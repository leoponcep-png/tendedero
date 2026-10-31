import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  cuerdasARobar,
  mejorJugada,
  normalizarAjustes,
  partidaAlDia,
  rondasRestantes,
  siguienteJugadaIA,
  type Ajustes,
  type DatosCrudos,
  type Dificultad,
  type Jugada,
  type Partida,
} from "../src";

// El juego base desde la versión 0.3: prendas a 1/2/3, final en 40, hasta 2 cartas de cuerda por turno y cuerdas con
// habilidad que se pueden poner encima de otras con habilidad. Sustituye al antiguo modo «Partida larga».
// Ver informes/juego-base/propuesta.md.

function crudos(): DatosCrudos {
  return Object.fromEntries(
    ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(new URL(`../../../data/${n}.json`, import.meta.url), "utf8"))]),
  ) as DatosCrudos;
}

const datos = cargarDatos(crudos());

function jugar(p: Partida, j: Jugada): Partida {
  const r = aplicar(p, j);
  if (!r.ok) throw new Error(r.motivo);
  return r.partida;
}

function nueva(cambios: Partial<Ajustes> = {}, semilla = "base"): Partida {
  return crearPartida(datos, { ...ajustesIniciales(datos), semilla, ...cambios });
}

/** Con los objetivos elegidos y el reparto hecho (cogiendo lo primero), sin carta del día. */
function lista(p0: Partida): Partida {
  let p = p0;
  p.jugadores.forEach((j, i) => {
    if (j.objetivosOfrecidos[0]) p = jugar(p, { tipo: "elegirObjetivo", jugador: i, objetivo: j.objetivosOfrecidos[0] });
  });
  while (p.turno.fase === "cesta" || p.turno.fase === "centro") {
    const origen = p.turno.fase === "centro" ? "centro" : { cesta: p.cestas.findIndex((c) => c.length > 0) };
    const prendas = origen === "centro" ? p.centro : p.cestas[origen.cesta];
    p = jugar(p, { tipo: "draft", jugador: p.turno.jugador, origen, patron: { tipo: p.prendas[prendas[0]].tipo } });
  }
  p.dia = null;
  p.mazos.dia = [];
  p.descartes.dia = [];
  return p;
}

let n = 0;
function copia(p: Partida, def: string): string {
  const id = `${def}#base${n++}`;
  p.cartas[id] = def;
  p.catalogo.cartas[def] ??= datos.cartas.find((c) => c.id === def)!;
  return id;
}

/** Llena el tendedero del jugador con estas cuerdas (en orden, repitiendo la última) y le quita las cuerdas de la mano. */
function llenar(p: Partida, i: number, cuerdas: string[]): void {
  const { lineas, cartasPorLinea } = p.ajustes.tendedero;
  let k = 0;
  p.jugadores[i].lineas = Array.from({ length: lineas }, () => ({
    cartas: Array.from({ length: cartasPorLinea }, () => ({ carta: copia(p, cuerdas[Math.min(k++, cuerdas.length - 1)]), colgadas: [] })),
  }));
  p.jugadores[i].mano = p.jugadores[i].mano.filter((c) => datos.cartas.find((d) => d.id === p.cartas[c])?.mazo !== "cuerdas");
}

