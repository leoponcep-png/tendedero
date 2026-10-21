import { cestasVacias, rellenarCestas, robar } from "../estado/utilidades";
import type { JugadaDe, Manejador } from "./tipos";

// Paso 1: roba y pasa al siguiente. El secado, el límite de mano y el final de partida llegan en el paso 2.
export const terminarTurno: Manejador<JugadaDe<"terminarTurno">> = {
  soloEnSuTurno: true,
  validar() {
    return null;
  },
  aplicar(p, j) {
    const { cuerdas, acciones } = p.ajustes.roboPorTurno;
    robar(p, j.jugador, "cuerdas", cuerdas);
    robar(p, j.jugador, "acciones", acciones);

    if (cestasVacias(p) && p.bolsa.length > 0) {
      rellenarCestas(p);
      p.registro.push("Las cestas y el centro se han vaciado: se rellenan las cestas desde la bolsa.");
    }

    const siguiente = (j.jugador + 1) % p.jugadores.length;
    p.turno = { numero: p.turno.numero + 1, jugador: siguiente, cuerdasJugadas: 0, accionesJugadas: 0, drafts: 0 };
    p.registro.push(`— Turno ${p.turno.numero}: ${p.jugadores[siguiente].nombre} —`);
  },
};
