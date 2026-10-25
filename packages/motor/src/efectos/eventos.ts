import { protegidaDe, secarPrenda } from "../estado/secado";
import { anotar } from "../estado/registro";
import type { CartaTendida, Partida } from "../estado/tipos";
import { caer, mojarPrenda, numero, quitarHumedad, texto, tipoDe } from "../estado/utilidades";
import type { Etiqueta, EfectoEvento } from ".";

/** Todas las prendas colgadas de todos los jugadores, con su carta de cuerda. */
function colgadas(p: Partida, jugador?: number): { prenda: string; tendida: CartaTendida }[] {
  return p.jugadores.flatMap((j, i) =>
    jugador !== undefined && i !== jugador
      ? []
      : j.lineas.flatMap((l) => l.cartas.flatMap((tendida) => tendida.colgadas.map(({ prenda }) => ({ prenda, tendida })))),
  );
}

/** A cada jugador se le cae la prenda que dé más valor a `orden`, salvo en cuerdas que protegen de caídas. */
function caeUnaPorJugador(p: Partida, orden: (prenda: string) => number) {
  p.jugadores.forEach((_, i) => {
    const candidatas = colgadas(p, i).filter(({ tendida }) => !protegidaDe(p, tendida, "tira"));
    if (!candidatas.length) return;
    // En empate, la primera (la más a la izquierda de la primera línea).
    const elegida = candidatas.reduce((mejor, c) => (orden(c.prenda) > orden(mejor.prenda) ? c : mejor));
    caer(p, elegida.prenda);
  });
}

function sumarHumedad(p: Partida, h: number, filtro: (prenda: string, tendida: CartaTendida) => boolean) {
  for (const { prenda, tendida } of colgadas(p)) {
    if (filtro(prenda, tendida)) mojarPrenda(p, prenda, h);
  }
}

export const efectosEvento: Record<string, EfectoEvento> = {
  // +parametros.humedad a todas las prendas sin tejadillo.
  "tormenta-repentina": {
    tipo: "evento",
    resolver(p, params) {
      const h = numero(params, "humedad", 1);
      sumarHumedad(p, h, (_prenda, tendida) => !protegidaDe(p, tendida, "moja"));
      anotar(p, "tormenta", { h }, `Todas las prendas sin tejadillo ganan ${h} de humedad.`);
    },
  },

  // −parametros.humedad a todas las prendas colgadas; las que llegan a 0 se secan y puntúan.
  "ola-de-calor": {
    tipo: "evento",
    resolver(p, params) {
      const h = numero(params, "humedad", 1);
      anotar(p, "olaDeCalor", { h }, `Todas las prendas colgadas pierden ${h} de humedad.`);
      for (const { prenda } of colgadas(p)) {
        if (quitarHumedad(p, prenda, h)) secarPrenda(p, prenda);
      }
    },
  },

  // El polvo ensucia las prendas de un color (parametros.color, blanco por defecto): +parametros.humedad.
  "vecina-sacude-alfombra": {
    tipo: "evento",
    resolver(p, params) {
      const color = texto(params, "color") ?? "blanco";
      const h = numero(params, "humedad", 1);
      sumarHumedad(p, h, (prenda) => p.prendas[prenda].color === color);
      anotar(p, "prendasDeColor", { color, h }, `Las prendas ${p.catalogo.colores[color]?.nombre.toLowerCase() ?? color} colgadas ganan ${h} de humedad.`);
    },
  },

  // A cada jugador se le cae la prenda con más humedad (salvo en cuerdas resistentes).
  "pinzas-viejas": {
    tipo: "evento",
    resolver: (p) => caeUnaPorJugador(p, (prenda) => p.prendas[prenda].humedad),
  },

  // A cada jugador se le cae la prenda más grande (salvo en cuerdas resistentes).
  "viento-traicionero": {
    tipo: "evento",
    resolver: (p) => caeUnaPorJugador(p, (prenda) => tipoDe(p, prenda).espacios * 100 + p.prendas[prenda].humedad),
  },

  // Durante esta ronda, las prendas no se pueden tirar ni mover.
  "ropa-se-engancha": {
    tipo: "evento",
    resolver(p) {
      p.rondaProtegeDe = ["tira", "mueve"] satisfies Etiqueta[];
      anotar(p, "ropaEnganchada", {}, "Durante esta ronda ninguna prenda se puede tirar ni mover.");
    },
  },
};
