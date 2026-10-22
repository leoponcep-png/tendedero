import { efectos, type EfectoClima, type EfectoCuerda, type Etiqueta } from "../efectos";
import type { Parametros } from "../datos/esquemas";
import type { CartaTendida, Partida } from "./tipos";
import { defCarta, descolgar, localizar, nombrePrenda, tipoDe } from "./utilidades";

/** Efecto pasivo de una carta de cuerda tendida, si tiene. */
export function efectoCuerda(p: Partida, tendida: CartaTendida): { efecto: EfectoCuerda; params: Parametros } | null {
  const def = defCarta(p, tendida.carta);
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  return efecto?.tipo === "cuerda" ? { efecto, params: def.parametros } : null;
}

/** Efecto del clima activo, si hay. */
export function efectoClima(p: Partida): { efecto: EfectoClima; params: Parametros } | null {
  if (!p.clima) return null;
  const def = defCarta(p, p.clima);
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  return efecto?.tipo === "clima" ? { efecto, params: def.parametros } : null;
}

/** Si la cuerda (por su habilidad) o la ronda (por un evento) protegen de algo. */
export function protegidaDe(p: Partida, tendida: CartaTendida, etiqueta: Etiqueta): boolean {
  return Boolean(efectoCuerda(p, tendida)?.efecto.protegeDe?.includes(etiqueta)) || p.rondaProtegeDe.includes(etiqueta);
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
  jugador.secadoEn[prenda] = defCarta(p, u.tendida.carta).id;
  jugador.puntos += puntos;
  const extra = puntos !== base ? ` (${base} ${puntos > base ? "+" : "−"} ${Math.abs(puntos - base)} por la cuerda)` : "";
  p.registro.push(`${jugador.nombre} seca ${nombrePrenda(p, prenda)}: +${puntos} pts${extra}.`);
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
