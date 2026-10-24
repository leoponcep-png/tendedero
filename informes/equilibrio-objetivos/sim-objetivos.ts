// Copia de trabajo de packages/motor/sim/bots.ts para medir los objetivos (no cambia nada del juego).
// Igual que bots.ts, pero apunta por asiento los puntos de cada objetivo y, además, cuánto habría
// contado cada objetivo del catálogo para cada jugador al final (para cálculos «¿y si…?»).
// Admite `forzarSecreto`: el asiento k % jugadores recibe ese objetivo como secreto.
// Empaquetar: npx rolldown informes/equilibrio-objetivos/sim-objetivos.ts --platform node --format esm -o informes/equilibrio-objetivos/sim-objetivos.mjs
// Uso (desde la raíz): node informes/equilibrio-objetivos/sim-objetivos.mjs tanda.json salida.jsonl

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  aplicar,
  ajustesIniciales,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  cuerdasARobar,
  descarteDeBot,
  eleccionDeObjetivo,
  mejorDraft,
  mejorJugada,
  puntuarObjetivo,
  type DatosCrudos,
  type Jugada,
  type OpcionesIA,
  type Partida,
} from "../../packages/motor/src";

const crudos = Object.fromEntries(
  ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(join(process.cwd(), "data", `${n}.json`), "utf8"))]),
) as DatosCrudos;
const datos = cargarDatos(crudos);

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

interface Config {
  id: string;
  /** Prefijo de la semilla: con la misma semilla, variantes distintas reparten igual al empezar. */
  semilla?: string;
  jugadores: number;
  prendas: [number, number, number];
  objetivos: number;
  umbral: number;
  ritmos?: Record<string, [number, number]>;
  forzarSecreto?: string;
}

const TIPOS = ["calcetin", "camiseta", "toalla"] as const;

function datosDe(c: Config) {
  return {
    ...datos,
    objetivos: datos.objetivos.map((o) => {
      const [cada, puntos] = c.ritmos?.[o.id] ?? [o.cada, o.puntos];
      return { ...o, cada, puntos: Math.max(1, Math.round(puntos * c.objetivos)) };
    }),
  };
}

function forzar(p: Partida, x: string, asiento: number) {
  const js = p.jugadores;
  const mio = js[asiento].objetivosOfrecidos;
  const sitio = (arr: string[]) => arr.indexOf(x);
  // Si x está en los comunes o en lo ofrecido a otro, se intercambia con lo primero que me ofrecían.
  let k = sitio(p.objetivosComunes);
  if (k >= 0) p.objetivosComunes[k] = mio[0] === x ? mio[1] : mio[0];
  js.forEach((j, i) => {
    if (i === asiento) return;
    const m = sitio(j.objetivosOfrecidos);
    if (m >= 0) j.objetivosOfrecidos[m] = mio[0] === x ? mio[1] : mio[0];
  });
  js[asiento].objetivosOfrecidos = [x];
}

function jugarPartida(c: Config, k: number) {
  const datosConfig = datosDe(c);
  ia = { azar, rivales: "mejor" };
  const base = ajustesIniciales(datosConfig);
  const ajustes = {
    ...base,
    jugadores: c.jugadores,
    semilla: `${c.semilla ?? c.id}-${k}`,
    umbralFinal: c.umbral,
    prendas: structuredClone(base.prendas),
  };
  TIPOS.forEach((t, n) => (ajustes.prendas[t].puntos = c.prendas[n]));
  let p = crearPartida(datosConfig, ajustes);
  p.registro = [];
  const asientoForzado = c.forzarSecreto ? k % c.jugadores : -1;
  if (c.forzarSecreto) forzar(p, c.forzarSecreto, asientoForzado);
  const ofrecidos = p.jugadores.map((j) => [...j.objetivosOfrecidos]);

  p.jugadores.forEach((_, i) => {
    p = aplicada(p, eleccionDeObjetivo(p, i, ia))!;
  });

  let pasos = 0;
  let abortada = false;
  while (!p.terminada) {
    if (++pasos > 20000 || p.ronda > 60) {
      abortada = true;
      break;
    }
    if (p.reaccion) {
      p = aplicada(p, { tipo: "responder", jugador: p.reaccion.defensor, anular: true })!;
      continue;
    }
    const i = p.turno.jugador;
    const fase = p.turno.fase;
    if (fase === "cesta" || fase === "centro") {
      p = aplicada(p, mejorDraft(p, i, ia))!;
      continue;
    }
    if (fase === "descartar") {
      p = aplicada(p, descarteDeBot(p, i, ia))!;
      continue;
    }
    let jugadas = 0;
    let mejor = mejorJugada(p, i, ia);
    while (mejor && jugadas < 30) {
      p = mejor.partida;
      jugadas++;
      if (p.terminada || p.reaccion) break;
      mejor = mejorJugada(p, i, ia);
    }
    if (p.terminada || p.reaccion) continue;
    p = aplicada(p, { tipo: "terminarTurno", jugador: i, cuerdas: cuerdasARobar(p, i) })!;
  }

  // Cuánto cuenta cada objetivo del catálogo para cada jugador (cantidad, no puntos).
  const cantidades = p.jugadores.map((_, i) =>
    Object.fromEntries(datosConfig.objetivos.map((o) => [o.id, puntuarObjetivo(p, i, o).cantidad])),
  );
  const asientos = p.jugadores.map((j, i) => {
    const r = p.final?.find((x) => x.jugador === i);
    return {
      secreto: j.objetivoSecreto,
      ofrecidos: ofrecidos[i],
      total: r?.total ?? null,
      partida: r?.puntosPartida ?? j.puntos,
      puesto: r?.puesto ?? null,
      objetivos: Object.fromEntries((r?.objetivos ?? []).map((o) => [o.objetivo, o.puntos])),
      secas: j.seca.length,
      cantidades: cantidades[i],
    };
  });
  return {
    config: c.id,
    k,
    jugadores: c.jugadores,
    rondas: p.ronda,
    abortada,
    primeroEnLlegar: p.primeroEnLlegar,
    comunes: [...p.objetivosComunes],
    forzado: c.forzarSecreto ? { objetivo: c.forzarSecreto, asiento: asientoForzado } : null,
    asientos,
  };
}

const [, , archivoTanda, salida = "resultados.jsonl"] = process.argv;
const tanda = JSON.parse(readFileSync(archivoTanda, "utf8")) as { configs: Config[]; partidas: number; desde?: number };
for (const c of tanda.configs) {
  const inicio = Date.now();
  const desde = tanda.desde ?? 0;
  for (let k = desde; k < desde + tanda.partidas; k++) {
    estado = (hash(c.semilla ?? c.id) + k * 7919) >>> 0 || 1;
    appendFileSync(salida, JSON.stringify(jugarPartida(c, k)) + "\n");
  }
  console.log(`${c.id}: ${tanda.partidas} partidas en ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
}

function hash(texto: string): number {
  let h = 2166136261;
  for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
