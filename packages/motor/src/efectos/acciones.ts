import { secarPrenda } from "../estado/secado";
import { descolgar, localizar, nombrePrenda, numero, tipoDe } from "../estado/utilidades";
import type { Partida } from "../estado/tipos";
import type { JugadaDe } from "../jugadas/tipos";
import type { EfectoAccion } from ".";

// Las comprobaciones comunes (que el blanco sea propio o rival, que exista, protecciones,
// que el destino de un movimiento sea válido) las hace jugarAccion antes de llegar aquí.

function cartaObjetivo(p: Partida, j: JugadaDe<"jugarAccion">) {
  const o = j.objetivo!;
  return p.jugadores[o.jugador].lineas[o.linea].cartas[o.posicion];
}

function cambiarHumedad(p: Partida, prenda: string, cambio: number) {
  p.prendas[prenda].humedad = Math.max(0, p.prendas[prenda].humedad + cambio);
  if (p.prendas[prenda].humedad === 0) secarPrenda(p, prenda);
}

function mover(p: Partida, j: JugadaDe<"jugarAccion">) {
  const { prenda, destino, jugador } = j.objetivo!;
  const u = localizar(p, prenda!)!;
  descolgar(u);
  p.jugadores[jugador].lineas[destino!.linea].cartas[destino!.posicion].colgadas.push({ prenda: prenda!, inicio: destino!.inicio });
  p.registro.push(`Se mueve ${nombrePrenda(p, prenda!)} a la línea ${destino!.linea + 1}, carta ${destino!.posicion + 1}.`);
}

export const efectosAccion: Record<string, EfectoAccion> = {
  // parametros.humedad: cuánta humedad suma a cada prenda de la carta.
  "mojar-cuerda-rival": {
    tipo: "accion",
    blanco: "cartaRival",
    etiquetas: ["fastidio", "moja"],
    validar: (p, j) => (cartaObjetivo(p, j).colgadas.length ? null : "Esa carta de cuerda no tiene prendas."),
    aplicar(p, j, params) {
      const h = numero(params, "humedad", 1);
      for (const { prenda } of cartaObjetivo(p, j).colgadas) p.prendas[prenda].humedad += h;
      p.registro.push(`Las prendas de esa cuerda de ${p.jugadores[j.objetivo!.jugador].nombre} ganan ${h} de humedad.`);
    },
  },

  // La prenda cae y vuelve a las prendas por tender de su dueño, con su humedad inicial.
  "rafaga-de-viento": {
    tipo: "accion",
    blanco: "prendaRival",
    etiquetas: ["fastidio", "tira"],
    aplicar(p, j) {
      const prenda = j.objetivo!.prenda!;
      descolgar(localizar(p, prenda)!);
      p.prendas[prenda].humedad = tipoDe(p, prenda).humedad;
      p.jugadores[j.objetivo!.jugador].pendientes.push(prenda);
      p.registro.push(`${nombrePrenda(p, prenda)} se cae y vuelve a las prendas por tender de ${p.jugadores[j.objetivo!.jugador].nombre}.`);
    },
  },

  // parametros.humedad: cuánta humedad suma a la prenda.
  "retrasar-secado": {
    tipo: "accion",
    blanco: "prendaRival",
    etiquetas: ["fastidio", "moja"],
    aplicar(p, j, params) {
      const h = numero(params, "humedad", 1);
      p.prendas[j.objetivo!.prenda!].humedad += h;
      p.registro.push(`${nombrePrenda(p, j.objetivo!.prenda!)} gana ${h} de humedad.`);
    },
  },

  "mover-prenda-rival": { tipo: "accion", blanco: "moverRival", etiquetas: ["fastidio", "mueve"], aplicar: mover },
  "mover-prenda-propia": { tipo: "accion", blanco: "moverPropia", etiquetas: [], aplicar: mover },

  // parametros.cuerdas: cuerdas de más que se pueden jugar este turno.
  "colocar-cuerda-extra": {
    tipo: "accion",
    blanco: "ninguno",
    etiquetas: [],
    aplicar(p, _j, params) {
      const n = numero(params, "cuerdas", 1);
      p.turno.cuerdasExtra += n;
      p.registro.push(`Este turno puede jugar ${n} cuerda(s) más.`);
    },
  },

  "secar-prenda": {
    tipo: "accion",
    blanco: "prendaPropia",
    etiquetas: [],
    aplicar: (p, j) => secarPrenda(p, j.objetivo!.prenda!),
  },

  // parametros.humedad: cuánta humedad quita; si llega a 0, se seca.
  "reducir-humedad": {
    tipo: "accion",
    blanco: "prendaPropia",
    etiquetas: [],
    aplicar(p, j, params) {
      const h = numero(params, "humedad", 1);
      p.registro.push(`${nombrePrenda(p, j.objetivo!.prenda!)} pierde ${h} de humedad.`);
      cambiarHumedad(p, j.objetivo!.prenda!, -h);
    },
  },

  "proteger-cuerda": {
    tipo: "accion",
    blanco: "cartaPropia",
    etiquetas: [],
    aplicar(p, j) {
      cartaObjetivo(p, j).protegida = true;
      p.registro.push("Esa cuerda queda protegida del fastidio hasta su próximo turno.");
    },
  },
};
