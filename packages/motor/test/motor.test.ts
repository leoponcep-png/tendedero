import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  ErrorDatos,
  puntuarObjetivo,
  vistaPara,
  type Ajustes,
  type DatosCrudos,
  type Jugada,
  type Partida,
} from "../src";

function crudos(): DatosCrudos {
  return Object.fromEntries(
    ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(new URL(`../../../data/${n}.json`, import.meta.url), "utf8"))]),
  ) as DatosCrudos;
}

const datos = cargarDatos(crudos());

/** Partida con los objetivos secretos ya elegidos, lista para jugar. */
function partida(semilla = "prueba", cambios: (a: Ajustes) => void = () => {}): Partida {
  const ajustes = { ...ajustesIniciales(datos), semilla };
  cambios(ajustes);
  let p = crearPartida(datos, ajustes);
  p.jugadores.forEach((j, i) => {
    if (j.objetivosOfrecidos[0]) p = jugar(p, { tipo: "elegirObjetivo", jugador: i, objetivo: j.objetivosOfrecidos[0] });
  });
  // Sin clima ni eventos, para que cada test controle el tiempo que hace.
  p.clima = null;
  p.mazos.clima = [];
  p.descartes.clima = [];
  return p;
}

/** Saca este clima o evento al empezar la siguiente ronda. */
function proximaCarta(p: Partida, def: string) {
  p.mazos.clima.push(copia(p, def));
}

function jugar(p: Partida, j: Jugada): Partida {
  const r = aplicar(p, j);
  if (!r.ok) throw new Error(r.motivo);
  return r.partida;
}

function motivo(p: Partida, j: Jugada): string | null {
  const r = aplicar(p, j);
  return r.ok ? null : r.motivo;
}

/** Mete en la partida una copia nueva de una carta (sin sacarla del mazo) y devuelve su id. */
function copia(p: Partida, def: string): string {
  const id = `${def}#test${Object.keys(p.cartas).length}`;
  p.cartas[id] = def;
  p.catalogo.cartas[def] ??= datos.cartas.find((c) => c.id === def)!;
  return id;
}

/** Pone directamente una carta de cuerda con prendas en la línea indicada. */
function tender(p: Partida, jugador: number, cuerda: string, prendas: [string, number][], linea = 0): number {
  const cartas = p.jugadores[jugador].lineas[linea].cartas;
  cartas.push({ carta: copia(p, cuerda), colgadas: prendas.map(([prenda, inicio]) => ({ prenda, inicio })) });
  return cartas.length - 1;
}

function darAccion(p: Partida, jugador: number, def: string): string {
  const id = copia(p, def);
  p.jugadores[jugador].mano.push(id);
  return id;
}

function terminar(p: Partida): Partida {
  let q = jugar(p, { tipo: "terminarTurno", jugador: p.turno.jugador });
  while (!q.terminada && q.turno.fase === "descartar") q = jugar(q, { tipo: "descartar", jugador: q.turno.jugador, carta: q.jugadores[q.turno.jugador].mano[0] });
  return q;
}

describe("datos", () => {
  it("cargan los JSON de /data", () => {
    const total = datos.tipos.reduce((s, t) => s + t.porColor * datos.colores.length, 0);
    expect(total).toBe(100);
  });

  it("dicen qué archivo y qué carta fallan", () => {
    const c = crudos();
    (c.cuerdas as { cartas: { copias: number }[] }).cartas[0].copias = -1;
    expect(() => cargarDatos(c)).toThrow(ErrorDatos);
    expect(() => cargarDatos(c)).toThrow(/cuerdas\.json → cartas\[basica\]\.copias/);
  });

  it("no dejan marcar como definida una carta sin efecto programado", () => {
    const c = crudos();
    const cartas = (c.acciones as { cartas: { id: string; estado: string }[] }).cartas;
    cartas.find((x) => x.id === "pinza-rota")!.estado = "definida";
    expect(() => cargarDatos(c)).toThrow(/pinza-rota.*no está programado/);
  });
});

