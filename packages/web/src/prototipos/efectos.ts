// Animaciones de los prototipos de mesa. Todo se dibuja en una capa fija encima de la mesa, con la
// Web Animations API, para que una carta o una prenda pueda volar de una zona a otra sin moverla en el DOM.

type Punto = { x: number; y: number };
type Pose = { x: number; y: number; giro: number; escala: number };

const SVG = "http://www.w3.org/2000/svg";
let capaActual: HTMLElement | null = null;
const poses = new WeakMap<HTMLElement, Pose>();

export function usarCapa(el: HTMLElement | null) {
  capaActual = el;
}

function capa(): HTMLElement {
  const c = capaActual?.isConnected ? capaActual : document.querySelector<HTMLElement>(".capa-efectos");
  if (!c) throw new Error("Falta la capa de efectos");
  return c;
}

/** Curva de movimiento de la versión activa (cada estilo tiene su ritmo). */
function curva(): string {
  return getComputedStyle(capa()).getPropertyValue("--curva").trim() || "cubic-bezier(.45,.05,.25,1)";
}

export const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function centro(r: DOMRect): Punto {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function crear<K extends keyof HTMLElementTagNameMap>(etiqueta: K, clase: string, estilo: Partial<CSSStyleDeclaration> = {}) {
  const el = document.createElement(etiqueta);
  el.className = clase;
  Object.assign(el.style, estilo);
  capa().appendChild(el);
  return el;
}

/** Copia un elemento de la mesa en la capa de efectos, en el mismo sitio, para poder llevarlo volando. */
export function clonar(el: HTMLElement): HTMLElement {
  // Se mide sin giros ni abanicos (offsetWidth) y se centra donde se ve el original.
  const r = el.getBoundingClientRect();
  const ancho = el.offsetWidth;
  const alto = el.offsetHeight;
  const c = el.cloneNode(true) as HTMLElement;
  c.classList.add("clon");
  c.removeAttribute("data-uid");
  c.removeAttribute("data-prenda");
  c.style.setProperty("--carta-w", `${ancho}px`);
  Object.assign(c.style, {
    position: "fixed",
    left: `${r.left + r.width / 2 - ancho / 2}px`,
    top: `${r.top + r.height / 2 - alto / 2}px`,
    width: `${ancho}px`,
    height: `${alto}px`,
    margin: "0",
    transform: "none",
    rotate: "0deg",
    animation: "none",
    visibility: "visible",
  });
  capa().appendChild(c);
  poses.set(c, { x: 0, y: 0, giro: 0, escala: 1 });
  return c;
}

function transformar(p: Pose): string {
  return `translate(${p.x}px, ${p.y}px) rotate(${p.giro}deg) scale(${p.escala})`;
}

/**
 * Lleva un clon hasta un punto de la pantalla siguiendo un arco, como una carta lanzada a la mesa.
 * `voltear` gira la carta en el aire (las del rival llegan boca abajo y se descubren por el camino).
 */
export async function volar(
  c: HTMLElement,
  destino: Punto,
  { arco = 120, giro = 0, escala = 1, duracion = 700, voltear = false }: { arco?: number; giro?: number; escala?: number; duracion?: number; voltear?: boolean } = {},
) {
  const p0 = poses.get(c) ?? { x: 0, y: 0, giro: 0, escala: 1 };
  const o = centro(c.getBoundingClientRect());
  const p1: Pose = { x: p0.x + destino.x - o.x, y: p0.y + destino.y - o.y, giro, escala };
  const control = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - arco };
  const pasos = 16;
  const fotogramas: Keyframe[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const u = 1 - t;
    fotogramas.push({
      offset: t,
      transform: transformar({
        x: u * u * p0.x + 2 * u * t * control.x + t * t * p1.x,
        y: u * u * p0.y + 2 * u * t * control.y + t * t * p1.y,
        giro: p0.giro + (p1.giro - p0.giro) * t,
        // Se levanta un poco en mitad del vuelo, como si se acercara a la cámara.
        escala: p0.escala + (p1.escala - p0.escala) * t + Math.sin(Math.PI * t) * 0.12,
      }),
    });
  }
  const anim = c.animate(fotogramas, { duration: duracion, easing: curva(), fill: "forwards" });
  const giroCara = c.querySelector<HTMLElement>(".carta-giro");
  if (voltear && giroCara) {
    giroCara.animate([{ transform: "rotateY(180deg)" }, { transform: "rotateY(0deg)" }], { duration: duracion * 0.8, delay: duracion * 0.1, easing: "ease-in-out", fill: "forwards" });
  }
  await anim.finished;
  c.style.transform = transformar(p1);
  anim.cancel();
  poses.set(c, p1);
}

