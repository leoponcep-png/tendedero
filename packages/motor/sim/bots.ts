// Partidas enteras jugadas por bots, para ver el equilibrio del juego con muchos datos.
// Uso (desde la raíz): node bots.mjs tanda.json salida.jsonl (empaquetado antes con rolldown).
//
// Cada bot, en cada paso, prueba todas las jugadas válidas, valora cómo queda la mesa para él frente
// al mejor rival y se queda con la mejor; cuando ninguna mejora, termina el turno. No mira más allá.

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  aplicar,
  cierraLaRonda,
  ajustesIniciales,
  ARCHIVOS_DATOS,
  cargarDatos,
  crearPartida,
  defCarta,
  efectoAccion,
  efectoDeCuerda,
  esValida,
  maxCuerdasRobadas,
  pideDestino,
  puntuarObjetivo,
  rondasHastaRomperse,
  tipoDe,
  type DatosCrudos,
  type Jugada,
  type ObjetivoAccion,
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

// ---------- Valoración ----------

/** Huecos libres donde merece la pena colgar: no cuentan los de una cuerda que se va a romper ni los de su derecha. */
function espaciosLibres(p: Partida, i: number): number {
  let libres = 0;
  for (const l of p.jugadores[i].lineas) {
    for (const t of l.cartas) {
      if (rondasHastaRomperse(p, t) !== null) break;
      const ocupados = t.colgadas.reduce((s, c) => s + tipoDe(p, c.prenda).espacios, 0);
      libres += defCarta(p, t.carta).espacios - ocupados;
    }
  }
  return libres;
}

/** Lo que vale para un jugador cómo está la mesa ahora: puntos, ropa en camino, objetivos y capacidad. */
function valor(p: Partida, i: number): number {
  const j = p.jugadores[i];
  let v = j.puntos;

  // Ropa colgada: vale más cuanto menos le falta; si su cuerda se va a romper, no vale nada.
  for (const l of j.lineas) {
    let rota = false;
    for (const t of l.cartas) {
      const quedan = rondasHastaRomperse(p, t);
      if (quedan !== null) rota = true;
      for (const c of t.colgadas) {
        const tipo = tipoDe(p, c.prenda);
        const h = p.prendas[c.prenda].humedad;
        v += rota ? -0.3 * tipo.puntos : (tipo.puntos * 0.9) / (1 + 0.5 * h);
      }
      // Capacidad útil del tendedero (una vieja ocupa sitio y amenaza a lo de su derecha).
      v += rota ? -3 : 0.25 * defCarta(p, t.carta).espacios;
      if (efectoDeCuerda(p, t.carta)) v += 1;
    }
  }

  // Ropa por tender: vale algo si hay sitio para ella.
  const libres = espaciosLibres(p, i);
  let cabe = libres;
  const pendientes = [...j.pendientes].sort((a, b) => tipoDe(p, b).puntos - tipoDe(p, a).puntos);
  for (const id of pendientes) {
    const t = tipoDe(p, id);
    if (t.espacios <= cabe) {
      v += t.puntos * 0.35;
      cabe -= t.espacios;
    } else v += t.puntos * 0.1;
  }

  // Objetivos (lo que darían ahora).
  const ids = [...p.objetivosComunes, ...(j.objetivoSecreto ? [j.objetivoSecreto] : [])];
  for (const id of ids) v += puntuarObjetivo(p, i, p.catalogo.objetivos[id]).puntos * 0.8;

  // Cartas en mano: algo de valor, para no tirarlas por nada.
  v += j.mano.length * 0.1;
  v += j.trofeos.length * 0.5;
  return v;
}

function valoracion(p: Partida, i: number): number {
  if (p.terminada && p.final) {
    const mio = p.final.find((r) => r.jugador === i)!;
    const mejorRival = Math.max(...p.final.filter((r) => r.jugador !== i).map((r) => r.total));
    return (mio.total - mejorRival) * 10;
  }
  const valores = p.jugadores.map((_, k) => k).filter((k) => k !== i).map((k) => valor(p, k));
  // «mejor»: se compara con el rival que va mejor (y se le ataca a él); «media»: con la media de los rivales,
  // así que da igual a quién se ataque y los fastidios se reparten.
  const rival = modoRivales === "media" ? valores.reduce((a, b) => a + b, 0) / valores.length : Math.max(...valores);
  return valor(p, i) - 0.8 * rival;
}

let modoRivales: "mejor" | "media" = "mejor";

// ---------- Jugadas candidatas ----------

function objetivosPosibles(p: Partida): ObjetivoAccion[] {
  const lista: ObjetivoAccion[] = [];
  p.jugadores.forEach((j, jugador) =>
    j.lineas.forEach((l, linea) =>
      l.cartas.forEach((t, posicion) => {
        lista.push({ jugador, linea, posicion });
        for (const c of t.colgadas) lista.push({ jugador, linea, posicion, prenda: c.prenda });
      }),
    ),
  );
  return lista;
}

function destinosPosibles(p: Partida, jugador: number): { linea: number; posicion: number; inicio: number }[] {
  const lista: { linea: number; posicion: number; inicio: number }[] = [];
  p.jugadores[jugador].lineas.forEach((l, linea) => {
    for (let posicion = 0; posicion <= l.cartas.length; posicion++) {
      const espacios = posicion < l.cartas.length ? defCarta(p, l.cartas[posicion].carta).espacios : 1;
      for (let inicio = 0; inicio < espacios; inicio++) lista.push({ linea, posicion, inicio });
    }
  });
  return lista;
}

