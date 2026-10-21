import { efectoAccion, FALTA_DESTINO, motivoInvalida, tipoDe, type Jugada, type JugadaDe, type Partida } from "@tendedero/motor";
import { createContext, useContext } from "react";

/** Lo que se está arrastrando. */
export type Arrastre =
  | { tipo: "prenda"; jugador: number; prenda: string }
  | { tipo: "cuerda"; jugador: number; carta: string }
  | { tipo: "accion"; jugador: number; carta: string };

/** Dónde se puede soltar. */
export type Destino =
  | { tipo: "espacio"; jugador: number; linea: number; posicion: number; inicio: number }
  | { tipo: "hueco"; jugador: number; linea: number };

/** La prenda que ocupa ese espacio, si hay alguna. */
function prendaEn(p: Partida, d: Destino & { tipo: "espacio" }): string | undefined {
  const tendida = p.jugadores[d.jugador].lineas[d.linea].cartas[d.posicion];
  return tendida?.colgadas.find((c) => d.inicio >= c.inicio && d.inicio < c.inicio + tipoDe(p, c.prenda).espacios)?.prenda;
}

export function jugadaDe(p: Partida, a: Arrastre, d: Destino): Jugada | null {
  if (a.tipo === "accion") {
    if (d.tipo !== "espacio") return null;
    const { jugador, linea, posicion } = d;
    return { tipo: "jugarAccion", jugador: a.jugador, carta: a.carta, objetivo: { jugador, linea, posicion, prenda: prendaEn(p, d) } };
  }
  if (a.jugador !== d.jugador) return null;
  if (a.tipo === "prenda" && d.tipo === "espacio") {
    return { tipo: "colgarPrenda", jugador: a.jugador, prenda: a.prenda, linea: d.linea, posicion: d.posicion, inicio: d.inicio };
  }
  if (a.tipo === "cuerda" && d.tipo === "hueco") {
    return { tipo: "colocarCuerda", jugador: a.jugador, carta: a.carta, linea: d.linea };
  }
  return null;
}

/** Válida, o válida a falta de elegir adónde mover (las acciones de mover se completan en un segundo paso). */
export function admisible(p: Partida, j: Jugada): boolean {
  const motivo = motivoInvalida(p, j);
  return motivo === null || motivo === FALTA_DESTINO;
}

export function necesitaDestino(p: Partida, j: Jugada): j is JugadaDe<"jugarAccion"> {
  return j.tipo === "jugarAccion" && Boolean(efectoAccion(p, j.carta)?.blanco.startsWith("mover")) && !j.objetivo?.destino;
}

interface ContextoMesa {
  partida: Partida;
  arrastre: Arrastre | null;
  /** Acción de mover a la que solo le falta el destino. */
  movimiento: JugadaDe<"jugarAccion"> | null;
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
  const j = jugadaDe(partida, arrastre, destino);
  return j !== null && admisible(partida, j);
}
