// Animación de cada jugada ANTES de aplicarla en la mesa: se conoce el origen (la mano, la pila por tender, una
// cesta) y el destino (un hueco, una prenda, una cuerda), así que la carta vuela de uno a otro y luego se enseña
// la partida nueva. Después se animan las consecuencias que solo se ven al aplicarla (puntos, cartas robadas).

import { cumple, defCarta, efectoAccion, prendasDe, tipoDe, type Jugada, type Partida } from "@tendedero/motor";
import { nombreVisible, t, t as tr, tLibre } from "../i18n";
import { nombreCarta, nombreObjetivoId } from "../i18n/juego";
import { CARTAS_MOJAN } from "../prototipos/CartasBosque";
import * as fx from "../prototipos/efectos";
import { reproducir } from "../audio";
import type { Perfil } from "../prototipos/MenuPartida";
import { MOJADAS_VISIBLES } from "./piezas";
import { textoPatron } from "./vista";

export interface Escena {
  raiz: HTMLElement;
  yo: number;
  perfiles: Perfil[];
  /** Enseña el tendedero de un jugador (si «ver las jugadas» está activo) y devuelve cómo volver. */
  mirar: (jugador: number) => Promise<() => Promise<void>>;
  /**
   * Enseña el tendedero de un jugador para el recuento del secado (también al terminar tú el turno) y devuelve
   * cómo volver. Con «ver las jugadas» quitado no cambia nada.
   */
  ensenar: (jugador: number) => Promise<() => Promise<void>>;
  /** Pone en la muestra oculta la cara de una carta para poder clonarla (las de los rivales no están en la mesa). */
  muestra: (carta: string | null) => void;
  /** Opción «sin animaciones»: la mesa cambia de golpe. */
  sinAnimar?: boolean;
}

type Rect = DOMRect;

// Con la ventana oculta el navegador no pinta y las animaciones no avanzan: la mesa cambia de golpe.
const rapido = (e: Escena) => !!e.sinAnimar || document.visibilityState === "hidden" || matchMedia("(prefers-reduced-motion: reduce)").matches;

function buscar(e: Escena, ...selectores: string[]): HTMLElement | null {
  for (const s of selectores) {
    const el = e.raiz.querySelector<HTMLElement>(s);
    if (el && el.getClientRects().length) return el;
  }
  return null;
}

function rectDe(e: Escena, ...selectores: string[]): Rect | null {
  return buscar(e, ...selectores)?.getBoundingClientRect() ?? null;
}

const ocultos: HTMLElement[] = [];
function ocultar(el: HTMLElement) {
  el.style.visibility = "hidden";
  ocultos.push(el);
}
/** Vuelve a enseñar lo que se escondió mientras volaba su copia (React reutiliza esos elementos). */
export function restaurar() {
  while (ocultos.length) ocultos.pop()!.style.visibility = "";
}

/** Copia un elemento en la capa de efectos y la coloca centrada en `donde` (p. ej. el panel de un rival). */
function clonarEn(el: HTMLElement, donde: Rect): HTMLElement {
  const c = fx.clonar(el);
  c.style.left = `${donde.left + donde.width / 2 - el.offsetWidth / 2}px`;
  c.style.top = `${donde.top + donde.height / 2 - el.offsetHeight / 2}px`;
  return c;
}

/**
 * La carta que juega alguien, ya en la capa de efectos: la tuya sale de tu mano; la de un rival, de su panel
 * (boca abajo, y se da la vuelta por el camino).
 */
async function cartaJugada(e: Escena, jugador: number, carta: string): Promise<{ clon: HTMLElement; ancho: number; rival: boolean } | null> {
  if (jugador === e.yo) {
    const el = buscar(e, `[data-carta="${carta}"]`);
    if (!el) return null;
    const clon = fx.clonar(el);
    ocultar(el);
    return { clon, ancho: el.offsetWidth, rival: false };
  }
  e.muestra(carta);
  const molde = buscar(e, "[data-muestra] > *");
  const panel = rectDe(e, `[data-mano-panel="${jugador}"]`, `[data-panel="${jugador}"]`);
  if (!molde || !panel) return null;
  // El ancho se mide antes de quitar la muestra: fuera del DOM mediría 0 y la carta volaría a escala infinita
  // (invisible), con la mesa esperando a una animación que no se ve.
  const ancho = molde.offsetWidth;
  const clon = clonarEn(molde, panel);
  clon.classList.add("tapada");
  e.muestra(null);
  return { clon, ancho, rival: true };
}

async function alDescarte(e: Escena, clon: HTMLElement, ancho: number) {
  const d = rectDe(e, '[data-pila="descarte"]');
  if (d) await fx.volar(clon, fx.centro(d), { arco: 40, escala: d.width / ancho, giro: 3, duracion: 450 });
  clon.remove();
}

function nombre(e: Escena, j: number) {
  return j === e.yo ? t("menu.tu") : e.perfiles[j]?.nombre ? nombreVisible(e.perfiles[j].nombre) : t("anuncio.jugadorN", { n: j + 1 });
}