function candidatas(p: Partida, i: number): Jugada[] {
  const j = p.jugadores[i];
  const lista: Jugada[] = [];

  for (const carta of j.mano) {
    const def = defCarta(p, carta);
    if (def.mazo === "cuerdas") {
      p.jugadores.forEach((_, en) =>
        p.jugadores[en].lineas.forEach((l, linea) => {
          lista.push({ tipo: "colocarCuerda", jugador: i, carta, linea, ...(en !== i && { en }) });
          l.cartas.forEach((_, posicion) => en === i && lista.push({ tipo: "mejorarCuerda", jugador: i, carta, linea, posicion }));
        }),
      );
      continue;
    }
    const efecto = efectoAccion(p, carta);
    if (!efecto || efecto.blanco === "reaccion") continue;
    if (efecto.blanco === "ninguno") {
      lista.push({ tipo: "jugarAccion", jugador: i, carta });
      continue;
    }
    for (const objetivo of objetivosPosibles(p)) {
      const base: Jugada = { tipo: "jugarAccion", jugador: i, carta, objetivo };
      if (!pideDestino(efecto.blanco)) {
        lista.push(base);
        continue;
      }
      for (const destino of destinosPosibles(p, objetivo.jugador)) {
        lista.push({ tipo: "jugarAccion", jugador: i, carta, objetivo: { ...objetivo, destino } });
      }
    }
  }

  for (const prenda of j.pendientes) {
    j.lineas.forEach((l, linea) =>
      l.cartas.forEach((t, posicion) => {
        for (let inicio = 0; inicio < defCarta(p, t.carta).espacios; inicio++) {
          lista.push({ tipo: "colgarPrenda", jugador: i, prenda, linea, posicion, inicio });
        }
      }),
    );
  }
  return lista;
}

/** La mejor jugada del turno, o null si ninguna mejora lo que hay. */
function mejorJugada(p: Partida, i: number): { jugada: Jugada; partida: Partida } | null {
  const ahora = valoracion(p, i);
  let mejor: { jugada: Jugada; partida: Partida; v: number } | null = null;
  for (const jugada of candidatas(p, i)) {
    if (!esValida(p, jugada)) continue;
    const q = aplicada(p, jugada);
    if (!q) continue;
    // El bot no ve la mano del rival: valora el fastidio como si no lo fueran a anular.
    const vista = q.reaccion ? (aplicada(q, { tipo: "responder", jugador: q.reaccion.defensor, anular: false }) ?? q) : q;
    const v = valoracion(vista, i) + azar() * 0.05;
    if (!mejor || v > mejor.v) mejor = { jugada, partida: q, v };
  }
  return mejor && mejor.v > ahora + 0.05 ? mejor : null;
}

function mejorDraft(p: Partida, i: number): Partida {
  const origenes = p.turno.fase === "centro" ? (["centro"] as const) : p.cestas.map((_, cesta) => ({ cesta }));
  let mejor: { partida: Partida; v: number } | null = null;
  for (const origen of origenes) {
    const prendas = origen === "centro" ? p.centro : p.cestas[origen.cesta];
    const patrones = [
      ...new Set(prendas.map((id) => `c:${p.prendas[id].color}`)),
      ...new Set(prendas.map((id) => `t:${p.prendas[id].tipo}`)),
    ];
    for (const pat of patrones) {
      const patron = pat.startsWith("c:") ? { color: pat.slice(2) } : { tipo: pat.slice(2) };
      const q = aplicada(p, { tipo: "draft", jugador: i, origen, patron });
      if (!q) continue;
      const v = valoracion(q, i) + azar() * 0.2;
      if (!mejor || v > mejor.v) mejor = { partida: q, v };
    }
  }
  if (!mejor) throw new Error("El bot no encuentra qué coger en el reparto.");
  return mejor.partida;
}

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
  modoRivales = c.rivales ?? "mejor";
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
  p.jugadores.forEach((j, i) => {
    const elegido = j.objetivosOfrecidos[Math.floor(azar() * j.objetivosOfrecidos.length)];
    p = aplicada(p, { tipo: "elegirObjetivo", jugador: i, objetivo: elegido })!;
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
      p = mejorDraft(p, i);
      continue;
    }
    if (fase === "descartar") {
      const j = p.jugadores[i];
      const libres = p.ajustes.tendedero.lineas * p.ajustes.tendedero.cartasPorLinea - j.lineas.reduce((t, l) => t + l.cartas.length, 0);
      const cuerdas = j.mano.filter((x) => defCarta(p, x).mazo === "cuerdas");
      // Sobran cuerdas si no caben en el tendedero; las de reacción se guardan mientras haya otra que tirar.
      const otras = j.mano.filter((x) => efectoAccion(p, x)?.blanco !== "reaccion");
      const tirar = cuerdas.length > libres ? cuerdas[0] : (otras.length ? otras : j.mano)[Math.floor(azar() * (otras.length || j.mano.length))];
      s.descartes++;
      p = aplicada(p, { tipo: "descartar", jugador: i, carta: tirar })!;
      continue;
    }

    // Fase de juego: jugadas mientras mejoren, y luego terminar el turno.
    if (p.jugadores[i].mano.some((x) => p.cartas[x] === "vieja")) s.turnosConVieja++;
    let jugadas = 0;
    let mejor = mejorJugada(p, i);
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
      mejor = mejorJugada(p, i);
    }
    if (p.terminada || p.reaccion) continue;

    const j = p.jugadores[i];
    const libres = p.ajustes.tendedero.lineas * p.ajustes.tendedero.cartasPorLinea - j.lineas.reduce((t, l) => t + l.cartas.length, 0);
    const enMano = j.mano.filter((x) => defCarta(p, x).mazo === "cuerdas").length;
    const cuerdas = c.robo?.cuerdasFijas ?? Math.max(0, Math.min(maxCuerdasRobadas(p), libres - enMano));
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
