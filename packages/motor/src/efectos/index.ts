// Registro de efectos programados. Cada carta de los JSON apunta a uno por su campo "efecto"
// y le pasa sus "parametros". Una carta solo puede marcarse "definida" si su efecto está aquí.
//
// Para añadir uno: prográmalo en el archivo de su tipo (acciones, cuerdas, objetivos, climas o eventos)
// con el mismo id que usará el JSON. El registro se arma solo.

import type { Parametros } from "../datos/esquemas";
import type { Motivo } from "../estado/registro";
import type { CartaTendida, Partida } from "../estado/tipos";
import type { JugadaDe } from "../jugadas/tipos";
import { efectosAccion } from "./acciones";
import { efectosClima } from "./climas";
import { efectosCuerda } from "./cuerdas";
import { efectosEvento } from "./eventos";
import { efectosObjetivo } from "./objetivos";

/** Lo que una carta de acción hace a sus objetivos; las cuerdas pueden proteger de ciertas etiquetas. */
export type Etiqueta = "fastidio" | "moja" | "tira" | "mueve";

/**
 * Sobre qué se suelta la carta de acción. Los que acaban en «Rival» van al tendedero de otro; el resto, al tuyo.
 * Los de dos pasos (ver BLANCOS_CON_DESTINO) piden además un destino:
 * - moverPropia / moverRival: un espacio libre adonde llevar la prenda.
 * - cambiarPrendas: un espacio de otra prenda tuya; se intercambian sus sitios.
 * - cambiarCuerdas: otra carta de cuerda tuya; se intercambia todo lo colgado en ellas.
 * - moverCuerda: otra carta de cuerda tuya (se intercambian de sitio) o el hueco siguiente de una línea.
 * «reaccion» no se juega en tu turno: se responde con ella al fastidio de un rival.
 */
export type Blanco =
  | "ninguno"
  | "prendaPropia"
  | "prendaRival"
  | "cartaPropia"
  | "cartaRival"
  | "moverPropia"
  | "moverRival"
  | "cambiarPrendas"
  | "cambiarCuerdas"
  | "moverCuerda"
  | "reaccion";

export const BLANCOS_CON_DESTINO: Blanco[] = ["moverPropia", "moverRival", "cambiarPrendas", "cambiarCuerdas", "moverCuerda"];

export interface EfectoAccion {
  tipo: "accion";
  blanco: Blanco;
  etiquetas: Etiqueta[];
  /** Comprobaciones propias, además de las comunes (mano, límite, blanco, protecciones). */
  validar?(p: Partida, j: JugadaDe<"jugarAccion">, params: Parametros): Motivo | null;
  aplicar(p: Partida, j: JugadaDe<"jugarAccion">, params: Parametros): void;
}

/** Habilidad pasiva de una carta de cuerda; afecta a las prendas colgadas en ella. */
export interface EfectoCuerda {
  tipo: "cuerda";
  /** Humedad que pierden sus prendas en cada secado (1 si no se indica). */
  secado?(params: Parametros): number;
  /** Puntos que da una prenda al secarse aquí, a partir de los base. */
  puntosAlSecar?(p: Partida, prenda: string, params: Parametros, base: number): number;
  /** Etiquetas de acción que no afectan a esta carta. */
  protegeDe?: Etiqueta[];
  /** Etiquetas de las que protege también a la carta de cuerda justo debajo (misma posición, línea siguiente). */
  cubreAbajo?: Etiqueta[];
  /** Rondas tras las que se rompe, ella y todas las cartas a su derecha (contando la ronda en que se coloca). */
  seRompeTras?(params: Parametros): number;
  /** Se puede colocar en el tendedero de un rival. */
  paraRival?: boolean;
  /** Colocarla no cuenta como la cuerda del turno. */
  noGastaTurno?: boolean;
}

/** Cuenta lo que mide un objetivo; «cada» y «puntos» del JSON convierten la cantidad en puntos. */
export interface EfectoObjetivo {
  tipo: "objetivo";
  contar(p: Partida, jugador: number, params: Parametros): number;
}

/** Clima persistente: actúa en el secado de cada jugador mientras siga activo. */
export interface EfectoClima {
  tipo: "clima";
  /** Humedad de más (o de menos, si es negativa) que pierden las prendas de esta carta de cuerda. */
  ajusteSecado?(p: Partida, tendida: CartaTendida, params: Parametros): number;
  /** Lo que le pasa a cada jugador al acabar la ronda, justo antes de secar. */
  antesDelSecado?(p: Partida, jugador: number, params: Parametros): void;
}

/** Evento instantáneo: se resuelve al salir y se descarta. */
export interface EfectoEvento {
  tipo: "evento";
  resolver(p: Partida, params: Parametros): void;
}

export type Efecto = EfectoAccion | EfectoCuerda | EfectoObjetivo | EfectoClima | EfectoEvento;

export const efectos: Record<string, Efecto> = {
  ...efectosAccion,
  ...efectosCuerda,
  ...efectosObjetivo,
  ...efectosClima,
  ...efectosEvento,
};
