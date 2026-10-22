import type { Partida } from "../estado/tipos";
import { texto } from "../estado/utilidades";
import type { EfectoObjetivo } from ".";

function porColor(p: Partida, prendas: string[]): number[] {
  return Object.keys(p.catalogo.colores).map((c) => prendas.filter((id) => p.prendas[id].color === c).length);
}

export const efectosObjetivo: Record<string, EfectoObjetivo> = {
  // Prendas secas; parametros.tipo y parametros.color (opcionales) las filtran.
  "prendas-secas": {
    tipo: "objetivo",
    contar(p, jugador, params) {
      const tipo = texto(params, "tipo");
      const color = texto(params, "color");
      return p.jugadores[jugador].seca.filter(
        (id) => (!tipo || p.prendas[id].tipo === tipo) && (!color || p.prendas[id].color === color),
      ).length;
    },
  },

  // Prendas secas del color del que más tengas.
  "mismo-color": {
    tipo: "objetivo",
    contar: (p, jugador) => Math.max(0, ...porColor(p, p.jugadores[jugador].seca)),
  },

  // Juegos completos con una prenda seca de cada color.
  "juegos-de-colores": {
    tipo: "objetivo",
    contar: (p, jugador) => Math.min(...porColor(p, p.jugadores[jugador].seca)),
  },

  // Parejas del mismo color de un tipo (parametros.tipo, calcetines por defecto).
  parejas: {
    tipo: "objetivo",
    contar(p, jugador, params) {
      const tipo = texto(params, "tipo") ?? "calcetin";
      const delTipo = p.jugadores[jugador].seca.filter((id) => p.prendas[id].tipo === tipo);
      return porColor(p, delTipo).reduce((s, n) => s + Math.floor(n / 2), 0);
    },
  },

  // Líneas con todas sus cartas de cuerda puestas.
  "lineas-completas": {
    tipo: "objetivo",
    contar: (p, jugador) =>
      p.jugadores[jugador].lineas.filter((l) => l.cartas.length >= p.ajustes.tendedero.cartasPorLinea).length,
  },

  // Cuántas clases de cuerda distintas tienes puestas (las básicas cuentan como una).
  "clases-de-cuerda": {
    tipo: "objetivo",
    contar(p, jugador) {
      const clases = new Set<string>();
      for (const l of p.jugadores[jugador].lineas) {
        for (const t of l.cartas) clases.add(p.catalogo.cartas[p.cartas[t.carta]].efecto ?? "basica");
      }
      return clases.size;
    },
  },

  // Prendas que se secaron en cuerdas con un efecto concreto (parametros.efecto), o bajo un tejadillo que las cubría.
  "secadas-en": {
    tipo: "objetivo",
    contar(p, jugador, params) {
      const efecto = texto(params, "efecto");
      return Object.values(p.jugadores[jugador].secadoEn).filter((defs) => defs.some((def) => p.catalogo.cartas[def]?.efecto === efecto)).length;
    },
  },
};
