// Animación de cada jugada ANTES de aplicarla en la mesa: se conoce el origen (la mano, la pila por tender, una
// cesta) y el destino (un hueco, una prenda, una cuerda), así que la carta vuela de uno a otro y luego se enseña
// la partida nueva. Después se animan las consecuencias que solo se ven al aplicarla (puntos, cartas robadas).

import { cumple, defCarta, efectoAccion, prendasDe, tipoDe, type Jugada, type Partida } from "@tendedero/motor";
import * as fx from "../prototipos/efectos";
import type { Perfil } from "../prototipos/MenuPartida";
import { textoPatron } from "./vista";

export interface Escena {
  raiz: HTMLElement;
  yo: number;
  perfiles: Perfil[];
  /** Enseña el tendedero de un jugador (si «ver las jugadas» está activo) y devuelve cómo volver. */
  mirar: (jugador: number) => Promise<() => Promise<void>>;
  /** Pone en la muestra oculta la cara de una carta para poder clonarla (las de los rivales no están en la mesa). */
  muestra: (carta: string | null) => void;
  /** Opción «sin animaciones»: la mesa cambia de golpe. */
  sinAnimar?: boolean;
}

type Rect = DOMRect;

const rapido = (e: Escena) => !!e.sinAnimar || matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const clon = clonarEn(molde, panel);
  clon.classList.add("tapada");
  e.muestra(null);
  return { clon, ancho: molde.offsetWidth, rival: true };
}

async function alDescarte(e: Escena, clon: HTMLElement, ancho: number) {
  const d = rectDe(e, '[data-pila="descarte"]');
  if (d) await fx.volar(clon, fx.centro(d), { arco: 40, escala: d.width / ancho, giro: 3, duracion: 450 });
  clon.remove();
}

function nombre(e: Escena, j: number) {
  return j === e.yo ? "Tú" : (e.perfiles[j]?.nombre ?? `Jugador ${j + 1}`);
}

// ---------- Cada jugada ----------

export async function animarJugada(e: Escena, p: Partida, j: Jugada, despues: Partida): Promise<void> {
  if (rapido(e)) return;
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
      return animarFinTurno(e, p, j, despues);
    case "elegirObjetivo":
      return;
  }
}

async function animarDraft(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "draft" }>) {
  const prendas = prendasDe(p, j.origen) ?? [];
  const cogidas = prendas.filter((id) => cumple(p.prendas[id], j.patron));
  const resto = prendas.filter((id) => !cumple(p.prendas[id], j.patron));
  const deDonde = j.origen === "centro" ? "del centro" : `de la cesta ${j.origen.cesta + 1}`;
  fx.anunciar(`${nombre(e, j.jugador)} ${j.jugador === e.yo ? "coges" : "coge"} ${textoPatron(j.patron, cogidas.length)}`, `${deDonde}${j.origen !== "centro" && resto.length ? " · el resto va al centro" : ""}`, "tactica");
  const pila = rectDe(e, `[data-pila="porTender-${j.jugador}"]`, `[data-panel-portender="${j.jugador}"]`, `[data-panel="${j.jugador}"]`);
  const centro = rectDe(e, "[data-centro]");
  const sel = (id: string) => (j.origen === "centro" ? `[data-encentro="${id}"]` : `[data-encesta="${id}"]`);
  const vuelos = [...cogidas.map((id) => ({ id, destino: pila })), ...(j.origen === "centro" ? [] : resto.map((id) => ({ id, destino: centro })))];
  await Promise.all(
    vuelos.map(async ({ id, destino }, i) => {
      const el = buscar(e, sel(id));
      if (!el || !destino) return;
      await fx.esperar(i * 110);
      const clon = fx.clonar(el);
      ocultar(el);
      await fx.volar(clon, fx.centro(destino), { arco: 110, escala: 0.85, giro: i % 2 ? 7 : -7, duracion: 650 });
      clon.remove();
    }),
  );
  if (pila) fx.salpicar(fx.centro(pila), e.perfiles[j.jugador]?.color ?? "#f2c25a", 10);
}

