// La IA difícil: juega para ganar.
//
// Como la normal, prueba cada jugada válida aplicándola con el motor, pero puntúa la mesa resultante con una
// heurística que mira hacia delante: cuántas rondas quedan, cuándo se secará cada prenda (según su humedad, la
// de las cartas de Mojar, su cuerda y el tiempo), si su cuerda se romperá antes, qué le darán sus objetivos (el
// común y el secreto) con la ropa que lleva camino de secarse, y cuánto vale guardar cartas como «¡Ni hablar!».
// Los fastidios se valoran contando con que el rival pueda anularlos (sin mirar su mano: solo lo que se ve) y
// van contra quien va ganando. Solo usa información que tendría una persona en la mesa.

import { efectos } from "./efectos";
import { puntuarObjetivo } from "./estado/final";
import { rondasHastaRomperse } from "./estado/rotura";
import { efectoClima, efectoCuerda, protegidaDe } from "./estado/secado";
import type { CartaTendida, Partida } from "./estado/tipos";
import { defCarta, tipoDe } from "./estado/utilidades";
import { esValida } from "./jugadas";
import { efectoAccion } from "./jugadas/jugarAccion";
import type { Jugada } from "./jugadas/tipos";
import { aplicada, candidatas, cuerdasARobarBase, type AzarIA } from "./ia";
import { ropaPorTender } from "./iaRopa";

// ---------- Cuánto queda de partida ----------

/** Rondas que quedan contando la actual (su secado incluido); en la última ronda, 1. */
export function rondasRestantes(p: Partida): number {
  if (p.ultimaRonda) return 1;
  const lider = Math.max(...p.jugadores.map((j) => j.puntos));
  const falta = p.ajustes.umbralFinal - lider;
  if (falta <= 0) return 1;
  // Ritmo de puntos por ronda del que va primero: lo visto hasta ahora, o una estimación al principio.
  const ritmo = p.ronda > 1 ? Math.max(4, lider / (p.ronda - 1)) : 6;
  let r = Math.max(1, Math.ceil(falta / ritmo));
  // Si casi no queda ropa, la partida acaba antes.
  const ropa = p.bolsa.length + p.centro.length + p.cestas.flat().length;
  const porRonda = p.ajustes.cestas.numero * p.ajustes.cestas.prendasPorCesta;
  if (porRonda > 0) r = Math.min(r, 1 + Math.ceil(ropa / porRonda));
  return r;
}

/** Probabilidad de que la partida siga viva hasta el secado de la ronda `k` (1 = la actual). */
function sigueViva(k: number, R: number, ultima: boolean): number {
  if (k <= R) return 1;
  if (ultima) return 0;
  return k === R + 1 ? 0.35 : 0.08;
}

// ---------- Secado de cada prenda ----------

/** Humedad que pierde una prenda de esta cuerda en el secado de esta ronda (con el tiempo) y en las siguientes. */
function ritmos(p: Partida, t: CartaTendida): { ahora: number; luego: number } {
  const cuerda = efectoCuerda(p, t);
  const base = cuerda?.efecto.secado?.(cuerda.params) ?? 1;
  const clima = efectoClima(p);
  const ajuste = clima?.efecto.ajusteSecado?.(p, t, clima.params) ?? 0;
  return { ahora: Math.max(0, base + ajuste), luego: Math.max(1, base) };
}

/** En qué secado (1 = el de esta ronda) llega a 0 una prenda con humedad `h`. */
function secadoEn(h: number, ahora: number, luego: number): number {
  if (h <= 0) return 1;
  if (h <= ahora) return 1;
  return 1 + Math.ceil((h - ahora) / luego);
}

/** Si el viento de hoy tira esta prenda antes de secar (calcetines en cuerdas no resistentes). */
function laTiraElViento(p: Partida, t: CartaTendida, prenda: string): boolean {
  if (!p.dia) return false;
  const def = defCarta(p, p.dia);
  const e = def.efecto ? efectos[def.efecto] : undefined;
  if (e?.tipo !== "clima" || !e.antesDelSecado) return false;
  const cae = typeof def.parametros.cae === "string" ? def.parametros.cae : "calcetin";
  return p.prendas[prenda].tipo === cae && !protegidaDe(p, t, "tira");
}

