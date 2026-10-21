import { barajar } from "../azar";
import type { DefCarta, Mazo, TipoPrenda } from "../datos/esquemas";
import type { Partida, Pila } from "./tipos";

export function pilaDe(mazo: Mazo): Pila {
  return mazo === "cuerdas" ? "cuerdas" : mazo === "acciones" ? "acciones" : "clima";
}

export function defCarta(p: Partida, carta: string): DefCarta {
  return p.catalogo.cartas[p.cartas[carta]];
}

export function tipoDe(p: Partida, prenda: string): TipoPrenda {
  return p.catalogo.tipos[p.prendas[prenda].tipo];
}

export function nombrePrenda(p: Partida, prenda: string): string {
  const { tipo, color } = p.prendas[prenda];
  return `${p.catalogo.tipos[tipo].nombre.toLowerCase()} ${p.catalogo.colores[color].nombre.toLowerCase()}`;
}

export function espacios(n: number): string {
  return n === 1 ? "1 espacio" : `${n} espacios`;
}

/** Roba hasta `n` cartas; si el mazo se acaba, baraja su descarte. Devuelve cuántas robó. */
export function robar(p: Partida, jugador: number, pila: "cuerdas" | "acciones", n: number): number {
  let robadas = 0;
  for (let i = 0; i < n; i++) {
    if (p.mazos[pila].length === 0 && p.descartes[pila].length > 0) {
      p.mazos[pila] = p.descartes[pila];
      p.descartes[pila] = [];
      barajar(p, p.mazos[pila]);
      p.registro.push(`Se baraja el descarte de ${pila} para formar un mazo nuevo.`);
    }
    const carta = p.mazos[pila].pop();
    if (!carta) break;
    p.jugadores[jugador].mano.push(carta);
    robadas++;
  }
  return robadas;
}

// Provisional: el reparto de cestas, el relleno y las sobrantes siguen pendientes en el diseño.
export function rellenarCestas(p: Partida): void {
  const { numero, prendasPorCesta } = p.ajustes.cestas;
  p.cestas = Array.from({ length: numero }, () => p.bolsa.splice(-prendasPorCesta));
}

export function cestasVacias(p: Partida): boolean {
  return p.centro.length === 0 && p.cestas.every((c) => c.length === 0);
}
