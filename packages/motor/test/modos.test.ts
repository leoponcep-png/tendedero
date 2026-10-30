import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ajustesConModo,
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  cuerdasARobar,
  MODOS_JUEGO,
  normalizarAjustes,
  revisarAjustes,
  rondasRestantes,
  siguienteJugadaIA,
  type Ajustes,
  type DatosCrudos,
  type Jugada,
  type Partida,
} from "../src";

// Modos de juego: «normal» (las reglas de siempre) y «larga» (más rondas y prendas que puntúan menos).
// Lo que cambia cada modo está en data/ajustes-por-defecto.json, en `modos`.

function crudos(): DatosCrudos {
  return Object.fromEntries(
    ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(new URL(`../../../data/${n}.json`, import.meta.url), "utf8"))]),
  ) as DatosCrudos;
}

const datos = cargarDatos(crudos());
const larga = datos.porDefecto.modos!.larga;

function jugar(p: Partida, j: Jugada): Partida {
  const r = aplicar(p, j);
  if (!r.ok) throw new Error(r.motivo);
  return r.partida;
}

function nueva(cambios: Partial<Ajustes> = {}, semilla = "modos"): Partida {
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

/** Una prenda de este tipo casi seca (humedad 1) colgada en una cuerda básica del jugador 0. */
function colgarCasiSeca(p: Partida, tipo: string): string {
  const prenda = Object.keys(p.prendas).find((id) => p.prendas[id].tipo === tipo && p.bolsa.includes(id))!;
  p.bolsa = p.bolsa.filter((id) => id !== prenda);
  p.prendas[prenda].humedad = 1;
  const carta = "basica#modo";
  p.cartas[carta] = "basica";
  p.catalogo.cartas.basica ??= datos.cartas.find((c) => c.id === "basica")!;
  p.jugadores[0].lineas[0].cartas.push({ carta, colgadas: [{ prenda, inicio: 0 }] });
  return prenda;
}

/** Todos terminan su turno: se seca y se puntúa. */
function acabarRonda(p0: Partida): Partida {
  let p = p0;
  const r = p.ronda;
  while (!p.terminada && p.ronda === r) {
    p = jugar(p, { tipo: "terminarTurno", jugador: p.turno.jugador, cuerdas: 0 });
    while (!p.terminada && p.turno.fase === "descartar") p = jugar(p, { tipo: "descartar", jugador: p.turno.jugador, carta: p.jugadores[p.turno.jugador].mano[0] });
  }
  return p;
}

describe("modos de juego", () => {
  it("los datos traen el modo larga con prendas que puntúan 1, 2 y 3 y un final más lejos", () => {
    expect(MODOS_JUEGO).toEqual(["normal", "larga"]);
    expect(larga.prendas).toEqual({ calcetin: { puntos: 1 }, camiseta: { puntos: 2 }, toalla: { puntos: 3 } });
    expect(larga.umbralFinal).toBeGreaterThan(datos.porDefecto.umbralFinal);
  });

  it("el modo normal no cambia nada: la misma semilla da la misma partida con o sin modo", () => {
    const base = ajustesIniciales(datos);
    expect(base.modo).toBe("normal");
    expect(ajustesConModo(base, datos)).toBe(base);
    const sinModo = nueva({ modo: undefined });
    const normal = nueva({ modo: "normal" });
    expect({ ...normal, ajustes: { ...normal.ajustes, modo: undefined } }).toEqual(sinModo);
    expect(normal.catalogo.tipos.toalla.puntos).toBe(datos.tipos.find((t) => t.id === "toalla")!.puntos);
    expect(normal.ajustes.umbralFinal).toBe(datos.porDefecto.umbralFinal);
    for (const o of datos.objetivos) {
      if (normal.catalogo.objetivos[o.id]) expect(normal.catalogo.objetivos[o.id]).toEqual(o);
    }
  });

  it("la partida larga lleva sus puntos, su umbral y sus objetivos", () => {
    const p = nueva({ modo: "larga" });
    expect(p.ajustes.modo).toBe("larga");
    expect(p.ajustes.umbralFinal).toBe(larga.umbralFinal);
    expect(p.catalogo.tipos.calcetin.puntos).toBe(1);
    expect(p.catalogo.tipos.camiseta.puntos).toBe(2);
    expect(p.catalogo.tipos.toalla.puntos).toBe(3);
    expect(p.ajustes.prendas.toalla.puntos).toBe(3);
    // Lo demás de las prendas no cambia.
    expect(p.catalogo.tipos.toalla.espacios).toBe(3);
    expect(p.catalogo.tipos.toalla.humedad).toBe(3);
    for (const [id, ritmo] of Object.entries(larga.objetivos ?? {})) {
      if (p.catalogo.objetivos[id]) expect(p.catalogo.objetivos[id]).toMatchObject(ritmo);
    }
    // En la larga se juegan más cuerdas por turno, para que dé tiempo a llenar el tendedero.
    expect(p.ajustes.jugablesPorTurno).toEqual(larga.jugablesPorTurno ?? datos.porDefecto.jugablesPorTurno);
    // Los ajustes que no toca el modo se quedan como estaban.
    expect(p.ajustes.tendedero).toEqual(datos.porDefecto.tendedero);
    expect(p.ajustes.limiteMano).toBe(larga.limiteMano ?? datos.porDefecto.limiteMano);
  });

  it.each([
    ["normal", "toalla", 6],
    ["larga", "toalla", 3],
    ["larga", "camiseta", 2],
    ["larga", "calcetin", 1],
  ])("en el modo %s una %s seca da %i puntos", (modo, tipo, puntos) => {
    const p = lista(nueva({ modo: modo as Ajustes["modo"] }));
    const prenda = colgarCasiSeca(p, tipo);
    const antes = p.jugadores[0].puntos;
    const q = acabarRonda(p);
    expect(q.jugadores[0].seca).toContain(prenda);
    expect(q.jugadores[0].puntos - antes).toBe(puntos);
  });

  it("la partida larga acaba al llegar a su umbral, no al de la normal", () => {
    const p = lista(nueva({ modo: "larga" }));
    p.jugadores[0].puntos = datos.porDefecto.umbralFinal + 1;
    const q = acabarRonda(p);
    expect(q.terminada).toBe(false);
    q.jugadores[0].puntos = larga.umbralFinal!;
    const r = acabarRonda(lista2(q));
    expect(r.terminada).toBe(true);
  });

  it("los ajustes guardados conservan el modo, y uno que no existe avisa y se juega como el normal", () => {
    expect(normalizarAjustes({ modo: "larga" }, datos).modo).toBe("larga");
    expect(normalizarAjustes({}, datos).modo).toBe("normal");
    const raro = { ...ajustesIniciales(datos), modo: "eterna" as Ajustes["modo"] };
    expect(revisarAjustes(raro, datos).avisos.some((a) => a.includes("eterna"))).toBe(true);
    const p = crearPartida(datos, { ...raro, semilla: "raro" });
    expect(p.ajustes.umbralFinal).toBe(datos.porDefecto.umbralFinal);
    expect(p.catalogo.tipos.toalla.puntos).toBe(6);
  });

  it("la IA calcula las rondas que quedan con los puntos del modo", () => {
    const normal = nueva({ modo: "normal" });
    const largaP = nueva({ modo: "larga" });
    // Al principio: lo que falta para el final entre el ritmo esperado (6 por ronda en la normal).
    expect(rondasRestantes(normal)).toBe(Math.ceil(datos.porDefecto.umbralFinal / 6));
    expect(rondasRestantes(largaP)).toBeGreaterThan(rondasRestantes(normal));
  });

  it("con el tendedero lleno, la IA roba cuerdas para mejorar sus básicas", () => {
    const p = lista(nueva({ modo: "larga" }));
    const j = p.jugadores[p.turno.jugador];
    const { lineas, cartasPorLinea } = p.ajustes.tendedero;
    j.lineas = Array.from({ length: lineas }, (_, l) => ({
      cartas: Array.from({ length: cartasPorLinea }, (_, k) => {
        const carta = `basica#lleno${l}-${k}`;
        p.cartas[carta] = "basica";
        return { carta, colgadas: [] };
      }),
    }));
    p.catalogo.cartas.basica ??= datos.cartas.find((c) => c.id === "basica")!;
    j.mano = j.mano.filter((c) => datos.cartas.find((d) => d.id === p.cartas[c])?.mazo !== "cuerdas");
    expect(cuerdasARobar(p, p.turno.jugador, { dificultad: "normal" })).toBeGreaterThan(0);
  });

  it("una partida larga de bots llega al final", () => {
    let p = nueva({ modo: "larga", jugadores: 2 }, "larga-bots");
    let s = 7;
    const azar = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    for (let pasos = 0; !p.terminada; pasos++) {
      if (pasos > 8000) throw new Error("Los bots se han quedado atascados.");
      const quien = p.jugadores.findIndex((j) => j.objetivosOfrecidos.length > 0);
      const i = quien >= 0 ? quien : p.reaccion ? p.reaccion.defensor : p.turno.jugador;
      p = jugar(p, siguienteJugadaIA(p, i, { azar, dificultad: i === 0 ? "normal" : "dificil" })!);
    }
    expect(p.final).toHaveLength(2);
    expect(p.ronda).toBeGreaterThan(5);
  }, 120000);
});

/** Tras acabar una ronda hay reparto: se hace cogiendo lo primero (sin carta del día). */
function lista2(p0: Partida): Partida {
  let p = p0;
  while (p.turno.fase === "cesta" || p.turno.fase === "centro") {
    const origen = p.turno.fase === "centro" ? "centro" : { cesta: p.cestas.findIndex((c) => c.length > 0) };
    const prendas = origen === "centro" ? p.centro : p.cestas[origen.cesta];
    p = jugar(p, { tipo: "draft", jugador: p.turno.jugador, origen, patron: { tipo: p.prendas[prendas[0]].tipo } });
  }
  p.dia = null;
  return p;
}