/** Puntos que dará la prenda al secarse en esta cuerda (con su modificador). */
function puntosAlSecar(p: Partida, t: CartaTendida, prenda: string): number {
  const base = tipoDe(p, prenda).puntos;
  const cuerda = efectoCuerda(p, t);
  return Math.max(0, cuerda?.efecto.puntosAlSecar?.(p, prenda, cuerda.params, base) ?? base);
}

/** Riesgo por ronda de que un fastidio rival retrase o tire la prenda; menor si la cuerda la protege. */
function riesgo(p: Partida, t: CartaTendida, prenda: string): number {
  let r = 0.07;
  if (protegidaDe(p, t, "moja")) r -= 0.025;
  if (protegidaDe(p, t, "tira")) r -= 0.02;
  // Una toalla tirada pierde mucho más que un calcetín: la atacarán antes.
  r += 0.01 * (tipoDe(p, prenda).espacios - 1);
  return Math.max(0.01, r);
}

// ---------- Valor de la mesa para un jugador ----------

interface Proyeccion {
  /** Prenda → probabilidad de que acabe seca antes del final. */
  secas: Map<string, number>;
}

function valorJugador(p: Partida, i: number, R: number, vistoPor: number): number {
  const j = p.jugadores[i];
  const ultima = p.ultimaRonda;
  const futuro = Math.min(1, Math.max(0, (R - 1) / 2));
  let v = j.puntos;
  const proy: Proyeccion = { secas: new Map(j.seca.map((id) => [id, 1])) };

  // Ropa colgada y cuerdas.
  let libres = 0;
  let huecosCarta = 0;
  for (const l of j.lineas) {
    // Ronda en la que se rompe la línea a partir de cada carta (la vieja arrastra a las de su derecha).
    let rompeEn = Infinity;
    for (const t of l.cartas) {
      huecosCarta++;
      const quedan = rondasHastaRomperse(p, t);
      if (quedan !== null) rompeEn = Math.min(rompeEn, Math.max(1, quedan - 0));
      const seRompe = rompeEn !== Infinity && sigueViva(rompeEn, R, ultima) > 0.3;
      const { ahora, luego } = ritmos(p, t);
      const ocupados = t.colgadas.reduce((s, c) => s + tipoDe(p, c.prenda).espacios, 0);
      if (!seRompe) libres += defCarta(p, t.carta).espacios - ocupados;

      for (const c of t.colgadas) {
        const tipo = tipoDe(p, c.prenda);
        const h = p.prendas[c.prenda].humedad;
        let k = secadoEn(h, ahora, luego);
        let factor = 1;
        if (laTiraElViento(p, t, c.prenda)) {
          k = 1 + tipo.humedad + 1;
          factor = 0.8;
        }
        if (seRompe && k > rompeEn - 0) {
          // Se rompe antes de secarse: se pierde.
          v -= 0.4 * tipo.puntos;
          continue;
        }
        const prob = sigueViva(k, R, ultima) * Math.pow(1 - riesgo(p, t, c.prenda), k - 1) * factor;
        v += puntosAlSecar(p, t, c.prenda) * prob;
        // Aunque no se seque a tiempo, cuenta algo para «Cuerdas llenas».
        v += 0.05 * tipo.puntos;
        proy.secas.set(c.prenda, prob);
      }

      const cuerda = efectoCuerda(p, t);
      if (seRompe) v -= 1.5 + 1.5 * futuro;
      else if (cuerda) {
        if (cuerda.efecto.secado) v += 1 * futuro;
        else if (cuerda.efecto.puntosAlSecar) v += 0.4 * futuro;
        else if (cuerda.efecto.protegeDe?.length) v += 0.5 * futuro;
      }
    }
  }

  // Cuerdas en la mano que caben: más sitio para la próxima ronda.
  const { lineas, cartasPorLinea } = p.ajustes.tendedero;
  const huecos = lineas * cartasPorLinea - huecosCarta;
  const cuerdasEnMano = vistoPor === i ? j.mano.filter((x) => defCarta(p, x).mazo === "cuerdas").length : 0;
  const cuerdasUtiles = Math.min(cuerdasEnMano, huecos, Math.max(1, R - 1));
  v += libres * 0.25 * futuro;

  // Ropa por tender: solo la que cabe y se seca a tiempo, empezando por la que más rinde por pinza y ronda.
  const porTender = ropaPorTender(p, i, R, cuerdasEnMano, 0.6);
  v += porTender.valor;
  for (const [id, q] of porTender.prob) proy.secas.set(id, q);

  // Objetivos: lo que darían con la ropa seca más la que lleva camino de secarse.
  const ids = [...p.objetivosComunes, ...(i === vistoPor && j.objetivoSecreto ? [j.objetivoSecreto] : [])];
  if (ids.length) {
    const seguras = [...proy.secas].filter(([, q]) => q >= 0.55).map(([id]) => id);
    const probables = [...proy.secas].filter(([, q]) => q >= 0.3).map(([id]) => id);
    const conSeca = (seca: string[]) => ({ ...p, jugadores: p.jugadores.map((x, k) => (k === i ? { ...x, seca } : x)) });
    const pSeguras = conSeca(seguras);
    const pProbables = conSeca(probables);
    const parcial = ultima ? 0 : 0.45;
    for (const id of ids) {
      const def = p.catalogo.objetivos[id];
      if (!def) continue;
      const ahora = puntuarObjetivo(p, i, def).puntos;
      const a = continuo(puntuarObjetivo(pSeguras, i, def).cantidad, def.cada, def.puntos, parcial);
      const b = continuo(puntuarObjetivo(pProbables, i, def).cantidad, def.cada, def.puntos, parcial);
      v += ahora + 0.7 * Math.max(0, a - ahora) + 0.2 * Math.max(0, b - a);
    }
  }
  // El secreto de un rival no se ve: se cuenta una media.
  if (i !== vistoPor && j.objetivoSecreto) v += 2;

  // Cartas en la mano.
  const reaccion = j.mano.filter((x) => efectoAccion(p, x)?.blanco === "reaccion").length;
  if (vistoPor === i) {
    const acciones = j.mano.filter((x) => defCarta(p, x).mazo === "acciones").length - reaccion;
    v += acciones * (0.15 + 0.35 * futuro) + reaccion * (ultima ? 0.4 : 1.1) + cuerdasUtiles * 0.5 * futuro;
  } else {
    v += j.mano.length * (0.15 + 0.3 * futuro);
  }
  v += j.trofeos.length * 0.3;
  return v;
}