describe("preparar partida", () => {
  it("la misma semilla da el mismo reparto", () => {
    expect(partida("abc")).toEqual(partida("abc"));
    expect(partida("abc").bolsa).not.toEqual(partida("xyz").bolsa);
  });

  it("reparte cestas, manos y objetivos, y deja fuera las cartas pendientes", () => {
    const p = partida();
    expect(p.cestas).toHaveLength(5);
    expect(p.bolsa).toHaveLength(80);
    expect(p.jugadores[0].mano).toHaveLength(4);
    expect(p.objetivosComunes).toHaveLength(2);
    expect(p.jugadores.every((j) => j.objetivoSecreto)).toBe(true);
    expect(Object.values(p.cartas)).not.toContain("pinza-rota");
  });

  it("no se juega sin haber elegido el objetivo secreto", () => {
    const p = crearPartida(datos, { ...ajustesIniciales(datos), semilla: "x" });
    expect(motivo(p, { tipo: "terminarTurno", jugador: 0 })).toMatch(/objetivo secreto/);
  });
});

describe("colgar prendas y cuerdas", () => {
  it("una prenda tiene que caber entera y sin solaparse", () => {
    const p = partida();
    tender(p, 0, "basica", [["camiseta-azul-1", 0]]);
    p.jugadores[0].pendientes = ["toalla-azul-1", "calcetin-azul-1"];
    const sitio = { tipo: "colgarPrenda", jugador: 0, linea: 0, posicion: 0 } as const;
    expect(motivo(p, { ...sitio, prenda: "toalla-azul-1", inicio: 0 })).toMatch(/ocupados/);
    expect(motivo(p, { ...sitio, prenda: "toalla-azul-1", inicio: 1 })).toMatch(/No cabe/);
    expect(motivo(p, { ...sitio, prenda: "calcetin-azul-1", inicio: 2 })).toBeNull();
  });

  it("respeta el máximo de cuerdas por turno y Colocar cuerda extra lo amplía", () => {
    let p = partida();
    const [a, b] = p.jugadores[0].mano;
    p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: a, linea: 0 });
    expect(motivo(p, { tipo: "colocarCuerda", jugador: 0, carta: b, linea: 0 })).toMatch(/Ya has jugado una cuerda/);
    const extra = darAccion(p, 0, "colocar-cuerda-extra");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: extra });
    expect(motivo(p, { tipo: "colocarCuerda", jugador: 0, carta: b, linea: 0 })).toBeNull();
  });
});

describe("secado y puntos", () => {
  it("al final del turno la humedad baja 1 y al llegar a 0 la prenda puntúa", () => {
    let p = partida();
    tender(p, 0, "basica", [["camiseta-azul-1", 0], ["calcetin-azul-1", 2]]);
    p = terminar(p);
    expect(p.prendas["camiseta-azul-1"].humedad).toBe(1);
    expect(p.jugadores[0].seca).toEqual(["calcetin-azul-1"]);
    expect(p.jugadores[0].puntos).toBe(1);
    p = terminar(terminar(p));
    expect(p.jugadores[0].seca).toContain("camiseta-azul-1");
    expect(p.jugadores[0].puntos).toBe(4);
  });

  it("solo se secan las prendas del jugador que termina su turno", () => {
    let p = partida();
    tender(p, 1, "basica", [["calcetin-rojo-1", 0]]);
    p = terminar(p);
    expect(p.prendas["calcetin-rojo-1"].humedad).toBe(1);
  });

  it("secado rápido quita 2 de humedad", () => {
    let p = partida();
    tender(p, 0, "secado-rapido", [["toalla-azul-1", 0]]);
    p = terminar(p);
    expect(p.prendas["toalla-azul-1"].humedad).toBe(1);
  });

  it("las pinzas de color suman y la cuerda vieja resta", () => {
    let p = partida();
    tender(p, 0, "pinzas-rojas", [["calcetin-rojo-1", 0], ["calcetin-azul-1", 1]]);
    tender(p, 0, "vieja", [["calcetin-blanco-1", 0]], 1);
    p = terminar(p);
    expect(p.jugadores[0].puntos).toBe(2 + 1 + 0);
  });
});

