import { comprobarUmbral } from "../estado/final";
import { no, type Motivo } from "../estado/registro";
import type { Partida } from "../estado/tipos";
import { colgarPrenda } from "./colgarPrenda";
import { colocarCuerda, mejorarCuerda } from "./colocarCuerda";
import { draft } from "./draft";
import { elegirObjetivo } from "./elegirObjetivo";
import { jugarAccion } from "./jugarAccion";
import { responder } from "./responder";
import { descartar, terminarTurno } from "./terminarTurno";
import type { Jugada, JugadaDe, Manejador } from "./tipos";

const manejadores: { [T in Jugada["tipo"]]: Manejador<JugadaDe<T>> } = {
  draft,
  colocarCuerda,
  mejorarCuerda,
  colgarPrenda,
  jugarAccion,
  elegirObjetivo,
  terminarTurno,
  descartar,
  responder,
};

/** Si no vale, `motivo` es el texto en castellano y `detalle` el mismo motivo estructurado (para traducirlo). */
export type Resultado = { ok: true; partida: Partida } | { ok: false; motivo: string; detalle: Motivo };

function manejadorDe<J extends Jugada>(j: J): Manejador<J> {
  return manejadores[j.tipo] as unknown as Manejador<J>;
}

/** null si la jugada es válida; si no, el motivo: clave y datos para traducirlo, y el texto en castellano. */
export function porQueNoVale(p: Partida, j: Jugada): Motivo | null {
  const m = manejadorDe(j);
  if (!m) return no("desconocida", "Jugada desconocida.");
  if (p.terminada) return no("terminada", "La partida ha terminado.");
  const jugador = p.jugadores[j.jugador];
  if (!jugador) return no("sinJugador", "Ese jugador no existe.");
  if (p.reaccion && j.tipo !== "responder") {
    return no("esperandoRespuesta", `Esperando a que ${p.jugadores[p.reaccion.defensor].nombre} decida si responde.`, { jugador: p.reaccion.defensor });
  }
  if (m.soloEnSuTurno && j.jugador !== p.turno.jugador) return no("noEsTuTurno", `No es el turno de ${jugador.nombre}.`, { jugador: j.jugador });
  if (j.tipo !== "elegirObjetivo" && jugador.objetivosOfrecidos.length > 0) return no("primeroObjetivo", "Primero elige tu objetivo secreto.");
  if (p.turno.fase === "descartar" && j.tipo !== "descartar" && j.tipo !== "elegirObjetivo") {
    return no("primeroDescarta", `Primero descarta hasta quedarte con ${p.ajustes.limiteMano} cartas.`, { n: p.ajustes.limiteMano });
  }
  if ((p.turno.fase === "cesta" || p.turno.fase === "centro") && j.tipo !== "draft" && j.tipo !== "elegirObjetivo") {
    return no(
      p.turno.fase === "cesta" ? "primeroRepartoCesta" : "primeroRepartoCentro",
      `Primero se reparten las prendas: ${p.jugadores[p.turno.jugador].nombre} coge un color o un tipo ${p.turno.fase === "cesta" ? "de una cesta" : "del centro"}.`,
      { jugador: p.turno.jugador },
    );
  }
  return m.validar(p, j);
}

/** null si la jugada es válida; si no, el motivo en castellano. */
export function motivoInvalida(p: Partida, j: Jugada): string | null {
  return porQueNoVale(p, j)?.texto ?? null;
}

export function esValida(p: Partida, j: Jugada): boolean {
  return motivoInvalida(p, j) === null;
}

/** Devuelve una partida nueva con la jugada aplicada; la original no se toca. */
export function aplicar(p: Partida, j: Jugada): Resultado {
  const detalle = porQueNoVale(p, j);
  if (detalle) return { ok: false, motivo: detalle.texto, detalle };
  const nueva = structuredClone(p);
  manejadorDe(j).aplicar(nueva, j);
  // Una acción o un evento también pueden dar puntos a mitad de ronda.
  if (!nueva.terminada) comprobarUmbral(nueva);
  return { ok: true, partida: nueva };
}
