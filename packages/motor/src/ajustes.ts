import type { Datos, DefCarta, DefModo, DefObjetivo } from "./datos/esquemas";

/**
 * Modos de juego. «normal»: las reglas de siempre. «larga»: más rondas, para que dé tiempo a llenar el tendedero
 * y mejorar cuerdas; las prendas puntúan menos y el final está más lejos (lo que cambia está en
 * data/ajustes-por-defecto.json, en `modos`).
 */
export type ModoJuego = "normal" | "larga";
export const MODOS_JUEGO: readonly ModoJuego[] = ["normal", "larga"];

/** Parámetros de una partida. Se fijan en la pestaña de ajustes y no cambian durante la partida. */
export interface Ajustes {
  jugadores: number;
  manoInicial: { cuerdas: number; acciones: number };
  /** Cuántas se roban al terminar el turno; el jugador elige cuántas son de cuerda, hasta `maxCuerdas`. */
  roboPorTurno: { cartas: number; maxCuerdas: number };
  jugablesPorTurno: { cuerdas: number; acciones: number };
  limiteMano: number;
  umbralFinal: number;
  /** Tope de humedad de una prenda: mojarla no la sube de aquí (lo que sobra se pierde). */
  humedadMaxima: number;
  /** `renovarTodas`: al acabar la ronda se vacían y rellenan todas, no solo las que se cogieron (sistema anterior). */
  cestas: { numero: number; prendasPorCesta: number; renovarTodas?: boolean };
  /** Si en el reparto coge primero quien juega el último (para compensar el orden de turno). */
  repartoInverso?: boolean;
  tendedero: { lineas: number; cartasPorLinea: number };
  objetivos: { comunes: number; secretosRepartidos: number };
  /** Por id de tipo de prenda. */
  prendas: Record<string, { espacios: number; humedad: number; puntos: number }>;
  /** Por id de carta u objetivo: si entra en la partida. Las pendientes nunca entran. */
  incluidas: Record<string, boolean>;
  /** Vacía = se genera una al empezar. */
  semilla: string;
  /**
   * Modo de juego (sin él, «normal»). Al crear la partida se aplica lo que cambia el modo sobre estos ajustes
   * (ver `ajustesConModo`), así que la partida ya lleva los puntos y el umbral del modo.
   */
  modo?: ModoJuego;
}

export function cestasPorDefecto(datos: Datos, jugadores: number): number {
  const tabla = datos.porDefecto.cestas.porJugadores as Record<string, number>;
  return tabla[String(jugadores)] ?? tabla["4"];
}

export function ajustesIniciales(datos: Datos): Ajustes {
  const d = structuredClone(datos.porDefecto);
  return {
    jugadores: d.jugadores,
    manoInicial: d.manoInicial,
    roboPorTurno: d.roboPorTurno,
    jugablesPorTurno: d.jugablesPorTurno,
    limiteMano: d.limiteMano,
    umbralFinal: d.umbralFinal,
    humedadMaxima: d.humedadMaxima ?? 4,
    cestas: { numero: cestasPorDefecto(datos, d.jugadores), prendasPorCesta: d.cestas.prendasPorCesta },
    tendedero: d.tendedero,
    objetivos: d.objetivos,
    prendas: Object.fromEntries(
      datos.tipos.map((t) => [t.id, { espacios: t.espacios, humedad: t.humedad, puntos: t.puntos }]),
    ),
    incluidas: Object.fromEntries([...datos.cartas, ...datos.objetivos].map((c) => [c.id, true])),
    semilla: "",
    modo: "normal",
  };
}

/** Lo que cambia el modo de unos ajustes; nada si es el normal o no existe en los datos. */
export function defModo(datos: Datos, modo: string | undefined): DefModo | null {
  if (!modo || modo === "normal") return null;
  return datos.porDefecto.modos?.[modo] ?? null;
}

/**
 * Los ajustes con lo que cambia su modo aplicado encima (puntos de las prendas, umbral de final, cartas por turno…).
 * En el modo normal devuelve los mismos ajustes, sin tocar nada.
 */
export function ajustesConModo(a: Ajustes, datos: Datos): Ajustes {
  const m = defModo(datos, a.modo);
  if (!m) return a;
  const prendas = structuredClone(a.prendas);
  for (const [tipo, cambio] of Object.entries(m.prendas ?? {})) {
    if (prendas[tipo]) prendas[tipo].puntos = cambio.puntos;
  }
  return {
    ...a,
    umbralFinal: m.umbralFinal ?? a.umbralFinal,
    manoInicial: m.manoInicial ?? a.manoInicial,
    roboPorTurno: m.roboPorTurno ?? a.roboPorTurno,
    jugablesPorTurno: m.jugablesPorTurno ?? a.jugablesPorTurno,
    limiteMano: m.limiteMano ?? a.limiteMano,
    humedadMaxima: m.humedadMaxima ?? a.humedadMaxima,
    prendas,
  };
}

