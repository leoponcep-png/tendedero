import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  defCarta,
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  ErrorDatos,
  motivoInvalida,
  porQueNoVale,
  puntuarObjetivo,
  siguienteJugadaIA,
  vistaPara,
  type Ajustes,
  type DatosCrudos,
  type Jugada,
  type Partida,
} from "../src";
import { candidatas } from "../src/ia";

function crudos(): DatosCrudos {
  return Object.fromEntries(
    ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(new URL(`../../../data/${n}.json`, import.meta.url), "utf8"))]),
  ) as DatosCrudos;
}

const datos = cargarDatos(crudos());

/** Partida con los objetivos secretos ya elegidos, a punto de empezar el reparto de prendas. */
function sinRepartir(semilla = "prueba", cambios: (a: Ajustes) => void = () => {}): Partida {
  const ajustes = { ...ajustesIniciales(datos), semilla };
  cambios(ajustes);
  let p = crearPartida(datos, ajustes);
  p.jugadores.forEach((j, i) => {
    if (j.objetivosOfrecidos[0]) p = jugar(p, { tipo: "elegirObjetivo", jugador: i, objetivo: j.objetivosOfrecidos[0] });
  });
  return p;
}

/**
 * Hace el reparto de la ronda cogiendo siempre lo primero que haya. Lo cogido se quita de «por tender»
 * para que no estorbe a los tests, que cuelgan sus propias prendas.
 */
function repartir(p: Partida): Partida {
  let q = p;
  while (!q.terminada && (q.turno.fase === "cesta" || q.turno.fase === "centro")) {
    const origen = q.turno.fase === "centro" ? "centro" : { cesta: q.cestas.findIndex((c) => c.length > 0) };
    const prendas = origen === "centro" ? q.centro : q.cestas[origen.cesta];
    const jugador = q.turno.jugador;
    const antes = q.jugadores[jugador].pendientes.length;
    q = jugar(q, { tipo: "draft", jugador, origen, patron: { tipo: q.prendas[prendas[0]].tipo } });
    q.jugadores[jugador].pendientes.splice(antes);
  }
  return q;
}

/** Partida con los objetivos elegidos y el reparto de la primera ronda hecho, lista para jugar. */
function partida(semilla = "prueba", cambios: (a: Ajustes) => void = () => {}): Partida {
  const p = repartir(sinRepartir(semilla, cambios));
  // Sin cartas de reacción, para que ningún fastidio se quede esperando respuesta (los tests de reacción las dan).
  const reaccion = (c: string) => p.cartas[c] === "ni-hablar";
  p.jugadores.forEach((j) => (j.mano = j.mano.filter((c) => !reaccion(c))));
  p.mazos.acciones = p.mazos.acciones.filter((c) => !reaccion(c));
  // Sin clima ni eventos, para que cada test controle el tiempo que hace.
  p.dia = null;
  p.mazos.dia = [];
  p.descartes.dia = [];
  return p;
}

