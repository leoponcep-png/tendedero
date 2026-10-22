import { comprobarUmbral } from "../estado/final";
import type { Partida } from "../estado/tipos";
import { colgarPrenda } from "./colgarPrenda";
import { colocarCuerda } from "./colocarCuerda";
import { draft } from "./draft";
import { elegirObjetivo } from "./elegirObjetivo";
import { jugarAccion } from "./jugarAccion";
import { descartar, terminarTurno } from "./terminarTurno";
import type { Jugada, JugadaDe, Manejador } from "./tipos";

const manejadores: { [T in Jugada["tipo"]]: Manejador<JugadaDe<T>> } = {
  draft,
  colocarCuerda,
  colgarPrenda,
  jugarAccion,
  elegirObjetivo,
  terminarTurno,
  descartar,
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
  const jugador = p.jugadores[j.jugador];
  if (!jugador) return "Ese jugador no existe.";
  if (m.soloEnSuTurno && j.jugador !== p.turno.jugador) return `No es el turno de ${jugador.nombre}.`;
  if (j.tipo !== "elegirObjetivo" && jugador.objetivosOfrecidos.length > 0) return "Primero elige tu objetivo secreto.";
  if (p.turno.fase === "descartar" && j.tipo !== "descartar" && j.tipo !== "elegirObjetivo") {
    return `Primero descarta hasta quedarte con ${p.ajustes.limiteMano} cartas.`;
  }
  if ((p.turno.fase === "cesta" || p.turno.fase === "centro") && j.tipo !== "draft" && j.tipo !== "elegirObjetivo") {
    return `Primero se reparten las prendas: ${p.jugadores[p.turno.jugador].nombre} coge un tipo ${p.turno.fase === "cesta" ? "de una cesta" : "del centro"}.`;
  }
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
  // Una acción o un evento también pueden dar puntos a mitad de ronda.
  if (!nueva.terminada) comprobarUmbral(nueva);
  return { ok: true, partida: nueva };
}
