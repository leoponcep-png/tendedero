// La partida del tutorial: 2 jugadores contra una IA Fácil y dócil, con una semilla elegida para que salga todo
// lo que hay que enseñar en la primera ronda (ver la comprobación en pasos.ts):
// - en una cesta hay un calcetín y una camiseta del mismo color (se cogen juntos, por color);
// - en tu mano hay una Cuerda básica, una cuerda especial, «Reducir humedad» y «¡Ni hablar!»;
// - el rival tiene «Retrasar secado» (un fastidio) para jugártelo y que lo anules;
// - la carta del día es de sol, así que al acabar el día se te seca lo que tiendes.
// Todo lo que hace aquí la IA sale de la partida (sin Math.random), así que la misma semilla y las mismas jugadas
// dan siempre lo mismo, también al retomar el tutorial.

import {
  ajustesIniciales,
  aplicar,
  cestasPorDefecto,
  crearPartida,
  cuerdasARobar,
  defCarta,
  efectoAccion,
  eleccionDeObjetivo,
  esValida,
  siguienteJugadaIA,
  type AzarIA,
  type Datos,
  type Jugada,
  type JugadaDe,
  type Partida,
  type Patron,
} from "@tendedero/motor";

export const SEMILLA_TUTORIAL = "aprende-a-tender-4442"; // cambiada con el mazo nuevo de acciones (la 833 ya no daba lo de arriba)
export const YO = 0;
export const RIVAL = 1;

