import { barajar } from "../azar";
import type { DefCarta, Mazo, Parametros, TipoPrenda } from "../datos/esquemas";
import { anotar, no, refPrenda, type Motivo } from "./registro";
import type { Colgada, CartaTendida, Partida, Pila } from "./tipos";

export function pilaDe(mazo: Mazo): Pila {
  return mazo === "cuerdas" ? "cuerdas" : mazo === "acciones" ? "acciones" : "dia";
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

export function numero(params: Parametros, clave: string, porDefecto: number): number {
  const v = params[clave];
  return typeof v === "number" ? v : porDefecto;
}

export function texto(params: Parametros, clave: string): string | undefined {
  const v = params[clave];
  return typeof v === "string" ? v : undefined;
}

export interface Ubicacion {
  jugador: number;
  linea: number;
  posicion: number;
  tendida: CartaTendida;
  colgada: Colgada;
}

/** Dónde está colgada una prenda, si lo está. */
export function localizar(p: Partida, prenda: string): Ubicacion | null {
  for (const [jugador, j] of p.jugadores.entries()) {
    for (const [linea, l] of j.lineas.entries()) {
      for (const [posicion, tendida] of l.cartas.entries()) {
        const colgada = tendida.colgadas.find((c) => c.prenda === prenda);
        if (colgada) return { jugador, linea, posicion, tendida, colgada };
      }
    }
  }
  return null;
}

/** La prenda que ocupa ese espacio de una carta de cuerda, si hay alguna. */
export function prendaEn(p: Partida, sitio: { jugador: number; linea: number; posicion: number; inicio: number }): string | undefined {
  const tendida = p.jugadores[sitio.jugador]?.lineas[sitio.linea]?.cartas[sitio.posicion];
  return tendida?.colgadas.find((c) => sitio.inicio >= c.inicio && sitio.inicio < c.inicio + tipoDe(p, c.prenda).espacios)?.prenda;
}

/** null si la prenda cabe en ese sitio; si no, el motivo. `ignorar`: prendas que se están moviendo. */
export function motivoNoCabe(
  p: Partida,
  sitio: { jugador: number; linea: number; posicion: number; inicio: number },
  prenda: string,
  ignorar: string | string[] = [],
): Motivo | null {
  const ignoradas = typeof ignorar === "string" ? [ignorar] : ignorar;
  const tendida = p.jugadores[sitio.jugador]?.lineas[sitio.linea]?.cartas[sitio.posicion];
  if (!tendida) return no("sinCuerdaAhi", "Ahí no hay ninguna carta de cuerda.");
  const huecos = defCarta(p, tendida.carta).espacios;
  const ocupa = tipoDe(p, prenda).espacios;
  if (!Number.isInteger(sitio.inicio) || sitio.inicio < 0 || sitio.inicio + ocupa > huecos) {
    return no("noCabe", `No cabe: ocupa ${espacios(ocupa)} y tiene que caber entera en una sola carta.`, { n: ocupa });
  }
  for (const c of tendida.colgadas) {
    if (ignoradas.includes(c.prenda)) continue;
    const fin = c.inicio + tipoDe(p, c.prenda).espacios;
    if (sitio.inicio < fin && c.inicio < sitio.inicio + ocupa) return no("ocupado", "Esos espacios ya están ocupados.");
  }
  return null;
}

export function descolgar(u: Ubicacion): void {
  u.tendida.colgadas = u.tendida.colgadas.filter((c) => c !== u.colgada);
}

/** La prenda se cae: vuelve a las prendas por tender de su dueño, con su humedad inicial. */
export function caer(p: Partida, prenda: string): void {
  const u = localizar(p, prenda);
  if (!u) return;
  descolgar(u);
  p.prendas[prenda].humedad = tipoDe(p, prenda).humedad;
  p.jugadores[u.jugador].pendientes.push(prenda);
  anotar(p, "seCae", { prenda: refPrenda(p, prenda), jugador: u.jugador }, `${nombrePrenda(p, prenda)} se cae y vuelve a las prendas por tender de ${p.jugadores[u.jugador].nombre}.`);
}

/** Roba hasta `n` cartas; si el mazo se acaba, baraja su descarte. Devuelve cuántas robó. */
export function robar(p: Partida, jugador: number, pila: "cuerdas" | "acciones", n: number): number {
  let robadas = 0;
  for (let i = 0; i < n; i++) {
    if (p.mazos[pila].length === 0 && p.descartes[pila].length > 0) {
      p.mazos[pila] = p.descartes[pila];
      p.descartes[pila] = [];
      barajar(p, p.mazos[pila]);
      anotar(p, "barajaDescarte", { pila }, `Se baraja el descarte de ${pila} para formar un mazo nuevo.`);
    }
    const carta = p.mazos[pila].pop();
    if (!carta) break;
    p.jugadores[jugador].mano.push(carta);
    robadas++;
  }
  return robadas;
}
