// Punto de encuentro entre la partida y el perfil: al acabar una partida se apunta aquí su resumen, y de aquí
// salen los récords, las estadísticas y los logros (que desbloquean personajes y tapetes).

import { CLAVES, guardarJSON, leerJSON } from "./almacen";
import { actualizarLogros } from "./logros";

export interface ResumenPartida {
  /** Cuándo acabó (ISO). */
  fecha: string;
  jugadores: number;
  contraIA: boolean;
  online: boolean;
  /** 1 = ganada (empatar el primer puesto también cuenta como ganada). */
  puesto: number;
  /** Puntos totales con los objetivos. */
  puntos: number;
  /** Puntos de tus rivales, por si hacen falta para récords («ganar por más de X»). */
  puntosRivales: number[];
  rondas: number;
  prendasSecas: number;
  /** Fastidios que jugaste y que te jugaron. */
  fastidiosJugados: number;
  fastidiosRecibidos: number;
  /** Objetivo secreto que elegiste y si lo cumpliste (dio puntos). */
  objetivoSecreto: string | null;
  objetivoSecretoCumplido: boolean;
  /** Opcional: nombres de los rivales, en el mismo orden que `puntosRivales` (sirve para «has jugado con…»). */
  rivales?: string[];
  /** Opcional: animal con el que jugaste. */
  animal?: string;
  /** Opcional: código de la sala si fue online. */
  codigoSala?: string;
}

export function leerPartidas(): ResumenPartida[] {
  const lista = leerJSON<ResumenPartida[]>(CLAVES.partidas, []);
  return Array.isArray(lista) ? lista : [];
}

/** Apunta una partida terminada y comprueba los logros: los nuevos quedan pendientes de aviso. */
export function registrarPartida(r: ResumenPartida): void {
  const lista = leerPartidas();
  lista.push(r);
  guardarJSON(CLAVES.partidas, lista);
  actualizarLogros(lista);
}