/** Saca este clima o evento al empezar la siguiente ronda. */
function proximaCarta(p: Partida, def: string) {
  p.mazos.dia.push(copia(p, def));
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

/** Una cuerda vieja ya puesta en esta ronda en la línea indicada. */
function tenderVieja(p: Partida, jugador: number, prendas: [string, number][], linea = 0): number {
  const i = tender(p, jugador, "vieja", prendas, linea);
  p.jugadores[jugador].lineas[linea].cartas[i].colocadaEn = p.ronda;
  return i;
}

function darAccion(p: Partida, jugador: number, def: string): string {
  const id = copia(p, def);
  p.jugadores[jugador].mano.push(id);
  return id;
}

function terminar(p: Partida): Partida {
  let q = jugar(p, { tipo: "terminarTurno", jugador: p.turno.jugador });
  while (!q.terminada && q.turno.fase === "descartar") q = jugar(q, { tipo: "descartar", jugador: q.turno.jugador, carta: q.jugadores[q.turno.jugador].mano[0] });
  return repartir(q);
}

/** Terminan su turno todos los que quedan en la ronda, y con eso se seca y se puntúa. */
function ronda(p: Partida): Partida {
  const r = p.ronda;
  let q = p;
  while (!q.terminada && q.ronda === r) q = terminar(q);
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
    expect(p.cestas).toHaveLength(4);
    expect(p.bolsa).toHaveLength(84);
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

describe("rondas, secado y puntos", () => {
  it("al acabar la ronda la humedad baja 1 y al llegar a 0 la prenda puntúa", () => {
    let p = partida();
    tender(p, 0, "basica", [["camiseta-azul-1", 0], ["calcetin-azul-1", 2]]);
    p = ronda(p);
    expect(p.prendas["camiseta-azul-1"].humedad).toBe(1);
    expect(p.jugadores[0].seca).toEqual(["calcetin-azul-1"]);
    expect(p.jugadores[0].puntos).toBe(1);
    p = ronda(p);
    expect(p.jugadores[0].seca).toContain("camiseta-azul-1");
    expect(p.jugadores[0].puntos).toBe(4);
  });

  it("terminar el turno no seca nada: se seca y se puntúa a la vez cuando han jugado todos", () => {
    let p = partida();
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    tender(p, 1, "basica", [["calcetin-rojo-1", 0]]);
    p = terminar(p);
    expect(p.turno.jugador).toBe(1);
    expect(p.prendas["calcetin-azul-1"].humedad).toBe(1);
    expect(p.jugadores[0].puntos).toBe(0);
    p = terminar(p);
    expect(p.jugadores[0].seca).toEqual(["calcetin-azul-1"]);
    expect(p.jugadores[1].seca).toEqual(["calcetin-rojo-1"]);
  });

  it("el jugador que abre la ronda va rotando", () => {
    let p = partida();
    expect(p.turno.jugador).toBe(0);
    p = ronda(p);
    expect(p.ronda).toBe(2);
    expect(p.turno.jugador).toBe(1);
    p = terminar(p);
    expect(p.turno.jugador).toBe(0);
    expect(p.ronda).toBe(2);
    p = terminar(p);
    expect(p.ronda).toBe(3);
    expect(p.turno.jugador).toBe(0);
  });

  it("secado rápido quita 2 de humedad", () => {
    let p = partida();
    tender(p, 0, "secado-rapido", [["toalla-azul-1", 0]]);
    p = ronda(p);
    expect(p.prendas["toalla-azul-1"].humedad).toBe(1);
  });

  it("las pinzas de color suman", () => {
    let p = partida();
    tender(p, 0, "pinzas-rojas", [["calcetin-rojo-1", 0], ["calcetin-azul-1", 1]]);
    p = ronda(p);
    expect(p.jugadores[0].puntos).toBe(2 + 1);
  });

  it("un tejadillo protege también la cuerda justo debajo", () => {
    let p = partida();
    p.dia = copia(p, "lluvia");
    p.diaDesde = p.ronda;
    p.catalogo.objetivos["bajo-techo"] ??= datos.objetivos.find((o) => o.id === "bajo-techo")!;
    tender(p, 0, "tejadillo", [], 0);
    tender(p, 0, "basica", [["calcetin-azul-1", 0]], 1);
    tender(p, 0, "basica", [], 0);
    tender(p, 0, "basica", [["calcetin-azul-2", 0]], 1);
    const mojar = darAccion(p, 1, "mojar-cuerda-rival");
    p.turno.jugador = 1;
    expect(motivo(p, { tipo: "jugarAccion", jugador: 1, carta: mojar, objetivo: { jugador: 0, linea: 1, posicion: 0 } })).toMatch(/Tejadillo protege/);
    p.turno.jugador = 0;
    p = ronda(p);
    expect(p.jugadores[0].seca).toEqual(["calcetin-azul-1"]);
    expect(puntuarObjetivo(p, 0, p.catalogo.objetivos["bajo-techo"]).cantidad).toBe(1);
  });
});

describe("cuerda vieja y mejoras", () => {
  it("se le puede colocar a un rival (las demás cuerdas, solo en tu tendedero) y no gasta tu cuerda del turno", () => {
    let p = partida();
    const vieja = copia(p, "vieja");
    const basica = copia(p, "basica");
    p.jugadores[0].mano.push(vieja, basica);
    expect(motivo(p, { tipo: "colocarCuerda", jugador: 0, carta: basica, linea: 0, en: 1 })).toMatch(/propio tendedero/);
    p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: vieja, linea: 0, en: 1 });
    expect(p.jugadores[1].lineas[0].cartas.map((t) => p.cartas[t.carta])).toEqual(["vieja"]);
    expect(motivo(p, { tipo: "colocarCuerda", jugador: 0, carta: basica, linea: 0 })).toBeNull();
  });

  it("al acabar su 2.ª ronda se rompe con todo lo de su derecha y las prendas se pierden", () => {
    let p = partida();
    tenderVieja(p, 1, [["toalla-rojo-1", 0]]);
    tender(p, 1, "tejadillo", [["toalla-rojo-2", 0]]);
    tender(p, 1, "basica", [["toalla-azul-1", 0]], 1);
    for (const t of ["toalla-rojo-1", "toalla-rojo-2", "toalla-azul-1"]) p.prendas[t].humedad = 9;
    p = ronda(p);
    expect(p.jugadores[1].lineas[0].cartas).toHaveLength(2);
    p = ronda(p);
    expect(p.jugadores[1].lineas[0].cartas).toHaveLength(0);
    expect(p.jugadores[1].lineas[1].cartas).toHaveLength(1);
    expect(p.perdidas).toEqual(["toalla-rojo-1", "toalla-rojo-2"]);
    expect(p.descartes.cuerdas.map((c) => p.cartas[c])).toEqual(expect.arrayContaining(["vieja", "tejadillo"]));
  });

  it("una vieja solo se salva poniéndole encima una básica; las de habilidad mejoran básicas", () => {
    let p = partida();
    tenderVieja(p, 0, [["toalla-azul-1", 0]]);
    tender(p, 0, "tejadillo", [], 1);
    p.prendas["toalla-azul-1"].humedad = 9;
    const [a, b] = [copia(p, "secado-rapido"), copia(p, "basica")];
    p.jugadores[0].mano.push(a, b);
    expect(motivo(p, { tipo: "mejorarCuerda", jugador: 0, carta: a, linea: 1, posicion: 0 })).toMatch(/básicas y las viejas/);
    expect(motivo(p, { tipo: "mejorarCuerda", jugador: 0, carta: a, linea: 0, posicion: 0 })).toMatch(/solo se arregla poniéndole encima una cuerda básica/);
    p = jugar(p, { tipo: "mejorarCuerda", jugador: 0, carta: b, linea: 0, posicion: 0 });
    expect(p.cartas[p.jugadores[0].lineas[0].cartas[0].carta]).toBe("basica");
    expect(p.jugadores[0].lineas[0].cartas[0].colgadas).toEqual([{ prenda: "toalla-azul-1", inicio: 0 }]);
    expect(motivo(p, { tipo: "mejorarCuerda", jugador: 0, carta: a, linea: 0, posicion: 0 })).toMatch(/Ya has jugado una cuerda/);
    p = ronda(ronda(p));
    expect(p.jugadores[0].lineas[0].cartas).toHaveLength(1);
    expect(p.perdidas).toEqual([]);
  });
});

