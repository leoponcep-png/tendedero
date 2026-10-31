import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DefsBosque } from "./ArteBosque";
import { CaraAccionBosque, CartaCuerdaBosque, CartaDiaBosque, CartaObjetivoBosque, DorsoBosque, medallonDorso } from "./CartasBosque";
import { CartaPrendaHumeda } from "./HumedadTaller";
import { MM } from "./medidas";
import { COLORES } from "./Prototipos";
import "./taller.css";
import "./plantillas.css";

// Modo «plantilla» de la galería (/galeria-cartas.html?plantilla=1): cada tipo de carta vacío, sin ilustración,
// textos, números ni iconos, para dibujar encima. Pinta los mismos componentes que el juego y esconde lo que sobra
// con plantillas.css (todo bajo la clase .plantillas), así que no toca cómo se ven las cartas en la partida.
// Debajo de las plantillas van las guías: la zona de la ilustración, el margen seguro, el sangrado y las medidas.
// window.plantillas tiene los datos para capturarlas (tipos, medidas, zonas) y exportarSVG(id) saca el SVG limpio.

/** Píxeles de pantalla por milímetro con los que se pintan las plantillas (luego se capturan a 300 ppp). */
export const K = 3;
/** Sangrado y margen seguro, en mm. */
const SANGRADO = 3;
const SEGURO = 3;

type Rect = { x: number; y: number; w: number; h: number };
type Circulo = { cx: number; cy: number; r: number };
type Tipo = {
  id: string;
  nombre: string;
  medida: keyof typeof MM;
  /** Color del sangrado: el del borde de la carta. */
  sangrado: string;
  /** Hueco de la ilustración (rectángulo que la contiene), en mm desde la esquina de arriba a la izquierda. */
  ilustracion: Rect;
  /** Forma visible de la ventana, si no es rectangular (path en mm). */
  forma?: string;
  /** Medallones de emblema que quedan vacíos (por si quiere dibujar también los iconos). */
  emblemas?: Circulo[];
  /** Otras zonas que conviene señalar. */
  notas?: { rect: Rect; texto: string }[];
  carta: ReactNode;
};

const cuerdaMm = (x: number, y: number) => ({ x: (x * 88) / 180, y: (y * 63) / 128 });
const rectCuerda = (x0: number, y0: number, x1: number, y1: number): Rect => {
  const a = cuerdaMm(x0, y0);
  const b = cuerdaMm(x1, y1);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
};

/** Las cartas verticales se meten en una caja con su tamaño, como en la galería. */
function Caja({ medida, children }: { medida: keyof typeof MM; children: ReactNode }) {
  return (
    <div style={{ position: "relative", width: MM[medida].ancho * K, height: MM[medida].alto * K }}>
      <div style={{ position: "absolute", inset: 0, display: "grid" }}>{children}</div>
    </div>
  );
}

function dorso(clase: "acciones" | "objetivos" | "cuerdas" | "dias" | "prendas", medida: keyof typeof MM): Pick<Tipo, "ilustracion" | "carta" | "emblemas"> {
  // El medallón del dorso (CartasBosque): ahí va el emblema del mazo
  const { cx, cy, r } = medallonDorso(clase);
  return {
    ilustracion: { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r },
    carta: (
      <Caja medida={medida}>
        <DorsoBosque clase={clase} />
      </Caja>
    ),
  };
}