describe("acciones", () => {
  it("Mojar cuerda rival suma humedad, pero no bajo un tejadillo", () => {
    let p = partida();
    const normal = tender(p, 1, "basica", [["camiseta-rojo-1", 0]]);
    const techo = tender(p, 1, "tejadillo", [["camiseta-rojo-2", 0]]);
    const carta = darAccion(p, 0, "mojar-cuerda-rival");
    const sobre = (posicion: number): Jugada => ({ tipo: "jugarAccion", jugador: 0, carta, objetivo: { jugador: 1, linea: 0, posicion } });
    expect(motivo(p, sobre(techo))).toMatch(/Tejadillo protege/);
    p = jugar(p, sobre(normal));
    expect(p.prendas["camiseta-rojo-1"].humedad).toBe(3);
    expect(p.descartes.acciones).toContain(carta);
  });

  it("Ráfaga de viento devuelve la prenda a por tender con la humedad inicial", () => {
    let p = partida();
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    p.prendas["toalla-rojo-1"].humedad = 1;
    const carta = darAccion(p, 0, "rafaga-de-viento");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo: { jugador: 1, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } });
    expect(p.jugadores[1].pendientes).toContain("toalla-rojo-1");
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(3);
  });

  it("las acciones de fastidio no se juegan sobre ti mismo", () => {
    const p = partida();
    tender(p, 0, "basica", [["toalla-rojo-1", 0]]);
    const carta = darAccion(p, 0, "rafaga-de-viento");
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo: { jugador: 0, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } })).toMatch(/rival/);
  });

  it("Mover prenda propia la lleva a otro hueco libre", () => {
    let p = partida();
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    tender(p, 0, "basica", [], 1);
    const carta = darAccion(p, 0, "mover-prenda-propia");
    const objetivo = { jugador: 0, linea: 0, posicion: 0, prenda: "calcetin-azul-1" };
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo })).toMatch(/adónde/);
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo: { ...objetivo, destino: { linea: 1, posicion: 0, inicio: 2 } } });
    expect(p.jugadores[0].lineas[1].cartas[0].colgadas).toEqual([{ prenda: "calcetin-azul-1", inicio: 2 }]);
  });

  it("Secar prenda inmediatamente puntúa en el acto", () => {
    let p = partida();
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    const carta = darAccion(p, 0, "secar-prenda");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo: { jugador: 0, linea: 0, posicion: 0, prenda: "toalla-azul-1" } });
    expect(p.jugadores[0].puntos).toBe(6);
  });

  it("Proteger cuerda bloquea el fastidio hasta el siguiente turno de su dueño", () => {
    let p = partida();
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "proteger-cuerda"), objetivo: { jugador: 0, linea: 0, posicion: 0 } });
    p = terminar(p);
    const rafaga: Jugada = { tipo: "jugarAccion", jugador: 1, carta: darAccion(p, 1, "rafaga-de-viento"), objetivo: { jugador: 0, linea: 0, posicion: 0, prenda: "toalla-azul-1" } };
    expect(motivo(p, rafaga)).toMatch(/protegida/);
    p = terminar(p);
    p = terminar(p);
    expect(p.jugadores[0].lineas[0].cartas[0].protegida).toBeUndefined();
  });

  it("como máximo 2 acciones por turno", () => {
    let p = partida();
    for (let i = 0; i < 2; i++) p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "colocar-cuerda-extra") });
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "colocar-cuerda-extra") })).toMatch(/2 acciones/);
  });
});

