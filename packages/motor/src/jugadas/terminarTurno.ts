import { pasarTurno } from "../estado/final";
import { defCarta, pilaDe, robar } from "../estado/utilidades";
import type { JugadaDe, Manejador } from "./tipos";

// Orden: robo → descartar si se pasa del límite → siguiente jugador.
// El secado y los puntos no van aquí: se hacen para todos a la vez al acabar la ronda (ver pasarTurno).
export const terminarTurno: Manejador<JugadaDe<"terminarTurno">> = {
  soloEnSuTurno: true,
  validar() {
    return null;
  },
  aplicar(p, j) {
    robar(p, j.jugador, "cuerdas", p.ajustes.roboPorTurno.cuerdas);
    robar(p, j.jugador, "acciones", p.ajustes.roboPorTurno.acciones);

    const jugador = p.jugadores[j.jugador];
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
