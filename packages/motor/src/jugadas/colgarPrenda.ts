import { anotar, no, refPrenda } from "../estado/registro";
import { motivoNoCabe, nombrePrenda } from "../estado/utilidades";
import type { JugadaDe, Manejador } from "./tipos";

export const colgarPrenda: Manejador<JugadaDe<"colgarPrenda">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    if (!p.jugadores[j.jugador].pendientes.includes(j.prenda)) return no("prendaNoPendiente", "Esa prenda no está entre tus prendas por tender.");
    return motivoNoCabe(p, j, j.prenda);
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    jugador.pendientes = jugador.pendientes.filter((id) => id !== j.prenda);
    jugador.lineas[j.linea].cartas[j.posicion].colgadas.push({ prenda: j.prenda, inicio: j.inicio });
    anotar(
      p,
      "cuelga",
      { jugador: j.jugador, prenda: refPrenda(p, j.prenda), linea: j.linea + 1, posicion: j.posicion + 1 },
      `${jugador.nombre} cuelga ${nombrePrenda(p, j.prenda)} en la línea ${j.linea + 1}, carta ${j.posicion + 1}.`,
    );
  },
};
