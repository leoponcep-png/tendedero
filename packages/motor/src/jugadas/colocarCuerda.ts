import { efectoDeCuerda } from "../estado/secado";
import type { Partida } from "../estado/tipos";
import { defCarta, tipoDe } from "../estado/utilidades";
import { esperaReaccion } from "./jugarAccion";
import type { JugadaDe, Manejador } from "./tipos";

/**
 * Comprobaciones comunes a jugar una carta de cuerda, ya sea colocándola o mejorando otra.
 * `gratis`: no cuenta como la cuerda del turno (con el ajuste viejaAlRivalGratis).
 */
function motivoCartaDeCuerda(p: Partida, jugador: number, carta: string, gratis = false): string | null {
  if (!p.jugadores[jugador].mano.includes(carta)) return "Esa carta no está en tu mano.";
  if (defCarta(p, carta).mazo !== "cuerdas") return "Esa carta no es de cuerda.";
  if (gratis) return null;
  const maximo = p.ajustes.jugablesPorTurno.cuerdas + p.turno.cuerdasExtra;
  if (p.turno.cuerdasJugadas >= maximo) {
    return maximo === 1 ? "Ya has jugado una cuerda este turno." : `Ya has jugado ${maximo} cuerdas este turno.`;
  }
  return null;
}

/** Quita la carta de la mano y, salvo que sea gratis, la cuenta como la cuerda del turno. */
function pagarCuerda(p: Partida, jugador: number, carta: string, gratis = false): void {
  p.jugadores[jugador].mano = p.jugadores[jugador].mano.filter((c) => c !== carta);
  if (!gratis) p.turno.cuerdasJugadas++;
}

/** Con el ajuste viejaAlRivalGratis, colocar una cuerda en el tendedero de un rival no gasta la del turno. */
function esGratis(p: Partida, j: JugadaDe<"colocarCuerda">): boolean {
  return Boolean(p.ajustes.viejaAlRivalGratis) && (j.en ?? j.jugador) !== j.jugador;
}

/** Pone la carta de cuerda en el hueco siguiente de la línea (ya pagada). */
export function tenderCuerda(p: Partida, j: JugadaDe<"colocarCuerda">): void {
  const en = j.en ?? j.jugador;
  p.jugadores[en].lineas[j.linea].cartas.push({
    carta: j.carta,
    colgadas: [],
    colocadaEn: p.ronda,
    ...(en !== j.jugador && { colocadaPor: j.jugador }),
  });
}

export const colocarCuerda: Manejador<JugadaDe<"colocarCuerda">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    const motivo = motivoCartaDeCuerda(p, j.jugador, j.carta, esGratis(p, j));
    if (motivo) return motivo;
    const en = j.en ?? j.jugador;
    if (!p.jugadores[en]) return "Ese jugador no existe.";
    if (en !== j.jugador && !efectoDeCuerda(p, j.carta)?.efecto.paraRival) {
      return "Esta cuerda solo se puede colocar en tu propio tendedero.";
    }
    const linea = p.jugadores[en].lineas[j.linea];
    if (!linea) return "Esa línea no existe.";
    if (linea.cartas.length >= p.ajustes.tendedero.cartasPorLinea) {
      return `Esta línea ya tiene ${p.ajustes.tendedero.cartasPorLinea} cartas de cuerda.`;
    }
    return null;
  },
  aplicar(p, j) {
    const en = j.en ?? j.jugador;
    pagarCuerda(p, j.jugador, j.carta, esGratis(p, j));
    const donde = en === j.jugador ? "" : ` de ${p.jugadores[en].nombre}`;
    p.registro.push(`${p.jugadores[j.jugador].nombre} coloca ${defCarta(p, j.carta).nombre} en la línea ${j.linea + 1}${donde}.`);
    // Colocarle una cuerda a un rival es un fastidio: puede anularlo con una carta de reacción.
    if (esperaReaccion(p, j.jugador, en)) {
      p.reaccion = { jugada: j, defensor: en };
      p.registro.push(`${p.jugadores[en].nombre} puede responder con una carta de reacción.`);
      return;
    }
    tenderCuerda(p, j);
  },
};

// Se mejora poniendo la carta encima de una básica o de una que se rompe (la vieja); las prendas se quedan.
export const mejorarCuerda: Manejador<JugadaDe<"mejorarCuerda">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    const motivo = motivoCartaDeCuerda(p, j.jugador, j.carta);
    if (motivo) return motivo;
    const tendida = p.jugadores[j.jugador].lineas[j.linea]?.cartas[j.posicion];
    if (!tendida) return "Ahí no hay ninguna carta de cuerda tuya.";
    const debajo = defCarta(p, tendida.carta);
    const encima = defCarta(p, j.carta);
    const seRompe = (carta: string) => Boolean(efectoDeCuerda(p, carta)?.efecto.seRompeTras);
    if (debajo.efecto !== null && !seRompe(tendida.carta)) return "Solo se mejoran las cuerdas básicas y las viejas.";
    if (encima.id === debajo.id) return `Ya es una ${debajo.nombre.toLowerCase()}.`;
    if (seRompe(j.carta)) return `${encima.nombre} no sirve para mejorar una cuerda.`;
    const cabe = tendida.colgadas.every((c) => c.inicio + tipoDe(p, c.prenda).espacios <= encima.espacios);
    if (!cabe) return "Las prendas colgadas no caben en esa carta.";
    return null;
  },
  aplicar(p, j) {
    const tendida = p.jugadores[j.jugador].lineas[j.linea].cartas[j.posicion];
    const antes = defCarta(p, tendida.carta).nombre;
    pagarCuerda(p, j.jugador, j.carta);
    p.descartes.cuerdas.push(tendida.carta);
    tendida.carta = j.carta;
    tendida.colocadaEn = p.ronda;
    // Mejorada, ya no es el regalo de nadie.
    delete tendida.colocadaPor;
    p.registro.push(
      `${p.jugadores[j.jugador].nombre} mejora ${antes} a ${defCarta(p, j.carta).nombre} (línea ${j.linea + 1}, carta ${j.posicion + 1}).`,
    );
  },
};
