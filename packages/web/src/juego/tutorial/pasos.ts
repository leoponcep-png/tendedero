// Guion del tutorial «Aprender a jugar»: una lista de pasos declarativa que Tutorial.tsx ejecuta sobre la mesa real.
// Cada paso tiene su bocadillo (claves tutorial.<id>.titulo y tutorial.<id>.texto, con huecos que salen de la
// partida), un foco (selectores de la mesa que se resaltan; el resto se oscurece) y, si toca, una acción que hay que
// hacer de verdad: mientras tanto, la mesa solo deja hacer las jugadas que pasan `permitida`.
// Los pasos de espera (`hasta`) dejan jugar a la IA hasta que se cumple lo que dicen.
// Lo que sale en la partida (qué cesta, qué cartas) lo fija la semilla de escenario.ts.

import { cumple, defCarta, type Jugada, type Partida } from "@tendedero/motor";
import { tLibre, type Variables } from "../../i18n";
import { nombreCarta, nombrePrendaT } from "../../i18n/juego";
import { textoPatron } from "../vista";
import { centroTutorial, cestaTutorial, colgadaDe, cuerdaBasica, cuerdaEspecial, niHablar, porTender, RIVAL, tactica, YO } from "./escenario";

export interface Paso {
  id: string;
  /** Los huecos del texto del bocadillo. */
  datos?: (p: Partida) => Variables;
  /** Lo que se resalta (selectores CSS de la mesa); sin foco, no se oscurece nada. */
  foco?: (p: Partida) => (string | null)[];
  /** Acción de verdad: solo valen las jugadas que la cumplen, y la primera que se hace termina el paso. */
  permitida?: (j: Jugada, p: Partida) => boolean;
  /** Paso de espera: la IA juega hasta que se cumple (y la mesa está quieta). */
  hasta?: (p: Partida) => boolean;
  /** Si no se cumple, el paso se salta (por si la partida no trae lo que enseña). */
  si?: (p: Partida) => boolean;
  /** El bocadillo va en el centro de la pantalla (para los de bienvenida y despedida). */
  centrado?: boolean;
}

// Selectores de la mesa.
const enMano = (carta: string | null) => (carta ? `.mj-mano [data-carta="${carta}"]` : null);
const panel = (j: number) => `.mj-panel:has([data-puntos="${j}"])`;
/** Una cuerda de tu tendedero y lo que cuelga de ella (que asoma por debajo de la carta). */
const tendida = (linea: number, posicion: number) => [`[data-tendida="${YO}:${linea}:${posicion}"]`, `[data-tendida="${YO}:${linea}:${posicion}"] .me-colgada`];
const MI_TENDEDERO = `[data-zona="${YO}"]`;
const AYUDA_MANO = ".mj-ayuda";

const miTurno = (p: Partida) => p.turno.jugador === YO && p.turno.fase === "jugar" && !p.reaccion;
const esMia = (j: Jugada) => j.jugador === YO;
const nombre = (p: Partida, carta: string | null) => (carta ? nombreCarta(p, carta) : "");

