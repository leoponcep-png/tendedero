import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  ErrorDatos,
  vistaPara,
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

function partida(semilla = "prueba"): Partida {
  return crearPartida(datos, { ...ajustesIniciales(datos), semilla });
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

/** Partida con una cuerda ya colocada en la línea 1 y las prendas indicadas por tender. */
function conCuerda(tipos: string[]): Partida {
  let p = partida();
  p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: p.jugadores[0].mano[0], linea: 0 });
  p.jugadores[0].pendientes = tipos.map((t, i) => `${t}-azul-${i + 1}`);
  return p;
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
    (c.acciones as { cartas: { estado: string }[] }).cartas[0].estado = "definida";
    expect(() => cargarDatos(c)).toThrow(/mojar-cuerda-rival.*no está programado/);
  });
});

describe("preparar partida", () => {
  it("la misma semilla da el mismo reparto", () => {
    expect(partida("abc")).toEqual(partida("abc"));
    expect(partida("abc").bolsa).not.toEqual(partida("xyz").bolsa);
  });

  it("reparte cestas, manos y deja fuera las cartas pendientes", () => {
    const p = partida();
    expect(p.cestas).toHaveLength(5);
    expect(p.cestas.every((c) => c.length === 4)).toBe(true);
    expect(p.bolsa).toHaveLength(80);
    expect(p.jugadores[0].mano).toHaveLength(2);
    expect(Object.values(p.cartas).every((def) => def === "basica")).toBe(true);
  });
});

describe("colgar prendas", () => {
  it("una toalla cabe en una carta vacía, pero solo desde el primer espacio", () => {
    const p = conCuerda(["toalla"]);
    const prenda = p.jugadores[0].pendientes[0];
    expect(motivo(p, { tipo: "colgarPrenda", jugador: 0, prenda, linea: 0, posicion: 0, inicio: 1 })).toMatch(/No cabe/);
    expect(motivo(p, { tipo: "colgarPrenda", jugador: 0, prenda, linea: 0, posicion: 0, inicio: 0 })).toBeNull();
  });

  it("no deja solapar prendas", () => {
    let p = conCuerda(["camiseta", "camiseta", "calcetin"]);
    const [cam1, cam2, cal] = p.jugadores[0].pendientes;
    p = jugar(p, { tipo: "colgarPrenda", jugador: 0, prenda: cam1, linea: 0, posicion: 0, inicio: 0 });
    expect(motivo(p, { tipo: "colgarPrenda", jugador: 0, prenda: cam2, linea: 0, posicion: 0, inicio: 1 })).toMatch(/ocupados/);
    expect(motivo(p, { tipo: "colgarPrenda", jugador: 0, prenda: cal, linea: 0, posicion: 0, inicio: 2 })).toBeNull();
  });

  it("no deja colgar donde no hay carta de cuerda", () => {
    const p = conCuerda(["calcetin"]);
    const prenda = p.jugadores[0].pendientes[0];
    expect(motivo(p, { tipo: "colgarPrenda", jugador: 0, prenda, linea: 1, posicion: 0, inicio: 0 })).toMatch(/ninguna carta/);
  });
});

describe("cuerdas", () => {
  it("respeta el máximo por turno y el de cartas por línea", () => {
    let p = partida();
    const [a, b] = p.jugadores[0].mano;
    p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: a, linea: 0 });
    expect(motivo(p, { tipo: "colocarCuerda", jugador: 0, carta: b, linea: 0 })).toMatch(/Ya has jugado una cuerda/);

    p.ajustes.jugablesPorTurno.cuerdas = 99;
    p.jugadores[0].mano.push(...p.mazos.cuerdas.splice(-4));
    for (const carta of p.jugadores[0].mano.slice(0, 3)) {
      p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta, linea: 0 });
    }
    expect(p.jugadores[0].lineas[0].cartas).toHaveLength(4);
    expect(motivo(p, { tipo: "colocarCuerda", jugador: 0, carta: p.jugadores[0].mano[0], linea: 0 })).toMatch(/ya tiene 4/);
  });

  it("solo juega quien tiene el turno", () => {
    const p = partida();
    expect(motivo(p, { tipo: "colocarCuerda", jugador: 1, carta: p.jugadores[1].mano[0], linea: 0 })).toMatch(/No es el turno/);
  });
});

describe("draft", () => {
  it("se lleva lo que cumple el patrón y manda el resto al centro", () => {
    const p = partida();
    const cesta = p.cestas[0];
    const color = p.prendas[cesta[0]].color;
    const iguales = cesta.filter((id) => p.prendas[id].color === color);
    const despues = jugar(p, { tipo: "draft", jugador: 0, origen: { cesta: 0 }, patron: { color } });
    expect(despues.jugadores[0].pendientes).toEqual(iguales);
    expect(despues.centro).toHaveLength(4 - iguales.length);
    expect(despues.cestas[0]).toHaveLength(0);
    expect(motivo(despues, { tipo: "draft", jugador: 0, origen: { cesta: 1 }, patron: { tipo: "toalla" } })).toMatch(/Ya has cogido/);
  });

  it("no modifica la partida original", () => {
    const p = partida();
    const antes = structuredClone(p);
    jugar(p, { tipo: "draft", jugador: 0, origen: { cesta: 0 }, patron: { color: p.prendas[p.cestas[0][0]].color } });
    expect(p).toEqual(antes);
  });
});

describe("turnos y vistas", () => {
  it("terminar turno roba y pasa al siguiente", () => {
    const p = jugar(partida(), { tipo: "terminarTurno", jugador: 0 });
    expect(p.turno.jugador).toBe(1);
    expect(p.jugadores[0].mano).toHaveLength(3);
  });

  it("la vista de un jugador oculta la mano rival y la semilla", () => {
    const v = vistaPara(partida(), 0);
    expect(v.jugadores[1].mano.every((c) => c === "?")).toBe(true);
    expect(v.jugadores[0].mano.some((c) => c !== "?")).toBe(true);
    expect(v.semilla).toBe("");
  });
});
