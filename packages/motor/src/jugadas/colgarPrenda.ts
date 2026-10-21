import { defCarta, espacios, nombrePrenda, tipoDe } from "../estado/utilidades";
import type { JugadaDe, Manejador } from "./tipos";

export const colgarPrenda: Manejador<JugadaDe<"colgarPrenda">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    const jugador = p.jugadores[j.jugador];
    if (!jugador.pendientes.includes(j.prenda)) return "Esa prenda no está entre tus prendas por tender.";
    const tendida = jugador.lineas[j.linea]?.cartas[j.posicion];
    if (!tendida) return "Ahí no hay ninguna carta de cuerda.";

    const huecos = defCarta(p, tendida.carta).espacios;
    const ocupa = tipoDe(p, j.prenda).espacios;
    if (!Number.isInteger(j.inicio) || j.inicio < 0 || j.inicio + ocupa > huecos) {
      return `No cabe: ocupa ${espacios(ocupa)} y tiene que caber entera en una sola carta.`;
    }
    for (const c of tendida.colgadas) {
      const fin = c.inicio + tipoDe(p, c.prenda).espacios;
      if (j.inicio < fin && c.inicio < j.inicio + ocupa) return "Esos espacios ya están ocupados.";
    }
    return null;
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    jugador.pendientes = jugador.pendientes.filter((id) => id !== j.prenda);
    jugador.lineas[j.linea].cartas[j.posicion].colgadas.push({ prenda: j.prenda, inicio: j.inicio });
    p.registro.push(
      `${jugador.nombre} cuelga ${nombrePrenda(p, j.prenda)} en la línea ${j.linea + 1}, carta ${j.posicion + 1}.`,
    );
  },
};