/** Puntos de un objetivo contando una parte de lo que falta para el siguiente escalón. */
function continuo(cantidad: number, cada: number, puntos: number, parcial: number): number {
  const enteros = Math.floor(cantidad / cada);
  return enteros * puntos + ((cantidad - enteros * cada) / cada) * puntos * parcial;
}

/** Cómo de bien le va al jugador `i` frente a los rivales (sobre todo frente al que va mejor). */
export function valoracionDificil(p: Partida, i: number): number {
  if (p.terminada && p.final) {
    const mio = p.final.find((r) => r.jugador === i)!;
    const mejorRival = Math.max(...p.final.filter((r) => r.jugador !== i).map((r) => r.total));
    return (mio.total - mejorRival) * 10 + (mio.puesto === 1 ? 50 : 0);
  }
  const R = rondasRestantes(p);
  const valores = p.jugadores.map((_, k) => k).filter((k) => k !== i).map((k) => valorJugador(p, k, R, i));
  const mejor = Math.max(...valores);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  return valorJugador(p, i, R, i) - (0.75 * mejor + 0.25 * media);
}

// ---------- Fastidios y reacciones ----------

/** Probabilidad de que `defensor` tenga una carta de reacción, con lo que se ve desde el asiento `yo`. */
function probReaccion(p: Partida, defensor: number, yo: number): number {
  const esReaccion = (c: string) => efectoAccion(p, c)?.blanco === "reaccion";
  const total = Object.keys(p.cartas).filter(esReaccion).length;
  const vistas = p.descartes.acciones.filter(esReaccion).length + p.jugadores[yo].mano.filter(esReaccion).length;
  const ocultas = Math.max(0, total - vistas);
  const accionesDe = (k: number) => p.jugadores[k].mano.filter((c) => defCarta(p, c).mazo === "acciones").length;
  const desconocidas = p.mazos.acciones.length + p.jugadores.reduce((s, _, k) => s + (k === yo ? 0 : accionesDe(k)), 0);
  if (desconocidas <= 0 || ocultas === 0) return 0;
  const f = Math.min(1, ocultas / desconocidas);
  return 1 - Math.pow(1 - f, accionesDe(defensor));
}