/** Golpe de la carta al llegar: se aplasta un poco y rebota. */
export async function golpe(c: HTMLElement) {
  const p = poses.get(c) ?? { x: 0, y: 0, giro: 0, escala: 1 };
  const base = transformar(p);
  await c.animate(
    [{ transform: base }, { transform: `${base} scale(1.12)` }, { transform: `${base} scale(0.94)` }, { transform: base }],
    { duration: 380, easing: "ease-out" },
  ).finished;
}

export async function desvanecer(el: HTMLElement, duracion = 300) {
  await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duracion, fill: "forwards" }).finished;
  el.remove();
}

/** Línea discontinua de quien juega a quien recibe: deja claro a quién va dirigida la carta. */
export function estela(a: Punto, b: Punto, color: string): () => void {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "estela");
  const control = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 140 };
  const d = `M${a.x} ${a.y} Q${control.x} ${control.y} ${b.x} ${b.y}`;
  svg.innerHTML = `
    <path d="${d}" fill="none" stroke="${color}" stroke-opacity=".25" stroke-width="14" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 12" pathLength="1000"/>
    <circle cx="${b.x}" cy="${b.y}" r="18" fill="none" stroke="${color}" stroke-width="4"/>
    <circle cx="${b.x}" cy="${b.y}" r="6" fill="${color}"/>`;
  capa().appendChild(svg);
  const trazos = svg.querySelectorAll("path");
  trazos.forEach((t) => t.animate([{ strokeDashoffset: 1000, strokeDasharray: "0 1000" }, { strokeDasharray: "1000 0" }], { duration: 500, easing: "ease-out" }));
  svg.querySelectorAll("circle").forEach((c, i) =>
    c.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.4)", opacity: 1 }, { transform: "scale(1)" }], {
      duration: 450,
      delay: 350 + i * 60,
      fill: "both",
      easing: "ease-out",
    }),
  );
  (svg.querySelectorAll("circle")[0] as SVGElement).style.transformOrigin = `${b.x}px ${b.y}px`;
  (svg.querySelectorAll("circle")[1] as SVGElement).style.transformOrigin = `${b.x}px ${b.y}px`;
  return () => void desvanecer(svg as unknown as HTMLElement, 400);
}

/** Cartel con el nombre de la carta, letra a letra, y quién se la juega a quién. */
export function anunciar(titulo: string, detalle: string, grupo: string) {
  const el = crear("div", `anuncio anuncio-${grupo}`);
  const h = document.createElement("div");
  h.className = "anuncio-titulo";
  [...titulo].forEach((letra, i) => {
    const s = document.createElement("span");
    s.textContent = letra === " " ? " " : letra;
    s.style.setProperty("--i", String(i));
    h.appendChild(s);
  });
  const p = document.createElement("div");
  p.className = "anuncio-detalle";
  p.textContent = detalle;
  el.append(h, p);
  el.animate([{ opacity: 0, transform: "translate(-50%, 20px) scale(.9)" }, { opacity: 1, transform: "translate(-50%, 0) scale(1)" }], {
    duration: 350,
    easing: curva(),
    fill: "both",
  });
  h.querySelectorAll("span").forEach((s, i) =>
    s.animate([{ transform: "translateY(0.9em) rotate(8deg)", opacity: 0 }, { transform: "none", opacity: 1 }], {
      duration: 420,
      delay: 80 + i * 28,
      easing: curva(),
      fill: "both",
    }),
  );
  p.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 300, delay: 300 + titulo.length * 28, fill: "both" });
  // Tras leerse, se encoge hacia arriba para no tapar la jugada, y luego se va.
  setTimeout(() => {
    const arriba = -(el.getBoundingClientRect().top - 70);
    el.animate([{ transform: "translate(-50%, 0) scale(1)" }, { transform: `translate(-50%, ${arriba}px) scale(.55)` }], {
      duration: 500,
      easing: curva(),
      fill: "forwards",
    });
  }, 1100);
  setTimeout(() => {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: "forwards" }).finished.then(() => el.remove());
  }, 3600);
}