async function animarCuerda(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "colocarCuerda" | "mejorarCuerda" }>) {
  const def = defCarta(p, j.carta);
  const en = j.tipo === "colocarCuerda" ? (j.en ?? j.jugador) : j.jugador;
  const volver = await e.mirar(en);
  const destino =
    j.tipo === "colocarCuerda" ? rectDe(e, `[data-hueco="${en}:${j.linea}"]`) : rectDe(e, `[data-tendida="${en}:${j.linea}:${j.posicion}"]`);
  const detalle =
    j.tipo === "mejorarCuerda" ? "mejora una cuerda" : en !== j.jugador ? `se la pone a ${nombre(e, en)}` : `tiende una cuerda en la línea ${j.linea + 1}`;
  fx.anunciar(def.nombre, `${nombre(e, j.jugador)} · ${detalle}`, en !== j.jugador ? "fastidio" : "cuerda");
  const c = await cartaJugada(e, j.jugador, j.carta);
  if (c && destino) {
    await fx.volar(c.clon, fx.centro(destino), { arco: 160, escala: destino.width / c.ancho, giro: 0, duracion: 800, voltear: c.rival });
    await fx.golpe(c.clon);
    fx.salpicar({ x: destino.left + 8, y: destino.bottom - 4 }, "#d9c3a0", 7);
    fx.salpicar({ x: destino.right - 8, y: destino.bottom - 4 }, "#d9c3a0", 7);
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
  if (j.jugador !== e.yo) fx.anunciar(`${nombre(e, j.jugador)} cuelga`, p.catalogo.tipos[p.prendas[j.prenda].tipo].nombre.toLowerCase(), "cuerda");
  if (origen && ranuras.length && carta) {
    const izq = Math.min(...ranuras.map((r) => r.left));
    const der = Math.max(...ranuras.map((r) => r.right));
    const clon = fx.clonar(origen);
    ocultar(origen);
    await fx.volar(clon, { x: (izq + der) / 2, y: carta.bottom + origen.offsetHeight * 0.25 }, { arco: 110, escala: 1, giro: 0, duracion: 650 });
    fx.salpicar({ x: (izq + der) / 2, y: carta.bottom - 6 }, "#c99a62", 8);
    clon.remove();
  } else if (carta) {
    // Un rival cuelga una prenda que no se ve (está en su panel): se ve llegar desde allí.
    const panel = rectDe(e, `[data-panel-portender="${j.jugador}"]`, `[data-panel="${j.jugador}"]`);
    if (panel) fx.salpicar(fx.centro(panel), "#c99a62", 6);
    fx.salpicar({ x: carta.left + carta.width / 2, y: carta.bottom - 6 }, "#c99a62", 10);
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
      await Promise.all(prendas.map((pr, i) => fx.esperar(i * 120).then(() => fx.gotaNueva(pr))));
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

async function animarAccion(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "jugarAccion" }>, despues: Partida) {
  const def = defCarta(p, j.carta);
  const fastidio = efectoAccion(p, j.carta)?.etiquetas.includes("fastidio") ?? false;
  const o = j.objetivo;
  const volver = o ? await e.mirar(o.jugador) : async () => {};
  const detalle = !o || o.jugador === j.jugador ? `${nombre(e, j.jugador)} · en su tendedero` : `${nombre(e, j.jugador)}  ➜  ${nombre(e, o.jugador)}`;
  fx.anunciar(def.nombre, o ? detalle : nombre(e, j.jugador), fastidio ? "fastidio" : "tactica");
  const c = await cartaJugada(e, j.jugador, j.carta);
  const destino = o
    ? (o.prenda ? rectDe(e, `[data-prenda="${o.prenda}"]`) : null) ?? rectDe(e, `[data-tendida="${o.jugador}:${o.linea}:${o.posicion}"]`)
    : rectDe(e, ".mf-lienzo");
  if (c && destino) {
    const quitarEstela = o ? fx.estela(fx.centro(c.clon.getBoundingClientRect()), fx.centro(destino), e.perfiles[j.jugador]?.color ?? "#f2c25a") : () => {};
    const ancho = (buscar(e, ".mano .mb-accion")?.offsetWidth ?? c.ancho) * 0.62;
    await fx.volar(c.clon, { x: fx.centro(destino).x, y: Math.max(90, destino.top - 60) }, { arco: 150, escala: ancho / c.ancho, giro: j.jugador === e.yo ? -6 : 6, duracion: 750, voltear: c.rival });
    await fx.golpe(c.clon);
    // Si el atacado puede responder, el efecto espera a su decisión.
    if (!despues.reaccion) await efectoSobre(e, p, j);
    else await fx.esperar(500);
    quitarEstela();
    await alDescarte(e, c.clon, c.ancho);
  } else c?.clon.remove();
  volverDespues(volver);
}

async function animarRespuesta(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "responder" }>) {
  const ataque = p.reaccion?.jugada;
  if (!ataque) return;
  if (j.anular) {
    const carta = p.jugadores[j.jugador].mano.find((c) => p.cartas[c] === "ni-hablar") ?? null;
    fx.anunciar("¡Ni hablar!", `${nombre(e, j.jugador)} ${j.jugador === e.yo ? "anulas" : "anula"} ${defCarta(p, ataque.carta).nombre}`, "fastidio");
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
  if (c.rival) fx.anunciar(`${nombre(e, j.jugador)} descarta`, defCarta(p, j.carta).nombre, "tactica");
  await alDescarte(e, c.clon, c.ancho);
}

async function animarFinTurno(e: Escena, p: Partida, j: Extract<Jugada, { tipo: "terminarTurno" }>, despues: Partida) {
  if (despues.ronda === p.ronda && !despues.terminada) return;
  // Se acaba el día: la ropa pierde humedad, la seca vuela al panel de su dueño y las viejas se rompen.
  fx.anunciar(despues.terminada ? "Fin de la partida" : "Se acaba el día", "La ropa se seca un poco", "tactica");
  await fx.esperar(500);
  const visibles = [...e.raiz.querySelectorAll<HTMLElement>("[data-prenda]")];
  await Promise.all(visibles.map((el, i) => fx.esperar(i * 40).then(() => fx.evaporar(el, 1))));
  for (const [k, jug] of despues.jugadores.entries()) {
    const nuevas = jug.seca.filter((id) => !p.jugadores[k].seca.includes(id));
    for (const id of nuevas) {
      const el = buscar(e, `[data-prenda="${id}"]`);
      const destino = rectDe(e, `[data-pila="secas-${k}"]`, `[data-panel="${k}"]`);
      if (!el || !destino) continue;
      const clon = fx.clonar(el);
      ocultar(el);
      fx.salpicar(fx.centro(el.getBoundingClientRect()), "#ffc93c", 10);
      await fx.volar(clon, fx.centro(destino), { arco: 110, escala: 0.35, giro: -10, duracion: 550 });
      clon.remove();
    }
  }
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
        fx.anunciar("¡Se rompe la cuerda!", `${defCarta(p, t.carta).nombre} de ${nombre(e, k)}`, "fastidio");
        void fx.temblar(el, 10).then(() => el.animate([{ translate: "0 0", opacity: 1 }, { translate: "0 60px", opacity: 0 }], { duration: 500, fill: "forwards" }));
      }),
    );
  }
  await fx.esperar(700);
  void j;
}

