// Cuánta ropa por tender le cabe de verdad a un jugador antes de que acabe la partida (lo usan la IA normal y la
// difícil).
//
// El tendedero se mide en «pinzas × rondas»: una carta de 3 espacios durante 4 rondas da 12. Cada prenda colgada
// gasta sus espacios durante las rondas que tarda en secarse (su humedad, con la `extra` de Mojar, entre lo que seca
// su cuerda), y lo que sobra es para la ropa por tender. Esta se reparte empezando por la que más puntos da por
// pinza y por ronda (calcetín 1/1, camiseta 3/4, toalla 6/9), y solo cuenta la que cabe y se seca a tiempo; el
// resto no vale nada (y un poco menos que nada, para no llevarse en el reparto ropa que no se podrá tender).

import { rondasHastaRomperse } from "./estado/rotura";
import { efectoCuerda } from "./estado/secado";
import type { CartaTendida, Partida } from "./estado/tipos";
import { defCarta, tipoDe } from "./estado/utilidades";

/** Humedad que pierden por ronda las prendas de esta cuerda (sin contar el tiempo del día). */
export function secadoDeCuerda(p: Partida, t: CartaTendida): number {
  const cuerda = efectoCuerda(p, t);
  return Math.max(1, cuerda?.efecto.secado?.(cuerda.params) ?? 1);
}

/** Rondas que tarda en secarse (contando la actual) una prenda colgada en `t`. */
export function rondasParaSecar(p: Partida, t: CartaTendida, prenda: string): number {
  return Math.max(1, Math.ceil(p.prendas[prenda].humedad / secadoDeCuerda(p, t)));
}

/** Puntos por pinza y por ronda de una prenda: lo que se ordena para decidir qué tender primero. */
export function rendimiento(p: Partida, prenda: string): number {
  const t = tipoDe(p, prenda);
  return t.puntos / (t.espacios * Math.max(1, p.prendas[prenda].humedad));
}

export interface RopaPorTender {
  /** Lo que vale la ropa por tender (con `factor` sobre sus puntos). */
  valor: number;
  /** Prenda por tender → probabilidad de que se llegue a secar (0 si no cabe a tiempo). */
  prob: Map<string, number>;
}

/**
 * Valor de la ropa por tender del jugador `i` si quedan `R` rondas. `cuerdasEnMano`: las que puede añadir al
 * tendedero (solo se saben las propias). `factor`: cuánto vale una prenda por tender frente a una colgada.
 */
export function ropaPorTender(p: Partida, i: number, R: number, cuerdasEnMano: number, factor: number): RopaPorTender {
  const j = p.jugadores[i];
  let presupuesto = 0;
  let cartas = 0;
  for (const l of j.lineas) {
    let rota = false;
    for (const t of l.cartas) {
      cartas++;
      const quedan = rondasHastaRomperse(p, t);
      if (quedan !== null && quedan <= R) rota = true;
      if (rota) continue;
      presupuesto += defCarta(p, t.carta).espacios * R;
      for (const c of t.colgadas) presupuesto -= tipoDe(p, c.prenda).espacios * Math.min(R, rondasParaSecar(p, t, c.prenda));
    }
  }
  // Una cuerda de la mano entra como pronto el turno que viene.
  const { lineas, cartasPorLinea } = p.ajustes.tendedero;
  const nuevas = Math.min(cuerdasEnMano, lineas * cartasPorLinea - cartas, Math.max(0, R - 1));
  presupuesto += nuevas * 3 * Math.max(0, R - 1);
  // Lo justo en el tendedero nunca encaja perfecto: se cuenta algo menos de lo que daría la cuenta.
  presupuesto *= 0.85;

  const ahora = p.turno.jugador === i && p.turno.fase === "jugar" ? 0 : 1;
  const orden = [...j.pendientes].sort((a, b) => rendimiento(p, b) - rendimiento(p, a) || tipoDe(p, b).puntos - tipoDe(p, a).puntos);
  const prob = new Map<string, number>();
  let valor = 0;
  for (const id of orden) {
    const t = tipoDe(p, id);
    const h = Math.max(1, p.prendas[id].humedad);
    const k = h + ahora;
    const gasto = t.espacios * h;
    if (k <= R && gasto <= presupuesto) {
      presupuesto -= gasto;
      const q = Math.pow(0.92, k - 1);
      valor += t.puntos * q * factor;
      prob.set(id, q * 0.9);
    } else {
      valor -= 0.4;
      prob.set(id, 0);
    }
  }
  return { valor, prob };
}