describe("reacción contra el fastidio", () => {
  it("el atacado puede anular el fastidio con ¡Ni hablar!", () => {
    let p = partida();
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    const ni = darAccion(p, 1, "ni-hablar");
    const rafaga = darAccion(p, 0, "rafaga-de-viento");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: rafaga, objetivo: { jugador: 1, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } });
    expect(p.reaccion?.defensor).toBe(1);
    expect(motivo(p, { tipo: "terminarTurno", jugador: 0 })).toMatch(/Esperando/);
    p = jugar(p, { tipo: "responder", jugador: 1, anular: true });
    expect(p.reaccion).toBeNull();
    expect(p.jugadores[1].lineas[0].cartas[0].colgadas).toHaveLength(1);
    expect(p.descartes.acciones).toEqual(expect.arrayContaining([ni, rafaga]));
    expect(p.turno.accionesJugadas).toBe(1);
  });

  it("si no responde, el fastidio se aplica; también vale contra la cuerda vieja", () => {
    let p = partida();
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    darAccion(p, 1, "ni-hablar");
    const rafaga = darAccion(p, 0, "rafaga-de-viento");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: rafaga, objetivo: { jugador: 1, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } });
    p = jugar(p, { tipo: "responder", jugador: 1, anular: false });
    expect(p.jugadores[1].pendientes).toContain("toalla-rojo-1");

    const vieja = copia(p, "vieja");
    p.jugadores[0].mano.push(vieja);
    p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: vieja, linea: 1, en: 1 });
    p = jugar(p, { tipo: "responder", jugador: 1, anular: true });
    expect(p.jugadores[1].lineas[1].cartas).toHaveLength(0);
    expect(p.descartes.cuerdas).toContain(vieja);
  });

  it("no se juega en tu turno", () => {
    const p = partida();
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "ni-hablar") })).toMatch(/rival te lanza/);
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
    // Acaba la ronda y la siguiente la abre el jugador 2: sigue protegida hasta que vuelve a tocarle al 1.
    p = terminar(p);
    expect(p.turno.jugador).toBe(1);
    expect(p.jugadores[0].lineas[0].cartas[0].protegida).toBe(true);
    p = terminar(p);
    expect(p.turno.jugador).toBe(0);
    expect(p.jugadores[0].lineas[0].cartas[0].protegida).toBeUndefined();
  });

  it("Cambiar prendas de sitio intercambia dos prendas tuyas", () => {
    let p = partida();
    tender(p, 0, "basica", [["calcetin-azul-1", 2]]);
    tender(p, 0, "tejadillo", [["camiseta-rojo-1", 0], ["calcetin-rojo-1", 2]], 1);
    const carta = darAccion(p, 0, "cambiar-prendas");
    const objetivo = { jugador: 0, linea: 0, posicion: 0, prenda: "camiseta-rojo-1" };
    const calcetin = { jugador: 0, linea: 0, posicion: 0, prenda: "calcetin-azul-1" };
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo: calcetin })).toMatch(/adónde/);
    // La camiseta no cabe en el espacio 3 de la cuerda del calcetín.
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo: { ...objetivo, linea: 1, destino: { linea: 0, posicion: 0, inicio: 2 } } })).toMatch(/No caben/);
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta, objetivo: { ...calcetin, destino: { linea: 1, posicion: 0, inicio: 2 } } });
    expect(p.jugadores[0].lineas[0].cartas[0].colgadas).toEqual([{ prenda: "calcetin-rojo-1", inicio: 2 }]);
    expect(p.jugadores[0].lineas[1].cartas[0].colgadas).toContainEqual({ prenda: "calcetin-azul-1", inicio: 2 });
  });

  it("Cambiar la ropa de cuerda y Mover cuerda", () => {
    let p = partida();
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    tender(p, 0, "tejadillo", [["toalla-rojo-1", 0]], 1);
    const cambiar = darAccion(p, 0, "cambiar-cuerdas");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: cambiar, objetivo: { jugador: 0, linea: 0, posicion: 0, destino: { linea: 1, posicion: 0, inicio: 0 } } });
    expect(p.jugadores[0].lineas[0].cartas[0].colgadas[0].prenda).toBe("toalla-rojo-1");
    expect(p.jugadores[0].lineas[1].cartas[0].colgadas[0].prenda).toBe("calcetin-azul-1");

    const mover = darAccion(p, 0, "mover-cuerda");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: mover, objetivo: { jugador: 0, linea: 1, posicion: 0, destino: { linea: 0, posicion: 1, inicio: 0 } } });
    expect(p.jugadores[0].lineas[0].cartas.map((t) => p.cartas[t.carta])).toEqual(["basica", "tejadillo"]);
    expect(p.jugadores[0].lineas[1].cartas).toEqual([]);
    expect(p.jugadores[0].lineas[0].cartas[1].colgadas[0].prenda).toBe("calcetin-azul-1");
  });

  it("Buscar cuerda roba una carta de cuerda", () => {
    let p = partida();
    const cuerdas = (q: Partida) => q.jugadores[0].mano.filter((c) => q.catalogo.cartas[q.cartas[c]].mazo === "cuerdas").length;
    const antes = cuerdas(p);
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "buscar-cuerda") });
    expect(cuerdas(p)).toBe(antes + 1);
  });

  it("como máximo 2 acciones por turno", () => {
    let p = partida();
    for (let i = 0; i < 2; i++) p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "colocar-cuerda-extra") });
    expect(motivo(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "colocar-cuerda-extra") })).toMatch(/2 acciones/);
  });
});