// ---------- Cada jugada ----------

export async function animarJugada(e: Escena, p: Partida, j: Jugada, despues: Partida): Promise<void> {
  if (rapido(e)) return;
  // Lo que hacen los rivales entre ellos va aún más deprisa; lo que te toca a ti, a su ritmo.
  fx.conPrisa(teAfecta(e, j) ? 1 : 0.75);
  try {
    await animarSegunTipo(e, p, j, despues);
  } finally {
    fx.conPrisa(1);
  }
  // El día se acaba con la jugada que cierra la ronda (terminar el turno o el último descarte): secado y recuento,
  // con las cartas de mojar que se van dentro del secado.
  if (acabaElDia(p, despues)) await animarFinDia(e, p, despues);
  else await irseMojadas(e, p, despues);
}

/** Si la jugada es tuya o va contra ti (un fastidio, una cuerda vieja, una respuesta a tu ataque). */
function teAfecta(e: Escena, j: Jugada): boolean {
  if (j.jugador === e.yo) return true;
  if (j.tipo === "jugarAccion") return j.objetivo?.jugador === e.yo;
  if (j.tipo === "colocarCuerda") return j.en === e.yo;
  return j.tipo === "responder";
}

/** Si con esta jugada se acaba el día (o la partida): toca secar y puntuar. */
export function acabaElDia(antes: Partida, despues: Partida): boolean {
  return despues.ronda !== antes.ronda || (despues.terminada && !antes.terminada);
}

/**
 * Las cartas de mojar que se quitan (al secarse, la humedad se lleva primero esas): se meten otra vez por debajo
 * de su prenda, la última primero, antes de enseñar la partida nueva.
 */
async function irseMojadas(e: Escena, p: Partida, despues: Partida) {
  const anims: Promise<unknown>[] = [];
  for (const [id, pr] of Object.entries(p.prendas)) {
    const antes = Math.min(pr.extra ?? 0, pr.humedad);
    const ahora = Math.min(despues.prendas[id]?.extra ?? 0, despues.prendas[id]?.humedad ?? 0);
    if (ahora >= antes) continue;
    const cartas = [...e.raiz.querySelectorAll<HTMLElement>(`[data-mojadas="${id}"] .mj-moja`)].slice(Math.min(ahora, MOJADAS_VISIBLES));
    cartas.reverse().forEach((c, i) => {
      const k = Number(c.dataset.k ?? 0);
      // Cada carta asoma media altura por cada una que tiene encima: sube eso para volver a esconderse.
      const subir = (c.offsetHeight / 2) * (k + 1);
      anims.push(
        fx.animar(c, [{ translate: "0 0", opacity: 1 }, { translate: `0 ${-subir}px`, opacity: 1, offset: 0.85 }, { translate: `0 ${-subir}px`, opacity: 0 }], {
          duration: 520,
          delay: i * 120,
          fill: "forwards",
          easing: "cubic-bezier(.5,0,.6,1)",
        }).finished,
      );
    });
  }
  await Promise.all(anims);
}

async function animarSegunTipo(e: Escena, p: Partida, j: Jugada, despues: Partida): Promise<void> {
  switch (j.tipo) {
    case "draft":
      return animarDraft(e, p, j);
    case "colocarCuerda":
    case "mejorarCuerda":
      return animarCuerda(e, p, j);
    case "colgarPrenda":
      return animarColgar(e, p, j);
    case "jugarAccion":
      return animarAccion(e, p, j, despues);
    case "responder":
      return animarRespuesta(e, p, j);
    case "descartar":
      return animarDescarte(e, p, j);
    case "terminarTurno":
      return;
    case "elegirObjetivo":
      return;
  }
}

