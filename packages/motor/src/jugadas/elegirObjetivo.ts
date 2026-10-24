import { anotar, no } from "../estado/registro";
import type { JugadaDe, Manejador } from "./tipos";

// Se elige al empezar, todos a la vez, así que no depende del turno.
export const elegirObjetivo: Manejador<JugadaDe<"elegirObjetivo">> = {
  soloEnSuTurno: false,
  validar(p, j) {
    const jugador = p.jugadores[j.jugador];
    if (jugador.objetivoSecreto) return no("yaObjetivo", "Ya has elegido tu objetivo secreto.");
    if (!jugador.objetivosOfrecidos.includes(j.objetivo)) return no("objetivoAjeno", "Ese objetivo no está entre los que te han tocado.");
    return null;
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    jugador.objetivoSecreto = j.objetivo;
    jugador.objetivosOfrecidos = [];
    anotar(p, "eligeObjetivo", { jugador: j.jugador }, `${jugador.nombre} elige su objetivo secreto.`);
  },
};
