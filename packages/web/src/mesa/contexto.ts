import { esValida, type Jugada, type Partida } from "@tendedero/motor";
import { createContext, useContext } from "react";

/** Lo que se está arrastrando. */
export type Arrastre =
  | { tipo: "prenda"; jugador: number; prenda: string }
  | { tipo: "cuerda"; jugador: number; carta: string };

/** Dónde se puede soltar. */
export type Destino =
  | { tipo: "espacio"; jugador: number; linea: number; posicion: number; inicio: number }
  | { tipo: "hueco"; jugador: number; linea: number };

export function jugadaDe(a: Arrastre, d: Destino): Jugada | null {
  if (a.jugador !== d.jugador) return null;
  if (a.tipo === "prenda" && d.tipo === "espacio") {
    return { tipo: "colgarPrenda", jugador: a.jugador, prenda: a.prenda, linea: d.linea, posicion: d.posicion, inicio: d.inicio };
  }
  if (a.tipo === "cuerda" && d.tipo === "hueco") {
    return { tipo: "colocarCuerda", jugador: a.jugador, carta: a.carta, linea: d.linea };
  }
  return null;
}

interface ContextoMesa {
  partida: Partida;
  arrastre: Arrastre | null;
  jugar: (j: Jugada) => void;
}

export const ContextoMesa = createContext<ContextoMesa | null>(null);

export function useMesa(): ContextoMesa {
  const c = useContext(ContextoMesa);
  if (!c) throw new Error("useMesa fuera de la mesa");
  return c;
}

/** Si lo que se arrastra ahora se podría soltar en este destino (para iluminarlo). */
export function useAdmite(destino: Destino): boolean {
  const { partida, arrastre } = useMesa();
  if (!arrastre) return false;
  const j = jugadaDe(arrastre, destino);
  return j !== null && esValida(partida, j);
}