async function animarDraft(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "draft" }>) {
  const prendas = prendasDe(p, j.origen) ?? [];
  const cogidas = prendas.filter((id) => cumple(p.prendas[id], j.patron));
  const resto = prendas.filter((id) => !cumple(p.prendas[id], j.patron));
  const deDonde = j.origen === "centro" ? t("anuncio.delCentro") : t("anuncio.deCesta", { n: j.origen.cesta + 1 });
  const lo = textoPatron(j.patron, cogidas.length);
  fx.anunciar(
    j.jugador === e.yo ? t("anuncio.coge.yo", { lo }) : t("anuncio.coge", { jugador: nombre(e, j.jugador), lo }),
    `${deDonde}${j.origen !== "centro" && resto.length ? ` · ${t("anuncio.restoCentro")}` : ""}`,
    "tactica",
  );
  const pilaEl = buscar(e, `[data-pila="porTender-${j.jugador}"]`, `[data-panel-portender="${j.jugador}"]`, `[data-panel="${j.jugador}"]`);
  const pila = pilaEl?.getBoundingClientRect() ?? null;
  const centroEl = buscar(e, "[data-centro]");
  const centro = centroEl?.getBoundingClientRect() ?? null;
  // Llegan con el tamaño que tendrán allí: en su pila por tender (dentro del tendedero escalado) o en el centro;
  // si su tendedero no se ve, se encogen hacia su panel.
  const escalaPila = pilaEl?.matches("[data-pila]") ? fx.escalaDe(pilaEl) : 0.45;
  const escalaCentro = centroEl ? fx.escalaDe(centroEl) : 0.85;
  const sel = (id: string) => (j.origen === "centro" ? `[data-encentro="${id}"]` : `[data-encesta="${id}"]`);
  const vuelos = [...cogidas.map((id) => ({ id, destino: pila, escala: escalaPila })), ...(j.origen === "centro" ? [] : resto.map((id) => ({ id, destino: centro, escala: escalaCentro })))];
  await Promise.all(
    vuelos.map(async ({ id, destino, escala }, i) => {
      const el = buscar(e, sel(id));
      if (!el || !destino) return;
      await fx.esperar(i * 110);
      reproducir("deslizar");
      const clon = fx.clonar(el);
      ocultar(el);
      await fx.volar(clon, fx.centro(destino), { arco: 110, escala, giro: i % 2 ? 7 : -7, duracion: 650 });
      clon.remove();
    }),
  );
  if (pila) fx.salpicar(fx.centro(pila), e.perfiles[j.jugador]?.color ?? "#f2c25a", 10);
}

async function animarCuerda(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "colocarCuerda" | "mejorarCuerda" }>) {
  const en = j.tipo === "colocarCuerda" ? (j.en ?? j.jugador) : j.jugador;
  const volver = await e.mirar(en);
  const destino =
    j.tipo === "colocarCuerda" ? rectDe(e, `[data-hueco="${en}:${j.linea}"]`) : rectDe(e, `[data-tendida="${en}:${j.linea}:${j.posicion}"]`);
  // Si la juegas tú, en segunda persona («mejoras…»); si te la ponen a ti, «te la pone a ti».
  const tuya = j.jugador === e.yo;
  const detalle =
    j.tipo === "mejorarCuerda"
      ? t(tuya ? "anuncio.mejora.yo" : "anuncio.mejora")
      : en !== j.jugador
        ? en === e.yo
          ? t("anuncio.teLaPone")
          : t(tuya ? "anuncio.seLaPone.yo" : "anuncio.seLaPone", { nombre: nombre(e, en) })
        : t(tuya ? "anuncio.tiende.yo" : "anuncio.tiende", { n: j.linea + 1 });
  fx.anunciar(nombreCarta(p, j.carta), `${nombre(e, j.jugador)} · ${detalle}`, en !== j.jugador ? "fastidio" : "cuerda");
  if (en !== j.jugador) reproducir("fastidio");
  const c = await cartaJugada(e, j.jugador, j.carta);
  if (c && destino) {
    await fx.volar(c.clon, fx.centro(destino), { arco: 160, escala: destino.width / c.ancho, giro: 0, duracion: 800, voltear: c.rival });
    reproducir("colocar");
    await fx.golpe(c.clon);
    fx.salpicar({ x: destino.left + 8, y: destino.bottom - 4 }, "#d9c3a0", 7);
    fx.salpicar({ x: destino.right - 8, y: destino.bottom - 4 }, "#d9c3a0", 7);
  } else if (c) {
    // No se ve el tendedero donde va (le pones una cuerda vieja a un rival mientras miras el tuyo): va a su panel.
    const panel = rectDe(e, `[data-panel="${en}"]`);
    if (panel) {
      await fx.volar(c.clon, fx.centro(panel), { arco: 120, escala: 0.5, giro: 0, duracion: 650, voltear: c.rival });
      await fx.golpe(c.clon);
    }
  }
  c?.clon.remove();
  return volverDespues(volver);
}

// La vuelta al tendedero que se miraba se hace al terminar, ya con la partida nueva a la vista.
let pendienteVolver: (() => Promise<void>) | null = null;
function volverDespues(volver: () => Promise<void>) {
  pendienteVolver = volver;
}
/** Al cambiar de turno, una vuelta pendiente de una jugada anterior ya no vale. */
export function olvidarVuelta() {
  pendienteVolver = null;
}
export async function volverVista() {
  const v = pendienteVolver;
  pendienteVolver = null;
  if (v) {
    await fx.esperar(650);
    await v();
  }
}