/** A quién va un fastidio (jugada sobre un rival que este podría anular), o null. */
function atacado(p: Partida, j: Jugada): number | null {
  if (j.tipo === "jugarAccion" && j.objetivo && j.objetivo.jugador !== j.jugador) {
    return efectoAccion(p, j.carta)?.etiquetas.includes("fastidio") ? j.objetivo.jugador : null;
  }
  if (j.tipo === "colocarCuerda" && j.en !== undefined && j.en !== j.jugador) return j.en;
  return null;
}

// ---------- Decisiones ----------

/** Valor esperado de una jugada ya aplicada (q), contando con que un fastidio pueda ser anulado. */
function valorDeJugada(p: Partida, q: Partida, jugada: Jugada, i: number, antes: number): number {
  const defensor = atacado(p, jugada);
  if (defensor === null) return valoracionDificil(q, i);
  const aceptada = q.reaccion ? (aplicada(q, { tipo: "responder", jugador: q.reaccion.defensor, anular: false }) ?? q) : q;
  const v = valoracionDificil(aceptada, i);
  // Si lo anula, se pierde la carta pero el rival gasta su reacción: casi como no haber jugado.
  const prob = probReaccion(p, defensor, i);
  return (1 - prob) * v + prob * (antes - 0.25);
}

/** Tiempo máximo para pensar una jugada: si se acaba, se queda con la mejor que haya visto. */
const PRESUPUESTO_MS = 150;
/** Primero lo que casi siempre importa (cuerdas y prendas) y al final las acciones, que son muchas más pruebas. */
const ORDEN: Partial<Record<Jugada["tipo"], number>> = { colocarCuerda: 0, mejorarCuerda: 0, colgarPrenda: 1, jugarAccion: 2 };

export function mejorJugadaDificil(p: Partida, i: number, azar: AzarIA): { jugada: Jugada; partida: Partida } | null {
  const inicio = performance.now();
  const antes = valoracionDificil(p, i);
  let mejor: { jugada: Jugada; partida: Partida; v: number } | null = null;
  const lista = candidatas(p, i, true).sort((a, b) => (ORDEN[a.tipo] ?? 3) - (ORDEN[b.tipo] ?? 3));
  for (const [n, jugada] of lista.entries()) {
    if (n % 16 === 15 && performance.now() - inicio > PRESUPUESTO_MS) break;
    if (!esValida(p, jugada)) continue;
    const q = aplicada(p, jugada);
    if (!q) continue;
    const v = valorDeJugada(p, q, jugada, i, antes) + azar() * 0.01;
    if (!mejor || v > mejor.v) mejor = { jugada, partida: q, v };
  }
  return mejor && mejor.v > antes + 0.03 ? { jugada: mejor.jugada, partida: mejor.partida } : null;
}

export function mejorDraftDificil(p: Partida, i: number, azar: AzarIA): Jugada {
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
      const v = valoracionDificil(q, i) + azar() * 0.01;
      if (!mejor || v > mejor.v) mejor = { jugada, v };
    }
  }
  if (!mejor) throw new Error("El bot no encuentra qué coger en el reparto.");
  return mejor.jugada;
}

