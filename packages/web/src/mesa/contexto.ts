import { efectoAccion, FALTA_DESTINO, motivoInvalida, pideDestino, prendaEn, type Jugada, type JugadaDe, type Partida } from "@tendedero/motor";
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

export function jugadaDe(p: Partida, a: Arrastre, d: Destino): Jugada | null {
  if (a.tipo === "accion") {
    if (d.tipo !== "espacio") return null;
    const { jugador, linea, posicion } = d;
    return { tipo: "jugarAccion", jugador: a.jugador, carta: a.carta, objetivo: { jugador, linea, posicion, prenda: prendaEn(p, d) } };
  }
  if (a.tipo === "cuerda") {
    // En un hueco: se coloca (en el tendedero de un rival, solo la vieja). Encima de una carta tuya: la mejora.
    if (d.tipo === "hueco") {
      return { tipo: "colocarCuerda", jugador: a.jugador, carta: a.carta, linea: d.linea, ...(d.jugador !== a.jugador && { en: d.jugador }) };
    }
    if (d.jugador !== a.jugador) return null;
    return { tipo: "mejorarCuerda", jugador: a.jugador, carta: a.carta, linea: d.linea, posicion: d.posicion };
  }
  if (a.jugador !== d.jugador || d.tipo !== "espacio") return null;
  return { tipo: "colgarPrenda", jugador: a.jugador, prenda: a.prenda, linea: d.linea, posicion: d.posicion, inicio: d.inicio };
}

/** Válida, o válida a falta de elegir el destino (las acciones de dos pasos se completan después). */
export function admisible(p: Partida, j: Jugada): boolean {
  const motivo = motivoInvalida(p, j);
  return motivo === null || motivo === FALTA_DESTINO;
}

export function necesitaDestino(p: Partida, j: Jugada): j is JugadaDe<"jugarAccion"> {
  if (j.tipo !== "jugarAccion" || j.objetivo?.destino) return false;
  const efecto = efectoAccion(p, j.carta);
  return efecto !== null && pideDestino(efecto.blanco);
}

interface ContextoMesa {
  partida: Partida;
  arrastre: Arrastre | null;
  /** Acción de dos pasos (mover, intercambiar) a la que solo le falta el destino. */
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

/** La jugada de dos pasos a medias, completada con este destino, si es válida. */
export function movidaHacia(
  p: Partida,
  movimiento: JugadaDe<"jugarAccion"> | null,
  jugador: number,
  destino: { linea: number; posicion: number; inicio: number },
): JugadaDe<"jugarAccion"> | null {
  if (!movimiento || movimiento.objetivo?.jugador !== jugador) return null;
  const movida = { ...movimiento, objetivo: { ...movimiento.objetivo, destino } };
  return motivoInvalida(p, movida) === null ? movida : null;
}