describe("mazo del día", () => {
  it("solo se roba carta del día cuando no hay ninguna en juego, y cada una dura sus días", () => {
    const sinPreparar = crearPartida(datos, { ...ajustesIniciales(datos), semilla: "r" });
    // Al empezar sale la primera; el resto se queda en el mazo.
    expect(sinPreparar.dia).not.toBeNull();
    expect(sinPreparar.mazos.dia).toHaveLength(19);

    let p = partida();
    proximaCarta(p, "ola-de-calor");
    proximaCarta(p, "racha-de-sol");
    p = ronda(p);
    expect(p.cartas[p.dia!]).toBe("racha-de-sol");
    p = ronda(p);
    // Segundo día de sol: no se roba.
    expect(p.cartas[p.dia!]).toBe("racha-de-sol");
    expect(p.mazos.dia.map((c) => p.cartas[c])).toEqual(["ola-de-calor"]);
    p = ronda(p);
    expect(p.cartas[p.dia!]).toBe("ola-de-calor");
    expect(p.registro).toContain("Se acaba Racha de sol.");
    p = ronda(p);
    // Un suceso dura 1 día; con el mazo vacío se baraja el descarte para robar la siguiente.
    expect(p.registro).toContain("Se acaba Ola de calor.");
    expect(p.registro).toContain("Se baraja el descarte del mazo del día para formar un mazo nuevo.");
    expect(p.dia).not.toBeNull();
  });

  it("con sol se seca 1 más", () => {
    let p = partida();
    p.dia = copia(p, "soleado");
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    p = ronda(p);
    expect(p.prendas["toalla-azul-1"].humedad).toBe(1);
  });

  it("con lluvia no se seca nada salvo bajo un tejadillo", () => {
    let p = partida();
    p.dia = copia(p, "lluvia");
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    tender(p, 0, "tejadillo", [["calcetin-azul-2", 0]], 1);
    p = ronda(p);
    expect(p.prendas["calcetin-azul-1"].humedad).toBe(1);
    expect(p.jugadores[0].seca).toEqual(["calcetin-azul-2"]);
  });

  it("un chaparrón dura 1 día y no deja secar nada sin tejadillo", () => {
    let p = partida();
    proximaCarta(p, "chaparron");
    p = ronda(p);
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    p = ronda(p);
    expect(p.prendas["calcetin-azul-1"].humedad).toBe(1);
    expect(p.registro).toContain("Se acaba Chaparrón.");
  });

  it("con lluvia, en la segunda ronda de lluvia se seca normal", () => {
    let p = partida();
    p.dia = copia(p, "lluvia");
    p.diaDesde = p.ronda;
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    tender(p, 0, "basica", [["camiseta-azul-1", 0]], 1);
    p = ronda(p);
    expect(p.prendas["calcetin-azul-1"].humedad).toBe(1);
    expect(p.prendas["camiseta-azul-1"].humedad).toBe(2);
    p = ronda(p);
    expect(p.jugadores[0].seca).toEqual(["calcetin-azul-1"]);
    expect(p.prendas["camiseta-azul-1"].humedad).toBe(1);
  });

  it("con viento se caen los calcetines salvo en cuerdas resistentes, y lo demás seca más", () => {
    let p = partida();
    p.dia = copia(p, "viento");
    tender(p, 0, "basica", [["calcetin-azul-1", 0], ["camiseta-azul-1", 1]]);
    tender(p, 0, "resistente", [["calcetin-azul-2", 0]], 1);
    p = ronda(p);
    expect(p.jugadores[0].pendientes).toContain("calcetin-azul-1");
    expect(p.jugadores[0].seca).toEqual(expect.arrayContaining(["camiseta-azul-1", "calcetin-azul-2"]));
  });

  it("Tormenta repentina moja todo lo que no tiene tejadillo, de todos los jugadores", () => {
    let p = partida();
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    tender(p, 1, "tejadillo", [["toalla-rojo-1", 0]]);
    proximaCarta(p, "tormenta-repentina");
    // Primero se seca la ronda que acaba (3 → 2) y luego sale la tormenta.
    p = ronda(p);
    expect(p.prendas["toalla-azul-1"].humedad).toBe(3);
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(2);
  });

  it("Ola de calor seca y puntúa al instante", () => {
    let p = partida();
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    p.prendas["toalla-rojo-1"].humedad = 2;
    proximaCarta(p, "ola-de-calor");
    p = ronda(p);
    expect(p.jugadores[1].seca).toEqual(["toalla-rojo-1"]);
    expect(p.jugadores[1].puntos).toBe(6);
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
    tender(p, 0, "basica", [["toalla-rojo-1", 0]]);
    p.prendas["toalla-rojo-1"].humedad = 9;
    proximaCarta(p, "ropa-se-engancha");
    p = terminar(terminar(p));
    const rafaga = darAccion(p, 1, "rafaga-de-viento");
    expect(motivo(p, { tipo: "jugarAccion", jugador: 1, carta: rafaga, objetivo: { jugador: 0, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } })).toMatch(/Ropa se engancha lo impide hoy/);
  });
});