const NUBE = `<svg viewBox="0 0 120 60"><path d="M24 52 C8 52 4 36 16 30 C14 16 32 10 42 18 C48 4 74 2 80 18 C94 12 110 22 104 36 C116 40 112 54 98 52 Z" fill="#eef3f7" stroke="#7d8fa0" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 44 C46 48 70 48 92 44" stroke="#c9d4de" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

/** Nube que se pone encima de una zona y llueve sobre ella hasta que se llama a la función devuelta. */
export function nube(zona: DOMRect): () => Promise<void> {
  const ancho = Math.max(zona.width + 40, 110);
  const el = crear("div", "nube-efecto", {
    left: `${zona.left + zona.width / 2 - ancho / 2}px`,
    top: `${zona.top - ancho * 0.42}px`,
    width: `${ancho}px`,
  });
  el.innerHTML = NUBE;
  el.animate([{ transform: "translateX(-40px) scale(.5)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 500, easing: curva(), fill: "both" });
  el.animate([{ translate: "0 0" }, { translate: "0 -4px" }], { duration: 900, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
  const gotas: HTMLElement[] = [];
  const cuantas = Math.round(ancho / 9);
  for (let i = 0; i < cuantas; i++) {
    const g = crear("div", "lluvia", {
      left: `${zona.left + zona.width / 2 - ancho / 2 + 14 + Math.random() * (ancho - 28)}px`,
      top: `${zona.top - ancho * 0.1}px`,
    });
    g.animate([{ transform: "translateY(0)", opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: `translateY(${zona.height + ancho * 0.1}px)`, opacity: 0.2 }], {
      duration: 550 + Math.random() * 200,
      delay: 300 + Math.random() * 600,
      iterations: Infinity,
      easing: "ease-in",
    });
    gotas.push(g);
  }
  return async () => {
    gotas.forEach((g) => void desvanecer(g, 200));
    await desvanecer(el, 400);
  };
}

/** Ráfaga: rayas de viento que cruzan la zona de lado a lado. */
export async function viento(zona: DOMRect, haciaLaDerecha = true) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "viento");
  Object.assign((svg as unknown as HTMLElement).style, { left: `${zona.left - 60}px`, top: `${zona.top}px`, width: `${zona.width + 120}px`, height: `${zona.height}px` });
  svg.setAttribute("viewBox", `0 0 ${zona.width + 120} ${zona.height}`);
  let trazos = "";
  for (let i = 0; i < 7; i++) {
    const y = zona.height * (0.12 + 0.12 * i) + (Math.random() - 0.5) * 12;
    const w = zona.width + 120;
    trazos += `<path d="M0 ${y} C${w * 0.25} ${y - 18} ${w * 0.45} ${y + 18} ${w * 0.7} ${y} S${w * 0.9} ${y - 24} ${w * 0.86} ${y - 34} S${w * 0.78} ${y - 30} ${w * 0.82} ${y - 20}" pathLength="100"/>`;
  }
  svg.innerHTML = trazos;
  if (!haciaLaDerecha) (svg as unknown as HTMLElement).style.transform = "scaleX(-1)";
  capa().appendChild(svg);
  const anims = [...svg.querySelectorAll("path")].map((p, i) =>
    p.animate(
      [
        { strokeDasharray: "0 100", strokeDashoffset: 0, opacity: 0 },
        { strokeDasharray: "38 100", strokeDashoffset: -20, opacity: 1, offset: 0.4 },
        { strokeDasharray: "10 100", strokeDashoffset: -100, opacity: 0 },
      ],
      { duration: 900, delay: i * 70, easing: "ease-in-out", fill: "both" },
    ),
  );
  await Promise.all(anims.map((a) => a.finished));
  svg.remove();
}

/** Sol que aparece encima de una prenda mientras se seca. */
export function sol(zona: DOMRect): () => Promise<void> {
  const el = crear("div", "sol-efecto", { left: `${zona.left + zona.width / 2 - 40}px`, top: `${zona.top - 86}px` });
  const rayos = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<line x1="${40 + Math.cos(a) * 24}" y1="${40 + Math.sin(a) * 24}" x2="${40 + Math.cos(a) * 34}" y2="${40 + Math.sin(a) * 34}"/>`;
  }).join("");
  el.innerHTML = `<svg viewBox="0 0 80 80"><g class="rayos">${rayos}</g><circle cx="40" cy="40" r="18" fill="#ffc93c" stroke="#d98a1c" stroke-width="3"/><path d="M33 42 q7 6 14 0" stroke="#a5600f" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="34" cy="36" r="2" fill="#a5600f"/><circle cx="46" cy="36" r="2" fill="#a5600f"/></svg>`;
  el.animate([{ transform: "translateY(30px) scale(.3) rotate(-90deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 550, easing: curva(), fill: "both" });
  el.querySelector(".rayos")!.animate([{ transform: "rotate(0)" }, { transform: "rotate(30deg)" }], { duration: 1200, iterations: Infinity });
  return () => desvanecer(el, 350);
}

/** Las gotas dibujadas en la prenda suben y se evaporan (las `cuantas` últimas). */
export async function evaporar(prenda: HTMLElement, cuantas = Infinity) {
  const gotas = [...prenda.querySelectorAll<SVGPathElement>(".gotas path")].slice(-Math.min(cuantas, 99));
  const anims = gotas.map((g, i) => {
    const r = g.getBoundingClientRect();
    g.style.opacity = "0";
    const copia = crear("div", "gota-suelta", { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    return copia
      .animate([{ transform: "none", opacity: 1 }, { transform: `translate(${(i % 2 ? 1 : -1) * 8}px, -46px) scale(.4)`, opacity: 0 }], {
        duration: 700,
        delay: i * 90,
        easing: "ease-out",
        fill: "both",
      })
      .finished.then(() => copia.remove());
  });
  await Promise.all(anims);
}

/** Gota que cae sobre la prenda y se queda en su sitio (+1 de humedad). */
export async function gotaNueva(prenda: HTMLElement) {
  const r = prenda.getBoundingClientRect();
  const g = crear("div", "gota-suelta grande", { left: `${r.right - 26}px`, top: `${r.top - 50}px` });
  await g.animate([{ transform: "translateY(0) scale(.6)", opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translateY(${r.height + 30}px) scale(1)`, opacity: 1 }], {
    duration: 520,
    easing: "cubic-bezier(.5,0,1,1)",
    fill: "both",
  }).finished;
  salpicar({ x: r.right - 20, y: r.bottom - 4 }, "#5fb3e6");
  g.remove();
}

/** Texto que sube y se desvanece: +3, +1 de humedad... */
export function cartelito(p: Punto, texto: string, clase: string) {
  const el = crear("div", `cartelito ${clase}`, { left: `${p.x}px`, top: `${p.y}px` });
  el.textContent = texto;
  el.animate(
    [
      { transform: "translate(-50%, 0) scale(.4)", opacity: 0 },
      { transform: "translate(-50%, -24px) scale(1.25)", opacity: 1, offset: 0.25 },
      { transform: "translate(-50%, -40px) scale(1)", opacity: 1, offset: 0.7 },
      { transform: "translate(-50%, -64px) scale(.9)", opacity: 0 },
    ],
    { duration: 1300, easing: "ease-out", fill: "both" },
  ).finished.then(() => el.remove());
}

/** Chispas que saltan desde un punto. */
export function salpicar(p: Punto, color: string, cuantas = 10) {
  for (let i = 0; i < cuantas; i++) {
    const a = (Math.PI * 2 * i) / cuantas + Math.random() * 0.5;
    const d = 26 + Math.random() * 26;
    const el = crear("div", "chispa", { left: `${p.x}px`, top: `${p.y}px`, background: color });
    el.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0.8 }], {
      duration: 500 + Math.random() * 250,
      easing: "cubic-bezier(.2,.7,.3,1)",
      fill: "both",
    }).finished.then(() => el.remove());
  }
}

/** Sacudida de una prenda o una cuerda. */
export async function temblar(el: HTMLElement, fuerza = 8) {
  await el.animate(
    [0, 1, -1, 1, -0.7, 0.5, -0.3, 0].map((k) => ({ transform: `rotate(${k * fuerza}deg)` })),
    { duration: 650, easing: "ease-in-out" },
  ).finished;
}

/** Al aparecer un elemento nuevo (una carta robada), lo trae desde otro punto de la pantalla. */
export async function traerDesde(el: HTMLElement, desde: DOMRect, voltear = false) {
  const r = el.getBoundingClientRect();
  const final = getComputedStyle(el).transform;
  const fin = final === "none" ? "" : final;
  const dx = centro(desde).x - centro(r).x;
  const dy = centro(desde).y - centro(r).y;
  const escala = desde.width / r.width;
  const anim = el.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${escala}) ${fin}` }, { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 60}px) scale(1.1) ${fin}`, offset: 0.5 }, { transform: fin || "none" }],
    { duration: 650, easing: curva() },
  );
  const giro = el.querySelector<HTMLElement>(".carta-giro");
  if (voltear && giro) giro.animate([{ transform: "rotateY(180deg)" }, { transform: "rotateY(0)" }], { duration: 500, delay: 100, easing: "ease-in-out", fill: "backwards" });
  await anim.finished;
}
