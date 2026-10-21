import type { Partida } from "../estado/tipos";
import { colgarPrenda } from "./colgarPrenda";
import { colocarCuerda } from "./colocarCuerda";
import { draft } from "./draft";
import { elegirObjetivo } from "./elegirObjetivo";
import { terminarTurno } from "./terminarTurno";
import type { Jugada, JugadaDe, Manejador } from "./tipos";

const manejadores: { [T in Jugada["tipo"]]: Manejador<JugadaDe<T>> } = {
  draft,
  colocarCuerda,
  colgarPrenda,
  elegirObjetivo,
  terminarTurno,
};

export type Resultado = { ok: true; partida: Partida } | { ok: false; motivo: string };

function manejadorDe<J extends Jugada>(j: J): Manejador<J> {
  return manejadores[j.tipo] as unknown as Manejador<J>;
}

/** null si la jugada es válida; si no, el motivo en castellano. */
export function motivoInvalida(p: Partida, j: Jugada): string | null {
  const m = manejadorDe(j);
  if (!m) return "Jugada desconocida.";
  if (p.terminada) return "La partida ha terminado.";
  if (!p.jugadores[j.jugador]) return "Ese jugador no existe.";
  if (m.soloEnSuTurno && j.jugador !== p.turno.jugador) return `No es el turno de ${p.jugadores[j.jugador].nombre}.`;
  return m.validar(p, j);
}

export function esValida(p: Partida, j: Jugada): boolean {
  return motivoInvalida(p, j) === null;
}

/** Devuelve una partida nueva con la jugada aplicada; la original no se toca. */
export function aplicar(p: Partida, j: Jugada): Resultado {
  const motivo = motivoInvalida(p, j);
  if (motivo) return { ok: false, motivo };
  const nueva = structuredClone(p);
  manejadorDe(j).aplicar(nueva, j);
  return { ok: true, partida: nueva };
}
