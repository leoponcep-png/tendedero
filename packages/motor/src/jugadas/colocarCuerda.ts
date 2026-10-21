import { defCarta } from "../estado/utilidades";
import type { JugadaDe, Manejador } from "./tipos";

export const colocarCuerda: Manejador<JugadaDe<"colocarCuerda">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    const jugador = p.jugadores[j.jugador];
    if (!jugador.mano.includes(j.carta)) return "Esa carta no está en tu mano.";
    if (defCarta(p, j.carta).mazo !== "cuerdas") return "Esa carta no es de cuerda.";
    const maximo = p.ajustes.jugablesPorTurno.cuerdas + p.turno.cuerdasExtra;
    if (p.turno.cuerdasJugadas >= maximo) {
      return maximo === 1 ? "Ya has jugado una cuerda este turno." : `Ya has jugado ${maximo} cuerdas este turno.`;
    }
    const linea = jugador.lineas[j.linea];
    if (!linea) return "Esa línea no existe.";
    if (linea.cartas.length >= p.ajustes.tendedero.cartasPorLinea) {
      return `Esta línea ya tiene ${p.ajustes.tendedero.cartasPorLinea} cartas de cuerda.`;
    }
    return null;
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    jugador.mano = jugador.mano.filter((c) => c !== j.carta);
    jugador.lineas[j.linea].cartas.push({ carta: j.carta, colgadas: [] });
    p.turno.cuerdasJugadas++;
    p.registro.push(`${jugador.nombre} coloca ${defCarta(p, j.carta).nombre} en la línea ${j.linea + 1}.`);
  },
};
