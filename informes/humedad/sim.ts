// Simulación rápida con los bots para el tope de humedad (informes/humedad/tope-4.md). No cambia nada del juego.
// Como informes/ia-dificultad/torneo.ts, pero con modo de juego y apuntando cuántas veces se toca el tope.
//
// Empaquetar (desde la raíz, donde está /data):
//   npx rolldown informes/humedad/sim.ts --file informes/humedad/sim.mjs --platform node
// Uso: node informes/humedad/sim.mjs tanda.json salida.jsonl
// tanda.json: { "partidas": 100, "desde": 0, "duelos": [{ "id": "dificil-normal", "niveles": ["dificil", "normal"], "modo": "normal" }] }
//
// Sirve también con el motor de antes del tope (sin `humedadMaxima`): entonces cuenta las veces que una prenda
// pasa de 4, que con la regla nueva habrían tocado el tope.

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
  type Ajustes,
  type DatosCrudos,
  type Dificultad,
  type Jugada,
  type Partida,
} from "../../packages/motor/src";

const TOPE = 4;
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
  modo?: "normal" | "larga";
}

const conTope = "humedadMaxima" in ajustesIniciales(datos);

/** Qué ha hecho subir la humedad en esta jugada: una carta (por su id) o el día. */
function causa(p: Partida, j: Jugada): string {
  if (j.tipo === "jugarAccion") return p.cartas[j.carta];
  if (j.tipo === "responder" && p.reaccion?.jugada.tipo === "jugarAccion") return p.cartas[p.reaccion.jugada.carta];
  return "dia";
}

function jugar(d: Duelo, k: number) {
  const n = d.niveles.length;
  const niveles = Array.from({ length: n }, (_, s) => d.niveles[(s + k) % n]);
  const base = ajustesIniciales(datos);
  let p = crearPartida(datos, { ...base, modo: d.modo ?? "normal", jugadores: n, cestas: { ...base.cestas, numero: cestasPorDefecto(datos, n) }, semilla: `${d.id}-${k}` } as Ajustes);
  p.registro = [];
  let pasos = 0;
  /** Prendas que tocan el tope (una por prenda y jugada) y humedad que se pierde por él. */
  let toques = 0;
  let perdida = 0;
  const porCausa: Record<string, number> = {};
  let maxima = 0;
  /** Cartas que mojan jugadas sobre prendas que ya estaban todas a 4 (no hacen nada). */
  let mojasEnBalde = 0;
  while (!p.terminada && pasos++ < 6000) {
    const i = quienJuega(p);
    const j = siguienteJugadaIA(p, i, { azar, dificultad: niveles[i] });
    if (!j) throw new Error(`Nadie juega (paso ${pasos}).`);
    const r = aplicar(p, j);
    if (!r.ok) throw new Error(`Jugada inválida de ${niveles[i]}: ${r.motivo} ${JSON.stringify(j)}`);
    const q = r.partida;
    if (conTope) {
      // La misma jugada sin tope: lo que habría ganado de más cada prenda es lo que se pierde por el tope.
      const sin = aplicar({ ...p, ajustes: { ...p.ajustes, humedadMaxima: 99 } as Ajustes }, j);
      if (sin.ok) {
        let tocadas = 0;
        for (const [id, pr] of Object.entries(sin.partida.prendas)) {
          const dif = pr.humedad - q.prendas[id].humedad;
          if (dif > 0) {
            tocadas++;
            perdida += dif;
          }
        }
        if (tocadas) {
          toques += tocadas;
          porCausa[causa(p, j)] = (porCausa[causa(p, j)] ?? 0) + tocadas;
        }
      }
      if (j.tipo === "jugarAccion" && j.objetivo) {
        const def = p.cartas[j.carta];
        const t = p.jugadores[j.objetivo.jugador].lineas[j.objetivo.linea]?.cartas[j.objetivo.posicion];
        const blancos = def === "retrasar-secado" ? [j.objetivo.prenda!] : def === "mojar-cuerda-rival" ? (t?.colgadas.map((c) => c.prenda) ?? []) : [];
        if (blancos.length && blancos.every((id) => p.prendas[id].humedad >= TOPE)) mojasEnBalde++;
      }
    } else {
      let tocadas = 0;
      for (const [id, pr] of Object.entries(q.prendas)) {
        const antes = p.prendas[id].humedad;
        if (pr.humedad > antes && pr.humedad > TOPE) {
          tocadas++;
          perdida += pr.humedad - Math.max(TOPE, antes);
        }
      }
      if (tocadas) {
        toques += tocadas;
        porCausa[causa(p, j)] = (porCausa[causa(p, j)] ?? 0) + tocadas;
      }
    }
    for (const pr of Object.values(q.prendas)) maxima = Math.max(maxima, pr.humedad);
    p = q;
    p.registro = [];
    p.entradas = [];
  }
  const final = p.final ?? [];
  return {
    duelo: d.id,
    modo: d.modo ?? "normal",
    k,
    niveles,
    rondas: p.ronda,
    abortada: !p.terminada,
    totales: niveles.map((_, s) => final.find((r) => r.jugador === s)?.total ?? 0),
    puestos: niveles.map((_, s) => final.find((r) => r.jugador === s)?.puesto ?? 0),
    toques,
    perdida,
    porCausa,
    maxima,
    mojasEnBalde,
  };
}

const [, , archivoTanda, salida = "sim.jsonl"] = process.argv;
if (!archivoTanda) throw new Error("Uso: node sim.mjs tanda.json salida.jsonl");
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

function hash(texto: string): number {
  let h = 2166136261;
  for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
