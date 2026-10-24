import type { Jugada, JugadaDe, Partida } from "@tendedero/motor";
import { createContext, useContext } from "react";
import type { Arrastre } from "../mesa/contexto";
import type { Perfil } from "../prototipos/MenuPartida";

/** Lo que comparten las piezas de la mesa de juego. */
export interface Juego {
  /** La partida que se ve (puede ir por detrás de la real mientras se anima una jugada). */
  p: Partida;
  yo: number;
  perfiles: Perfil[];
  /** Carta o prenda elegida con un clic (para soltarla después con otro clic). */
  sel: Arrastre | null;
  /** Lo que se está arrastrando. */
  arrastre: Arrastre | null;
  /** Acción de dos pasos a la que solo le falta el destino. */
  movimiento: JugadaDe<"jugarAccion"> | null;
  /** Si ahora puedes jugar cartas y colgar prendas (tu turno, fase de juego, sin animaciones ni reacciones). */
  puedoJugar: boolean;
  ocupado: boolean;
  /** Lo que acaba de llegar a la mesa (para la animación de entrada). */
  recien: Set<string>;
  jugar: (j: Jugada) => void;
  elegir: (a: Arrastre | null) => void;
  vista: number;
  verTendedero: (j: number) => void;
}

export const ContextoJuego = createContext<Juego | null>(null);

export function useJuego(): Juego {
  const c = useContext(ContextoJuego);
  if (!c) throw new Error("useJuego fuera de la mesa");
  return c;
}

/** Lo que está en la mano del ratón: lo arrastrado o, si no, lo elegido con un clic. */
export const activo = (j: Juego): Arrastre | null => j.arrastre ?? j.sel;