async function animarColgar(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "colgarPrenda" }>) {
  const volver = await e.mirar(j.jugador);
  const origen = buscar(e, `[data-pendiente="${j.prenda}"]`);
  const esp = tipoDe(p, j.prenda).espacios;
  const ranuras = Array.from({ length: esp }, (_, k) => rectDe(e, `[data-ranura="${j.jugador}:${j.linea}:${j.posicion}:${j.inicio + k}"]`)).filter(Boolean) as Rect[];
  const carta = rectDe(e, `[data-tendida="${j.jugador}:${j.linea}:${j.posicion}"]`);
  if (j.jugador !== e.yo) fx.anunciar(t("anuncio.cuelga", { jugador: nombre(e, j.jugador) }), tLibre(`prenda.${p.prendas[j.prenda].tipo}`), "cuerda");
  if (origen && ranuras.length && carta) {
    const izq = Math.min(...ranuras.map((r) => r.left));
    const der = Math.max(...ranuras.map((r) => r.right));
    const clon = fx.clonar(origen);
    ocultar(origen);
    // Llega justo donde se quedará colgada y con su tamaño: bajo la carta de cuerda, más baja cuanto más mojada.
    const tendida = buscar(e, `[data-tendida="${j.jugador}:${j.linea}:${j.posicion}"]`)!;
    const s = fx.escalaDe(tendida);
    const est = getComputedStyle(tendida);
    const celda = parseFloat(est.getPropertyValue("--celda"));
    const filas = parseFloat(est.getPropertyValue("--filas")) || 3;
    const h = p.prendas[j.prenda].humedad - Math.min(p.prendas[j.prenda].extra ?? 0, p.prendas[j.prenda].humedad);
    const arriba = tendida.offsetHeight - (filas - h) * celda * 0.24;
    const y = Number.isFinite(celda) ? carta.top + s * (arriba + origen.offsetHeight / 2) : carta.bottom + origen.offsetHeight * 0.25;
    await fx.volar(clon, { x: (izq + der) / 2, y }, { arco: 110, escala: s, giro: 0, duracion: 650 });
    reproducir("pinza");
    fx.salpicar({ x: (izq + der) / 2, y: carta.bottom - 6 }, "#c99a62", 8);
    clon.remove();
  } else if (carta) {
    // Un rival cuelga una prenda que no se ve (está en su panel): se ve llegar desde allí.
    const panel = rectDe(e, `[data-panel-portender="${j.jugador}"]`, `[data-panel="${j.jugador}"]`);
    if (panel) fx.salpicar(fx.centro(panel), "#c99a62", 6);
    fx.salpicar({ x: carta.left + carta.width / 2, y: carta.bottom - 6 }, "#c99a62", 10);
    reproducir("pinza");
    await fx.esperar(350);
  }
  volverDespues(volver);
}

