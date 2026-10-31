import { secarPrenda } from "../estado/secado";
import { caer, defCarta, descolgar, humedadMaxima, localizar, mojarPrenda, nombrePrenda, numero, prendaEn, quitarHumedad, robar } from "../estado/utilidades";
import { anotar, no, refPrenda } from "../estado/registro";
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
  if (cambio > 0) mojarPrenda(p, prenda, cambio);
  else if (quitarHumedad(p, prenda, -cambio)) secarPrenda(p, prenda);
}

/**
 * Mover o intercambiar: si en el destino hay otra prenda del mismo jugador, las dos se cambian el sitio
 * (cada una pasa a la carta y al espacio de inicio de la otra); si no, la prenda pasa al hueco libre.
 */
function mover(p: Partida, j: JugadaDe<"jugarAccion">) {
  const { prenda, destino, jugador } = j.objetivo!;
  const otra = prendaEn(p, { jugador, ...destino! });
  if (otra && otra !== prenda) {
    intercambiar(p, prenda!, otra);
    return;
  }
  const u = localizar(p, prenda!)!;
  descolgar(u);
  p.jugadores[jugador].lineas[destino!.linea].cartas[destino!.posicion].colgadas.push({ prenda: prenda!, inicio: destino!.inicio });
  anotar(
    p,
    "seMueve",
    { prenda: refPrenda(p, prenda!), linea: destino!.linea + 1, posicion: destino!.posicion + 1 },
    `Se mueve ${nombrePrenda(p, prenda!)} a la línea ${destino!.linea + 1}, carta ${destino!.posicion + 1}.`,
  );
}

/** Dos prendas se cambian el sitio: cada una pasa a la carta y al espacio de inicio de la otra. */
function intercambiar(p: Partida, a: string, b: string) {
  const ua = localizar(p, a)!;
  const ub = localizar(p, b)!;
  descolgar(ua);
  descolgar(ub);
  ub.tendida.colgadas.push({ prenda: a, inicio: ub.colgada.inicio });
  ua.tendida.colgadas.push({ prenda: b, inicio: ua.colgada.inicio });
  anotar(p, "intercambianPrendas", { prenda: refPrenda(p, a), otraPrenda: refPrenda(p, b) }, `Se intercambian ${nombrePrenda(p, a)} y ${nombrePrenda(p, b)}.`);
}

/** +h de humedad a una prenda (sin pasar del tope), con su línea en el registro. */
function mojarUna(p: Partida, prenda: string, cuanta: number) {
  const h = mojarPrenda(p, prenda, cuanta);
  if (h > 0) anotar(p, "ganaHumedad", { prenda: refPrenda(p, prenda), h }, `${nombrePrenda(p, prenda)} gana ${h} de humedad.`);
  else {
    const max = humedadMaxima(p);
    anotar(p, "humedadAlTope", { prenda: refPrenda(p, prenda), max }, `${nombrePrenda(p, prenda)} ya tiene la humedad máxima (${max}): no gana más.`);
  }
}

/** −h de humedad a una prenda propia; si llega a 0, se seca y puntúa. */
function secarUn(p: Partida, prenda: string, h: number) {
  anotar(p, "pierdeHumedad", { prenda: refPrenda(p, prenda), h }, `${nombrePrenda(p, prenda)} pierde ${h} de humedad.`);
  cambiarHumedad(p, prenda, -h);
}

function sitio(p: Partida, j: JugadaDe<"jugarAccion">): string {
  const o = j.objetivo!;
  return `${defCarta(p, cartaObjetivo(p, j).carta).nombre} (línea ${o.linea + 1}, carta ${o.posicion + 1})`;
}

/** Los datos de `sitio` para el registro estructurado. */
function datosSitio(p: Partida, j: JugadaDe<"jugarAccion">) {
  const o = j.objetivo!;
  return { carta: defCarta(p, cartaObjetivo(p, j).carta).id, linea: o.linea + 1, posicion: o.posicion + 1 };
}