describe("juego base", () => {
  it("las prendas dan 1, 2 y 3 puntos, el final está en 40 y se juegan hasta 2 cuerdas por turno", () => {
    const p = nueva();
    expect([p.catalogo.tipos.calcetin.puntos, p.catalogo.tipos.camiseta.puntos, p.catalogo.tipos.toalla.puntos]).toEqual([1, 2, 3]);
    expect(p.ajustes.umbralFinal).toBe(40);
    expect(p.ajustes.jugablesPorTurno.cuerdas).toBe(2);
    expect("modos" in datos.porDefecto).toBe(false);
  });

  it("unos ajustes guardados con el antiguo modo «larga» se cargan como normales", () => {
    const a = normalizarAjustes({ modo: "larga", umbralFinal: 40 }, datos);
    expect("modo" in a).toBe(false);
    const p = crearPartida(datos, { ...(a as Ajustes & { modo?: string }), modo: "larga", semilla: "vieja" } as Ajustes);
    expect("modo" in p.ajustes).toBe(false);
    expect(p.ajustes.umbralFinal).toBe(40);
  });

  it("una partida guardada en el modo «larga» sigue como normal: meta, cuerdas, puntos y objetivos de siempre", () => {
    const p = nueva({}, "guardada");
    const vieja = structuredClone(p) as Partida & { ajustes: { modo?: string } };
    vieja.ajustes.modo = "larga";
    vieja.ajustes.umbralFinal = 70;
    const id = Object.keys(vieja.catalogo.objetivos)[0];
    vieja.catalogo.objetivos[id] = { ...vieja.catalogo.objetivos[id], cada: 9, puntos: 9 };
    const q = partidaAlDia(vieja, datos);
    expect("modo" in q.ajustes).toBe(false);
    expect(q.ajustes.umbralFinal).toBe(40);
    expect(q.catalogo.objetivos[id]).toMatchObject({ cada: datos.objetivos.find((o) => o.id === id)!.cada });
    expect(q.catalogo.tipos.toalla.puntos).toBe(3);
    // Lo demás de la partida no cambia, y la guardada original no se toca.
    expect(q.jugadores).toEqual(vieja.jugadores);
    expect(vieja.ajustes.umbralFinal).toBe(70);
    // Una partida al día se devuelve tal cual.
    expect(partidaAlDia(p, datos)).toBe(p);
  });

  it("la IA calcula las rondas que quedan con los puntos de las prendas (1 por pinza: unos 4 por ronda al principio)", () => {
    const r = rondasRestantes(nueva());
    expect(r).toBeGreaterThan(Math.ceil(datos.porDefecto.umbralFinal / 6));
    expect(r).toBeLessThanOrEqual(Math.ceil(datos.porDefecto.umbralFinal / 4));
  });

  it.each(["facil", "normal", "dificil"] as Dificultad[])("con el tendedero lleno de cuerdas con habilidad, la IA %s roba 1 cuerda para cambiar", (dificultad) => {
    const p = lista(nueva());
    llenar(p, p.turno.jugador, ["tejadillo"]);
    expect(cuerdasARobar(p, p.turno.jugador, { dificultad })).toBe(1);
    // Con una cuerda con habilidad ya en la mano, no roba más.
    p.jugadores[p.turno.jugador].mano.push(copia(p, "resistente"));
    expect(cuerdasARobar(p, p.turno.jugador, { dificultad })).toBe(0);
  });

  it("con el tendedero lleno de básicas, la IA roba cuerdas para mejorarlas", () => {
    const p = lista(nueva());
    llenar(p, p.turno.jugador, ["basica"]);
    expect(cuerdasARobar(p, p.turno.jugador, { dificultad: "normal" })).toBe(p.ajustes.roboPorTurno.maxCuerdas);
  });

  it.each(["normal", "dificil"] as Dificultad[])("la IA %s cambia unas pinzas que no le sirven por un secado rápido con ropa mojada", (dificultad) => {
    const p = lista(nueva({}, "cambio"));
    const i = p.turno.jugador;
    llenar(p, i, ["pinzas-amarillas", "resistente"]);
    // Una toalla roja empapada en las pinzas amarillas (no le dan nada) y un secado rápido en la mano.
    const toalla = Object.keys(p.prendas).find((id) => p.prendas[id].tipo === "toalla" && p.prendas[id].color === "rojo" && p.bolsa.includes(id))!;
    p.bolsa = p.bolsa.filter((id) => id !== toalla);
    p.prendas[toalla].humedad = 4;
    p.jugadores[i].lineas[0].cartas[0].colgadas = [{ prenda: toalla, inicio: 0 }];
    p.jugadores[i].pendientes = [];
    p.jugadores[i].mano = [copia(p, "secado-rapido")];
    p.ultimaRonda = false;
    let s = 3;
    const azar = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const j = mejorJugada(p, i, { dificultad, azar })?.jugada;
    expect(j).toMatchObject({ tipo: "mejorarCuerda", linea: 0, posicion: 0 });
  });

  it.each(["facil", "normal", "dificil"] as Dificultad[])("la IA %s cambia una cuerda repetida por otra clase si así sube «Variedad de cuerdas»", (dificultad) => {
    const p = lista(nueva({}, "variedad"));
    const i = p.turno.jugador;
    // 3 clases de cuerda (pinzas, secado rápido y resistente); con un tejadillo encima de una resistente, 4.
    llenar(p, i, ["pinzas-amarillas", "secado-rapido", "resistente"]);
    p.objetivosComunes = ["variedad-de-cuerdas"];
    p.catalogo.objetivos["variedad-de-cuerdas"] ??= datos.objetivos.find((o) => o.id === "variedad-de-cuerdas")!;
    p.jugadores[i].pendientes = [];
    p.jugadores[i].mano = [copia(p, "tejadillo")];
    let s = 5;
    const azar = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const j = mejorJugada(p, i, { dificultad, azar })?.jugada;
    expect(j?.tipo).toBe("mejorarCuerda");
    if (j?.tipo !== "mejorarCuerda") return;
    expect(p.cartas[p.jugadores[i].lineas[j.linea].cartas[j.posicion].carta]).toBe("resistente");
  });

  it("una partida de bots llega al final en unas 5–9 rondas", () => {
    let p = nueva({ jugadores: 3 }, "base-bots");
    let s = 7;
    const azar = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const niveles: Dificultad[] = ["facil", "normal", "dificil"];
    for (let pasos = 0; !p.terminada; pasos++) {
      if (pasos > 12000) throw new Error("Los bots se han quedado atascados.");
      const quien = p.jugadores.findIndex((j) => j.objetivosOfrecidos.length > 0);
      const i = quien >= 0 ? quien : p.reaccion ? p.reaccion.defensor : p.turno.jugador;
      p = jugar(p, siguienteJugadaIA(p, i, { azar, dificultad: niveles[i] })!);
    }
    expect(p.final).toHaveLength(3);
    expect(p.ronda).toBeGreaterThanOrEqual(4);
    expect(p.ronda).toBeLessThanOrEqual(10);
  }, 120000);
});