/** El efecto de una acción sobre su objetivo (nube, viento, sol…), antes de cambiar la mesa. */
async function efectoSobre(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "jugarAccion" }>) {
  const o = j.objetivo;
  const id = p.cartas[j.carta];
  if (!o) return;
  const objetivo = o.prenda ? buscar(e, `[data-prenda="${o.prenda}"]`) : buscar(e, `[data-tendida="${o.jugador}:${o.linea}:${o.posicion}"]`);
  if (!objetivo) return;
  const zona = objetivo.getBoundingClientRect();
  switch (id) {
    case "rafaga-de-viento":
    case "mover-prenda-rival":
    case "mover-prenda-propia":
    case "cambiar-prendas": {
      const tapete = rectDe(e, `[data-zona="${o.jugador}"]`);
      const viento = tapete ? fx.viento(tapete, o.jugador !== j.jugador) : Promise.resolve();
      await fx.esperar(250);
      await fx.temblar(objetivo, 12);
      await viento;
      return;
    }
    case "mojar-cuerda-rival":
    case "retrasar-secado": {
      const quitar = fx.nube(zona);
      await fx.esperar(650);
      const prendas = o.prenda ? [objetivo] : [...objetivo.parentElement!.querySelectorAll<HTMLElement>("[data-prenda]")];
      await Promise.all(prendas.map((pr, i) => fx.esperar(i * 120).then(() => (reproducir("gota"), fx.gotaNueva(pr)))));
      prendas.forEach((pr) => {
        const r = pr.getBoundingClientRect();
        fx.cartelito({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, "+1", "agua");
      });
      await fx.esperar(350);
      await quitar();
      return;
    }
    case "secar-prenda":
    case "reducir-humedad": {
      const quitar = fx.sol(zona);
      await fx.esperar(450);
      reproducir("secar");
      await fx.evaporar(objetivo, id === "reducir-humedad" ? 1 : Infinity);
      await quitar();
      return;
    }
    default:
      await fx.temblar(objetivo, 6);
      fx.salpicar(fx.centro(zona), "#f2c25a", 12);
      await fx.esperar(300);
  }
}

/** Si la carta moja prendas (su humedad se queda aparte, como cartas por debajo de la prenda). */
function mojaPrendas(p: Partida, carta: string): boolean {
  return CARTAS_MOJAN.has(defCarta(p, carta)?.efecto ?? "");
}

/**
 * La carta que moja baja hasta el pie de su prenda (o de la primera de la cuerda), se encoge a su ancho y se
 * desvanece como si se metiera por debajo; al enseñar la partida nueva asoma su recuadro con la gota.
 */
async function meterBajo(e: Escena, clon: HTMLElement, ancho: number, j: Extract<Jugada, { tipo: "jugarAccion" }>) {
  const o = j.objetivo!;
  const prenda = o.prenda
    ? buscar(e, `[data-prenda="${o.prenda}"]`)
    : buscar(e, `[data-tendida="${o.jugador}:${o.linea}:${o.posicion}"] [data-prenda]`);
  if (!prenda) return alDescarte(e, clon, ancho);
  const r = prenda.getBoundingClientRect();
  const escala = (r.width * 0.9) / ancho;
  const alto = clon.offsetHeight * escala;
  await fx.volar(clon, { x: r.left + r.width / 2, y: r.bottom - alto / 2 }, { arco: 30, escala, giro: 0, duracion: 450 });
  await fx.animar(clon, [{ opacity: 1, clipPath: "inset(0 0 0 0)" }, { opacity: 0.2, clipPath: "inset(0 0 100% 0)" }], { duration: 260, easing: "ease-in", fill: "forwards" }).finished;
  clon.remove();
}

async function animarAccion(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "jugarAccion" }>, despues: Partida) {
  const fastidio = efectoAccion(p, j.carta)?.etiquetas.includes("fastidio") ?? false;
  const o = j.objetivo;
  const volver = o ? await e.mirar(o.jugador) : async () => {};
  const detalle = !o || o.jugador === j.jugador ? `${nombre(e, j.jugador)} · ${t(j.jugador === e.yo ? "anuncio.enTuTendedero" : "anuncio.enSuTendedero")}` : `${nombre(e, j.jugador)}  ➜  ${nombre(e, o.jugador)}`;
  fx.anunciar(nombreCarta(p, j.carta), o ? detalle : nombre(e, j.jugador), fastidio ? "fastidio" : "tactica");
  if (fastidio) reproducir("fastidio");
  const c = await cartaJugada(e, j.jugador, j.carta);
  const destino = o
    ? (o.prenda ? rectDe(e, `[data-prenda="${o.prenda}"]`) : null) ?? rectDe(e, `[data-tendida="${o.jugador}:${o.linea}:${o.posicion}"]`)
    : rectDe(e, ".mf-lienzo");
  // Si no se ve su tendedero (lo estás mirando tú en otra pestaña), la carta va hacia el panel del atacado.
  const panel = !destino && o ? rectDe(e, `[data-panel="${o.jugador}"]`) : null;
  if (c && panel) {
    await fx.volar(c.clon, fx.centro(panel), { arco: 120, escala: 0.5, giro: 0, duracion: 650, voltear: c.rival });
    await fx.golpe(c.clon);
    await alDescarte(e, c.clon, c.ancho);
  } else if (c && destino) {
    const quitarEstela = o ? fx.estela(fx.centro(c.clon.getBoundingClientRect()), fx.centro(destino), e.perfiles[j.jugador]?.color ?? "#f2c25a") : () => {};
    const ancho = (buscar(e, ".mano .mb-accion")?.offsetWidth ?? c.ancho) * 0.62;
    await fx.volar(c.clon, { x: fx.centro(destino).x, y: Math.max(90, destino.top - 60) }, { arco: 150, escala: ancho / c.ancho, giro: j.jugador === e.yo ? -6 : 6, duracion: 750, voltear: c.rival });
    reproducir("colocar");
    await fx.golpe(c.clon);
    // Si el atacado puede responder, el efecto espera a su decisión.
    if (!despues.reaccion) await efectoSobre(e, p, j);
    else await fx.esperar(500);
    quitarEstela();
    // Las cartas que mojan se quedan debajo de la prenda (asoma su gota); las demás van al descarte.
    if (!despues.reaccion && mojaPrendas(p, j.carta)) await meterBajo(e, c.clon, c.ancho, j);
    else await alDescarte(e, c.clon, c.ancho);
  } else c?.clon.remove();
  volverDespues(volver);
}

async function animarRespuesta(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "responder" }>) {
  const ataque = p.reaccion?.jugada;
  if (!ataque) return;
  if (j.anular) {
    const carta = p.jugadores[j.jugador].mano.find((c) => p.cartas[c] === "ni-hablar") ?? null;
    fx.anunciar(
      t("anuncio.niHablar"),
      j.jugador === e.yo ? t("anuncio.anula.yo", { carta: nombreCarta(p, ataque.carta) }) : t("anuncio.anula", { jugador: nombre(e, j.jugador), carta: nombreCarta(p, ataque.carta) }),
      "fastidio",
    );
    reproducir("niHablar");
    const c = carta ? await cartaJugada(e, j.jugador, carta) : null;
    const zona = rectDe(e, `[data-zona="${j.jugador}"]`, `[data-panel="${j.jugador}"]`);
    if (c && zona) {
      await fx.volar(c.clon, fx.centro(zona), { arco: 120, escala: 0.8, duracion: 650, voltear: c.rival });
      await fx.golpe(c.clon);
      fx.salpicar(fx.centro(zona), "#ff5a4f", 16);
      await alDescarte(e, c.clon, c.ancho);
    } else await fx.esperar(900);
    return;
  }
  if (ataque.tipo !== "jugarAccion") return;
  const volver = ataque.objetivo ? await e.mirar(ataque.objetivo.jugador) : async () => {};
  await efectoSobre(e, p, ataque);
  volverDespues(volver);
}