describe("objetivos", () => {
  const objetivo = (id: string) => datos.objetivos.find((o) => o.id === id)!;

  it("salen de un solo montón: primero los comunes y luego 2 por jugador, sin repetir", () => {
    const p = crearPartida(datos, { ...ajustesIniciales(datos), semilla: "montón" });
    const ofrecidos = p.jugadores.flatMap((j) => j.objetivosOfrecidos);
    expect(p.objetivosComunes).toHaveLength(2);
    expect(ofrecidos).toHaveLength(4);
    expect(new Set([...p.objetivosComunes, ...ofrecidos]).size).toBe(6);
  });

  it("Cuerdas llenas cuenta las cartas con todos sus huecos ocupados por prendas de un mismo color", () => {
    const p = partida();
    tender(p, 0, "basica", [["calcetin-azul-1", 0], ["camiseta-azul-1", 1]]);
    tender(p, 0, "basica", [["calcetin-azul-2", 0]]);
    tender(p, 0, "basica", [["calcetin-rojo-1", 0], ["camiseta-azul-2", 1]]);
    tender(p, 0, "tejadillo", [["toalla-azul-1", 0]], 1);
    const def = objetivo("cuerdas-llenas");
    expect(puntuarObjetivo(p, 0, def)).toMatchObject({ cantidad: 2, puntos: 2 * def.puntos });
    // Sin la condición de color, también cuenta la llena con colores mezclados.
    expect(puntuarObjetivo(p, 0, { ...def, parametros: {} }).cantidad).toBe(3);
  });

  it("Regalo envenenado: la vieja que pusiste a un rival y se le rompe es tu trofeo", () => {
    let p = partida();
    const i = tenderVieja(p, 1, [["calcetin-azul-1", 0]]);
    p.jugadores[1].lineas[0].cartas[i].colocadaPor = 0;
    p = ronda(ronda(p));
    expect(p.jugadores[1].lineas[0].cartas).toHaveLength(0);
    expect(p.jugadores[0].trofeos.map((c) => p.cartas[c])).toEqual(["vieja"]);
    expect(p.registro).toContain("Jugador 1 se queda Cuerda vieja como trofeo.");
    expect(puntuarObjetivo(p, 0, objetivo("regalo-envenenado")).puntos).toBe(4);
  });

  it("la vieja colocada con la jugada normal se rompe al acabar su 2.ª ronda y es trofeo de quien la puso", () => {
    let p = partida();
    const vieja = copia(p, "vieja");
    p.jugadores[0].mano.push(vieja);
    p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: vieja, linea: 0, en: 1 });
    expect(p.jugadores[1].lineas[0].cartas[0].colocadaPor).toBe(0);
    p = ronda(p);
    expect(p.jugadores[1].lineas[0].cartas).toHaveLength(1);
    p = ronda(p);
    expect(p.jugadores[1].lineas[0].cartas).toHaveLength(0);
    expect(p.jugadores[0].trofeos).toEqual([vieja]);
  });

  it("la cuerda vieja no gasta la cuerda del turno", () => {
    let p = partida();
    const vieja = copia(p, "vieja");
    const basica = copia(p, "basica");
    p.jugadores[0].mano.push(vieja, basica);
    p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: vieja, linea: 0, en: 1 });
    expect(p.turno.cuerdasJugadas).toBe(0);
    p = jugar(p, { tipo: "colocarCuerda", jugador: 0, carta: basica, linea: 0 });
    expect(p.turno.cuerdasJugadas).toBe(1);
  });

  it("el efecto viejas-colocadas cuenta las viejas que siguen en tendederos rivales y los trofeos", () => {
    const p = partida();
    const i = tenderVieja(p, 1, []);
    p.jugadores[1].lineas[0].cartas[i].colocadaPor = 0;
    p.jugadores[0].trofeos.push(copia(p, "vieja"));
    const def = { ...objetivo("regalo-envenenado"), efecto: "viejas-colocadas" };
    expect(puntuarObjetivo(p, 0, def).cantidad).toBe(2);
  });

  it("si el rival mejora la vieja antes de que se rompa, ya no es tu regalo", () => {
    let p = partida();
    const i = tenderVieja(p, 0, [["calcetin-azul-1", 0]]);
    p.jugadores[0].lineas[0].cartas[i].colocadaPor = 1;
    const basica = copia(p, "basica");
    p.jugadores[0].mano.push(basica);
    p = jugar(p, { tipo: "mejorarCuerda", jugador: 0, carta: basica, linea: 0, posicion: i });
    expect(p.jugadores[0].lineas[0].cartas[i].colocadaPor).toBeUndefined();
  });

  it("Conjunto completo: un calcetín, una camiseta y una toalla secos del mismo color", () => {
    const p = partida();
    p.jugadores[0].seca = ["calcetin-rojo-1", "camiseta-rojo-1", "toalla-rojo-1", "calcetin-azul-1", "camiseta-azul-1", "toalla-rojo-2"];
    expect(puntuarObjetivo(p, 0, objetivo("conjunto-completo"))).toMatchObject({ cantidad: 1, puntos: objetivo("conjunto-completo").puntos });
  });
});

