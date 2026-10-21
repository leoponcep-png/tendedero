import { protegidaDe } from "../estado/secado";
import { caer, numero, texto } from "../estado/utilidades";
import type { EfectoClima } from ".";

export const efectosClima: Record<string, EfectoClima> = {
  // parametros.humedad: humedad de más que se pierde en cada secado.
  soleado: { tipo: "clima", ajusteSecado: (_p, _t, params) => numero(params, "humedad", 1) },

  // Las prendas sin tejadillo secan parametros.humedad menos (con 1, no se secan).
  lluvia: {
    tipo: "clima",
    ajusteSecado: (p, tendida, params) => (protegidaDe(p, tendida, "moja") ? 0 : -numero(params, "humedad", 1)),
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