async function animarDescarte(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "descartar" }>) {
  const c = await cartaJugada(e, j.jugador, j.carta);
  if (!c) return;
  if (c.rival) fx.anunciar(t("anuncio.descarta", { jugador: nombre(e, j.jugador) }), nombreCarta(p, j.carta), "tactica");
  reproducir("deslizar");
  await alDescarte(e, c.clon, c.ancho);
}

/**
 * Puntos que ha dado cada prenda que se ha secado con esta jugada, por jugador y en orden (salen de las entradas
 * «seca» del registro). Si el registro no cuadra, se reparten los puntos ganados entre las prendas.
 */
function puntosDelSecado(antes: Partida, despues: Partida): { jugador: number; prenda: string; puntos: number }[] {
  const nuevas = (despues.entradas ?? []).slice(antes.entradas?.length ?? 0).filter((en) => en.clave === "seca");
  const lista: { jugador: number; prenda: string; puntos: number }[] = [];
  despues.jugadores.forEach((jug, k) => {
    const prendas = jug.seca.filter((id) => !antes.jugadores[k].seca.includes(id));
    if (!prendas.length) return;
    const suyas = nuevas.filter((en) => en.datos.jugador === k).map((en) => Number(en.datos.puntos) || 0);
    const ganados = jug.puntos - antes.jugadores[k].puntos;
    const cuadra = suyas.length === prendas.length;
    prendas.forEach((id, i) => {
      const puntos = cuadra ? suyas[i] : i === prendas.length - 1 ? ganados - Math.floor(ganados / prendas.length) * i : Math.floor(ganados / prendas.length);
      lista.push({ jugador: k, prenda: id, puntos });
    });
  });
  return lista;
}

/** Puntos que ya han subido contando en el marcador durante la jugada (para no volver a enseñarlos después). */
const yaContados = new Map<number, number>();

/** Una prenda que se seca: brilla, salta su «+N» hasta el marcador (que sube contando) y ella vuela a las secas. */
async function secarUna(e: Escena, jugador: number, prenda: string, puntos: number, rapida: boolean): Promise<{ fin: Promise<unknown> }> {
  const el = buscar(e, `[data-prenda="${prenda}"]`);
  const marcador = buscar(e, `[data-puntos="${jugador}"]`);
  const secas = rectDe(e, `[data-pila="secas-${jugador}"]`, `[data-panel="${jugador}"]`);
  const color = e.perfiles[jugador]?.color ?? "#ffc93c";
  let desde = secas ? fx.centro(secas) : null;
  if (el) {
    reproducir("secar");
    await fx.brillo(el, rapida ? 260 : 420);
    desde = fx.centro(el.getBoundingClientRect());
    fx.salpicar(desde, "#ffc93c", 10);
  }
  const vuelos: Promise<unknown>[] = [];
  if (marcador && desde) {
    vuelos.push(
      fx.puntosVolando(desde, marcador.getBoundingClientRect(), `+${puntos}`, color).then(() => {
        yaContados.set(jugador, (yaContados.get(jugador) ?? 0) + puntos);
        reproducir("punto");
        return fx.contar(marcador, puntos);
      }),
    );
  }
  if (el && secas) {
    const clon = fx.clonar(el);
    ocultar(el);
    vuelos.push(fx.volar(clon, fx.centro(secas), { arco: 110, escala: 0.35, giro: -10, duracion: rapida ? 450 : 600 }).then(() => clon.remove()));
  }
  // La siguiente prenda empieza mientras esta acaba de llegar.
  const fin = Promise.all(vuelos);
  await Promise.race([fin, fx.esperar(rapida ? 420 : 650)]);
  return { fin };
}