describe("límite de mano", () => {
  it("si se pasa del límite tiene que descartar antes de pasar el turno", () => {
    let p = partida();
    p = jugar(p, { tipo: "terminarTurno", jugador: 0 });
    expect(p.turno.fase).toBe("descartar");
    expect(p.turno.jugador).toBe(0);
    expect(motivo(p, { tipo: "draft", jugador: 0, origen: { cesta: 0 }, patron: { tipo: "toalla" } })).toMatch(/descarta/);
    while (p.turno.fase === "descartar") p = jugar(p, { tipo: "descartar", jugador: 0, carta: p.jugadores[0].mano[0] });
    expect(p.jugadores[0].mano).toHaveLength(p.ajustes.limiteMano);
    expect(p.turno.jugador).toBe(1);
  });
});

describe("robo al terminar el turno", () => {
  const deMazo = (p: Partida, mazo: string) => p.jugadores[0].mano.filter((c) => defCarta(p, c).mazo === mazo).length;

  it("se eligen cuántas de las 3 son de cuerda, hasta 2", () => {
    const p = partida();
    p.jugadores[0].mano = [];
    expect(motivo(p, { tipo: "terminarTurno", jugador: 0, cuerdas: 3 })).toMatch(/Como mucho puedes robar 2 de cuerda/);
    const q = jugar(p, { tipo: "terminarTurno", jugador: 0, cuerdas: 2 });
    expect(deMazo(q, "cuerdas")).toBe(2);
    expect(deMazo(q, "acciones")).toBe(1);
  });

  it("se puede robar todo de acción, y sin elegir se roba 1 de cuerda y 2 de acción", () => {
    const p = partida();
    p.jugadores[0].mano = [];
    const todoAccion = jugar(p, { tipo: "terminarTurno", jugador: 0, cuerdas: 0 });
    expect(deMazo(todoAccion, "acciones")).toBe(3);
    const porDefecto = jugar(p, { tipo: "terminarTurno", jugador: 0 });
    expect(deMazo(porDefecto, "cuerdas")).toBe(1);
    expect(deMazo(porDefecto, "acciones")).toBe(2);
  });
});

describe("final de partida", () => {
  it("si se acaba la ropa, la partida termina al acabar la ronda aunque nadie llegue al umbral", () => {
    let p = partida();
    p.bolsa = [];
    p.centro = [];
    p.cestas = p.cestas.map(() => []);
    p = ronda(p);
    expect(p.terminada).toBe(true);
    expect(p.primeroEnLlegar).toBeNull();
    expect(p.registro.some((l) => l.startsWith("Se ha acabado la ropa"))).toBe(true);
  });

  it("si alguien llega al umbral en el secado de la ronda, se cuentan los objetivos", () => {
    let p = partida();
    p.jugadores[0].puntos = 29;
    tender(p, 0, "basica", [["calcetin-azul-1", 0]]);
    p = terminar(p);
    expect(p.terminada).toBe(false);
    p = terminar(p);
    expect(p.terminada).toBe(true);
    expect(p.final).toHaveLength(2);
    expect(p.final![0].puesto).toBe(1);
  });

  it("si llega a mitad de ronda, se termina la ronda antes de contar", () => {
    let p = partida();
    p.jugadores[0].puntos = 25;
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "secar-prenda"), objetivo: { jugador: 0, linea: 0, posicion: 0, prenda: "toalla-azul-1" } });
    expect(p.ultimaRonda).toBe(true);
    p = terminar(p);
    expect(p.terminada).toBe(false);
    expect(p.turno.jugador).toBe(1);
    p = terminar(p);
    expect(p.terminada).toBe(true);
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
    const toallero = p.catalogo.objetivos.toallero;
    expect(p.final![0].total).toBe(25 + Math.floor(6 / toallero.cada) * toallero.puntos);
  });

  it("los objetivos no tienen límite: dan sus puntos por cada tantos", () => {
    const p = partida();
    // Con un ritmo fijo (cada 2 → 2), para no depender de los datos.
    const calcetinero = { ...datos.objetivos.find((o) => o.id === "calcetinero")!, cada: 2, puntos: 2 };
    p.jugadores[0].seca = ["calcetin-rojo-1", "calcetin-rojo-2", "calcetin-rojo-3"];
    expect(puntuarObjetivo(p, 0, calcetinero).puntos).toBe(2);
    p.jugadores[0].seca.push(...Array.from({ length: 17 }, (_, i) => `calcetin-azul-${(i % 10) + 1}`));
    expect(puntuarObjetivo(p, 0, calcetinero).puntos).toBe(20);
  });
});

