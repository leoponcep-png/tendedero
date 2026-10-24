// Partidas enteras jugadas por bots, para ver el equilibrio del juego con muchos datos.
// Uso (desde la raíz): node bots.mjs tanda.json salida.jsonl (empaquetado antes con rolldown).
//
// Cómo decide cada bot está en src/ia.ts (lo comparte con la mesa contra la IA); aquí solo se juegan
// las partidas y se apuntan las estadísticas.

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  aplicar,
  cierraLaRonda,
  ajustesIniciales,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  cuerdasARobar,
  descarteDeBot,
  eleccionDeObjetivo,
  mejorDraft,
  mejorJugada,
  type DatosCrudos,
  type Jugada,
  type OpcionesIA,
  type Partida,
} from "../src";

// Se ejecuta desde la raíz del proyecto, donde está /data.
const crudos = Object.fromEntries(
  ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(join(process.cwd(), "data", `${n}.json`), "utf8"))]),
) as DatosCrudos;
const datos = cargarDatos(crudos);

// Azar propio y con semilla, para que los resultados se puedan repetir.
let estado = 1;
const azar = () => {
  estado = (estado * 1664525 + 1013904223) >>> 0;
  return estado / 2 ** 32;
};

function aplicada(p: Partida, j: Jugada): Partida | null {
  const r = aplicar(p, j);
  if (!r.ok) return null;
  r.partida.registro = [];
  return r.partida;
}

let ia: OpcionesIA = { azar, rivales: "mejor" };
// ---------- Estadísticas de una partida ----------

/** Una variante de reglas que se prueba: puntos de cada prenda, multiplicador de objetivos y umbral. */
export interface Config {
  id: string;
  jugadores: number;
  /** Puntos al secar: calcetín, camiseta, toalla. */
  prendas: [number, number, number];
  /** Los puntos de cada objetivo se multiplican por esto (redondeando, mínimo 1). */
  objetivos: number;
  umbral: number;
  /** Cartas robadas al terminar el turno; con `cuerdasFijas` el reparto no se elige (sistema anterior: 1 cuerda y 2 acciones). */
  robo?: { cartas: number; maxCuerdas: number; cuerdasFijas?: number };
  limiteMano?: number;
  cestas?: { numero?: number; renovarTodas?: boolean };
  repartoInverso?: boolean;
  /** Ritmo propio de algunos objetivos: id → [cada, puntos]. Se aplica antes del multiplicador. */
  ritmos?: Record<string, [number, number]>;
  /** Parámetros distintos para algunas cartas: id → parámetros (p. ej. las rondas de la cuerda vieja). */
  parametros?: Record<string, Record<string, number>>;
  /** Efecto distinto para algunos objetivos: id → efecto (p. ej. Regalo envenenado contando viejas colocadas). */
  efectos?: Record<string, string>;
  /** Con quién se comparan los bots: el rival que va mejor (por defecto) o la media de los rivales. */
  rivales?: "mejor" | "media";
}

interface Stats {
  config: string;
  jugadores: number;
  rondas: number;
  abortada: boolean;
  /** Por asiento (0 = el que abre la ronda 1). */
  totales: number[];
  partida: number[];
  objetivos: number[];
  puestos: number[];
  primeroEnLlegar: number | null;
  secretos: (string | null)[];
  comunes: string[];
  puntosPorObjetivo: Record<string, number[]>;
  acciones: Record<string, number>;
  anuladas: number;
  viejasAlRival: number;
  /** Turnos en los que el jugador tenía una cuerda vieja en la mano. */
  turnosConVieja: number;
  /** Viejas que un rival puso y el dueño del tendedero mejoró antes de que se rompieran. */
  viejasMejoradas: number;
  mejoras: number;
  trofeos: number;
  perdidas: number;
  robo: Record<string, number>;
  descartes: number;
  secadasPorJugador: number[];
  /** Para estimar lo que tardarían personas. */
  tiempo: { drafts: number; turnos: number; jugadas: number; accionesJugadas: number; prendasAlSecar: number };
}

const TIPOS = ["calcetin", "camiseta", "toalla"] as const;

function datosDe(c: Config) {
  return {
    ...datos,
    cartas: datos.cartas.map((d) => (c.parametros?.[d.id] ? { ...d, parametros: { ...d.parametros, ...c.parametros[d.id] } } : d)),
    objetivos: datos.objetivos.map((o) => {
      const [cada, puntos] = c.ritmos?.[o.id] ?? [o.cada, o.puntos];
      return { ...o, cada, puntos: Math.max(1, Math.round(puntos * c.objetivos)), efecto: c.efectos?.[o.id] ?? o.efecto };
    }),
  };
}

function contarColgadas(p: Partida): number {
  return p.jugadores.reduce((t, j) => t + j.lineas.reduce((u, l) => u + l.cartas.reduce((w, c) => w + c.colgadas.length, 0), 0), 0);
}