async function animarFinDia(e: Escena, p: Partida, despues: Partida) {
  // Se acaba el día: la ropa pierde humedad y, prenda a prenda, la que se seca da sus puntos y vuela a las secas.
  fx.anunciar(despues.terminada ? t("anuncio.finPartida") : t("anuncio.seAcabaDia"), t("anuncio.seSeca"), despues.terminada ? "fastidio" : "tactica");
  await fx.esperar(500);
  await irseMojadas(e, p, despues);
  const visibles = [...e.raiz.querySelectorAll<HTMLElement>("[data-prenda]")];
  await Promise.all(visibles.map((el, i) => fx.esperar(i * 40).then(() => fx.evaporar(el, 1))));
  const secado = puntosDelSecado(p, despues);
  const rapida = secado.length > 5;
  const pendientes: Promise<unknown>[] = [];
  let volver: (() => Promise<void>) | null = null;
  // Primero el tendedero que se está viendo; después los demás, en orden.
  const jugadores = [...new Set(secado.map((s) => s.jugador))].sort((a, b) => Number(!buscar(e, `[data-tapete="${b}"]`)) - Number(!buscar(e, `[data-tapete="${a}"]`)) || a - b);
  for (const k of jugadores) {
    if (!buscar(e, `[data-tapete="${k}"]`)) {
      await Promise.all(pendientes);
      const v = await e.ensenar(k);
      volver ??= v;
      const suyas = [...e.raiz.querySelectorAll<HTMLElement>("[data-prenda]")];
      await Promise.all(suyas.map((el, i) => fx.esperar(i * 30).then(() => fx.evaporar(el, 1))));
    }
    for (const s of secado.filter((s) => s.jugador === k)) pendientes.push((await secarUna(e, k, s.prenda, s.puntos, rapida)).fin);
  }
  await Promise.all(pendientes);
  // Si sigue la partida, la vista del turno nuevo la pone la mesa; al acabar, se vuelve a la de antes.
  if (volver && despues.terminada) await volver();
  // Lo que sobra en el centro vuelve al mazo de prendas.
  const mazo = rectDe(e, "[data-bolsa]");
  if (mazo && despues.ronda !== p.ronda) {
    await Promise.all(
      p.centro.map(async (id, i) => {
        const el = buscar(e, `[data-encentro="${id}"]`);
        if (!el) return;
        await fx.esperar(i * 80);
        const clon = fx.clonar(el);
        ocultar(el);
        await fx.volar(clon, fx.centro(mazo), { arco: 80, escala: 0.5, giro: 15, duracion: 500 });
        clon.remove();
      }),
    );
  }
  // Cuerdas que se rompen: tiemblan y se caen.
  for (const [k, jug] of p.jugadores.entries()) {
    jug.lineas.forEach((l, li) =>
      l.cartas.forEach((t, pos) => {
        const sigue = despues.jugadores[k].lineas.some((ll) => ll.cartas.some((tt) => tt.carta === t.carta));
        if (sigue) return;
        const el = buscar(e, `[data-tendida="${k}:${li}:${pos}"]`);
        if (!el) return;
        fx.anunciar(tr("anuncio.seRompe"), k === e.yo ? tr("anuncio.cuerdaDe.yo", { carta: nombreCarta(p, t.carta) }) : tr("anuncio.cuerdaDe", { carta: nombreCarta(p, t.carta), jugador: nombre(e, k) }), "fastidio");
        void fx.temblar(el, 10).then(() => fx.animar(el, [{ translate: "0 0", opacity: 1 }, { translate: "0 60px", opacity: 0 }], { duration: 500, fill: "forwards" }));
      }),
    );
  }
  await fx.esperar(700);
}

/** Lo que se ve al aplicar la jugada: puntos ganados, cartas nuevas en tu mano, cestas rellenas, carta del día. */
export async function despuesDe(e: Escena, antes: Partida, despues: Partida): Promise<void> {
  if (rapido(e)) {
    yaContados.clear();
    return;
  }
  despues.jugadores.forEach((j, k) => {
    // Lo que ya subió contando prenda a prenda (el secado) no se vuelve a enseñar.
    const ganados = j.puntos - (antes.jugadores[k]?.puntos ?? j.puntos) - (yaContados.get(k) ?? 0);
    if (!ganados) return;
    const m = rectDe(e, `[data-puntos="${k}"]`);
    if (!m) return;
    fx.cartelito({ x: m.left + m.width / 2, y: m.top }, `${ganados > 0 ? "+" : ""}${ganados}`, "puntos");
    fx.salpicar(fx.centro(m), "#ffc93c", 12);
  });
  yaContados.clear();
  const nuevas = despues.jugadores[e.yo]?.mano.filter((c) => !antes.jugadores[e.yo].mano.includes(c)) ?? [];
  await Promise.all(
    nuevas.map(async (c, i) => {
      const el = buscar(e, `[data-carta="${c}"]`);
      const mazo = defCarta(despues, c)?.mazo === "cuerdas" ? rectDe(e, '[data-pila="mazo-cuerdas"]') : rectDe(e, '[data-pila="mazo"]');
      if (!el || !mazo) return;
      await fx.esperar(i * 140);
      reproducir("robar");
      await fx.traerDesde(el, mazo, true);
    }),
  );
  if (despues.terminada && despues.final && !antes.terminada) {
    await recuentoFinal(e, despues);
    return;
  }
  if (despues.dia && despues.dia !== antes.dia) await nuevoDia(e, despues);
  if (despues.ultimaRonda && !antes.ultimaRonda && !despues.terminada) await avisoUltimaRonda(e, despues);
  if (despues.ronda !== antes.ronda && !despues.terminada) {
    fx.anunciar(t("reparto.ronda", { n: despues.ronda }), t("anuncio.repartoRonda"), "tactica");
    const bolsa = rectDe(e, "[data-bolsa]");
    const llenas = despues.cestas.flat().filter((id) => !antes.cestas.flat().includes(id));
    if (bolsa) await Promise.all(llenas.map((id, i) => fx.esperar(i * 60).then(() => {
      const el = buscar(e, `[data-encesta="${id}"]`);
      return el ? fx.traerDesde(el, bolsa) : undefined;
    })));
  }
  // En la última ronda, cuando te llega el turno, se avisa de que es el último.
  const llegaTuTurno = despues.turno.jugador === e.yo && despues.turno.fase === "jugar" && !(antes.turno.jugador === e.yo && antes.turno.fase === "jugar");
  if (despues.ultimaRonda && !despues.terminada && llegaTuTurno) fx.anunciar(t("anuncio.tuUltimoTurno"), t("anuncio.tuUltimoTurnoDetalle"), "fastidio");
}