describe("reparto de prendas y vistas", () => {
  it("primero cada uno coge un tipo de una cesta, luego cada uno un tipo del centro, y después se juega", () => {
    let p = sinRepartir();
    expect(p.turno).toMatchObject({ fase: "cesta", jugador: 0 });
    expect(motivo(p, { tipo: "terminarTurno", jugador: 0 })).toMatch(/reparten las prendas/);
    expect(motivo(p, { tipo: "draft", jugador: 0, origen: "centro", patron: { tipo: "toalla" } })).toMatch(/de una cesta/);

    const cesta = p.cestas[0];
    const tipo = p.prendas[cesta[0]].tipo;
    const iguales = cesta.filter((id) => p.prendas[id].tipo === tipo);
    p = jugar(p, { tipo: "draft", jugador: 0, origen: { cesta: 0 }, patron: { tipo } });
    expect(p.jugadores[0].pendientes).toEqual(iguales);
    expect(p.centro).toEqual(cesta.filter((id) => !iguales.includes(id)));
    expect(p.turno).toMatchObject({ fase: "cesta", jugador: 1 });

    p = jugar(p, { tipo: "draft", jugador: 1, origen: { cesta: 1 }, patron: { tipo: p.prendas[p.cestas[1][0]].tipo } });
    expect(p.turno).toMatchObject({ fase: "centro", jugador: 0 });
    expect(motivo(p, { tipo: "draft", jugador: 0, origen: { cesta: 2 }, patron: { tipo: p.prendas[p.cestas[2][0]].tipo } })).toMatch(/del centro/);

    p = jugar(p, { tipo: "draft", jugador: 0, origen: "centro", patron: { tipo: p.prendas[p.centro[0]].tipo } });
    if (p.centro.length > 0) p = jugar(p, { tipo: "draft", jugador: 1, origen: "centro", patron: { tipo: p.prendas[p.centro[0]].tipo } });
    expect(p.turno).toMatchObject({ fase: "jugar", jugador: 0, numero: 1 });
  });

  it("con reparto inverso coge primero quien juega el último, y el turno lo sigue abriendo el primero", () => {
    let p = sinRepartir("prueba", (a) => (a.repartoInverso = true));
    expect(p.turno).toMatchObject({ fase: "cesta", jugador: 1 });
    p = repartir(p);
    expect(p.turno).toMatchObject({ fase: "jugar", jugador: 0 });
  });

  it("también se puede coger por color", () => {
    let p = sinRepartir();
    const cesta = p.cestas[0];
    const color = p.prendas[cesta[0]].color;
    const iguales = cesta.filter((id) => p.prendas[id].color === color);
    p = jugar(p, { tipo: "draft", jugador: 0, origen: { cesta: 0 }, patron: { color } });
    expect(p.jugadores[0].pendientes).toEqual(iguales);
    expect(p.centro).toHaveLength(4 - iguales.length);
  });

  it("al acabar la ronda el centro vuelve a la bolsa y solo se rellenan las cestas que se cogieron", () => {
    let p = partida("prueba", (a) => (a.limiteMano = 99));
    expect(p.cestas).toHaveLength(4);
    const sueltas = p.bolsa.length + p.cestas.flat().length + p.centro.length;
    const vacias = p.cestas.map((c, i) => (c.length === 0 ? i : -1)).filter((i) => i >= 0);
    expect(vacias).toHaveLength(2);
    const intactas = p.cestas.map((c) => [...c]);
    p = jugar(p, { tipo: "terminarTurno", jugador: 0 });
    p = jugar(p, { tipo: "terminarTurno", jugador: 1 });
    expect(p.ronda).toBe(2);
    expect(p.turno).toMatchObject({ fase: "cesta", jugador: 1 });
    expect(p.centro).toEqual([]);
    expect(p.cestas.every((c) => c.length === 4)).toBe(true);
    p.cestas.forEach((c, i) => {
      if (!vacias.includes(i)) expect(c).toEqual(intactas[i]);
    });
    expect(p.bolsa.length + p.cestas.flat().length).toBe(sueltas);
  });

  it("la vista de un jugador oculta la mano rival y la semilla", () => {
    const v = vistaPara(partida(), 0);
    expect(v.jugadores[1].mano.every((c) => c === "?")).toBe(true);
    expect(v.jugadores[0].mano.some((c) => c !== "?")).toBe(true);
    expect(v.semilla).toBe("");
  });
});

describe("jugadores automáticos", () => {
  // Azar con semilla, para que la prueba juegue siempre la misma partida.
  function azarFijo(semilla: number) {
    let s = semilla;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  }

  function partidaDeBots(jugadores: number, semilla: string): Partida {
    let p = crearPartida(datos, { ...ajustesIniciales(datos), jugadores, semilla });
    const azar = azarFijo(jugadores * 31 + 7);
    for (let pasos = 0; !p.terminada; pasos++) {
      if (pasos > 5000) throw new Error("Los bots se han quedado atascados.");
      // Le toca al que tiene que elegir objetivo, al que responde a un fastidio o al del turno.
      const quien = p.jugadores.findIndex((j) => j.objetivosOfrecidos.length > 0);
      const i = quien >= 0 ? quien : p.reaccion ? p.reaccion.defensor : p.turno.jugador;
      const jugada = siguienteJugadaIA(p, i, { azar });
      if (!jugada) throw new Error(`El bot ${i} no sabe qué hacer.`);
      p = jugar(p, jugada);
    }
    return p;
  }

  it.each([2, 4])("una partida de %i bots llega al final", (n) => {
    const p = partidaDeBots(n, `bots-${n}`);
    expect(p.final).toHaveLength(n);
    expect(p.final!.map((r) => r.puesto)).toContain(1);
  }, 60000);

  it("el registro estructurado va a la par que el registro en castellano", () => {
    const p = partidaDeBots(2, "bots-registro");
    expect(p.entradas).toHaveLength(p.registro.length);
    // Cada entrada tiene su clave, y las que nombran prendas las dan como «tipo:color».
    for (const e of p.entradas!) {
      expect(e.clave).toMatch(/^[a-zA-Z]+$/);
      if (typeof e.datos.prenda === "string") expect(e.datos.prenda).toMatch(/^[a-z]+:[a-z]+$/);
    }
    const i = p.entradas!.findIndex((e) => e.clave === "seca");
    expect(i).toBeGreaterThanOrEqual(0);
    const seca = p.entradas![i];
    expect(p.registro[i]).toContain(`${p.jugadores[seca.datos.jugador as number].nombre} seca`);
    expect(p.entradas!.at(-1)!.clave).toBe("puesto");
  }, 60000);
});

