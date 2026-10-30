import type { Ajustes } from "../ajustes";
import type { Color, DefCarta, DefObjetivo, TipoPrenda } from "../datos/esquemas";
import type { Etiqueta } from "../efectos";
import type { JugadaDe } from "../jugadas/tipos";
import type { Entrada } from "./registro";

export interface Prenda {
  id: string;
  tipo: string;
  color: string;
  /** Humedad: sube al mojarla (sin pasar de `ajustes.humedadMaxima`) y baja al secarse. */
  humedad: number;
  /** Obsoleto: lo traen partidas guardadas de versiones anteriores. No tiene efecto; el motor lo borra al tocar la humedad. */
  extra?: number;
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
  /** Ronda en la que se colocó (o se mejoró); las cuerdas que se rompen cuentan desde aquí. */
  colocadaEn?: number;
  /** Quién la puso, si fue un rival (la cuerda vieja); si se rompe aquí, se la lleva como trofeo. */
  colocadaPor?: number;
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
  /** Por prenda seca: las cartas de cuerda en las que se secó (la suya y, si la cubría, el tejadillo de arriba). */
  secadoEn: Record<string, string[]>;
  /** Cuerdas viejas que puso a un rival y se le rompieron allí: se las queda boca abajo. */
  trofeos: string[];
  objetivosOfrecidos: string[];
  objetivoSecreto: string | null;
  puntos: number;
}

export type Pila = "cuerdas" | "acciones" | "dia";

export interface Turno {
  numero: number;
  jugador: number;
  /**
   * "cesta" y "centro": reparto de prendas al empezar la ronda; `jugador` es a quien le toca coger.
   * "descartar": se ha pasado del límite de mano y tiene que soltar cartas antes de pasar.
   */
  fase: "cesta" | "centro" | "jugar" | "descartar";
  cuerdasJugadas: number;
  cuerdasExtra: number;
  accionesJugadas: number;
}

export interface Reaccion {
  jugada: JugadaDe<"jugarAccion"> | JugadaDe<"colocarCuerda">;
  defensor: number;
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
  /** Prendas que han salido de la partida (estaban en una cuerda que se rompió). */
  perdidas: string[];
  /**
   * Carta del día en juego (tiempo o suceso): dura sus parametros.dias rondas y, mientras haya una,
   * no se roba otra.
   */
  dia: string | null;
  /** Ronda en la que salió la carta del día en juego. */
  diaDesde: number | null;
  ronda: number;
  /** Lo que un suceso impide durante esta ronda (p. ej. «Ropa se engancha»). */
  rondaProtegeDe: Etiqueta[];
  /** La última carta de cada lista es la de arriba. */
  mazos: Record<Pila, string[]>;
  descartes: Record<Pila, string[]>;
  objetivosComunes: string[];
  jugadores: Jugador[];
  turno: Turno;
  /**
   * Fastidio a la espera de que el jugador atacado decida si lo anula con una carta de reacción.
   * La carta del atacante ya ha salido de su mano y cuenta como jugada; el efecto aún no se ha aplicado.
   */
  reaccion: Reaccion | null;
  /** Alguien ha llegado al umbral: se juega hasta acabar la ronda. */
  ultimaRonda: boolean;
  primeroEnLlegar: number | null;
  registro: string[];
  /**
   * El registro estructurado (clave del mensaje + datos), a la par que `registro`: la entrada i corresponde a la
   * línea registro.length - entradas.length + i. Falta en partidas guardadas antes de que existiera.
   */
  entradas?: Entrada[];
  terminada: boolean;
  /** Clasificación tras el recuento de objetivos, ordenada por puesto. */
  final: ResultadoJugador[] | null;
}
