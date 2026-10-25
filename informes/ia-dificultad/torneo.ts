// Enfrenta niveles de la IA (fácil, normal, difícil) en partidas completas y apunta quién gana.
// Uso (desde la raíz del proyecto, donde está /data):
//   npx rolldown informes/ia-dificultad/torneo.ts --file informes/ia-dificultad/torneo.mjs --platform node
//   node informes/ia-dificultad/torneo.mjs tanda.json salida.jsonl
// tanda.json: { "partidas": 200, "desde": 0, "duelos": [{ "id": "dificil-normal", "niveles": ["dificil", "normal"] }] }
// Cada partida rota los asientos para que abrir la ronda no favorezca a nadie.

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  cestasPorDefecto,
  crearPartida,
  siguienteJugadaIA,
  type DatosCrudos,
  type Dificultad,
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

function quienJuega(p: Partida): number {
  const eligiendo = p.jugadores.findIndex((j) => j.objetivosOfrecidos.length > 0);
  if (eligiendo >= 0) return eligiendo;
  if (p.reaccion) return p.reaccion.defensor;
  return p.turno.jugador;
}

interface Duelo {
  id: string;
  niveles: Dificultad[];
}

const tiempos: Record<string, { n: number; total: number; max: number }> = {};

function jugar(d: Duelo, k: number) {
  const n = d.niveles.length;
  // Asiento s lo ocupa el nivel (s + k) % n.
  const niveles = Array.from({ length: n }, (_, s) => d.niveles[(s + k) % n]);
  const base = ajustesIniciales(datos);
  let p = crearPartida(datos, { ...base, jugadores: n, cestas: { ...base.cestas, numero: cestasPorDefecto(datos, n) }, semilla: `${d.id}-${k}` });
  p.registro = [];
  let pasos = 0;
  // Ropa por tender de cada uno justo antes del último reparto (la del último reparto ya no da tiempo a tenderla).
  let antesDelReparto = p.jugadores.map((j) => j.pendientes.length);
  let enReparto = false;
  while (!p.terminada && pasos++ < 5000) {
    const i = quienJuega(p);
    const t0 = performance.now();
    const j = siguienteJugadaIA(p, i, { azar, dificultad: niveles[i] });
    const ms = performance.now() - t0;
    const t = (tiempos[niveles[i]] ??= { n: 0, total: 0, max: 0 });
    t.n++;
    t.total += ms;
    t.max = Math.max(t.max, ms);
    if (!j) throw new Error(`Nadie juega (paso ${pasos}).`);
    const r = aplicar(p, j);
    if (!r.ok) throw new Error(`Jugada inválida de ${niveles[i]}: ${r.motivo} ${JSON.stringify(j)}`);
    p = r.partida;
    const reparto = p.turno.fase === "cesta" || p.turno.fase === "centro";
    if (reparto && !enReparto) antesDelReparto = p.jugadores.map((j) => j.pendientes.length);
    enReparto = reparto;
    p.registro = [];
    p.entradas = [];
  }
  const final = p.final ?? [];
  return {
    duelo: d.id,
    k,
    niveles,
    rondas: p.ronda,
    abortada: !p.terminada,
    totales: niveles.map((_, s) => final.find((r) => r.jugador === s)?.total ?? 0),
    puestos: niveles.map((_, s) => final.find((r) => r.jugador === s)?.puesto ?? 0),
    /** Por asiento: prendas secas de cada tipo, las que quedaron colgadas de cada tipo y las que quedaron por tender. */
    secas: p.jugadores.map((j) => porTipo(p, j.seca)),
    colgadas: p.jugadores.map((j) => porTipo(p, j.lineas.flatMap((l) => l.cartas.flatMap((t) => t.colgadas.map((c) => c.prenda))))),
    pendientes: p.jugadores.map((j) => j.pendientes.length),
    pendientesAntesDelUltimoReparto: antesDelReparto,
  };
}

function porTipo(p: Partida, prendas: string[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const id of prendas) r[p.prendas[id].tipo] = (r[p.prendas[id].tipo] ?? 0) + 1;
  return r;
}

const [, , archivoTanda, salida = "torneo.jsonl"] = process.argv;
if (!archivoTanda) throw new Error("Uso: node torneo.mjs tanda.json salida.jsonl");
const tanda = JSON.parse(readFileSync(archivoTanda, "utf8")) as { partidas: number; desde?: number; duelos: Duelo[] };
for (const d of tanda.duelos) {
  const inicio = Date.now();
  const desde = tanda.desde ?? 0;
  for (let k = desde; k < desde + tanda.partidas; k++) {
    estado = (hash(d.id) + k * 7919) >>> 0 || 1;
    appendFileSync(salida, JSON.stringify(jugar(d, k)) + "\n");
  }
  console.log(`${d.id}: ${tanda.partidas} partidas en ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
}
console.log(
  "ms por jugada:",
  Object.entries(tiempos).map(([nivel, t]) => `${nivel} media ${(t.total / t.n).toFixed(1)} máx ${t.max.toFixed(0)}`).join(" · "),
);

function hash(texto: string): number {
  let h = 2166136261;
  for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