/** Un objetivo con el ritmo (cada, puntos) que le da el modo, si le da otro. */
export function objetivoConModo(o: DefObjetivo, datos: Datos, modo: string | undefined): DefObjetivo {
  const cambio = defModo(datos, modo)?.objetivos?.[o.id];
  return cambio ? { ...o, cada: cambio.cada, puntos: cambio.puntos } : o;
}

/**
 * Encaja unos ajustes guardados (que pueden venir de una versión anterior de los datos)
 * sobre los datos actuales: se ignora lo que ya no existe y lo nuevo toma su valor por defecto.
 */
export function normalizarAjustes(crudo: unknown, datos: Datos): Ajustes {
  return mezclar(ajustesIniciales(datos), crudo);
}

function mezclar<T>(base: T, encima: unknown): T {
  if (!encima || typeof encima !== "object" || !base || typeof base !== "object") {
    return typeof encima === typeof base ? (encima as T) : base;
  }
  const resultado = { ...base } as Record<string, unknown>;
  for (const clave of Object.keys(resultado)) {
    resultado[clave] = mezclar(resultado[clave], (encima as Record<string, unknown>)[clave]);
  }
  return resultado as T;
}

export function enJuego(c: DefCarta | DefObjetivo, ajustes: Ajustes): boolean {
  const copias = "copias" in c ? c.copias : 1;
  return c.estado === "definida" && copias > 0 && ajustes.incluidas[c.id] !== false;
}

export interface Revision {
  /** Impiden empezar la partida. */
  errores: string[];
  /** Se puede jugar, pero conviene saberlo. */
  avisos: string[];
}

export function revisarAjustes(a: Ajustes, datos: Datos): Revision {
  const errores: string[] = [];
  const avisos: string[] = [];

  const totalPrendas = datos.tipos.reduce((s, t) => s + t.porColor * datos.colores.length, 0);
  const enCestas = a.cestas.numero * a.cestas.prendasPorCesta;
  if (enCestas > totalPrendas) {
    errores.push(`Las cestas necesitan ${enCestas} prendas y solo hay ${totalPrendas}.`);
  }
  if (a.jugadores < 2 || a.jugadores > 4) errores.push("El número de jugadores debe estar entre 2 y 4.");

  const cuerdas = datos.cartas.filter((c) => c.mazo === "cuerdas" && enJuego(c, a));
  const copiasCuerdas = cuerdas.reduce((s, c) => s + c.copias, 0);
  if (copiasCuerdas === 0) {
    avisos.push("No entra ninguna carta de cuerda: no se podrá tender nada.");
  } else {
    const maxEspacios = Math.max(...cuerdas.map((c) => c.espacios));
    for (const t of datos.tipos) {
      if (a.prendas[t.id].espacios > maxEspacios) {
        avisos.push(`${t.nombre}: ocupa ${a.prendas[t.id].espacios} espacios y ninguna cuerda en juego tiene tantos.`);
      }
    }
  }
  for (const t of datos.tipos) {
    if (a.prendas[t.id].humedad > a.humedadMaxima) {
      avisos.push(`${t.nombre}: empieza con ${a.prendas[t.id].humedad} de humedad y el tope es ${a.humedadMaxima}; se queda en ${a.humedadMaxima}.`);
    }
  }
  if (a.manoInicial.cuerdas * a.jugadores > copiasCuerdas) {
    avisos.push(`La mano inicial pide ${a.manoInicial.cuerdas * a.jugadores} cuerdas y el mazo solo tiene ${copiasCuerdas}.`);
  }

  const objetivos = datos.objetivos.filter((o) => enJuego(o, a)).length;
  const pedidos = a.objetivos.comunes + a.objetivos.secretosRepartidos * a.jugadores;
  if (objetivos < pedidos) {
    avisos.push(`Se sacan ${a.objetivos.comunes} comunes y ${a.objetivos.secretosRepartidos} secretos por jugador (${pedidos}) y solo hay ${objetivos} objetivos.`);
  }

  if (a.modo && a.modo !== "normal" && !datos.porDefecto.modos?.[a.modo]) {
    avisos.push(`El modo «${a.modo}» no está en los datos: se juega con las reglas normales.`);
  }

  const pendientes = [...datos.cartas, ...datos.objetivos].filter((c) => c.estado === "pendiente").length;
  if (pendientes) avisos.push(`${pendientes} cartas u objetivos siguen pendientes y no entran en la partida.`);

  return { errores, avisos };
}