/**
 * Carta del día nueva: sale en grande en el centro de la pantalla (con el ambiente de la mesa cambiando detrás) y
 * después vuela a su sitio, junto a los objetivos.
 */
async function nuevoDia(e: Escena, p: Partida) {
  const el = buscar(e, ".mf-comun .mj-dia:not(.vacia)");
  if (!el) return;
  const r = el.getBoundingClientRect();
  const ancho = Math.min(innerWidth * 0.62, innerHeight * 0.8, 620);
  const quitarVelo = fx.velo();
  const clon = fx.clonar(el);
  clon.classList.add("dia-en-grande");
  el.style.visibility = "hidden";
  try {
    const titulo = fx.leyenda(t("anuncio.cartaDelDia"), nombreCarta(p, p.dia!));
    await fx.volar(clon, { x: innerWidth / 2, y: innerHeight * 0.46 }, { arco: 80, escala: ancho / el.offsetWidth, giro: 0, duracion: 750 });
    await fx.golpe(clon);
    await fx.esperar(2200);
    titulo();
    void quitarVelo();
    await fx.volar(clon, fx.centro(r), { arco: 60, escala: fx.escalaDe(el), giro: 0, duracion: 650 });
  } finally {
    clon.remove();
    el.style.visibility = "";
    void quitarVelo();
  }
  fx.salpicar(fx.centro(r), "#ffd34d", 12);
}

/** Alguien llega al umbral: cartel grande de «¡Última ronda!» (la marca de arriba se queda durante la ronda). */
async function avisoUltimaRonda(e: Escena, p: Partida) {
  const quien = p.primeroEnLlegar;
  const detalle =
    quien === null
      ? t("anuncio.ultimaRondaSinRopa")
      : quien === e.yo
        ? t("anuncio.ultimaRondaLlegas", { n: p.ajustes.umbralFinal })
        : t("anuncio.ultimaRondaLlega", { jugador: nombre(e, quien), n: p.ajustes.umbralFinal });
  reproducir("ultimaRonda");
  await fx.cartelGrande(t("anuncio.ultimaRonda"), detalle, "ultima");
}

/**
 * Fin de la partida: antes de la clasificación, cada jugador cuenta sus objetivos uno a uno; cada «+N» salta
 * a su marcador, que sube contando hasta el total.
 */
async function recuentoFinal(e: Escena, p: Partida) {
  await fx.cartelGrande(t("anuncio.finPartida"), t("anuncio.recuentoObjetivos"), "fin");
  const final = [...p.final!].sort((a, b) => a.jugador - b.jugador);
  for (const r of final) {
    const color = e.perfiles[r.jugador]?.color ?? "#f2c25a";
    const marcador = buscar(e, `[data-puntos="${r.jugador}"]`);
    const panel = buscar(e, `[data-panel="${r.jugador}"]`);
    panel?.classList.add("recontando");
    const tabla = fx.tablaRecuento(nombre(e, r.jugador), color, t("anuncio.ropaSeca", { n: r.puntosPartida }));
    await fx.esperar(450);
    for (const o of r.objetivos) {
      const carta = buscar(e, `.mj-objetivos [data-lupa="objetivo:${o.objetivo}"]`, `.mj-objetivos [data-lupa="objetivo:${o.objetivo}:secreto"]`);
      if (carta) void fx.brillo(carta, 500);
      const fila = tabla.fila(nombreObjetivoId(p, o.objetivo), t("anuncio.objetivoCantidad", { n: o.cantidad }), o.puntos);
      await fx.esperar(o.puntos ? 380 : 250);
      if (o.puntos && marcador) {
        await fx.puntosVolando(fx.centro(fila.getBoundingClientRect()), marcador.getBoundingClientRect(), `+${o.puntos}`, color);
        reproducir("punto");
        await fx.contar(marcador, o.puntos);
      } else await fx.esperar(300);
    }
    tabla.total(t("anuncio.totalPuntos", { n: r.total }));
    await fx.esperar(900);
    await tabla.quitar();
    panel?.classList.remove("recontando");
  }
  await fx.esperar(300);
}
