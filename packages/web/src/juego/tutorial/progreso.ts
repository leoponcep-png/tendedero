// Lo que se recuerda del tutorial en este navegador: por dónde ibas (para retomarlo), si ya lo acabaste y si ya
// se te ofreció al abrir el juego por primera vez.

import type { Partida } from "@tendedero/motor";
import { CLAVES, guardarJSON, leerJSON } from "../../prototipos/perfil/almacen";
import { leerPartidas } from "../../prototipos/perfil/registro";

const PROGRESO = "tendedero-tutorial";
const OFRECIDO = "tendedero-tutorial-ofrecido";

export interface Progreso {
  /** Índice del paso en PASOS. */
  paso: number;
  partida: Partida;
}

export function leerProgreso(): Progreso | null {
  const g = leerJSON<Progreso | null>(PROGRESO, null);
  return g && typeof g.paso === "number" && g.partida?.version === 1 && g.partida.jugadores?.length === 2 ? g : null;
}

export const guardarProgreso = (g: Progreso) => guardarJSON(PROGRESO, g);

export function borrarProgreso(): void {
  try {
    localStorage.removeItem(PROGRESO);
  } catch {
    // Sin almacenamiento no había nada guardado.
  }
}

export const tutorialHecho = (): boolean => !!leerJSON<string | null>(CLAVES.tutorial, null);
export const marcarHecho = () => guardarJSON(CLAVES.tutorial, new Date().toISOString());

/**
 * Si al abrir el juego hay que ofrecer el tutorial: solo la primera vez (a quien no ha jugado nunca ni lo ha
 * hecho, ni lo tiene a medias, ni ha dicho ya que no).
 */
export const hayQueOfrecer = (): boolean => !leerJSON<boolean>(OFRECIDO, false) && !tutorialHecho() && !leerProgreso() && leerPartidas().length === 0;
export const marcarOfrecido = () => guardarJSON(OFRECIDO, true);
