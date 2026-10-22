import { pasarTurno } from "../estado/final";
import { defCarta, pilaDe, robar } from "../estado/utilidades";
import type { Partida } from "../estado/tipos";
import type { JugadaDe, Manejador } from "./tipos";

/** Cuántas de las cartas robadas pueden ser de cuerda; el resto son de acción. */
export function maxCuerdasRobadas(p: Partida): number {
  return Math.min(p.ajustes.roboPorTurno.maxCuerdas, p.ajustes.roboPorTurno.cartas);
}

// Orden: robo → descartar si se pasa del límite → siguiente jugador.
// El secado y los puntos no van aquí: se hacen para todos a la vez al acabar la ronda (ver pasarTurno).
export const terminarTurno: Manejador<JugadaDe<"terminarTurno">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    const maximo = maxCuerdasRobadas(p);
    const cuerdas = j.cuerdas ?? Math.min(1, maximo);
    if (!Number.isInteger(cuerdas) || cuerdas < 0) return "Elige cuántas cartas de cuerda robas.";
    if (cuerdas > maximo) return `Como mucho puedes robar ${maximo} de cuerda.`;
    return null;
  },
  aplicar(p, j) {
    const cuerdas = j.cuerdas ?? Math.min(1, maxCuerdasRobadas(p));
    const deCuerda = robar(p, j.jugador, "cuerdas", cuerdas);
    const deAccion = robar(p, j.jugador, "acciones", p.ajustes.roboPorTurno.cartas - cuerdas);

    const jugador = p.jugadores[j.jugador];
    p.registro.push(`${jugador.nombre} roba ${deCuerda} de cuerda y ${deAccion} de acción.`);
    if (jugador.mano.length > p.ajustes.limiteMano) {
      p.turno.fase = "descartar";
      p.registro.push(`${jugador.nombre} tiene ${jugador.mano.length} cartas y debe descartar hasta quedarse con ${p.ajustes.limiteMano}.`);
      return;
    }
    pasarTurno(p);
  },
};

export const descartar: Manejador<JugadaDe<"descartar">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    if (p.turno.fase !== "descartar") return "Solo se descarta al pasarte del límite de mano.";
    if (!p.jugadores[j.jugador].mano.includes(j.carta)) return "Esa carta no está en tu mano.";
    return null;
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    jugador.mano = jugador.mano.filter((c) => c !== j.carta);
    const def = defCarta(p, j.carta);
    p.descartes[pilaDe(def.mazo)].push(j.carta);
    p.registro.push(`${jugador.nombre} descarta ${def.nombre}.`);
    if (jugador.mano.length <= p.ajustes.limiteMano) pasarTurno(p);
  },
};