function tipos(): Tipo[] {
  return [
    {
      id: "fastidio",
      nombre: "Acción · Fastidio",
      medida: "accion",
      sangrado: "#e2675a",
      ilustracion: { x: 5.5, y: 17.6, w: 52, h: 29 },
      forma: "M8.5 17.6 H54.5 L57.5 20.6 V43.6 L54.5 46.6 H8.5 L5.5 43.6 V20.6 Z",
      emblemas: [{ cx: 31.5, cy: 46.6, r: 4.7 }],
      carta: (
        <Caja medida="accion">
          <CaraAccionBosque id="rafaga-de-viento" />
        </Caja>
      ),
    },
    {
      id: "tactica",
      nombre: "Acción · Táctica",
      medida: "accion",
      sangrado: "#4fa27a",
      ilustracion: { x: 5.5, y: 17.6, w: 52, h: 29 },
      forma: "M5.5 46.6 V29 C5.5 22.5 17 17.6 31.5 17.6 C46 17.6 57.5 22.5 57.5 29 V46.6 Z",
      emblemas: [{ cx: 31.5, cy: 46.6, r: 4.7 }],
      carta: (
        <Caja medida="accion">
          <CaraAccionBosque id="colocar-cuerda-extra" />
        </Caja>
      ),
    },
    {
      id: "objetivo",
      nombre: "Objetivo",
      medida: "objetivo",
      sangrado: "#f0a53a",
      ilustracion: { x: 17.9, y: 17.9, w: 27.2, h: 27.2 },
      forma: "M17.9 31.5 A13.6 13.6 0 1 1 45.1 31.5 A13.6 13.6 0 1 1 17.9 31.5 Z",
      emblemas: [{ cx: 31.5, cy: 45.6, r: 4.3 }],
      carta: <CartaObjetivoBosque id="calcetinero" style={{ position: "relative", width: MM.objetivo.ancho * K, height: MM.objetivo.alto * K }} />,
    },
    {
      id: "dia-tiempo",
      nombre: "Día · Tiempo",
      medida: "dia",
      sangrado: "#4f98d8",
      ilustracion: { x: 5, y: 15.2, w: 31, h: 36 },
      emblemas: [{ cx: 20.5, cy: 51.2, r: 4.2 }],
      carta: <CartaDiaBosque id="soleado" style={{ width: MM.dia.ancho * K, rotate: "0deg" }} />,
    },
    {
      id: "dia-suceso",
      nombre: "Día · Suceso",
      medida: "dia",
      sangrado: "#a07ad0",
      ilustracion: { x: 5, y: 15.2, w: 31, h: 36 },
      emblemas: [{ cx: 20.5, cy: 51.2, r: 4.2 }],
      carta: <CartaDiaBosque id="tormenta-repentina" style={{ width: MM.dia.ancho * K, rotate: "0deg" }} />,
    },
    {
      id: "cuerda",
      nombre: "Cuerda",
      medida: "cuerda",
      sangrado: "#ecd8ad",
      // Franja entre la caja de texto y la cuerda (donde el tejadillo pinta su tejado)
      ilustracion: rectCuerda(12, 81, 168, 103),
      emblemas: [{ ...cuerdaMm(21.5, 18.4), r: (12 * 88) / 180 }].map((c) => ({ cx: c.x, cy: c.y, r: c.r })),
      notas: [{ rect: rectCuerda(12, 33, 168, 80), texto: "texto de la habilidad" }],
      carta: <CartaCuerdaBosque efecto={null} modo="borde" style={{ position: "relative", width: MM.cuerda.ancho * K, height: MM.cuerda.alto * K }} />,
    },
    {
      id: "prenda",
      nombre: "Prenda (mini)",
      medida: "prenda",
      sangrado: "#f8efdc",
      // Se mide en la carta pintada (ver Plantillas): depende del CSS de la carta
      ilustracion: { x: 0, y: 0, w: 0, h: 0 },
      carta: (
        <div className="plantilla-prenda" style={{ position: "relative", width: MM.prenda.ancho * K, height: MM.prenda.alto * K, "--celda": `${(MM.prenda.ancho * K) / 1.45}px` } as CSSProperties}>
          <CartaPrendaHumeda p={{ id: "plantilla", tipo: "camiseta", color: COLORES.rojo, humedad: 4 }} />
        </div>
      ),
    },
    { id: "dorso-acciones", nombre: "Dorso · Acciones", medida: "accion", sangrado: "#4f9a6c", ...dorso("acciones", "accion") },
    { id: "dorso-objetivos", nombre: "Dorso · Objetivos", medida: "objetivo", sangrado: "#f0a53a", ...dorso("objetivos", "objetivo") },
    { id: "dorso-cuerdas", nombre: "Dorso · Cuerdas", medida: "cuerda", sangrado: "#c99c5e", ...dorso("cuerdas", "cuerda") },
    { id: "dorso-dias", nombre: "Dorso · Días", medida: "dia", sangrado: "#5c9fdc", ...dorso("dias", "dia") },
    { id: "dorso-prendas", nombre: "Dorso · Prendas", medida: "prenda", sangrado: "#e79aa9", ...dorso("prendas", "prenda") },
  ];
}