describe("clima y eventos", () => {
  it("al empezar cada ronda sale una carta; el clima se queda y un evento no lo quita", () => {
    const sinPreparar = crearPartida(datos, { ...ajustesIniciales(datos), semilla: "r" });
    expect(sinPreparar.mazos.clima).toHaveLength(17);

    let p = partida();
    proximaCarta(p, "soleado");
    p = terminar(terminar(p));
    expect(p.ronda).toBe(2);
    expect(p.cartas[p.clima!]).toBe("soleado");
    proximaCarta(p, "ola-de-calor");
    p = terminar(terminar(p));
    expect(p.cartas[p.clima!]).toBe("soleado");
    expect(p.cartas[p.ultimoEvento!]).toBe("ola-de-calor");
    proximaCarta(p, "lluvia");
    p = terminar(terminar(p));
    expect(p.cartas[p.clima!]).toBe("lluvia");
    expect(p.descartes.clima.map((c) => p.cartas[c])).toEqual(["ola-de-calor", "soleado"]);
  });

  it("con sol se seca 1 más", () => {
    let p = partida();
    p.clima = copia(p, "soleado");
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    p = terminar(p);
    expect(p.prendas["toalla-azul-1"].humedad).toBe(1);
  });

  it("con lluvia no se seca nada salvo bajo un tejadillo", () => {
    let p = partida();
    p.clima = copia(p, "lluvia");
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    tender(p, 0, "tejadillo", [["calcetin-azul-2", 0]], 1);
    p = terminar(p);
    expect(p.prendas["calcetin-azul-1"].humedad).toBe(1);
    expect(p.jugadores[0].seca).toEqual(["calcetin-azul-2"]);
  });

  it("con viento se caen los calcetines salvo en cuerdas resistentes, y lo demás seca más", () => {
    let p = partida();
    p.clima = copia(p, "viento");
    tender(p, 0, "basica", [["calcetin-azul-1", 0], ["camiseta-azul-1", 1]]);
    tender(p, 0, "resistente", [["calcetin-azul-2", 0]], 1);
    p = terminar(p);
    expect(p.jugadores[0].pendientes).toContain("calcetin-azul-1");
    expect(p.jugadores[0].seca).toEqual(expect.arrayContaining(["camiseta-azul-1", "calcetin-azul-2"]));
  });

  it("Tormenta repentina moja todo lo que no tiene tejadillo, de todos los jugadores", () => {
    let p = partida();
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    tender(p, 1, "tejadillo", [["toalla-rojo-1", 0]]);
    proximaCarta(p, "tormenta-repentina");
    p = terminar(p);
    p.prendas["toalla-azul-1"].humedad = 3;
    p = terminar(p);
    expect(p.prendas["toalla-azul-1"].humedad).toBe(4);
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(2);
  });

  it("Ola de calor seca y puntúa al instante", () => {
    let p = partida();
    tender(p, 1, "basica", [["calcetin-rojo-1", 0]]);
    proximaCarta(p, "ola-de-calor");
    p = terminar(p);
    expect(p.jugadores[1].seca).toEqual([]);
    p = terminar(p);
    expect(p.jugadores[1].seca).toEqual(["calcetin-rojo-1"]);
  });

  it("Viento traicionero tira la prenda más grande de cada uno", () => {
    let p = partida();
    tender(p, 0, "basica", [["calcetin-azul-1", 0], ["camiseta-azul-1", 1]]);
    tender(p, 1, "resistente", [["toalla-rojo-1", 0]]);
    proximaCarta(p, "viento-traicionero");
    p.prendas["camiseta-azul-1"].humedad = 5;
    p = terminar(terminar(p));
    expect(p.jugadores[0].pendientes).toEqual(["camiseta-azul-1"]);
    expect(p.jugadores[1].pendientes).toEqual([]);
  });

  it("Ropa se engancha impide tirar y mover durante la ronda", () => {
    let p = partida();
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    p.prendas["toalla-rojo-1"].humedad = 9;
    proximaCarta(p, "ropa-se-engancha");
    p = terminar(terminar(p));
    const rafaga = darAccion(p, 0, "rafaga-de-viento");
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta: rafaga, objetivo: { jugador: 1, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } })).toMatch(/evento/);
  });
});

