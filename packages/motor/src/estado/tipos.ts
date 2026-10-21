import type { Ajustes } from "../ajustes";
import type { Color, DefCarta, DefObjetivo, TipoPrenda } from "../datos/esquemas";

export interface Prenda {
  id: string;
  tipo: string;
  color: string;
  humedad: number;
}

/** Prenda colgada en una carta de cuerda, desde el espacio `inicio` (0 = el de la izquierda). */
export interface Colgada {
  prenda: string;
  inicio: number;
}

export interface CartaTendida {
  carta: string;
  colgadas: Colgada[];
}

/** Las cartas van de izquierda a derecha; cada nueva tapa el poste de la anterior. */
export interface Linea {
  cartas: CartaTendida[];
}

export interface Jugador {
  nombre: string;
  lineas: Linea[];
  mano: string[];
  pendientes: string[];
  seca: string[];
  objetivosOfrecidos: string[];
  objetivoSecreto: string | null;
  puntos: number;
}

export type Pila = "cuerdas" | "acciones" | "clima";

export interface Turno {
  numero: number;
  jugador: number;
  cuerdasJugadas: number;
  accionesJugadas: number;
  drafts: number;
}

/**
 * Todo el estado de una partida. Es un objeto plano (se puede guardar como JSON)
 * e incluye el catálogo que usa, así que no depende de cómo estén los datos después.
 */
export interface Partida {
  version: 1;
  ajustes: Ajustes;
  semilla: string;
  azar: number;
  catalogo: {
    colores: Record<string, Color>;
    /** Con los valores de los ajustes ya aplicados. */
    tipos: Record<string, TipoPrenda>;
    cartas: Record<string, DefCarta>;
    objetivos: Record<string, DefObjetivo>;
  };
  prendas: Record<string, Prenda>;
  /** Id de cada copia física (p. ej. "basica#3") → id de su definición. */
  cartas: Record<string, string>;
  bolsa: string[];
  cestas: string[][];
  centro: string[];
  clima: string | null;
  /** La última carta de cada lista es la de arriba. */
  mazos: Record<Pila, string[]>;
  descartes: Record<Pila, string[]>;
  objetivosComunes: string[];
  jugadores: Jugador[];
  turno: Turno;
  registro: string[];
  terminada: boolean;
}