export const PASOS: Paso[] = [
  { id: "hola", centrado: true },
  {
    id: "meta",
    datos: (p) => ({ n: p.ajustes.umbralFinal }),
    foco: () => [panel(YO), panel(RIVAL)],
  },

  // ---------- Reparto ----------
  { id: "reparto", foco: () => [".me-reparto"] },
  {
    id: "cesta",
    si: (p) => p.turno.fase === "cesta" && p.turno.jugador === YO && !!cestaTutorial(p),
    datos: (p) => {
      const c = cestaTutorial(p)!;
      return { n: c.cesta + 1, opcion: textoPatron(c.patron, p.cestas[c.cesta].filter((id) => cumple(p.prendas[id], c.patron)).length) };
    },
    foco: (p) => [`[data-cesta="${cestaTutorial(p)?.cesta}"]`, `[data-cesta="${cestaTutorial(p)?.cesta}"] .me-opciones`],
    permitida: (j, p) => {
      const c = cestaTutorial(p);
      return !!c && esMia(j) && j.tipo === "draft" && j.origen !== "centro" && j.origen.cesta === c.cesta && JSON.stringify(j.patron) === JSON.stringify(c.patron);
    },
  },
  { id: "esperaCesta", hasta: (p) => p.turno.jugador === YO || p.turno.fase === "jugar" },
  {
    id: "centro",
    si: (p) => p.turno.fase === "centro" && p.turno.jugador === YO && !!centroTutorial(p),
    datos: (p) => {
      const patron = centroTutorial(p)!;
      return { opcion: textoPatron(patron, p.centro.filter((id) => cumple(p.prendas[id], patron)).length) };
    },
    foco: () => ["[data-centro]", "[data-centro] .me-opciones"],
    permitida: (j, p) => esMia(j) && j.tipo === "draft" && j.origen === "centro" && JSON.stringify(j.patron) === JSON.stringify(centroTutorial(p)),
  },
  { id: "esperaCentro", hasta: miTurno },

  // ---------- El tendedero y colgar ----------
  { id: "porTender", foco: () => [`[data-pila="porTender-${YO}"]`] },
  { id: "tendedero", datos: (p) => ({ lineas: p.ajustes.tendedero.lineas, cartas: p.ajustes.tendedero.cartasPorLinea }), foco: () => [MI_TENDEDERO] },
  {
    id: "cuerda",
    si: (p) => miTurno(p) && !!cuerdaBasica(p) && p.jugadores[YO].lineas[0].cartas.length === 0,
    datos: (p) => ({ carta: nombre(p, cuerdaBasica(p)) }),
    foco: (p) => [enMano(cuerdaBasica(p)), `[data-hueco="${YO}:0"]`],
    // En la línea de arriba: así la cuerda especial de después nunca le hace sombra.
    permitida: (j, p) => esMia(j) && j.tipo === "colocarCuerda" && j.carta === cuerdaBasica(p) && j.linea === 0 && j.en === undefined,
  },
  {
    id: "camiseta",
    si: (p) => miTurno(p) && !!porTender(p, "camiseta") && !colgadaDe(p, "camiseta") && p.jugadores[YO].lineas[0].cartas.length > 0,
    datos: (p) => ({ prenda: nombrePrendaT(p, porTender(p, "camiseta")!) }),
    foco: (p) => [`[data-pendiente="${porTender(p, "camiseta")}"]`, ...tendida(0, 0)],
    permitida: (j, p) => esMia(j) && j.tipo === "colgarPrenda" && p.prendas[j.prenda]?.tipo === "camiseta" && j.linea === 0 && j.posicion === 0,
  },
  {
    id: "calcetin",
    si: (p) => miTurno(p) && !!porTender(p, "calcetin") && !colgadaDe(p, "calcetin") && p.jugadores[YO].lineas[0].cartas.length > 0,
    foco: (p) => [...p.jugadores[YO].pendientes.filter((id) => p.prendas[id].tipo === "calcetin").map((id) => `[data-pendiente="${id}"]`), ...tendida(0, 0)],
    permitida: (j, p) => esMia(j) && j.tipo === "colgarPrenda" && p.prendas[j.prenda]?.tipo === "calcetin" && j.linea === 0 && j.posicion === 0,
  },

  // ---------- Humedad, secado y carta del día ----------
  {
    id: "humedad",
    datos: (p) => ({ calcetin: p.catalogo.tipos.calcetin?.puntos ?? 1, camiseta: p.catalogo.tipos.camiseta?.puntos ?? 3, toalla: p.catalogo.tipos.toalla?.puntos ?? 6 }),
    foco: () => [...tendida(0, 0)],
  },
  { id: "dia", datos: (p) => ({ carta: nombre(p, p.dia) }), foco: () => [".mf-comun .mj-dia"] },

  // ---------- Cuerdas especiales y la loseta ----------
  {
    id: "loseta",
    si: (p) => !!cuerdaEspecial(p),
    datos: (p) => ({ carta: nombre(p, cuerdaEspecial(p)) }),
    foco: (p) => [`[data-tapete="${YO}"] .loseta`, enMano(cuerdaEspecial(p))],
  },

  // ---------- Cartas de acción ----------
  {
    id: "acciones",
    datos: (p) => ({ n: p.ajustes.jugablesPorTurno.acciones }),
    foco: (p) => p.jugadores[YO].mano.filter((c) => defCarta(p, c).mazo !== "cuerdas").map(enMano),
  },
  {
    id: "tactica",
    si: (p) => miTurno(p) && !!tactica(p),
    datos: (p) => ({ carta: nombre(p, tactica(p)) }),
    foco: (p) => [enMano(tactica(p)), AYUDA_MANO],
    permitida: (j, p) => esMia(j) && j.tipo === "jugarAccion" && j.carta === tactica(p),
  },
  {
    // Con «Colocar cuerda extra», la cuerda especial se pone ya.
    id: "especial",
    si: (p) => miTurno(p) && !!cuerdaEspecial(p) && p.turno.cuerdasJugadas < p.ajustes.jugablesPorTurno.cuerdas + p.turno.cuerdasExtra,
    datos: (p) => ({ carta: nombre(p, cuerdaEspecial(p)) }),
    foco: (p) => [enMano(cuerdaEspecial(p)), MI_TENDEDERO],
    // Solo en un hueco (no encima de la básica, que la cambiaría).
    permitida: (j, p) => esMia(j) && j.tipo === "colocarCuerda" && j.carta === cuerdaEspecial(p) && j.en === undefined,
  },

  // ---------- Objetivos, ayudas y fin del turno ----------
  { id: "objetivos", foco: () => [".mf-comun .mj-objetivos"] },
  {
    id: "ayudas",
    datos: () => ({ boton: tLibre("mesa.vistazo") }),
    foco: () => [".mj-vistazo", panel(YO)],
  },
  {
    id: "terminar",
    si: miTurno,
    datos: (p) => ({ n: p.ajustes.roboPorTurno.cartas, max: p.ajustes.roboPorTurno.maxCuerdas }),
    foco: () => [".mj-turno-caja"],
    permitida: (j) => esMia(j) && j.tipo === "terminarTurno",
  },

  // ---------- Turno del rival: un fastidio y la reacción ----------
  { id: "turnoRival", hasta: (p) => p.reaccion?.defensor === YO || p.ronda > 1 },
  {
    id: "reaccion",
    si: (p) => p.reaccion?.defensor === YO && !!niHablar(p),
    datos: (p) => ({ carta: nombre(p, p.reaccion?.jugada.carta ?? null), prenda: colgadaDe(p, "calcetin") ? nombrePrendaT(p, colgadaDe(p, "calcetin")!.prenda) : "" }),
    foco: () => [".mj-reaccion"],
    permitida: (j) => esMia(j) && j.tipo === "responder" && j.anular,
  },
  { id: "finDia", hasta: (p) => p.ronda > 1 || p.terminada },

  // ---------- Secado y despedida ----------
  {
    id: "secado",
    datos: (p) => ({ n: p.jugadores[YO].puntos, secas: p.jugadores[YO].seca.length }),
    foco: () => [panel(YO)],
  },
  { id: "fin", centrado: true },
];

/** El siguiente paso que toca desde `desde` (incluido), saltando los que no vienen al caso. */
export function siguientePaso(p: Partida, desde: number): number {
  let i = desde;
  while (i < PASOS.length && PASOS[i].si && !PASOS[i].si!(p)) i++;
  return i;
}