function jugarPartida(c: Config, semilla: string): Stats {
  const datosConfig = datosDe(c);
  ia = { azar, rivales: c.rivales ?? "mejor" };
  const base = ajustesIniciales(datosConfig);
  const ajustes = {
    ...base,
    jugadores: c.jugadores,
    semilla,
    umbralFinal: c.umbral,
    prendas: structuredClone(base.prendas),
    roboPorTurno: c.robo ? { cartas: c.robo.cartas, maxCuerdas: c.robo.maxCuerdas } : base.roboPorTurno,
    limiteMano: c.limiteMano ?? base.limiteMano,
    cestas: { ...base.cestas, ...c.cestas },
    repartoInverso: c.repartoInverso,
  };
  TIPOS.forEach((t, k) => (ajustes.prendas[t].puntos = c.prendas[k]));
  let p = crearPartida(datosConfig, ajustes);
  p.registro = [];
  const s: Stats = {
    config: c.id,
    jugadores: c.jugadores,
    rondas: 0,
    abortada: false,
    totales: [],
    partida: [],
    objetivos: [],
    puestos: [],
    primeroEnLlegar: null,
    secretos: [],
    comunes: [],
    puntosPorObjetivo: {},
    acciones: {},
    anuladas: 0,
    viejasAlRival: 0,
    turnosConVieja: 0,
    viejasMejoradas: 0,
    mejoras: 0,
    trofeos: 0,
    perdidas: 0,
    robo: {},
    descartes: 0,
    secadasPorJugador: [],
    tiempo: { drafts: 0, turnos: 0, jugadas: 0, accionesJugadas: 0, prendasAlSecar: 0 },
  };

  // Cada uno se queda uno de los dos objetivos que le ofrecen, al azar.
  p.jugadores.forEach((_, i) => {
    p = aplicada(p, eleccionDeObjetivo(p, i, ia))!;
  });

  let pasos = 0;
  while (!p.terminada) {
    if (++pasos > 20000 || p.ronda > 60) {
      s.abortada = true;
      break;
    }
    if (p.reaccion) {
      s.anuladas++;
      p = aplicada(p, { tipo: "responder", jugador: p.reaccion.defensor, anular: true })!;
      continue;
    }
    const i = p.turno.jugador;
    const fase = p.turno.fase;
    if (fase === "cesta" || fase === "centro") {
      s.tiempo.drafts++;
      p = aplicada(p, mejorDraft(p, i, ia))!;
      continue;
    }
    if (fase === "descartar") {
      s.descartes++;
      p = aplicada(p, descarteDeBot(p, i, ia))!;
      continue;
    }

    // Fase de juego: jugadas mientras mejoren, y luego terminar el turno.
    if (p.jugadores[i].mano.some((x) => p.cartas[x] === "vieja")) s.turnosConVieja++;
    let jugadas = 0;
    let mejor = mejorJugada(p, i, ia);
    while (mejor && jugadas < 30) {
      const j = mejor.jugada;
      if (j.tipo === "jugarAccion") {
        const id = p.cartas[j.carta];
        s.acciones[id] = (s.acciones[id] ?? 0) + 1;
        s.tiempo.accionesJugadas++;
      }
      if (j.tipo === "colocarCuerda" && j.en !== undefined) s.viejasAlRival++;
      if (j.tipo === "mejorarCuerda") {
        s.mejoras++;
        if (p.jugadores[j.jugador].lineas[j.linea].cartas[j.posicion].colocadaPor !== undefined) s.viejasMejoradas++;
      }
      s.tiempo.jugadas++;
      p = mejor.partida;
      jugadas++;
      if (p.terminada || p.reaccion) break;
      mejor = mejorJugada(p, i, ia);
    }
    if (p.terminada || p.reaccion) continue;

    const cuerdas = c.robo?.cuerdasFijas ?? cuerdasARobar(p, i);
    s.robo[cuerdas] = (s.robo[cuerdas] ?? 0) + 1;
    s.tiempo.turnos++;
    // Al cerrar la ronda se baja la humedad de cada prenda colgada: es el mantenimiento que hacen las personas.
    if (cierraLaRonda(p, i)) s.tiempo.prendasAlSecar += contarColgadas(p);
    p = aplicada(p, { tipo: "terminarTurno", jugador: i, cuerdas })!;
  }

  s.rondas = p.ronda;
  s.primeroEnLlegar = p.primeroEnLlegar;
  s.comunes = [...p.objetivosComunes];
  s.secretos = p.jugadores.map((j) => j.objetivoSecreto);
  s.trofeos = p.jugadores.reduce((t, j) => t + j.trofeos.length, 0);
  s.perdidas = p.perdidas.length;
  s.secadasPorJugador = p.jugadores.map((j) => j.seca.length);
  if (p.final) {
    for (const r of p.final) {
      s.totales[r.jugador] = r.total;
      s.partida[r.jugador] = r.puntosPartida;
      s.objetivos[r.jugador] = r.total - r.puntosPartida;
      s.puestos[r.jugador] = r.puesto;
      for (const o of r.objetivos) (s.puntosPorObjetivo[o.objetivo] ??= []).push(o.puntos);
    }
  }
  return s;
}

// ---------- Programa ----------
// Recibe un archivo JSON con { configs: Config[], partidas: number } y va añadiendo una línea JSON
// por partida al archivo de salida, para que se pueda analizar mientras sigue jugando.

const [, , archivoTanda, salida = "resultados-bots.jsonl"] = process.argv;
if (!archivoTanda) throw new Error("Uso: node bots.mjs tanda.json salida.jsonl");
const tanda = JSON.parse(readFileSync(archivoTanda, "utf8")) as { configs: Config[]; partidas: number; desde?: number };
for (const c of tanda.configs) {
  const inicio = Date.now();
  const desde = tanda.desde ?? 0;
  for (let k = desde; k < desde + tanda.partidas; k++) {
    estado = (hash(c.id) + k * 7919) >>> 0 || 1;
    appendFileSync(salida, JSON.stringify(jugarPartida(c, `${c.id}-${k}`)) + "\n");
  }
  console.log(`${c.id}: ${tanda.partidas} partidas en ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
}

function hash(texto: string): number {
  let h = 2166136261;
  for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
