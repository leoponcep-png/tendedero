// Simulador para los informes de clima, parejas y modos de juego (no cambia nada del juego).
// Junta lo de informes/equilibrio-objetivos/sim-objetivos.ts (objetivo secreto forzado, cantidades de cada
// objetivo al final) y lo de informes/ia-dificultad/torneo.ts (niveles de la IA paso a paso con siguienteJugadaIA),
// y además apunta la carta del día de cada ronda, las cuerdas colocadas y las mejoras de cuerda.
//
// Empaquetar (desde la raíz):
//   npx rolldown informes/modos/sim.ts --file informes/modos/sim.mjs --platform node
// Uso: node informes/modos/sim.mjs tanda.json salida.jsonl
// tanda.json: { "partidas": 100, "desde": 0, "configs": [Config, ...] }

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  cestasPorDefecto,
  crearPartida,
  defCarta,
  puntuarObjetivo,
  siguienteJugadaIA,
  type Ajustes,
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

interface Config {
  id: string;
  /** Prefijo de la semilla: con la misma semilla, variantes distintas reparten igual al empezar. */
  semilla?: string;
  jugadores: number;
  /** Nivel de cada asiento (se rota con la partida); uno solo = todos iguales. */
  niveles: Dificultad[];
  /** Modo de juego de los ajustes («normal» o «larga»). */
  modo?: string;
  /** Cambios sueltos sobre los ajustes (después del modo): prendas [calcetín, camiseta, toalla], umbral… */
  prendas?: [number, number, number];
  umbral?: number;
  ajustes?: Record<string, unknown>;
  /** Ritmos de objetivos [cada, puntos] que sustituyen a los de los datos. */
  ritmos?: Record<string, [number, number]>;
  /** El asiento k % jugadores recibe este objetivo como secreto. */
  forzarSecreto?: string;
}

const TIPOS = ["calcetin", "camiseta", "toalla"] as const;

function datosDe(c: Config) {
  if (!c.ritmos) return datos;
  return {
    ...datos,
    objetivos: datos.objetivos.map((o) => {
      const r = c.ritmos![o.id];
      return r ? { ...o, cada: r[0], puntos: r[1] } : o;
    }),
  };
}

function forzar(p: Partida, x: string, asiento: number) {
  const js = p.jugadores;
  const mio = js[asiento].objetivosOfrecidos;
  const otro = mio[0] === x ? mio[1] : mio[0];
  const k = p.objetivosComunes.indexOf(x);
  if (k >= 0) p.objetivosComunes[k] = otro;
  js.forEach((j, i) => {
    if (i === asiento) return;
    const m = j.objetivosOfrecidos.indexOf(x);
    if (m >= 0) j.objetivosOfrecidos[m] = otro;
  });
  js[asiento].objetivosOfrecidos = [x];
}

function quienJuega(p: Partida): number {
  const eligiendo = p.jugadores.findIndex((j) => j.objetivosOfrecidos.length > 0);
  if (eligiendo >= 0) return eligiendo;
  if (p.reaccion) return p.reaccion.defensor;
  return p.turno.jugador;
}

const cartasEnTendedero = (p: Partida, i: number) => p.jugadores[i].lineas.reduce((s, l) => s + l.cartas.length, 0);

