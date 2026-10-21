import type { Ajustes } from "../ajustes";
import type { Color, DefCarta, DefObjetivo, TipoPrenda } from "../datos/esquemas";
import type { Etiqueta } from "../efectos";

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
  /** Por «Proteger cuerda»: inmune al fastidio hasta el siguiente turno de su dueño. */
  protegida?: boolean;
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
  /** Prenda seca → id de la cuerda en la que se secó (para objetivos que dependen de ello). */
  secadoEn: Record<string, string>;
  objetivosOfrecidos: string[];
  objetivoSecreto: string | null;
  puntos: number;
}

export type Pila = "cuerdas" | "acciones" | "clima";

export interface Turno {
  numero: number;
  jugador: number;
  /** "descartar": se ha pasado del límite de mano y tiene que soltar cartas antes de pasar. */
  fase: "jugar" | "descartar";
  cuerdasJugadas: number;
  cuerdasExtra: number;
  accionesJugadas: number;
  drafts: number;
}

export interface PuntosObjetivo {
  objetivo: string;
  nombre: string;
  cantidad: number;
  puntos: number;
}

export interface ResultadoJugador {
  jugador: number;
  puntosPartida: number;
  objetivos: PuntosObjetivo[];
  total: number;
  puesto: number;
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
  /** Carta de clima activa: dura hasta que sale otro clima. */
  clima: string | null;
  ronda: number;
  /** El evento que salió al empezar esta ronda (ya resuelto y en el descarte). */
  ultimoEvento: string | null;
  /** Lo que un evento impide durante esta ronda (p. ej. «Ropa se engancha»). */
  rondaProtegeDe: Etiqueta[];
  /** La última carta de cada lista es la de arriba. */
  mazos: Record<Pila, string[]>;
  descartes: Record<Pila, string[]>;
  objetivosComunes: string[];
  jugadores: Jugador[];
  turno: Turno;
  /** Alguien ha llegado al umbral: se juega hasta acabar la ronda. */
  ultimaRonda: boolean;
  primeroEnLlegar: number | null;
  registro: string[];
  terminada: boolean;
  /** Clasificación tras el recuento de objetivos, ordenada por puesto. */
  final: ResultadoJugador[] | null;
}