describe("límite de mano", () => {
  it("si se pasa del límite tiene que descartar antes de pasar el turno", () => {
    let p = partida();
    p = jugar(p, { tipo: "terminarTurno", jugador: 0 });
    expect(p.turno.fase).toBe("descartar");
    expect(p.turno.jugador).toBe(0);
    expect(motivo(p, { tipo: "draft", jugador: 0, origen: { cesta: 0 }, patron: { tipo: "toalla" } })).toMatch(/descarta/);
    p = jugar(p, { tipo: "descartar", jugador: 0, carta: p.jugadores[0].mano[0] });
    p = jugar(p, { tipo: "descartar", jugador: 0, carta: p.jugadores[0].mano[0] });
    expect(p.jugadores[0].mano).toHaveLength(5);
    expect(p.turno.jugador).toBe(1);
  });
});

describe("final de partida", () => {
  it("al llegar al umbral se acaba la ronda y después se cuentan los objetivos", () => {
    let p = partida();
    p.jugadores[0].puntos = 29;
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    p = terminar(p);
    expect(p.ultimaRonda).toBe(true);
    expect(p.terminada).toBe(false);
    expect(p.turno.jugador).toBe(1);
    p = terminar(p);
    expect(p.terminada).toBe(true);
    expect(p.final).toHaveLength(2);
    expect(p.final![0].puesto).toBe(1);
  });

  it("quien llega primero puede perder por los objetivos", () => {
    let p = partida("abc", (a) => (a.objetivos.secretosRepartidos = 0));
    p.objetivosComunes = ["toallero"];
    p.catalogo.objetivos.toallero ??= datos.objetivos.find((o) => o.id === "toallero")!;
    p.jugadores[0].puntos = 29;
    p.jugadores[1].puntos = 25;
    p.jugadores[1].seca = ["toalla-rojo-1", "toalla-rojo-2", "toalla-rojo-3", "toalla-rojo-4", "toalla-rojo-5", "toalla-rojo-6"];
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    p = terminar(terminar(p));
    expect(p.primeroEnLlegar).toBe(0);
    expect(p.final![0].jugador).toBe(1);
    expect(p.final![0].total).toBe(25 + 7);
  });

  it("los objetivos con niveles solo dan el más alto alcanzado", () => {
    const p = partida();
    const toallero = datos.objetivos.find((o) => o.id === "toallero")!;
    p.jugadores[0].seca = ["toalla-rojo-1", "toalla-rojo-2", "toalla-rojo-3", "toalla-rojo-4"];
    expect(puntuarObjetivo(p, 0, toallero).puntos).toBe(3);
    p.jugadores[0].seca.push("toalla-rojo-5", "toalla-rojo-6");
    expect(puntuarObjetivo(p, 0, toallero).puntos).toBe(7);
  });
});

describe("draft y vistas", () => {
  it("se lleva lo que cumple el patrón y manda el resto al centro", () => {
    const p = partida();
    const cesta = p.cestas[0];
    const color = p.prendas[cesta[0]].color;
    const iguales = cesta.filter((id) => p.prendas[id].color === color);
    const despues = jugar(p, { tipo: "draft", jugador: 0, origen: { cesta: 0 }, patron: { color } });
    expect(despues.jugadores[0].pendientes).toEqual(iguales);
    expect(despues.centro).toHaveLength(4 - iguales.length);
    expect(p.cestas[0]).toHaveLength(4);
  });

  it("la vista de un jugador oculta la mano rival y la semilla", () => {
    const v = vistaPara(partida(), 0);
    expect(v.jugadores[1].mano.every((c) => c === "?")).toBe(true);
    expect(v.jugadores[0].mano.some((c) => c !== "?")).toBe(true);
    expect(v.semilla).toBe("");
  });
});