function jugar(c: Config, k: number) {
  const d = datosDe(c);
  const n = c.jugadores;
  const niveles = Array.from({ length: n }, (_, s) => c.niveles[(s + k) % c.niveles.length]);
  const base = ajustesIniciales(d);
  const ajustes: Ajustes = {
    ...base,
    ...(c.ajustes as Partial<Ajustes>),
    jugadores: n,
    cestas: { ...base.cestas, numero: cestasPorDefecto(d, n) },
    semilla: `${c.semilla ?? c.id}-${k}`,
    prendas: structuredClone(base.prendas),
  };
  if (c.modo) (ajustes as Ajustes & { modo?: string }).modo = c.modo;
  if (c.prendas) TIPOS.forEach((t, m) => (ajustes.prendas[t].puntos = c.prendas![m]));
  if (c.umbral) ajustes.umbralFinal = c.umbral;
  let p = crearPartida(d, ajustes);
  p.registro = [];
  const asientoForzado = c.forzarSecreto ? k % n : -1;
  if (c.forzarSecreto) forzar(p, c.forzarSecreto, asientoForzado);

  const dias: string[] = [defCarta(p, p.dia!).id];
  let ronda = p.ronda;
  const mejoras = Array(n).fill(0);
  const arreglos = Array(n).fill(0);
  const colocadas = Array(n).fill(0);
  const rondaLleno: (number | null)[] = Array(n).fill(null);
  const capacidad = p.ajustes.tendedero.lineas * p.ajustes.tendedero.cartasPorLinea;
  let pasos = 0;
  while (!p.terminada && pasos++ < 20000 && p.ronda <= 60) {
    const i = quienJuega(p);
    const j = siguienteJugadaIA(p, i, { azar, dificultad: niveles[i] });
    if (!j) throw new Error(`Nadie juega (paso ${pasos}).`);
    let esMejora = false;
    let esArreglo = false;
    if (j.tipo === "mejorarCuerda") {
      const debajo = defCarta(p, p.jugadores[j.jugador].lineas[j.linea].cartas[j.posicion].carta);
      if (debajo.efecto === null) esMejora = true;
      else esArreglo = true;
    }
    const r = aplicar(p, j);
    if (!r.ok) throw new Error(`Jugada inválida de ${niveles[i]}: ${r.motivo} ${JSON.stringify(j)}`);
    if (esMejora) mejoras[j.jugador]++;
    if (esArreglo) arreglos[j.jugador]++;
    if (j.tipo === "colocarCuerda" && (j.en ?? j.jugador) === j.jugador) colocadas[j.jugador]++;
    p = r.partida;
    p.registro = [];
    p.entradas = [];
    for (let s = 0; s < n; s++) if (rondaLleno[s] === null && cartasEnTendedero(p, s) >= capacidad) rondaLleno[s] = p.ronda;
    if (p.ronda !== ronda && !p.terminada) {
      ronda = p.ronda;
      if (p.dia) dias.push(defCarta(p, p.dia).id);
    }
  }
  const cantidades = p.jugadores.map((_, i) => Object.fromEntries(d.objetivos.map((o) => [o.id, puntuarObjetivo(p, i, p.catalogo.objetivos[o.id] ?? o).cantidad])));
  const asientos = p.jugadores.map((jg, i) => {
    const r = p.final?.find((x) => x.jugador === i);
    const secas: Record<string, number> = {};
    for (const id of jg.seca) secas[p.prendas[id].tipo] = (secas[p.prendas[id].tipo] ?? 0) + 1;
    return {
      nivel: niveles[i],
      secreto: jg.objetivoSecreto,
      total: r?.total ?? null,
      partida: r?.puntosPartida ?? jg.puntos,
      puesto: r?.puesto ?? null,
      objetivos: Object.fromEntries((r?.objetivos ?? []).map((o) => [o.objetivo, o.puntos])),
      secas,
      mejoras: mejoras[i],
      arreglos: arreglos[i],
      colocadas: colocadas[i],
      cartas: cartasEnTendedero(p, i),
      rondaLleno: rondaLleno[i],
      cantidades: cantidades[i],
    };
  });
  return {
    config: c.id,
    k,
    jugadores: n,
    rondas: p.ronda,
    abortada: !p.terminada,
    comunes: [...p.objetivosComunes],
    forzado: c.forzarSecreto ? { objetivo: c.forzarSecreto, asiento: asientoForzado } : null,
    dias,
    asientos,
  };
}

const [, , archivoTanda, salida = "resultados.jsonl"] = process.argv;
if (!archivoTanda) throw new Error("Uso: node sim.mjs tanda.json salida.jsonl");
const tanda = JSON.parse(readFileSync(archivoTanda, "utf8")) as { configs: Config[]; partidas: number; desde?: number };
for (const c of tanda.configs) {
  const inicio = Date.now();
  const desde = tanda.desde ?? 0;
  for (let k = desde; k < desde + tanda.partidas; k++) {
    estado = (hash(c.semilla ?? c.id) + k * 7919) >>> 0 || 1;
    appendFileSync(salida, JSON.stringify(jugar(c, k)) + "\n");
  }
  console.log(`${c.id}: ${tanda.partidas} partidas en ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
}

function hash(texto: string): number {
  let h = 2166136261;
  for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
