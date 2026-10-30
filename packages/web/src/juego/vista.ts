// Lo que necesita la mesa para dibujar una Partida del motor con los componentes de la mesa E: las prendas y
// las cartas en el formato de los dibujos, los nombres y las opciones del reparto.

import {
  cumple,
  defCarta,
  efectoAccion,
  esValida,
  OCULTA,
  prendasDe,
  tipoDe,
  type Jugada,
  type Origen,
  type Partida,
  type Patron,
} from "@tendedero/motor";
import { hayTexto, tLibre } from "../i18n";
import { admisible, jugadaDe, type Arrastre, type Destino } from "../mesa/contexto";
import { ANIMALES } from "../prototipos/Animales";
import { COLORES_JUGADOR, type Perfil } from "../prototipos/MenuPartida";
import type { Prenda as PrendaDibujo, TIPOS } from "../prototipos/Prototipos";

/**
 * Una prenda del motor en el formato de las cartas dibujadas (el color va en hexadecimal). La humedad es la de
 * su escala: la que viene de cartas que mojan se dibuja aparte, como cartitas junto a la prenda (`humedadExtra`).
 */
export function prendaDibujo(p: Partida, id: string): PrendaDibujo {
  const pr = p.prendas[id];
  return {
    id,
    tipo: pr.tipo as keyof typeof TIPOS,
    color: p.catalogo.colores[pr.color]?.hex ?? "#ccc",
    humedad: pr.humedad - humedadExtra(p, id),
    // Los puntos de la partida: dependen del modo de juego.
    puntos: p.catalogo.tipos[pr.tipo]?.puntos,
  };
}

/** Cartas de mojar que tiene al lado una prenda (una gota cada una). */
export function humedadExtra(p: Partida, id: string): number {
  return Math.min(p.prendas[id]?.extra ?? 0, p.prendas[id]?.humedad ?? 0);
}

/** Cómo se dibuja una carta de cuerda: su efecto y, en las de pinzas de color, el color de las pinzas. */
export function cuerdaDibujo(p: Partida, carta: string): { efecto: string | null; pinzas?: string } {
  const def = defCarta(p, carta);
  const efecto = def.efecto ?? null;
  const color = efecto === "modificador-puntuacion" ? p.catalogo.colores[String(def.parametros.color)]?.hex : undefined;
  return { efecto, pinzas: color };
}

export const esCuerda = (p: Partida, carta: string) => carta !== OCULTA && defCarta(p, carta)?.mazo === "cuerdas";

/** Huecos libres de una carta tendida (cada carta de cuerda tiene sus huecos; cada prenda ocupa los suyos). */
export function huecosLibres(p: Partida, jugador: number, linea: number, posicion: number): number {
  const t = p.jugadores[jugador].lineas[linea].cartas[posicion];
  return defCarta(p, t.carta).espacios - t.colgadas.reduce((s, c) => s + tipoDe(p, c.prenda).espacios, 0);
}

/** «3 rojas», «1 toalla»… para el botón de cada opción del reparto, en el idioma elegido (claves reparto.color.* y reparto.tipo.*). */
export function textoPatron(patron: Patron, n: number): string {
  const clave = "color" in patron ? `reparto.color.${patron.color}` : `reparto.tipo.${patron.tipo}`;
  return hayTexto(clave) ? tLibre(clave, { n }) : `${n} ${"color" in patron ? patron.color : patron.tipo}`;
}

/** Lo que se puede coger de una cesta o del centro: cada color y cada tipo que haya, con cuántas prendas son. */
export function opcionesReparto(p: Partida, origen: Origen): { patron: Patron; cuantas: number; texto: string }[] {
  const prendas = prendasDe(p, origen) ?? [];
  const lista: { patron: Patron; cuantas: number; texto: string }[] = [];
  for (const color of Object.keys(p.catalogo.colores)) {
    const n = prendas.filter((id) => cumple(p.prendas[id], { color })).length;
    if (n) lista.push({ patron: { color }, cuantas: n, texto: textoPatron({ color }, n) });
  }
  for (const tipo of Object.keys(p.catalogo.tipos)) {
    const n = prendas.filter((id) => cumple(p.prendas[id], { tipo })).length;
    if (n) lista.push({ patron: { tipo }, cuantas: n, texto: textoPatron({ tipo }, n) });
  }
  return lista;
}

/** Todos los sitios donde se puede soltar algo en la mesa (para saber qué cartas de la mano se pueden jugar). */
export function destinos(p: Partida): Destino[] {
  const lista: Destino[] = [];
  p.jugadores.forEach((j, jugador) =>
    j.lineas.forEach((l, linea) => {
      if (l.cartas.length < p.ajustes.tendedero.cartasPorLinea) lista.push({ tipo: "hueco", jugador, linea });
      l.cartas.forEach((t, posicion) => {
        for (let inicio = 0; inicio < defCarta(p, t.carta).espacios; inicio++) lista.push({ tipo: "espacio", jugador, linea, posicion, inicio });
      });
    }),
  );
  return lista;
}

/**
 * Si lo elegido se puede jugar en algún sitio (o sin objetivo, en las acciones que no lo piden). `permitida`: en el
 * tutorial, el filtro de las jugadas que se dejan hacer en cada paso.
 */
export function sePuedeJugar(p: Partida, a: Arrastre, permitida?: (j: Jugada) => boolean): boolean {
  const vale = (j: Jugada) => !permitida || permitida(j);
  if (a.tipo === "accion" && efectoAccion(p, a.carta)?.blanco === "ninguno") {
    const j: Jugada = { tipo: "jugarAccion", jugador: a.jugador, carta: a.carta };
    return esValida(p, j) && vale(j);
  }
  return destinos(p).some((d) => {
    const j = jugadaDe(p, a, d);
    return j !== null && admisible(p, j) && vale(j);
  });
}

/** Si una acción se juega sin objetivo (basta con pulsarla o soltarla en la mesa). */
export function sinObjetivo(p: Partida, carta: string): boolean {
  return efectoAccion(p, carta)?.blanco === "ninguno";
}


/**
 * Perfiles para una partida online: el tuyo del menú y, para los demás, el que mandaron al entrar
 * o uno por defecto sin repetir animal ni color.
 */
export function perfilesDe(p: Partida, miAsiento: number, mio: Perfil, otros: (Partial<Perfil> | undefined)[] = []): Perfil[] {
  const usadosA = new Set<string>([mio.animal]);
  const usadosC = new Set<string>([mio.color]);
  return p.jugadores.map((j, i) => {
    if (i === miAsiento) return { ...mio, nombre: j.nombre };
    const dado = otros[i];
    const animal = dado?.animal && !usadosA.has(dado.animal) ? dado.animal : (ANIMALES.find((a) => !usadosA.has(a.id))?.id ?? ANIMALES[0].id);
    const color = dado?.color && !usadosC.has(dado.color) ? dado.color : (COLORES_JUGADOR.find((c) => !usadosC.has(c)) ?? COLORES_JUGADOR[0]);
    usadosA.add(animal);
    usadosC.add(color);
    return { nombre: j.nombre, animal, color, tapete: dado?.tapete };
  });
}