describe("motivos estructurados", () => {
  it("una jugada que no vale da la clave, los datos y el mismo texto en castellano", () => {
    const p = partida();
    const otro = (p.turno.jugador + 1) % p.jugadores.length;
    const r = aplicar(p, { tipo: "terminarTurno", jugador: otro, cuerdas: 0 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.detalle.clave).toBe("noEsTuTurno");
    expect(r.detalle.datos.jugador).toBe(otro);
    expect(r.detalle.texto).toBe(r.motivo);
    expect(porQueNoVale(p, { tipo: "terminarTurno", jugador: otro, cuerdas: 0 })?.texto).toBe(motivoInvalida(p, { tipo: "terminarTurno", jugador: otro, cuerdas: 0 }));
  });
});
describe("tope de humedad", () => {
  it("la humedad máxima viene de los ajustes por defecto (4), también en la partida larga", () => {
    expect(ajustesIniciales(datos).humedadMaxima).toBe(4);
    expect(partida().ajustes.humedadMaxima).toBe(4);
    expect(partida("prueba", (a) => void (a.modo = "larga")).ajustes.humedadMaxima).toBe(4);
    // La humedad inicial de cada prenda cabe en la escala de su carta.
    for (const t of datos.tipos) expect(t.humedad).toBeLessThanOrEqual(4);
  });

  it("mojar suma a la humedad de la prenda, sin campo aparte", () => {
    let p = partida();
    tender(p, 1, "basica", [["camiseta-rojo-1", 0]]);
    const retrasar = darAccion(p, 0, "retrasar-secado");
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: retrasar, objetivo: { jugador: 1, linea: 0, posicion: 0, prenda: "camiseta-rojo-1" } });
    expect(p.prendas["camiseta-rojo-1"].humedad).toBe(3);
    expect(p.prendas["camiseta-rojo-1"].extra).toBeUndefined();
  });

  it("Retrasar secado no pasa de 4: a una prenda que ya está a 4 no le hace nada", () => {
    let p = partida();
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    const objetivo = { jugador: 1, linea: 0, posicion: 0, prenda: "toalla-rojo-1" };
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "retrasar-secado"), objetivo });
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(4);
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "retrasar-secado"), objetivo });
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(4);
    expect(p.entradas?.at(-1)?.clave).toBe("humedadAlTope");
  });

  it("Mojar cuerda rival sube cada prenda hasta el tope y lo que sobra se pierde", () => {
    let p = partida();
    tender(p, 1, "basica", [["calcetin-azul-1", 0], ["toalla-rojo-1", 1]]);
    p.prendas["toalla-rojo-1"].humedad = 4;
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "mojar-cuerda-rival"), objetivo: { jugador: 1, linea: 0, posicion: 0 } });
    expect(p.prendas["calcetin-azul-1"].humedad).toBe(2);
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(4);
  });

  it("los sucesos del día tampoco pasan del tope", () => {
    let p = partida();
    tender(p, 0, "basica", [["toalla-azul-1", 0]]);
    p.prendas["toalla-azul-1"].humedad = 5; // tras el secado de la ronda, 4; la tormenta no la sube de ahí
    proximaCarta(p, "tormenta-repentina");
    p = ronda(p);
    expect(p.prendas["toalla-azul-1"].humedad).toBe(4);
  });

  it("el tope se puede cambiar en los ajustes", () => {
    let p = partida("prueba", (a) => void (a.humedadMaxima = 3));
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "retrasar-secado"), objetivo: { jugador: 1, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } });
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(3);
  });

  it("al secarse baja la misma humedad; un `extra` de una partida guardada no tiene efecto", () => {
    let p = partida();
    tender(p, 0, "basica", [["camiseta-rojo-1", 0]]);
    p.prendas["camiseta-rojo-1"].humedad = 4;
    p.prendas["camiseta-rojo-1"].extra = 2;
    p = ronda(p);
    expect(p.prendas["camiseta-rojo-1"].humedad).toBe(3);
    expect(p.prendas["camiseta-rojo-1"].extra).toBeUndefined();
    p = ronda(p);
    expect(p.prendas["camiseta-rojo-1"].humedad).toBe(2);
  });

  it("partidas guardadas sin el ajuste usan el tope de 4", () => {
    let p = partida();
    delete (p.ajustes as Partial<Ajustes>).humedadMaxima;
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    p.prendas["toalla-rojo-1"].humedad = 4;
    p = jugar(p, { tipo: "jugarAccion", jugador: 0, carta: darAccion(p, 0, "retrasar-secado"), objetivo: { jugador: 1, linea: 0, posicion: 0, prenda: "toalla-rojo-1" } });
    expect(p.prendas["toalla-rojo-1"].humedad).toBe(4);
  });

  it("la IA no gasta cartas que mojan en prendas que ya están a 4", () => {
    const p = partida();
    tender(p, 1, "basica", [["toalla-rojo-1", 0]]);
    p.prendas["toalla-rojo-1"].humedad = 4;
    darAccion(p, 0, "retrasar-secado");
    darAccion(p, 0, "mojar-cuerda-rival");
    const moja = candidatas(p, 0).filter(
      (j) => j.tipo === "jugarAccion" && ["retrasar-secado", "mojar-cuerda-rival"].includes(p.cartas[j.carta]) && j.objetivo?.jugador === 1,
    );
    expect(moja).toEqual([]);
  });
});
