import type { Partida } from "../estado/tipos";

export type Patron = { color: string } | { tipo: string };
export type Origen = { cesta: number } | "centro";

export type Jugada =
  | { tipo: "draft"; jugador: number; origen: Origen; patron: Patron }
  | { tipo: "colocarCuerda"; jugador: number; carta: string; linea: number }
  | { tipo: "colgarPrenda"; jugador: number; prenda: string; linea: number; posicion: number; inicio: number }
  | { tipo: "elegirObjetivo"; jugador: number; objetivo: string }
  | { tipo: "terminarTurno"; jugador: number };

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
