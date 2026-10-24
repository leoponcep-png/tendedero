import type { Partida } from "./tipos";

// Registro estructurado: además de la línea en castellano de p.registro (la que leen las pruebas y la web
// antigua), cada entrada se guarda como una clave de mensaje y sus datos, para que la interfaz la pueda
// traducir a cualquier idioma. Lo mismo para los motivos por los que una jugada no vale.
//
// Convenciones de los datos (así la interfaz sabe cómo dibujar cada uno):
//   · jugador, otro           → índice del jugador (su nombre está en p.jugadores[i].nombre)
//   · carta, otra             → id de la definición de la carta (p. ej. "tejadillo", "ni-hablar")
//   · prenda, otraPrenda      → "tipo:color" (p. ej. "camiseta:azul")
//   · prendas                 → lista de "tipo:color"
//   · objetivos               → lista de "idObjetivo:puntos"
//   · color                   → id del color; pila → "cuerdas" | "acciones"
//   · linea, posicion         → empiezan en 1, como se cuentan en voz alta
//   · el resto son números o textos tal cual (n, h, ronda, puntos…)

export type DatoEntrada = string | number | boolean | string[];
export type DatosEntrada = Record<string, DatoEntrada>;

/** Una entrada del registro: qué ha pasado (clave) y con qué (datos). */
export interface Entrada {
  clave: string;
  datos: DatosEntrada;
}

/** Por qué no vale una jugada: la clave y los datos para traducirlo, y el texto en castellano de siempre. */
export interface Motivo extends Entrada {
  texto: string;
}

/** Apunta una línea en el registro: el texto en castellano y, a la par, su versión estructurada. */
export function anotar(p: Partida, clave: string, datos: DatosEntrada, texto: string): void {
  p.registro.push(texto);
  (p.entradas ??= []).push({ clave, datos });
}

/** Motivo por el que una jugada no vale. */
export function no(clave: string, texto: string, datos: DatosEntrada = {}): Motivo {
  return { clave, datos, texto };
}

/** Una prenda en los datos del registro: su tipo y su color («camiseta:azul»). */
export function refPrenda(p: Partida, prenda: string): string {
  const { tipo, color } = p.prendas[prenda];
  return `${tipo}:${color}`;
}