/** Lo que se ve al aplicar la jugada: puntos ganados, cartas nuevas en tu mano, cestas rellenas, carta del día. */
export async function despuesDe(e: Escena, antes: Partida, despues: Partida): Promise<void> {
  if (rapido(e)) return;
  despues.jugadores.forEach((j, k) => {
    const ganados = j.puntos - (antes.jugadores[k]?.puntos ?? j.puntos);
    if (!ganados) return;
    const m = rectDe(e, `[data-puntos="${k}"]`);
    if (!m) return;
    fx.cartelito({ x: m.left + m.width / 2, y: m.top }, `${ganados > 0 ? "+" : ""}${ganados}`, "puntos");
    fx.salpicar(fx.centro(m), "#ffc93c", 12);
  });
  const nuevas = despues.jugadores[e.yo]?.mano.filter((c) => !antes.jugadores[e.yo].mano.includes(c)) ?? [];
  await Promise.all(
    nuevas.map(async (c, i) => {
      const el = buscar(e, `[data-carta="${c}"]`);
      const mazo = defCarta(despues, c)?.mazo === "cuerdas" ? rectDe(e, '[data-pila="mazo-cuerdas"]') : rectDe(e, '[data-pila="mazo"]');
      if (!el || !mazo) return;
      await fx.esperar(i * 140);
      await fx.traerDesde(el, mazo, true);
    }),
  );
  if (despues.ronda !== antes.ronda && !despues.terminada) {
    if (despues.dia && despues.dia !== antes.dia) {
      const def = defCarta(despues, despues.dia);
      fx.anunciar(def.nombre, def.texto, "tactica");
      await fx.esperar(1400);
    }
    fx.anunciar(`Ronda ${despues.ronda}`, "Reparto: cada uno coge de una cesta", "tactica");
    const bolsa = rectDe(e, "[data-bolsa]");
    const llenas = despues.cestas.flat().filter((id) => !antes.cestas.flat().includes(id));
    if (bolsa) await Promise.all(llenas.map((id, i) => fx.esperar(i * 60).then(() => {
      const el = buscar(e, `[data-encesta="${id}"]`);
      return el ? fx.traerDesde(el, bolsa) : undefined;
    })));
  }
}