/** Anula solo si lo que pierde pesa más que gastar la carta (su valor ya cuenta en la valoración). */
export function respuestaDificil(p: Partida): Jugada {
  const defensor = p.reaccion!.defensor;
  const anulada = aplicada(p, { tipo: "responder", jugador: defensor, anular: true });
  const aceptada = aplicada(p, { tipo: "responder", jugador: defensor, anular: false });
  const anular = !!anulada && (!aceptada || valoracionDificil(anulada, defensor) > valoracionDificil(aceptada, defensor) + 0.1);
  return { tipo: "responder", jugador: defensor, anular };
}

/** Suelta la carta que menos falta le hace (prueba cada descarte y se queda con el que mejor deja la mesa). */
export function descarteDificil(p: Partida, i: number): Jugada {
  let mejor: { jugada: Jugada; v: number } | null = null;
  for (const carta of new Set(p.jugadores[i].mano)) {
    const jugada: Jugada = { tipo: "descartar", jugador: i, carta };
    const q = aplicada(p, jugada);
    if (!q) continue;
    // Se valora antes de que pase el turno, mirando solo su mano.
    const sinCarta = { ...p, jugadores: p.jugadores.map((x, k) => (k === i ? { ...x, mano: x.mano.filter((c) => c !== carta) } : x)) };
    const v = valoracionDificil(sinCarta, i);
    if (!mejor || v > mejor.v) mejor = { jugada, v };
  }
  return mejor!.jugada;
}

/** Cuerdas a robar: las que le caben; en la última ronda, ninguna (no le dará tiempo a usarlas). */
export function cuerdasARobarDificil(p: Partida, i: number): number {
  if (p.ultimaRonda) return 0;
  return cuerdasARobarBase(p, i);
}

/** El objetivo secreto que mejor encaja con los comunes y con las cuerdas de su mano. */
export function eleccionDificil(p: Partida, i: number, azar: AzarIA): Jugada {
  const j = p.jugadores[i];
  const mano = j.mano.map((c) => defCarta(p, c));
  const comunes = p.objetivosComunes.map((id) => p.catalogo.objetivos[id]);
  const puntua = (id: string): number => {
    const o = p.catalogo.objetivos[id];
    let s = 4;
    const tipoO = typeof o.parametros.tipo === "string" ? o.parametros.tipo : undefined;
    const colorO = typeof o.parametros.color === "string" ? o.parametros.color : undefined;
    switch (o.efecto) {
      case "secadas-en":
        s += 1.2 * mano.filter((d) => d.efecto === o.parametros.efecto).length - 0.5;
        break;
      case "clases-de-cuerda":
        s += 0.5 * new Set(mano.filter((d) => d.mazo === "cuerdas" && d.efecto).map((d) => d.efecto)).size;
        break;
      case "viejas-colocadas":
        s += 1.5 * mano.filter((d) => d.efecto === "fragil").length - 1;
        break;
      case "lineas-completas":
        s += 0.3 * mano.filter((d) => d.mazo === "cuerdas").length;
        break;
      case "prendas-secas":
        s += 0.5;
        break;
    }
    // Encaja con un común: se persiguen los dos a la vez.
    for (const c of comunes) {
      if (!c) continue;
      const tipoC = typeof c.parametros.tipo === "string" ? c.parametros.tipo : undefined;
      if (c.efecto === o.efecto && !colorO && !tipoO) s += 0.8;
      if (tipoO && tipoC === tipoO) s += 1;
      if ((c.efecto === "mismo-color" && colorO) || (o.efecto === "mismo-color" && c.parametros.color)) s += 1;
      if ((c.efecto === "parejas" && tipoO === "calcetin") || (o.efecto === "parejas" && tipoC === "calcetin")) s += 1;
    }
    return s + azar() * 0.3;
  };
  const puntuados = j.objetivosOfrecidos.map((id) => ({ id, s: puntua(id) }));
  const objetivo = puntuados.reduce((a, b) => (b.s > a.s ? b : a)).id;
  return { tipo: "elegirObjetivo", jugador: i, objetivo };
}
