// Jugadores automáticos: los usan la simulación de partidas (sim/bots.ts) y la mesa contra la IA.
//
// Cada bot, en cada paso, prueba todas las jugadas válidas, valora cómo queda la mesa para él frente
// al mejor rival y se queda con la mejor; cuando ninguna mejora, termina el turno. No mira más allá.

import { puntuarObjetivo } from "./estado/final";
import { rondasHastaRomperse } from "./estado/rotura";
import { efectoDeCuerda } from "./estado/secado";
import type { Partida } from "./estado/tipos";
import { defCarta, tipoDe } from "./estado/utilidades";
import { aplicar, esValida, motivoInvalida } from "./jugadas";
import { efectoAccion, FALTA_DESTINO, pideDestino } from "./jugadas/jugarAccion";
import { maxCuerdasRobadas } from "./jugadas/terminarTurno";
import type { Jugada, ObjetivoAccion } from "./jugadas/tipos";

/** Un número entre 0 y 1; se pasa desde fuera para que la simulación pueda repetir partidas con semilla. */
export type AzarIA = () => number;

export interface OpcionesIA {
  azar?: AzarIA;
  /**
   * Con quién se compara el bot: el rival que va mejor (y se le ataca a él, por defecto) o la media
   * de los rivales, así que da igual a quién se ataque y los fastidios se reparten.
   */
  rivales?: "mejor" | "media";
}

interface Contexto {
  azar: AzarIA;
  rivales: "mejor" | "media";
}

function contexto(o: OpcionesIA = {}): Contexto {
  return { azar: o.azar ?? Math.random, rivales: o.rivales ?? "mejor" };
}

