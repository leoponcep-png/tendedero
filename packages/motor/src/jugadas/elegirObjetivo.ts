import type { JugadaDe, Manejador } from "./tipos";

// Se elige al empezar, todos a la vez, así que no depende del turno.
export const elegirObjetivo: Manejador<JugadaDe<"elegirObjetivo">> = {
  soloEnSuTurno: false,
  validar(p, j) {
    const jugador = p.jugadores[j.jugador];
    if (jugador.objetivoSecreto) return "Ya has elegido tu objetivo secreto.";
    if (!jugador.objetivosOfrecidos.includes(j.objetivo)) return "Ese objetivo no está entre los que te han tocado.";
    return null;
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    jugador.objetivoSecreto = j.objetivo;
    jugador.objetivosOfrecidos = [];
    p.registro.push(`${jugador.nombre} elige su objetivo secreto.`);
  },
};
