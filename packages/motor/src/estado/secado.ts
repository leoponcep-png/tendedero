import { efectos, type EfectoClima, type EfectoCuerda, type Etiqueta } from "../efectos";
import type { Parametros } from "../datos/esquemas";
import { anotar, refPrenda } from "./registro";
import type { CartaTendida, Partida } from "./tipos";
import { defCarta, descolgar, localizar, nombrePrenda, tipoDe } from "./utilidades";

/** Efecto pasivo de una carta de cuerda (por el id de la copia), si tiene. */
export function efectoDeCuerda(p: Partida, carta: string): { efecto: EfectoCuerda; params: Parametros } | null {
  const def = defCarta(p, carta);
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  return efecto?.tipo === "cuerda" ? { efecto, params: def.parametros } : null;
}

/** Efecto pasivo de una carta de cuerda tendida, si tiene. */
export function efectoCuerda(p: Partida, tendida: CartaTendida): { efecto: EfectoCuerda; params: Parametros } | null {
  return efectoDeCuerda(p, tendida.carta);
}

/** Efecto del clima activo, si hay. */
export function efectoClima(p: Partida): { efecto: EfectoClima; params: Parametros } | null {
  if (!p.dia) return null;
  const def = defCarta(p, p.dia);
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  return efecto?.tipo === "clima" ? { efecto, params: def.parametros } : null;
}

/** La carta de cuerda justo encima de esta (misma posición, línea anterior), si la hay. */
export function cartaDeArriba(p: Partida, tendida: CartaTendida): CartaTendida | null {
  for (const j of p.jugadores) {
    for (let l = 1; l < j.lineas.length; l++) {
      const pos = j.lineas[l].cartas.indexOf(tendida);
      if (pos >= 0) return j.lineas[l - 1].cartas[pos] ?? null;
    }
  }
  return null;
}

/** La carta que protege a esta de la etiqueta: ella misma por su habilidad, o la de arriba si la cubre (el tejadillo). */
export function quienProtege(p: Partida, tendida: CartaTendida, etiqueta: Etiqueta): CartaTendida | null {
  if (efectoCuerda(p, tendida)?.efecto.protegeDe?.includes(etiqueta)) return tendida;
  const arriba = cartaDeArriba(p, tendida);
  if (arriba && efectoCuerda(p, arriba)?.efecto.cubreAbajo?.includes(etiqueta)) return arriba;
  return null;
}

/** Si la cuerda (por su habilidad o la de arriba) o la ronda (por un evento) protegen de algo. */
export function protegidaDe(p: Partida, tendida: CartaTendida, etiqueta: Etiqueta): boolean {
  return quienProtege(p, tendida, etiqueta) !== null || p.rondaProtegeDe.includes(etiqueta);
}

/** La prenda pasa a la ropa seca de su dueño y da sus puntos (con el modificador de su cuerda). */
export function secarPrenda(p: Partida, prenda: string): void {
  const u = localizar(p, prenda);
  if (!u) return;
  const jugador = p.jugadores[u.jugador];
  const base = tipoDe(p, prenda).puntos;
  const cuerda = efectoCuerda(p, u.tendida);
  const puntos = Math.max(0, cuerda?.efecto.puntosAlSecar?.(p, prenda, cuerda.params, base) ?? base);

  descolgar(u);
  p.prendas[prenda].humedad = 0;
  jugador.seca.push(prenda);
  // Para objetivos como «Bajo techo»: su cuerda y, si la cubre, el tejadillo de arriba.
  const arriba = cartaDeArriba(p, u.tendida);
  const cubre = arriba && efectoCuerda(p, arriba)?.efecto.cubreAbajo?.length ? [defCarta(p, arriba.carta).id] : [];
  jugador.secadoEn[prenda] = [defCarta(p, u.tendida.carta).id, ...cubre];
  jugador.puntos += puntos;
  const extra = puntos !== base ? ` (${base} ${puntos > base ? "+" : "−"} ${Math.abs(puntos - base)} por la cuerda)` : "";
  anotar(p, "seca", { jugador: u.jugador, prenda: refPrenda(p, prenda), puntos, base }, `${jugador.nombre} seca ${nombrePrenda(p, prenda)}: +${puntos} pts${extra}.`);
}

/**
 * Al acabar la ronda, para cada jugador: el clima actúa (p. ej. el viento tira prendas), y después todas las prendas
 * colgadas del jugador pierden humedad según su cuerda y el clima; las que llegan a 0 se secan.
 */
export function faseDeSecado(p: Partida, jugador: number): void {
  const clima = efectoClima(p);
  clima?.efecto.antesDelSecado?.(p, jugador, clima.params);

  for (const linea of p.jugadores[jugador].lineas) {
    for (const tendida of linea.cartas) {
      const cuerda = efectoCuerda(p, tendida);
      const ajuste = clima?.efecto.ajusteSecado?.(p, tendida, clima.params) ?? 0;
      const baja = Math.max(0, (cuerda?.efecto.secado?.(cuerda.params) ?? 1) + ajuste);
      for (const { prenda } of [...tendida.colgadas]) {
        p.prendas[prenda].humedad = Math.max(0, p.prendas[prenda].humedad - baja);
        if (p.prendas[prenda].humedad === 0) secarPrenda(p, prenda);
      }
    }
  }
}