const num = (n: number) => (Math.round(n * 10) / 10).toString().replace(".", ",");
const px = (mm: number) => Math.round((mm / 25.4) * 300);

/** Guía de un tipo: la carta con sangrado y, encima, el corte, el margen seguro, la zona de la ilustración y las cotas. */
function Guia({ t }: { t: Tipo }) {
  const W = MM[t.medida].ancho;
  const H = MM[t.medida].alto;
  const izq = 16;
  const arriba = 22;
  const abajo = 44;
  const der = Math.max(16, 100 - izq - 2 * SANGRADO - W);
  const GW = izq + SANGRADO * 2 + W + der;
  const GH = arriba + SANGRADO * 2 + H + abajo;
  const ox = izq + SANGRADO;
  const oy = arriba + SANGRADO;
  const z = t.ilustracion;
  const letra = Math.min(2.6, z.w / 8.5, Math.max(1.6, z.h / 4));
  return (
    <div className="plantilla-guia" data-guia={t.id} style={{ width: GW * K, height: GH * K }}>
      <div className="plantilla-sangrado" style={{ position: "absolute", left: izq * K, top: arriba * K, padding: SANGRADO * K, background: t.sangrado }}>
        {t.carta}
      </div>
      <svg viewBox={`0 0 ${GW} ${GH}`} width={GW * K} height={GH * K} className="plantilla-guia-capa">
        <text x={izq} y={8} className="g-titulo">
          {t.nombre}
        </text>
        <text x={izq} y={13} className="g-sub">
          Corte {num(W)} × {num(H)} mm ({px(W)} × {px(H)} px a 300 ppp) · con sangrado {num(W + 2 * SANGRADO)} × {num(H + 2 * SANGRADO)} mm
        </text>
        {/* Sangrado, corte y margen seguro */}
        <rect x={izq} y={arriba} width={W + 2 * SANGRADO} height={H + 2 * SANGRADO} className="g-sangrado" />
        <rect x={ox} y={oy} width={W} height={H} className="g-corte" />
        <rect x={ox + SEGURO} y={oy + SEGURO} width={W - 2 * SEGURO} height={H - 2 * SEGURO} className="g-seguro" />
        {/* Zona de la ilustración */}
        <g transform={`translate(${ox} ${oy})`}>
          {t.notas?.map((n) => (
            <g key={n.texto}>
              <rect x={n.rect.x} y={n.rect.y} width={n.rect.w} height={n.rect.h} className="g-nota" />
              <text x={n.rect.x + n.rect.w / 2} y={n.rect.y + n.rect.h / 2 + 0.8} className="g-nota-texto">
                {n.texto}
              </text>
            </g>
          ))}
          <rect x={z.x} y={z.y} width={z.w} height={z.h} className="g-ilu" />
          {t.forma && <path d={t.forma} className="g-forma" />}
          {t.id.startsWith("dorso") && <circle cx={z.x + z.w / 2} cy={z.y + z.h / 2} r={z.w / 2} className="g-forma" />}
          {t.emblemas?.map((e, i) => (
            <circle key={i} cx={e.cx} cy={e.cy} r={e.r} className="g-emblema" />
          ))}
          <text x={z.x + z.w / 2} y={z.y + z.h / 2 + letra * 0.35} className="g-ilu-texto" style={{ fontSize: letra }}>
            ILUSTRACIÓN
          </text>
        </g>
        {/* Cotas de la carta */}
        <path d={`M${ox} ${arriba - 3} H${ox + W} M${ox} ${arriba - 4.4} v2.8 M${ox + W} ${arriba - 4.4} v2.8`} className="g-cota" />
        <text x={ox + W / 2} y={arriba - 4.2} className="g-cota-texto">
          {num(W)} mm
        </text>
        <path d={`M${izq - 3} ${oy} V${oy + H} M${izq - 4.4} ${oy} h2.8 M${izq - 4.4} ${oy + H} h2.8`} className="g-cota" />
        <text x={izq - 4.4} y={oy + H / 2} className="g-cota-texto" transform={`rotate(-90 ${izq - 4.4} ${oy + H / 2})`}>
          {num(H)} mm
        </text>
        {/* Leyenda */}
        <g transform={`translate(${izq} ${GH - abajo + 6})`} className="g-leyenda">
          <rect x="0" y="-2.2" width="4" height="2.6" className="g-ilu" />
          <text x="5.5" y="0">
            Ilustración: {num(z.w)} × {num(z.h)} mm = PNG transparente de {px(z.w)} × {px(z.h)} px
          </text>
          <text x="5.5" y="3.6" className="g-leyenda-sub">
            Empieza a {num(z.x)} mm del borde izquierdo y a {num(z.y)} mm del de arriba
          </text>
          {(t.forma || t.id.startsWith("dorso")) && (
            <text x="5.5" y="7" className="g-leyenda-sub">
              Línea blanca discontinua: lo que se ve de la ventana (deja transparente lo de fuera)
            </text>
          )}
          <rect x="0" y="9.3" width="4" height="2.6" className="g-seguro" />
          <text x="5.5" y="11.5">Margen seguro: {SEGURO} mm dentro del corte</text>
          <rect x="0" y="14.3" width="4" height="2.6" className="g-corte" />
          <text x="5.5" y="16.5">Corte: {num(W)} × {num(H)} mm</text>
          <rect x="0" y="19.3" width="4" height="2.6" className="g-sangrado" />
          <text x="5.5" y="21.5">Sangrado: {SANGRADO} mm fuera del corte</text>
          {t.emblemas && (
            <>
              <circle cx="2" cy="25.3" r="1.4" className="g-emblema" />
              <text x="5.5" y="26.5">Medallón del emblema: va encima de la ilustración</text>
            </>
          )}
          {t.notas?.map((n, i) => (
            <text key={n.texto} x="5.5" y={31.5 + i * 3.6} className="g-leyenda-sub">
              Recuadro gris: {n.texto}, no dibujes ahí lo importante
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

export function PlantillasCartas() {
  const [lista, setLista] = useState(tipos);
  const raiz = useRef<HTMLDivElement>(null);
  // La zona de la ilustración de la prenda sale de la carta ya pintada (su CSS va en unidades de --celda).
  useLayoutEffect(() => {
    const carta = raiz.current?.querySelector('[data-plantilla="prenda"] .hp');
    const ilu = carta?.querySelector(".hp-ilustra");
    if (!carta || !ilu) return;
    const a = carta.getBoundingClientRect();
    const b = ilu.getBoundingClientRect();
    const escala = carta.querySelector(".hp-escala")!.getBoundingClientRect();
    const r = (n: number) => Math.round((n / K) * 10) / 10;
    setLista((l) =>
      l.map((t) =>
        t.id === "prenda"
          ? {
              ...t,
              ilustracion: { x: r(b.left - a.left), y: r(b.top - a.top), w: r(b.width), h: r(b.height) },
              notas: [{ rect: { x: 0, y: 0, w: r(escala.width), h: r(escala.height) }, texto: "escala de humedad" }],
            }
          : t,
      ),
    );
  }, []);
  useLayoutEffect(() => {
    (window as unknown as { plantillas: unknown }).plantillas = lista.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      ancho: MM[t.medida].ancho,
      alto: MM[t.medida].alto,
      ilustracion: t.ilustracion,
      emblemas: t.emblemas ?? [],
    }));
  }, [lista]);
  return (
    <div ref={raiz} className="mb me estilo-fusion plantillas" style={{ "--celda": `${(MM.cuerda.ancho * K) / 3}px`, "--celda-base": `${(MM.cuerda.ancho * K) / 3}px` } as CSSProperties}>
      <DefsBosque />
      <h2>Plantillas vacías</h2>
      <div className="plantillas-fila">
        {lista.map((t) => (
          <div key={t.id} className="plantilla-carta" data-plantilla={t.id}>
            {t.carta}
          </div>
        ))}
      </div>
      <h2>Con sangrado de {SANGRADO} mm</h2>
      <div className="plantillas-fila">
        {lista.map((t) => (
          <div key={t.id} className="plantilla-sangrado" data-plantilla-sangrado={t.id} style={{ padding: SANGRADO * K, background: t.sangrado }}>
            {t.carta}
          </div>
        ))}
      </div>
      <h2>Guías</h2>
      <div className="plantillas-fila">
        {lista.map((t) => (
          <Guia key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}

// ---------- Exportar a SVG ----------
// Junta las capas SVG de la carta (marco de fondo y de frente) en un solo SVG en milímetros, con los colores y
// opacidades ya resueltos (sin clases ni variables de CSS) y las tramas que usa. La prenda es HTML: se redibuja con
// rectángulos medidos en la carta.

const lienzo = document.createElement("canvas").getContext("2d")!;
/** Un color de CSS (también color-mix o color(srgb …)) en #rrggbb o rgba(). */
function colorPlano(c: string) {
  if (!c || c === "none" || c.startsWith("url(")) return c;
  lienzo.fillStyle = "#000";
  lienzo.fillStyle = c;
  return lienzo.fillStyle as string;
}

const PROPIEDADES = ["fill", "stroke", "opacity", "fill-opacity", "stroke-opacity", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin"];

/** Copia un elemento SVG con su estilo calculado como atributos; quita lo que está escondido. */
function copiar(el: Element, refs: Set<string>): Element | null {
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden") return null;
  const copia = el.cloneNode(false) as Element;
  copia.removeAttribute("class");
  copia.removeAttribute("style");
  if (!(el instanceof SVGSVGElement) && !["defs", "clipPath", "pattern", "filter", "linearGradient", "radialGradient", "stop"].includes(el.tagName)) {
    for (const p of PROPIEDADES) {
      let v = cs.getPropertyValue(p);
      if (!v) continue;
      if (p === "fill" || p === "stroke") {
        const m = v.match(/url\("?#([^")]+)"?\)/);
        if (m) {
          refs.add(m[1]);
          v = `url(#${m[1]})`;
        } else v = colorPlano(v);
      }
      if (p === "stroke-width" || p === "stroke-dasharray") v = v.replace(/px/g, "");
      copia.setAttribute(p, v);
    }
  }
  if (el.tagName === "stop") copia.setAttribute("stop-color", colorPlano(cs.getPropertyValue("stop-color")));
  const cp = el.getAttribute("clip-path");
  if (cp) copia.setAttribute("clip-path", cp);
  for (const hijo of Array.from(el.childNodes)) {
    if (hijo.nodeType === Node.TEXT_NODE) copia.appendChild(hijo.cloneNode());
    else if (hijo instanceof Element) {
      const c = copiar(hijo, refs);
      if (c) copia.appendChild(c);
    }
  }
  return copia;
}

const NS = "http://www.w3.org/2000/svg";

function svgPrenda(carta: HTMLElement, W: number, H: number) {
  const a = carta.getBoundingClientRect();
  const mm = (n: number) => Math.round((n / K) * 100) / 100;
  const caja = (el: Element) => {
    const b = el.getBoundingClientRect();
    return { x: mm(b.left - a.left), y: mm(b.top - a.top), w: mm(b.width), h: mm(b.height) };
  };
  const cs = getComputedStyle(carta);
  const crema = colorPlano(cs.getPropertyValue("--crema"));
  const tinta = colorPlano(cs.getPropertyValue("--tinta"));
  const dorado = colorPlano(cs.getPropertyValue("--dorado"));
  const radio = mm(parseFloat(cs.borderTopLeftRadius));
  const escala = caja(carta.querySelector(".hp-escala")!);
  const filas = Array.from(carta.querySelectorAll(".hp-fila")).map(caja);
  const ilu = caja(carta.querySelector(".hp-ilustra")!);
  const iluColor = colorPlano(getComputedStyle(carta.querySelector(".hp-ilustra")!).backgroundColor);
  const pie = caja(carta.querySelector(".hp-pie")!);
  const puntos = caja(carta.querySelector(".pb-puntos")!);
  const linea = mm(2);
  return `<svg xmlns="${NS}" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="carta"><rect width="${W}" height="${H}" rx="${radio}"/></clipPath></defs>
  <g clip-path="url(#carta)">
    <rect width="${W}" height="${H}" fill="${crema}"/>
    <g id="escala-humedad">
      <rect x="0" y="0" width="${W}" height="${escala.h}" fill="#d6ecf7"/>
${filas.map((f) => `      <rect x="0" y="${Math.round((f.y + f.h - mm(1)) * 100) / 100}" width="${W}" height="${mm(1)}" fill="${tinta}" fill-opacity=".2"/>`).join("\n")}
      <rect x="0" y="${Math.round((escala.h - linea) * 100) / 100}" width="${W}" height="${linea}" fill="${tinta}"/>
    </g>
    <rect id="ilustracion" x="${ilu.x}" y="${ilu.y}" width="${ilu.w}" height="${ilu.h}" fill="${iluColor}"/>
    <rect x="0" y="${pie.y}" width="${W}" height="${linea}" fill="${tinta}"/>
    <circle cx="${puntos.x + puntos.w / 2}" cy="${puntos.y + puntos.h / 2}" r="${puntos.w / 2}" fill="#f2c25a" stroke="${tinta}" stroke-width="${mm(1.5)}"/>
    <rect x="${mm(1.5)}" y="${mm(1.5)}" width="${W - mm(3)}" height="${H - mm(3)}" rx="${Math.max(0, radio - mm(1.5))}" fill="none" stroke="${crema}" stroke-width="${mm(3)}"/>
    <rect x="${mm(3.75)}" y="${mm(3.75)}" width="${W - mm(7.5)}" height="${H - mm(7.5)}" rx="${Math.max(0, radio - mm(3.75))}" fill="none" stroke="${dorado}" stroke-width="${mm(1.5)}"/>
  </g>
</svg>
`;
}

function exportarSVG(id: string) {
  const caja = document.querySelector(`[data-plantilla="${id}"]`) as HTMLElement;
  const t = (window as unknown as { plantillas: { id: string; ancho: number; alto: number }[] }).plantillas.find((p) => p.id === id)!;
  const W = t.ancho;
  const H = t.alto;
  const prenda = caja.querySelector(".hp") as HTMLElement | null;
  if (prenda) return svgPrenda(prenda, W, H);
  const refs = new Set<string>();
  const capas = Array.from(caja.querySelectorAll("svg.marco-carta")) as SVGSVGElement[];
  const raiz = document.createElementNS(NS, "svg");
  raiz.setAttribute("xmlns", NS);
  raiz.setAttribute("width", `${W}mm`);
  raiz.setAttribute("height", `${H}mm`);
  raiz.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const defs = document.createElementNS(NS, "defs");
  raiz.appendChild(defs);
  // Esquinas redondeadas de la carta (el corte de la imprenta): recorta las tramas que se salen
  const recorte = document.createElementNS(NS, "clipPath");
  recorte.id = "corte";
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("width", String(W));
  r.setAttribute("height", String(H));
  r.setAttribute("rx", "3.4");
  recorte.appendChild(r);
  defs.appendChild(recorte);
  const todo = document.createElementNS(NS, "g");
  todo.setAttribute("clip-path", "url(#corte)");
  raiz.appendChild(todo);
  capas.forEach((capa, i) => {
    const vb = capa.viewBox.baseVal;
    const g = document.createElementNS(NS, "g");
    g.id = i === 0 ? "marco" : "marco-frente";
    g.setAttribute("transform", `scale(${W / vb.width} ${H / vb.height})`);
    for (const hijo of Array.from(capa.children)) {
      const c = copiar(hijo, refs);
      if (c) g.appendChild(c);
    }
    todo.appendChild(g);
  });
  // Tramas (y lo que usen a su vez) sacadas de DefsBosque
  const hechas = new Set<string>();
  while (refs.size > hechas.size) {
    for (const ref of Array.from(refs)) {
      if (hechas.has(ref)) continue;
      hechas.add(ref);
      if (raiz.querySelector(`[id="${ref}"]`)) continue;
      const def = document.getElementById(ref);
      if (!def) continue;
      const c = copiar(def, refs);
      if (c) {
        c.setAttribute("id", ref);
        defs.appendChild(c);
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(raiz)}\n`;
}

(window as unknown as { exportarSVG: typeof exportarSVG }).exportarSVG = exportarSVG;
