import { protegidaDe } from "../estado/secado";
import { caer, numero, texto } from "../estado/utilidades";
import type { EfectoClima } from ".";

export const efectosClima: Record<string, EfectoClima> = {
  // parametros.humedad: humedad de más que se pierde en cada secado.
  soleado: { tipo: "clima", ajusteSecado: (_p, _t, params) => numero(params, "humedad", 1) },

  // Las prendas sin tejadillo secan parametros.humedad menos (con 1, en una cuerda básica no se secan),
  // salvo una ronda de cada parametros.cadaRondas, en la que secan normal. Con 2: la segunda ronda de lluvia.
  lluvia: {
    tipo: "clima",
    ajusteSecado(p, tendida, params) {
      if (protegidaDe(p, tendida, "moja")) return 0;
      const rondaDeLluvia = p.ronda - (p.climaDesde ?? p.ronda) + 1;
      const cada = numero(params, "cadaRondas", 0);
      if (cada > 0 && rondaDeLluvia % cada === 0) return 0;
      return -numero(params, "humedad", 1);
    },
  },

  // Al acabar la ronda, antes de secar, las prendas ligeras (parametros.cae, calcetines por defecto)
  // de cuerdas no resistentes se caen. El resto seca parametros.humedad más.
  viento: {
    tipo: "clima",
    ajusteSecado: (_p, _t, params) => numero(params, "humedad", 1),
    antesDelSecado(p, jugador, params) {
      const tipo = texto(params, "cae") ?? "calcetin";
      for (const linea of p.jugadores[jugador].lineas) {
        for (const tendida of linea.cartas) {
          if (protegidaDe(p, tendida, "tira")) continue;
          for (const { prenda } of [...tendida.colgadas]) {
            if (p.prendas[prenda].tipo === tipo) caer(p, prenda);
          }
        }
      }
    },
  },
};
