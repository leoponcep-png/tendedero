import type { Partida } from "../estado/tipos";

/** Las prendas se cogen todas las de un color o todas las de un tipo. */
export type Patron = { color: string } | { tipo: string };
export type Origen = { cesta: number } | "centro";

/**
 * Sobre qué se juega una carta de acción: una carta de cuerda y, si hace falta, una prenda.
 * Las de dos pasos (mover, intercambiar) llevan además un destino: un espacio de una carta de cuerda,
 * o el hueco siguiente de una línea (posicion = número de cartas de esa línea).
 */
export interface ObjetivoAccion {
  jugador: number;
  linea: number;
  posicion: number;
  prenda?: string;
  destino?: { linea: number; posicion: number; inicio: number };
}

export type Jugada =
  | { tipo: "draft"; jugador: number; origen: Origen; patron: Patron }
  /** `en`: a quién se le coloca (por defecto, a uno mismo); solo algunas cuerdas van al tendedero de un rival. */
  | { tipo: "colocarCuerda"; jugador: number; carta: string; linea: number; en?: number }
  /** Pone la carta de cuerda encima de una básica o vieja propia; las prendas se quedan. */
  | { tipo: "mejorarCuerda"; jugador: number; carta: string; linea: number; posicion: number }
  /** El jugador atacado decide si anula el fastidio con una carta de reacción. */
  | { tipo: "responder"; jugador: number; anular: boolean }
  | { tipo: "colgarPrenda"; jugador: number; prenda: string; linea: number; posicion: number; inicio: number }
  | { tipo: "jugarAccion"; jugador: number; carta: string; objetivo?: ObjetivoAccion }
  | { tipo: "elegirObjetivo"; jugador: number; objetivo: string }
  /** `cuerdas`: cuántas de las cartas que roba son de cuerda (el resto, de acción). */
  | { tipo: "terminarTurno"; jugador: number; cuerdas?: number }
  | { tipo: "descartar"; jugador: number; carta: string };

export type JugadaDe<T extends Jugada["tipo"]> = Extract<Jugada, { tipo: T }>;

/**
 * Cada jugada se programa en dos partes: `validar` devuelve el motivo por el que no se puede
 * (o null si se puede) y `aplicar` la ejecuta sobre una copia de la partida.
 */
export interface Manejador<J extends Jugada> {
  soloEnSuTurno: boolean;
  validar(p: Partida, j: J): string | null;
  aplicar(p: Partida, j: J): void;
}