/** Números «al azar» para la IA sacados del estado de la partida: siempre los mismos en el mismo punto. */
export function azarDe(p: Partida): AzarIA {
  let s = (p.azar ^ Math.imul(p.registro.length + 1, 2654435761)) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const opcionesIA = (p: Partida) => ({ dificultad: "facil" as const, azar: azarDe(p) });

/** Crea la partida del tutorial con los objetivos secretos ya elegidos (el tuyo, el primero que te ofrecen). */
export function partidaTutorial(datos: Datos, nombres: [string, string], semilla = SEMILLA_TUTORIAL): Partida {
  const base = ajustesIniciales(datos);
  let p = crearPartida(datos, { ...base, jugadores: 2, cestas: { ...base.cestas, numero: cestasPorDefecto(datos, 2) }, semilla });
  p.jugadores[YO].nombre = nombres[0];
  p.jugadores[RIVAL].nombre = nombres[1];
  for (const j of [YO, RIVAL]) {
    const eleccion: Jugada = j === YO ? { tipo: "elegirObjetivo", jugador: YO, objetivo: p.jugadores[YO].objetivosOfrecidos[0] } : eleccionDeObjetivo(p, j, opcionesIA(p));
    const r = aplicar(p, eleccion);
    if (r.ok) p = r.partida;
  }
  return p;
}

// ---------- Lo que se le pide al jugador en cada paso (sale de la partida, no de ids escritos a mano) ----------

const mano = (p: Partida, j = YO) => p.jugadores[j].mano;
const idDe = (p: Partida, carta: string) => defCarta(p, carta).id;

/** La cesta de la que coger y el color: la que tiene un calcetín y una camiseta del mismo color. */
export function cestaTutorial(p: Partida): { cesta: number; patron: Patron } | null {
  for (let cesta = 0; cesta < p.cestas.length; cesta++) {
    for (const color of Object.keys(p.catalogo.colores)) {
      const tipos = p.cestas[cesta].filter((id) => p.prendas[id].color === color).map((id) => p.prendas[id].tipo);
      if (tipos.includes("calcetin") && tipos.includes("camiseta") && !tipos.includes("toalla")) return { cesta, patron: { color } };
    }
  }
  return null;
}

/** Qué coger del centro: lo que más prendas da (a igualdad, lo primero). */
export function centroTutorial(p: Partida): Patron | null {
  let mejor: { patron: Patron; n: number } | null = null;
  const contar = (patron: Patron) => p.centro.filter((id) => ("color" in patron ? p.prendas[id].color === patron.color : p.prendas[id].tipo === patron.tipo)).length;
  for (const tipo of Object.keys(p.catalogo.tipos)) {
    const n = contar({ tipo });
    if (n && (!mejor || n > mejor.n)) mejor = { patron: { tipo }, n };
  }
  for (const color of Object.keys(p.catalogo.colores)) {
    const n = contar({ color });
    if (n && (!mejor || n > mejor.n)) mejor = { patron: { color }, n };
  }
  return mejor?.patron ?? null;
}

export const cuerdaBasica = (p: Partida) => mano(p).find((c) => idDe(p, c) === "basica") ?? null;
/** La cuerda con habilidad que tienes en la mano (para enseñar la loseta). */
export const cuerdaEspecial = (p: Partida) => mano(p).find((c) => defCarta(p, c).mazo === "cuerdas" && idDe(p, c) !== "basica") ?? null;
/** Tácticas que sirven para enseñar (por orden de preferencia): sobre una prenda tuya o sin objetivo. */
export const TACTICAS = ["reducir-humedad", "secador", "secar-prenda", "buscar-cuerda", "cesto-ropa-sucia"];
export const tactica = (p: Partida) => TACTICAS.map((t) => mano(p).find((c) => idDe(p, c) === t)).find(Boolean) ?? null;
/** Fastidios que el rival te puede jugar de guion (sobre tu calcetín o su cuerda). */
export const FASTIDIOS = ["retrasar-secado", "manguerazo", "mojar-cuerda-rival", "rafaga-de-viento"];
export const niHablar = (p: Partida) => mano(p).find((c) => idDe(p, c) === "ni-hablar") ?? null;

/** La prenda de un tipo que tienes por tender (de las que cogiste de la cesta) o, si ya está colgada, null. */
export function porTender(p: Partida, tipo: string): string | null {
  return p.jugadores[YO].pendientes.find((id) => p.prendas[id].tipo === tipo) ?? null;
}

/** Dónde está colgada una prenda tuya de ese tipo: [línea, posición] de su cuerda. */
export function colgadaDe(p: Partida, tipo: string): { linea: number; posicion: number; prenda: string } | null {
  for (const [linea, l] of p.jugadores[YO].lineas.entries()) {
    for (const [posicion, t] of l.cartas.entries()) {
      const c = t.colgadas.find((c) => p.prendas[c.prenda].tipo === tipo);
      if (c) return { linea, posicion, prenda: c.prenda };
    }
  }
  return null;
}

// ---------- La IA del tutorial ----------

/** Si una jugada de la IA te fastidia (una acción de fastidio sobre ti o una cuerda vieja en tu tendedero). */
function teFastidia(p: Partida, j: Jugada): boolean {
  if (j.tipo === "colocarCuerda") return j.en === YO;
  if (j.tipo !== "jugarAccion" || j.objetivo?.jugador !== YO) return false;
  return !!efectoAccion(p, j.carta)?.etiquetas.includes("fastidio");
}

/** El fastidio de guion: el rival te juega «Retrasar secado» sobre tu calcetín, para que lo anules. */
export function fastidioDeGuion(p: Partida): JugadaDe<"jugarAccion"> | null {
  if (p.ronda !== 1 || p.turno.jugador !== RIVAL || p.turno.fase !== "jugar" || p.turno.accionesJugadas > 0 || p.reaccion) return null;
  const carta = FASTIDIOS.map((f) => mano(p, RIVAL).find((c) => idDe(p, c) === f)).find(Boolean);
  const sitio = colgadaDe(p, "calcetin") ?? colgadaDe(p, "camiseta");
  if (!carta || !sitio || !niHablar(p)) return null;
  const j: JugadaDe<"jugarAccion"> = { tipo: "jugarAccion", jugador: RIVAL, carta, objetivo: { jugador: YO, ...sitio } };
  return esValida(p, j) ? j : null;
}

/**
 * Lo que juega la IA del tutorial. Mientras dura la explicación (`docil`) no te fastidia salvo con el fastidio de
 * guion; después juega como la IA Fácil de siempre.
 */
export function jugadaIA(p: Partida, quien: number, docil: boolean): Jugada | null {
  if (docil) {
    const guion = fastidioDeGuion(p);
    if (guion && quien === RIVAL) return guion;
  }
  let j: Jugada | null = null;
  try {
    j = siguienteJugadaIA(p, quien, opcionesIA(p));
  } catch (e) {
    console.error(e);
  }
  if (j && docil && teFastidia(p, j)) j = { tipo: "terminarTurno", jugador: quien, cuerdas: cuerdasARobar(p, quien, opcionesIA(p)) };
  return j;
}

/** Quién de la IA tiene que hacer algo ahora (tú eres el asiento 0). */
export function quienJuegaIA(p: Partida): number | null {
  if (p.terminada) return null;
  if (p.jugadores.some((j) => j.objetivosOfrecidos.length > 0)) return p.jugadores[RIVAL].objetivosOfrecidos.length ? RIVAL : null;
  if (p.reaccion) return p.reaccion.defensor !== YO ? p.reaccion.defensor : null;
  return p.turno.jugador !== YO ? p.turno.jugador : null;
}

// ---------- Personajes ----------

/** El animal del rival del tutorial: uno distinto del tuyo. */
export const rivalTutorial = (miAnimal: string) => ["conejo", "zorra", "erizo"].find((a) => a !== miAnimal)!;
/** El personaje que hace de guía: el ratón, salvo que juegues con él (entonces el erizo o la ardilla). */
export const guiaTutorial = (miAnimal: string) => ["raton", "erizo", "ardilla"].find((a) => a !== miAnimal && a !== rivalTutorial(miAnimal))!;