export const efectosAccion: Record<string, EfectoAccion> = {
  // parametros.humedad: cuánta humedad suma a cada prenda de la carta.
  "mojar-cuerda-rival": {
    tipo: "accion",
    blanco: "cartaRival",
    etiquetas: ["fastidio", "moja"],
    validar: (p, j) => (cartaObjetivo(p, j).colgadas.length ? null : no("cuerdaSinPrendas", "Esa carta de cuerda no tiene prendas.")),
    aplicar(p, j, params) {
      const h = numero(params, "humedad", 1);
      // Cada prenda baja su escala; ninguna pasa del tope de humedad.
      for (const { prenda } of cartaObjetivo(p, j).colgadas) mojarPrenda(p, prenda, h);
      anotar(p, "mojaCuerda", { jugador: j.objetivo!.jugador, h }, `Las prendas de esa cuerda de ${p.jugadores[j.objetivo!.jugador].nombre} ganan ${h} de humedad.`);
    },
  },

  // La prenda cae y vuelve a las prendas por tender de su dueño, con su humedad inicial.
  "rafaga-de-viento": {
    tipo: "accion",
    blanco: "prendaRival",
    etiquetas: ["fastidio", "tira"],
    aplicar: (p, j) => caer(p, j.objetivo!.prenda!),
  },

  // parametros.humedad: cuánta humedad suma a la prenda (sin pasar del tope).
  "retrasar-secado": {
    tipo: "accion",
    blanco: "prendaRival",
    etiquetas: ["fastidio", "moja"],
    aplicar: (p, j, params) => mojarUna(p, j.objetivo!.prenda!, numero(params, "humedad", 1)),
  },

  // Como «Retrasar secado», pero de golpe (parametros.humedad, 2 en los datos).
  manguerazo: {
    tipo: "accion",
    blanco: "prendaRival",
    etiquetas: ["fastidio", "moja"],
    aplicar: (p, j, params) => mojarUna(p, j.objetivo!.prenda!, numero(params, "humedad", 2)),
  },

  // Mover a un hueco libre, o intercambiar con otra prenda del mismo tendedero (según dónde se suelte).
  "mover-prenda-rival": { tipo: "accion", blanco: "moverRival", etiquetas: ["fastidio", "mueve"], aplicar: mover },
  "mover-prenda-propia": { tipo: "accion", blanco: "moverPropia", etiquetas: [], aplicar: mover },

  // parametros.prendas: cuántas prendas roba de la bolsa (si quedan menos, las que haya).
  "cesto-ropa-sucia": {
    tipo: "accion",
    blanco: "ninguno",
    etiquetas: [],
    validar: (p) => (p.bolsa.length > 0 ? null : no("bolsaVacia", "No quedan prendas en la bolsa.")),
    aplicar(p, j, params) {
      const cogidas = p.bolsa.splice(-Math.min(numero(params, "prendas", 3), p.bolsa.length));
      p.jugadores[j.jugador].pendientes.push(...cogidas);
      anotar(p, "robaPrendas", { jugador: j.jugador, n: cogidas.length }, `${p.jugadores[j.jugador].nombre} roba ${cogidas.length} prenda(s) de la bolsa.`);
    },
  },

  // Ya no está en el mazo (con 2 cuerdas por turno sobra): se queda para las partidas guardadas que aún la tengan.
  // parametros.cuerdas: cuerdas de más que se pueden jugar este turno.
  "colocar-cuerda-extra": {
    tipo: "accion",
    blanco: "ninguno",
    etiquetas: [],
    aplicar(p, _j, params) {
      const n = numero(params, "cuerdas", 1);
      p.turno.cuerdasExtra += n;
      anotar(p, "cuerdasExtra", { n }, `Este turno puede jugar ${n} cuerda(s) más.`);
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
    aplicar: (p, j, params) => secarUn(p, j.objetivo!.prenda!, numero(params, "humedad", 1)),
  },

  // Como «Reducir humedad», pero más fuerte (parametros.humedad, 2 en los datos).
  secador: {
    tipo: "accion",
    blanco: "prendaPropia",
    etiquetas: [],
    aplicar: (p, j, params) => secarUn(p, j.objetivo!.prenda!, numero(params, "humedad", 2)),
  },

  // Ya no está en el mazo (va dentro de «Mover prenda propia»): se queda para las partidas guardadas que aún la tengan.
  "cambiar-prendas": {
    tipo: "accion",
    blanco: "cambiarPrendas",
    etiquetas: [],
    aplicar: (p, j) => intercambiar(p, j.objetivo!.prenda!, prendaEn(p, { jugador: j.jugador, ...j.objetivo!.destino! })!),
  },

  // Todo lo colgado en una carta de cuerda tuya pasa a otra, y al revés; las cartas no se mueven.
  "cambiar-cuerdas": {
    tipo: "accion",
    blanco: "cambiarCuerdas",
    etiquetas: [],
    aplicar(p, j) {
      const { destino } = j.objetivo!;
      const a = cartaObjetivo(p, j);
      const b = p.jugadores[j.jugador].lineas[destino!.linea].cartas[destino!.posicion];
      [a.colgadas, b.colgadas] = [b.colgadas, a.colgadas];
      anotar(
        p,
        "intercambianCuerdas",
        { ...datosSitio(p, j), lineaDestino: destino!.linea + 1, posicionDestino: destino!.posicion + 1 },
        `Se intercambia lo colgado en ${sitio(p, j)} con lo de la línea ${destino!.linea + 1}, carta ${destino!.posicion + 1}.`,
      );
    },
  },

  // Una carta de cuerda tuya, con sus prendas, cambia de sitio con otra o pasa al hueco siguiente de una línea.
  "mover-cuerda": {
    tipo: "accion",
    blanco: "moverCuerda",
    etiquetas: [],
    aplicar(p, j) {
      const o = j.objetivo!;
      const d = o.destino!;
      const lineas = p.jugadores[j.jugador].lineas;
      const nombre = sitio(p, j);
      const datos = datosSitio(p, j);
      if (d.posicion < lineas[d.linea].cartas.length) {
        const otra = lineas[d.linea].cartas[d.posicion];
        lineas[d.linea].cartas[d.posicion] = lineas[o.linea].cartas[o.posicion];
        lineas[o.linea].cartas[o.posicion] = otra;
        anotar(p, "cuerdaCambiaSitio", { ...datos, otra: defCarta(p, otra.carta).id }, `${nombre} cambia de sitio con ${defCarta(p, otra.carta).nombre}.`);
      } else {
        const [movida] = lineas[o.linea].cartas.splice(o.posicion, 1);
        lineas[d.linea].cartas.push(movida);
        anotar(p, "cuerdaAlFinal", { ...datos, lineaDestino: d.linea + 1 }, `${nombre} pasa al final de la línea ${d.linea + 1}.`);
      }
    },
  },

  // parametros.cartas: cuántas cartas de cuerda roba.
  "buscar-cuerda": {
    tipo: "accion",
    blanco: "ninguno",
    etiquetas: [],
    aplicar(p, j, params) {
      const n = robar(p, j.jugador, "cuerdas", numero(params, "cartas", 1));
      anotar(p, "robaCuerdas", { jugador: j.jugador, n }, `${p.jugadores[j.jugador].nombre} roba ${n} carta(s) de cuerda.`);
    },
  },

  // Carta de reacción: no se juega en tu turno; anula un fastidio de un rival (ver jugadas/responder.ts).
  "anular-fastidio": { tipo: "accion", blanco: "reaccion", etiquetas: [], aplicar() {} },

  "proteger-cuerda": {
    tipo: "accion",
    blanco: "cartaPropia",
    etiquetas: [],
    aplicar(p, j) {
      cartaObjetivo(p, j).protegida = true;
      anotar(p, "cuerdaProtegida", {}, "Esa cuerda queda protegida del fastidio hasta su próximo turno.");
    },
  },
};