/** La jugada aplicada sin registro (los bots prueban muchas y no hace falta copiarlo cada vez). */
function aplicada(p: Partida, j: Jugada): Partida | null {
  const r = aplicar({ ...p, registro: [], entradas: [] }, j);
  return r.ok ? r.partida : null;
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
  let cabe = espaciosLibres(p, i);
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

/** Cómo de bien le va al jugador `i` frente a los rivales. */
export function valoracion(p: Partida, i: number, opciones: OpcionesIA = {}): number {
  const c = contexto(opciones);
  if (p.terminada && p.final) {
    const mio = p.final.find((r) => r.jugador === i)!;
    const mejorRival = Math.max(...p.final.filter((r) => r.jugador !== i).map((r) => r.total));
    return (mio.total - mejorRival) * 10;
  }
  const valores = p.jugadores.map((_, k) => k).filter((k) => k !== i).map((k) => valor(p, k));
  const rival = c.rivales === "media" ? valores.reduce((a, b) => a + b, 0) / valores.length : Math.max(...valores);
  return valor(p, i) - 0.8 * rival;
}

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
      // Solo se buscan destinos si lo demás ya vale (si no, sobran cientos de pruebas).
      if (motivoInvalida(p, base) !== FALTA_DESTINO) continue;
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

// ---------- Decisiones ----------

/** La mejor jugada del turno, o null si ninguna mejora lo que hay (entonces toca terminar el turno). */
export function mejorJugada(p: Partida, i: number, opciones: OpcionesIA = {}): { jugada: Jugada; partida: Partida } | null {
  const c = contexto(opciones);
  const ahora = valoracion(p, i, c);
  let mejor: { jugada: Jugada; partida: Partida; v: number } | null = null;
  for (const jugada of candidatas(p, i)) {
    if (!esValida(p, jugada)) continue;
    const q = aplicada(p, jugada);
    if (!q) continue;
    // El bot no ve la mano del rival: valora el fastidio como si no lo fueran a anular.
    const vista = q.reaccion ? (aplicada(q, { tipo: "responder", jugador: q.reaccion.defensor, anular: false }) ?? q) : q;
    const v = valoracion(vista, i, c) + c.azar() * 0.05;
    if (!mejor || v > mejor.v) mejor = { jugada, partida: q, v };
  }
  return mejor && mejor.v > ahora + 0.05 ? { jugada: mejor.jugada, partida: mejor.partida } : null;
}

/** Qué coger en el reparto de prendas (de una cesta o del centro, según la fase). */
export function mejorDraft(p: Partida, i: number, opciones: OpcionesIA = {}): Jugada {
  const c = contexto(opciones);
  const origenes = p.turno.fase === "centro" ? (["centro"] as const) : p.cestas.map((_, cesta) => ({ cesta }));
  let mejor: { jugada: Jugada; v: number } | null = null;
  for (const origen of origenes) {
    const prendas = origen === "centro" ? p.centro : p.cestas[origen.cesta];
    const patrones = [
      ...new Set(prendas.map((id) => `c:${p.prendas[id].color}`)),
      ...new Set(prendas.map((id) => `t:${p.prendas[id].tipo}`)),
    ];
    for (const pat of patrones) {
      const patron = pat.startsWith("c:") ? { color: pat.slice(2) } : { tipo: pat.slice(2) };
      const jugada: Jugada = { tipo: "draft", jugador: i, origen, patron };
      const q = aplicada(p, jugada);
      if (!q) continue;
      const v = valoracion(q, i, c) + c.azar() * 0.2;
      if (!mejor || v > mejor.v) mejor = { jugada, v };
    }
  }
  if (!mejor) throw new Error("El bot no encuentra qué coger en el reparto.");
  return mejor.jugada;
}

/** Uno de los objetivos que le ofrecen, al azar. */
export function eleccionDeObjetivo(p: Partida, i: number, opciones: OpcionesIA = {}): Jugada {
  const c = contexto(opciones);
  const ofrecidos = p.jugadores[i].objetivosOfrecidos;
  return { tipo: "elegirObjetivo", jugador: i, objetivo: ofrecidos[Math.floor(c.azar() * ofrecidos.length)] };
}

/** Qué carta suelta al pasarse del límite de mano. */
export function descarteDeBot(p: Partida, i: number, opciones: OpcionesIA = {}): Jugada {
  const c = contexto(opciones);
  const j = p.jugadores[i];
  const cuerdas = j.mano.filter((x) => defCarta(p, x).mazo === "cuerdas");
  // Sobran cuerdas si no caben en el tendedero; las de reacción se guardan mientras haya otra que tirar.
  const otras = j.mano.filter((x) => efectoAccion(p, x)?.blanco !== "reaccion");
  const entre = otras.length ? otras : j.mano;
  const carta = cuerdas.length > huecosLibres(p, i) ? cuerdas[0] : entre[Math.floor(c.azar() * entre.length)];
  return { tipo: "descartar", jugador: i, carta };
}

function huecosLibres(p: Partida, i: number): number {
  const { lineas, cartasPorLinea } = p.ajustes.tendedero;
  return lineas * cartasPorLinea - p.jugadores[i].lineas.reduce((t, l) => t + l.cartas.length, 0);
}

/** Cuántas de las cartas que roba al terminar el turno son de cuerda: las que le caben en el tendedero. */
export function cuerdasARobar(p: Partida, i: number): number {
  const enMano = p.jugadores[i].mano.filter((x) => defCarta(p, x).mazo === "cuerdas").length;
  return Math.max(0, Math.min(maxCuerdasRobadas(p), huecosLibres(p, i) - enMano));
}

/** Si el atacado anula el fastidio: solo cuando le perjudica (lo que pierde pesa más que gastar la carta). */
export function respuestaDeBot(p: Partida, opciones: OpcionesIA = {}): Jugada {
  const c = contexto(opciones);
  const defensor = p.reaccion!.defensor;
  const anulada = aplicada(p, { tipo: "responder", jugador: defensor, anular: true });
  const aceptada = aplicada(p, { tipo: "responder", jugador: defensor, anular: false });
  const anular = !!anulada && (!aceptada || valoracion(anulada, defensor, c) > valoracion(aceptada, defensor, c) + 0.3);
  return { tipo: "responder", jugador: defensor, anular };
}

/**
 * Lo siguiente que haría el jugador `i`, o null si no le toca hacer nada ahora.
 * Sirve para llevar asientos automáticos paso a paso (la mesa los anima de uno en uno).
 */
export function siguienteJugadaIA(p: Partida, i: number, opciones: OpcionesIA = {}): Jugada | null {
  if (p.terminada) return null;
  const j = p.jugadores[i];
  if (j.objetivosOfrecidos.length > 0) return eleccionDeObjetivo(p, i, opciones);
  if (p.reaccion) return p.reaccion.defensor === i ? respuestaDeBot(p, opciones) : null;
  // Nadie empieza hasta que todos tienen objetivo (lo pide el motor).
  if (p.jugadores.some((o) => o.objetivosOfrecidos.length > 0)) return null;
  if (p.turno.jugador !== i) return null;
  const fase = p.turno.fase;
  if (fase === "cesta" || fase === "centro") return mejorDraft(p, i, opciones);
  if (fase === "descartar") return descarteDeBot(p, i, opciones);
  return mejorJugada(p, i, opciones)?.jugada ?? { tipo: "terminarTurno", jugador: i, cuerdas: cuerdasARobar(p, i) };
}
