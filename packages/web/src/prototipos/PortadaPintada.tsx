import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import pinzaMadera from "../arte/cuerdas/pinza-madera.png";
import calcetinAzul from "../arte/prendas/calcetin-azul.png";
import calcetinBlanco from "../arte/prendas/calcetin-blanco.png";
import calcetinAmarillo from "../arte/prendas/calcetin-amarillo.png";
import camisetaRojo from "../arte/prendas/camiseta-rojo.png";
import camisetaAzul from "../arte/prendas/camiseta-azul.png";
import toallaAmarillo from "../arte/prendas/toalla-amarillo.png";
import toallaRojo from "../arte/prendas/toalla-rojo.png";

// Portada pintada a código: un jardín con valla y colinas bajo un cielo medio soleado, con una tormenta asomando
// por la derecha y un tendedero con la ropa del juego cruzando por abajo. Todo es SVG y CSS: las capas de la
// escena (cielo, nubes, tormenta, paisaje, lluvia, tendedero, hojas, luz) son SVG apilados que cubren la pantalla
// (viewBox 1920 × 1080, «slice»), y el título y los botones van en un escenario de 1920 × 1080 que se escala para
// caber entero. El aspecto de gouache sale de nubes hechas con muchas bolas difuminadas y de una textura de
// pincel (ruido de feTurbulence) que solo tiñe el RELLENO: nunca se desplazan los contornos.
//
// Las capas que se mueven (nubes) son elementos HTML con su SVG dentro y se animan con transform, para que el
// navegador las pinte una vez y solo las desplace.

export const ANCHO = 1920;
export const ALTO = 1080;

/** Generador pseudoaleatorio con semilla (mulberry32): la escena sale igual cada vez. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Una capa de la escena: SVG que cubre la pantalla con el sistema de coordenadas de 1920 × 1080. */
function Capa({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`pp-capa ${className ?? ""}`} style={style} aria-hidden>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="xMidYMid slice">
        {children}
      </svg>
    </div>
  );
}

/**
 * Textura de pincel para el relleno: dos ruidos estirados (uno oscurece y otro aclara), recortados por la forma
 * (SourceAlpha) y puestos encima. Las formas no se deforman.
 */
function FiltroPincel({ id, frec = "0.012 0.045", oscuro = 0.22, claro = 0.2, semilla = 3 }: { id: string; frec?: string; oscuro?: number; claro?: number; semilla?: number }) {
  return (
    <filter id={id} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={frec} numOctaves={4} seed={semilla} result="ruido" />
      <feColorMatrix in="ruido" type="matrix" values={`0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.02  ${(oscuro * 6).toFixed(2)} 0 0 0 ${(-oscuro * 3).toFixed(2)}`} result="osc" />
      <feColorMatrix in="ruido" type="matrix" values={`0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.86  0 ${(claro * 6).toFixed(2)} 0 0 ${(-claro * 3).toFixed(2)}`} result="cla" />
      <feComposite in="osc" in2="SourceAlpha" operator="in" result="osc2" />
      <feComposite in="cla" in2="SourceAlpha" operator="in" result="cla2" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="osc2" />
        <feMergeNode in="cla2" />
      </feMerge>
    </filter>
  );
}

// ---------- Cielo ----------

function Cielo() {
  return (
    <Capa className="pp-cielo">
      <defs>
        <linearGradient id="pp-cielo-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1557b0" />
          <stop offset="0.35" stopColor="#2a7ad0" />
          <stop offset="0.58" stopColor="#5fa9e2" />
          <stop offset="0.72" stopColor="#b9dcef" />
          <stop offset="1" stopColor="#f3e3c0" />
        </linearGradient>
        <linearGradient id="pp-cielo-tormenta" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#3b4458" stopOpacity="0" />
          <stop offset="0.85" stopColor="#3b4458" stopOpacity="0.45" />
          <stop offset="1" stopColor="#2c3344" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="pp-sol" cx="0.1" cy="0.06" r="0.5">
          <stop offset="0" stopColor="#fff6cf" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#ffe6a0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        {/* Trazos largos de pincel en el cielo, como en la gouache: claros y oscuros, muy estirados en horizontal. */}
        <filter id="pp-trazos-cielo" filterUnits="userSpaceOnUse" x="0" y="0" width={ANCHO} height={ALTO} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0011 0.028" numOctaves={3} seed={11} result="r" />
          <feColorMatrix in="r" type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.84  0 0 0 0 1  2.2 0 0 0 -1.2" result="claro" />
          <feColorMatrix in="r" type="matrix" values="0 0 0 0 0.03  0 0 0 0 0.2  0 0 0 0 0.55  0 2.0 0 0 -1.12" result="oscuro" />
          <feMerge>
            <feMergeNode in="oscuro" />
            <feMergeNode in="claro" />
          </feMerge>
        </filter>
      </defs>
      <rect width={ANCHO} height={ALTO} fill="url(#pp-cielo-g)" />
      <rect width={ANCHO} height={760} filter="url(#pp-trazos-cielo)" opacity={0.4} />
      <rect width={ANCHO} height={760} fill="url(#pp-cielo-tormenta)" />
      <rect width={ANCHO} height={ALTO} fill="url(#pp-sol)" />
    </Capa>
  );
}

// ---------- Nubes ----------

type Bola = [x: number, y: number, r: number];

/** Las bolas de una nube de cúmulo: base casi plana y más alta en el centro, con el borde irregular. */
function bolasNube(semilla: number, cx: number, cy: number, w: number, h: number, n = 26): Bola[] {
  const rnd = azar(semilla);
  const bolas: Bola[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.15 + rnd() * 0.7) / n;
    const env = Math.sin(Math.PI * u);
    const r = h * (0.12 + 0.24 * env * (0.55 + 0.45 * rnd()));
    const x = cx + (u - 0.5) * w;
    const y = cy + h * 0.5 - r * (0.85 + rnd() * 0.25) - env * h * 0.42 * rnd();
    bolas.push([x, y, r]);
  }
  // Base: elipses alargadas para que la nube asiente.
  for (let i = 0; i < 5; i++) {
    const u = (i + 0.5) / 5;
    bolas.push([cx + (u - 0.5) * w * 0.85, cy + h * 0.36, h * (0.14 + rnd() * 0.06)]);
  }
  // Y una panza ancha que alisa los festones de abajo.
  for (let i = 0; i < 3; i++) bolas.push([cx + (i - 1) * w * 0.26, cy + h * 0.2, h * 0.3]);
  return bolas;
}

type Tonos = { sombra: string; cuerpo: string; nucleo: string; luz: string };
const CREMA: Tonos = { sombra: "#e8a062", cuerpo: "#fbe9c8", nucleo: "#f4b878", luz: "#fffaf0" };
const GRIS: Tonos = { sombra: "#262b36", cuerpo: "#555d6b", nucleo: "#3c434f", luz: "#8d97a6" };

/** Una nube pintada: sombra anaranjada desplazada, cuerpo crema, núcleo cálido y luces arriba, todo difuminado. */
function Nube({ bolas, tonos, h, id, borde = 7 }: { bolas: Bola[]; tonos: Tonos; h: number; id: string; borde?: number }) {
  const circulos = (dx: number, dy: number, k: number, filtro?: (i: number) => boolean) =>
    bolas.filter((_, i) => !filtro || filtro(i)).map(([x, y, r], i) => <circle key={i} cx={x + dx} cy={y + dy} r={r * k} />);
  const xs = bolas.map((b) => b[0]);
  const ys = bolas.map((b) => b[1]);
  const caja: [number, number, number, number] = [Math.min(...xs) - h * 0.4, Math.min(...ys) - h * 0.4, Math.max(...xs) - Math.min(...xs) + h * 0.8, Math.max(...ys) - Math.min(...ys) + h * 0.7];
  return (
    <g filter={`url(#${id}-pincel)`}>
      <defs>
        <filter id={`${id}-b1`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={borde * 1.6} />
        </filter>
        <filter id={`${id}-b2`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={borde * 0.55} />
        </filter>
        <filter id={`${id}-b3`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={borde * 2.8} />
        </filter>
        <clipPath id={`${id}-forma`}>{circulos(0, 0, 0.98)}</clipPath>
        <filter id={`${id}-b0`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <FiltroPincel id={`${id}-pincel`} frec="0.018 0.04" oscuro={0.04} claro={0.05} semilla={id.length * 7} />
      </defs>
      {/* Halo cálido por fuera, abajo a la derecha */}
      <g fill={tonos.sombra} filter={`url(#${id}-b1)`} opacity={0.75}>
        {circulos(h * 0.04, h * 0.07, 1)}
      </g>
      {/* Cuerpo con el borde casi nítido */}
      <g fill={tonos.cuerpo} filter={`url(#${id}-b2)`}>
        {circulos(0, 0, 1)}
      </g>
      {/* Sombreado de dentro, recortado por la nube: núcleo cálido abajo y luces arriba a la izquierda */}
      <g clipPath={`url(#${id}-forma)`}>
        <g fill={tonos.sombra} filter={`url(#${id}-b3)`} opacity={0.55}>
          {circulos(h * 0.1, h * 0.28, 0.85)}
        </g>
        <g fill={tonos.nucleo} filter={`url(#${id}-b3)`} opacity={0.75}>
          {circulos(h * 0.05, h * 0.12, 0.55, (i) => i % 3 !== 0)}
        </g>
        <g fill={tonos.luz} filter={`url(#${id}-b3)`} opacity={0.9}>
          {circulos(-h * 0.06, -h * 0.14, 0.62, (i) => i % 2 === 0)}
        </g>
      </g>
      <Manchas semilla={h + caja[0]} n={Math.round(caja[2] / 16)} caja={caja} tonos={[tonos.luz, tonos.cuerpo, tonos.nucleo, tonos.luz]} clip={`${id}-forma`} tam={[16, 40]} filtro={`${id}-b0`} redondez={0.45} />
    </g>
  );
}

function Nubes() {
  return (
    <>
      <Capa className="pp-nubes pp-deriva-a">
        <Nube id="pp-n1" bolas={bolasNube(4, 170, 150, 820, 380, 30)} tonos={CREMA} h={380} borde={8} />
        <Nube id="pp-n2" bolas={bolasNube(9, 40, 420, 470, 240, 18)} tonos={CREMA} h={240} />
      </Capa>
      <Capa className="pp-nubes pp-deriva-b">
        <Nube id="pp-n3" bolas={bolasNube(21, 1260, 330, 560, 250, 22)} tonos={CREMA} h={250} />
        <Nube id="pp-n4" bolas={bolasNube(33, 720, 545, 640, 120, 18)} tonos={CREMA} h={120} borde={6} />
      </Capa>
    </>
  );
}

// ---------- Tormenta ----------

function Tormenta() {
  return (
    <>
      <Capa className="pp-nubes pp-deriva-c">
        <Nube id="pp-tormenta" bolas={bolasNube(57, 1790, 170, 720, 360, 28)} tonos={GRIS} h={360} borde={9} />
        <Nube id="pp-tormenta2" bolas={bolasNube(61, 1880, 330, 380, 200, 14)} tonos={GRIS} h={200} borde={8} />
      </Capa>
      <Capa className="pp-relampago">
        <defs>
          <radialGradient id="pp-destello">
            <stop offset="0" stopColor="#fffbe8" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fffbe8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={1720} cy={220} rx={420} ry={260} fill="url(#pp-destello)" />
      </Capa>
    </>
  );
}

function Lluvia() {
  return (
    <Capa className="pp-lluvia">
      <defs>
        <pattern id="pp-gotas" width={60} height={160} patternUnits="userSpaceOnUse">
          <g stroke="#e4edf6" strokeWidth={2.2} strokeLinecap="round">
            <path d="M14 6 l-11 34" opacity={0.75} />
            <path d="M44 62 l-11 34" opacity={0.55} />
            <path d="M28 112 l-11 34" opacity={0.7} />
          </g>
        </pattern>
        <linearGradient id="pp-lluvia-mascara-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.95" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pp-lluvia-mascara-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.68" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="pp-lluvia-mascara" maskUnits="userSpaceOnUse" x="0" y="0" width={ANCHO} height={ALTO}>
          <rect width={ANCHO} height={760} fill="url(#pp-lluvia-mascara-g)" />
        </mask>
        <mask id="pp-lluvia-mascara2" maskUnits="userSpaceOnUse" x="0" y="0" width={ANCHO} height={ALTO}>
          <rect width={ANCHO} height={ALTO} fill="url(#pp-lluvia-mascara-h)" />
        </mask>
      </defs>
      <g mask="url(#pp-lluvia-mascara2)">
        <g mask="url(#pp-lluvia-mascara)">
          <g className="pp-gotas">
            <rect x={1200} y={0} width={800} height={1000} fill="url(#pp-gotas)" />
          </g>
        </g>
      </g>
    </Capa>
  );
}

// ---------- Paisaje: colinas, casa, árboles, valla y césped ----------

/** Pinceladas sueltas (manchas alargadas) de varios tonos, recortadas por la forma. */
function Manchas({ semilla, n, caja, tonos, clip, tam = [6, 20], filtro = "pp-difumina", redondez = 0 }: { semilla: number; n: number; caja: [number, number, number, number]; tonos: string[]; clip: string; tam?: [number, number]; filtro?: string; redondez?: number }) {
  const rnd = azar(semilla);
  const [x0, y0, w, h] = caja;
  return (
    <g clipPath={`url(#${clip})`}>
      <g filter={`url(#${filtro})`}>
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + rnd() * w;
        const y = y0 + rnd() * h;
        const rx = tam[0] + rnd() * (tam[1] - tam[0]);
        const ry = 2 + rx * (0.12 + redondez + rnd() * 0.14);
        return <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={tonos[i % tonos.length]} opacity={0.2 + rnd() * 0.3} transform={`rotate(${(rnd() - 0.5) * 36} ${x} ${y})`} />;
      })}
      </g>
    </g>
  );
}

/** Mechones de hierba: trazos curvos cortos. */
function Hierba({ semilla, n, caja, tonos }: { semilla: number; n: number; caja: [number, number, number, number]; tonos: string[] }) {
  const rnd = azar(semilla);
  const [x0, y0, w, h] = caja;
  return (
    <g fill="none" strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + rnd() * w;
        const y = y0 + rnd() * h;
        const alto = 10 + rnd() * 18 * (0.6 + (y - y0) / h);
        const inc = (rnd() - 0.4) * alto * 0.6;
        return <path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)} q${(inc * 0.3).toFixed(1)} ${(-alto * 0.6).toFixed(1)} ${inc.toFixed(1)} ${(-alto).toFixed(1)}`} stroke={tonos[i % tonos.length]} strokeWidth={2 + rnd() * 2.2} opacity={0.55 + rnd() * 0.35} />;
      })}
    </g>
  );
}

function Arbol({ x, y, r, semilla }: { x: number; y: number; r: number; semilla: number }) {
  const rnd = azar(semilla);
  const copa = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + rnd();
    return [x + Math.cos(a) * r * 0.5, y - r * 0.9 + Math.sin(a) * r * 0.4, r * (0.5 + rnd() * 0.18)] as const;
  });
  const id = `pp-copa-${semilla}`;
  return (
    <g>
      <path d={`M${x - r * 0.1} ${y} L${x - r * 0.07} ${y - r * 0.9} L${x + r * 0.07} ${y - r * 0.9} L${x + r * 0.12} ${y} Z`} fill="#6b4426" />
      <clipPath id={id}>
        {copa.map(([cx, cy, rr], i) => (
          <circle key={i} cx={cx} cy={cy} r={rr} />
        ))}
      </clipPath>
      <g>
        {copa.map(([cx, cy, rr], i) => (
          <circle key={i} cx={cx} cy={cy} r={rr} fill="#3f8a3a" />
        ))}
      </g>
      <g clipPath={`url(#${id})`}>
        <circle cx={x + r * 0.35} cy={y - r * 0.45} r={r * 0.85} fill="#2c6a2e" opacity={0.55} />
        <g filter="url(#pp-difumina)">
          {copa.map(([cx, cy, rr], i) => (
            <g key={i}>
              <circle cx={cx - rr * 0.18} cy={cy - rr * 0.22} r={rr * 0.72} fill="#5ea544" />
              <circle cx={cx - rr * 0.32} cy={cy - rr * 0.4} r={rr * 0.36} fill="#9fd060" opacity={0.85} />
            </g>
          ))}
        </g>
      </g>
      <Manchas semilla={semilla + 1} n={40} caja={[x - r * 1.2, y - r * 1.8, r * 2.4, r * 1.8]} tonos={["#a6d466", "#2f6b2c", "#6fae48"]} clip={id} tam={[4, 12]} />
    </g>
  );
}

function Casa({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-6} y={-92} width={14} height={30} fill="#8a4a32" />
      <path d="M-70 -40 L0 -96 L70 -40 Z" fill="#c4563a" />
      <path d="M-70 -40 L0 -96 L8 -90 L-58 -38 Z" fill="#dd7a52" opacity={0.7} />
      <rect x={-58} y={-42} width={116} height={52} fill="#f2e2c2" />
      <rect x={-58} y={-42} width={116} height={10} fill="#d8bf98" opacity={0.6} />
      <rect x={-14} y={-20} width={24} height={30} fill="#8a5332" />
      <rect x={20} y={-28} width={24} height={18} fill="#9ccbe0" />
      <rect x={-46} y={-28} width={22} height={18} fill="#9ccbe0" />
      <path d="M32 -28 v18 M20 -19 h24 M-35 -28 v18 M-46 -19 h22" stroke="#f2e2c2" strokeWidth={2.5} />
    </g>
  );
}

/** Valla de tablas de punta, con algo de variación en altura y tono. */
function Valla() {
  const rnd = azar(77);
  const tablas: ReactNode[] = [];
  for (let x = -10, i = 0; x < ANCHO + 30; x += 38, i++) {
    const alto = 108 + rnd() * 12;
    const base = 742;
    const tono = ["#cf9a62", "#c48a52", "#d6a670", "#bf8450"][i % 4];
    tablas.push(
      <g key={i}>
        <path d={`M${x} ${base} V${base - alto + 12} L${x + 14} ${base - alto} L${x + 28} ${base - alto + 12} V${base} Z`} fill={tono} stroke="#6e4322" strokeWidth={2.2} strokeLinejoin="round" />
        <path d={`M${x + 20} ${base - alto + 14} V${base - 6}`} stroke="#9c6436" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
        <path d={`M${x + 5} ${base - alto + 16} V${base - 30}`} stroke="#f2cf9a" strokeWidth={3} opacity={0.4} strokeLinecap="round" />
      </g>,
    );
  }
  return (
    <g filter="url(#pp-pincel-valla)">
      <rect x={0} y={652} width={ANCHO} height={16} fill="#a8703f" stroke="#6e4322" strokeWidth={2} />
      <rect x={0} y={706} width={ANCHO} height={16} fill="#a8703f" stroke="#6e4322" strokeWidth={2} />
      {tablas}
    </g>
  );
}

function Flores() {
  const rnd = azar(101);
  const colores = ["#fff6e6", "#f7d34a", "#f29ab5", "#ffffff", "#e86f5a"];
  return (
    <g>
      {Array.from({ length: 46 }, (_, i) => {
        const x = rnd() * ANCHO;
        const y = 770 + rnd() * 300;
        const s = 0.7 + ((y - 770) / 300) * 0.8;
        const c = colores[i % colores.length];
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={0} cy={-4.5} rx={3} ry={4.8} fill={c} transform={`rotate(${a})`} />
            ))}
            <circle r={2.6} fill={c === "#f7d34a" ? "#c86a1e" : "#f2b632"} />
          </g>
        );
      })}
    </g>
  );
}

const COLINA_LEJOS = "M0 560 C 220 500, 420 470, 640 520 S 1020 575, 1220 515 S 1640 445, 1920 505 L1920 780 L0 780 Z";
const COLINA_IZQ = "M0 590 C 160 530, 400 525, 640 585 S 940 650, 1060 660 L1060 780 L0 780 Z";
const COLINA_DER = "M780 660 C 980 610, 1240 560, 1500 572 S 1800 600, 1920 585 L1920 780 L780 780 Z";
const CESPED = "M0 722 C 400 704, 900 732, 1300 710 S 1800 704, 1920 716 L1920 1080 L0 1080 Z";

function Paisaje() {
  return (
    <Capa className="pp-paisaje">
      <defs>
        <filter id="pp-difumina" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
        <FiltroPincel id="pp-pincel-tierra" frec="0.022 0.04" oscuro={0.07} claro={0.06} semilla={5} />
        <FiltroPincel id="pp-pincel-valla" frec="0.004 0.09" oscuro={0.2} claro={0.12} semilla={8} />
        <linearGradient id="pp-lejos-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fbf98" />
          <stop offset="1" stopColor="#6ea67a" />
        </linearGradient>
        <linearGradient id="pp-izq-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9bcb57" />
          <stop offset="0.5" stopColor="#5f9f40" />
        </linearGradient>
        <linearGradient id="pp-der-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fae52" />
          <stop offset="0.6" stopColor="#4f8a3c" />
        </linearGradient>
        <linearGradient id="pp-cesped-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8cc84c" />
          <stop offset="0.35" stopColor="#62a83a" />
          <stop offset="1" stopColor="#3d7d28" />
        </linearGradient>
        <radialGradient id="pp-cesped-luz" cx="0.3" cy="0.25" r="0.6">
          <stop offset="0" stopColor="#e8f08a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e8f08a" stopOpacity="0" />
        </radialGradient>
        <clipPath id="pp-clip-lejos">
          <path d={COLINA_LEJOS} />
        </clipPath>
        <clipPath id="pp-clip-izq">
          <path d={COLINA_IZQ} />
        </clipPath>
        <clipPath id="pp-clip-der">
          <path d={COLINA_DER} />
        </clipPath>
        <clipPath id="pp-clip-cesped">
          <path d={CESPED} />
        </clipPath>
      </defs>
      <g filter="url(#pp-pincel-tierra)">
        <path d={COLINA_LEJOS} fill="url(#pp-lejos-g)" />
        <Manchas semilla={2} n={90} caja={[0, 440, ANCHO, 200]} tonos={["#b4d7a8", "#5f9670", "#a3cc8e"]} clip="pp-clip-lejos" tam={[10, 34]} />
        <path d={COLINA_IZQ} fill="url(#pp-izq-g)" />
        <Manchas semilla={3} n={160} caja={[0, 520, 1060, 200]} tonos={["#c4e070", "#3e7d33", "#a9d45e", "#eadb72"]} clip="pp-clip-izq" tam={[6, 26]} />
        <path d={COLINA_DER} fill="url(#pp-der-g)" />
        <Manchas semilla={4} n={150} caja={[780, 555, 1140, 200]} tonos={["#a9d06a", "#3a7333", "#8fbf5a"]} clip="pp-clip-der" tam={[6, 24]} />
        <Casa x={1560} y={584} />
        <Arbol x={120} y={660} r={110} semilla={12} />
        <Arbol x={330} y={668} r={72} semilla={13} />
        <Arbol x={1690} y={650} r={84} semilla={14} />
        <Arbol x={1860} y={664} r={70} semilla={15} />
      </g>
      <Valla />
      <g filter="url(#pp-pincel-tierra)">
        <path d={CESPED} fill="url(#pp-cesped-g)" />
        <path d={CESPED} fill="url(#pp-cesped-luz)" />
        <Manchas semilla={6} n={420} caja={[0, 700, ANCHO, 380]} tonos={["#b9dc62", "#3b7a2a", "#8cc84c", "#e3e07a", "#2f6a22"]} clip="pp-clip-cesped" tam={[6, 28]} />
      </g>
      <Hierba semilla={7} n={260} caja={[0, 728, ANCHO, 40]} tonos={["#3b7a2a", "#9fd05a", "#2f6a22"]} />
      <Hierba semilla={8} n={360} caja={[0, 790, ANCHO, 300]} tonos={["#2f6a22", "#a8d860", "#4a8f30"]} />
      <Flores />
    </Capa>
  );
}

// ---------- Tendedero de abajo ----------

/** Cuerda del tendedero: Bézier cuadrática de poste a poste con el control en medio (x lineal en t). */
const POSTE_I = 200;
const POSTE_D = 1720;
const CUERDA_Y = 745;
const COMBA = 140;
const cuerdaAbajo = (x: number) => {
  const t = (x - POSTE_I) / (POSTE_D - POSTE_I);
  return CUERDA_Y + 4 * COMBA * t * (1 - t);
};
const pendiente = (x: number) => {
  const t = (x - POSTE_I) / (POSTE_D - POSTE_I);
  return (Math.atan((4 * COMBA * (1 - 2 * t)) / (POSTE_D - POSTE_I)) * 180) / Math.PI;
};

type Colgada = { src: string; x: number; w: number; pinzas: number[] };
const ROPA: Colgada[] = [
  { src: calcetinAzul, x: 318, w: 128, pinzas: [-8] },
  { src: camisetaRojo, x: 500, w: 206, pinzas: [-66, 66] },
  { src: toallaAmarillo, x: 742, w: 214, pinzas: [-84, 84] },
  { src: calcetinBlanco, x: 948, w: 122, pinzas: [-8] },
  { src: camisetaAzul, x: 1290, w: 196, pinzas: [-62, 62] },
  { src: toallaRojo, x: 1500, w: 196, pinzas: [-76, 76] },
  { src: calcetinAmarillo, x: 1650, w: 112, pinzas: [-8] },
];

function PinzaCuerda({ x, y, giro, alto = 50 }: { x: number; y: number; giro: number; alto?: number }) {
  const ancho = (alto * 100) / 218;
  return <image href={pinzaMadera} x={x - ancho / 2} y={y - alto * 0.45} width={ancho} height={alto} transform={`rotate(${giro} ${x} ${y})`} />;
}

function Poste({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 15} y={CUERDA_Y - 30} width={30} height={420} rx={4} fill="#b98a5a" stroke="#5a3418" strokeWidth={3} />
      <rect x={x - 15} y={CUERDA_Y - 30} width={11} height={420} fill="#e2b984" opacity={0.55} />
      <rect x={x + 6} y={CUERDA_Y - 30} width={9} height={420} fill="#7e5230" opacity={0.4} />
      <rect x={x - 32} y={CUERDA_Y - 44} width={64} height={18} rx={5} fill="#e9d2a6" stroke="#5a3418" strokeWidth={3} />
      <rect x={x - 24} y={CUERDA_Y - 28} width={48} height={8} rx={3} fill="#cfae7c" stroke="#5a3418" strokeWidth={2.5} />
      <circle cx={x} cy={CUERDA_Y} r={6} fill="#6e4322" />
    </g>
  );
}

function Pajaro({ x }: { x: number }) {
  const y = cuerdaAbajo(x) - 3;
  return (
    <g className="pp-pajaro" transform={`translate(${x} ${y})`}>
      <path d="M-4 0 l-4 -14 M6 0 l2 -14" stroke="#5a3418" strokeWidth={3} strokeLinecap="round" />
      <path d="M-30 -30 L-62 -18 L-58 -10 L-28 -20 Z" fill="#7a3f18" stroke="#4a2a14" strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={0} cy={-30} rx={32} ry={20} fill="#d07a34" stroke="#4a2a14" strokeWidth={3} transform="rotate(-12 0 -30)" />
      <ellipse cx={6} cy={-22} rx={20} ry={11} fill="#f2c08a" opacity={0.8} transform="rotate(-12 6 -22)" />
      <path d="M-22 -36 Q0 -50 18 -36 Q2 -24 -22 -30 Z" fill="#8a4a1c" stroke="#4a2a14" strokeWidth={2.5} strokeLinejoin="round" />
      <g className="pp-cabeza">
        <circle cx={26} cy={-48} r={15} fill="#d07a34" stroke="#4a2a14" strokeWidth={3} />
        <path d="M39 -50 L52 -46 L39 -42 Z" fill="#f2b632" stroke="#4a2a14" strokeWidth={2} strokeLinejoin="round" />
        <circle cx={30} cy={-51} r={3.2} fill="#2b2019" />
        <circle cx={31} cy={-52} r={1} fill="#fff" />
      </g>
    </g>
  );
}

function Tendedero() {
  const d = `M${POSTE_I} ${CUERDA_Y} Q${(POSTE_I + POSTE_D) / 2} ${CUERDA_Y + 2 * COMBA} ${POSTE_D} ${CUERDA_Y}`;
  return (
    <>
      {/* Capa quieta: sombras de la ropa en la hierba y los postes (el filtro de sombra se calcula una sola vez). */}
      <Capa className="pp-tendedero-fijo">
        <defs>
          <filter id="pp-sombra-ropa" x="-20%" y="-20%" width="140%" height="150%" colorInterpolationFilters="sRGB">
            <feFlood floodColor="#1c3a10" floodOpacity={0.32} />
            <feComposite in2="SourceAlpha" operator="in" />
            <feGaussianBlur stdDeviation={6} />
          </filter>
        </defs>
        <g filter="url(#pp-sombra-ropa)">
          {ROPA.map((p, i) => {
            const y = cuerdaAbajo(p.x);
            const h = (p.w * 342) / 384;
            return <image key={i} href={p.src} x={p.x - p.w / 2 + 7} y={y - h * 0.1 + 12} width={p.w} height={h} transform={`rotate(${pendiente(p.x) * 0.6} ${p.x} ${y})`} />;
          })}
        </g>
        <Poste x={POSTE_I} />
        <Poste x={POSTE_D} />
      </Capa>
      <TendederoMovil d={d} />
    </>
  );
}

/** Capa que se mece: la cuerda, la ropa con sus pinzas y el pájaro (sin filtros, para repintarla barata). */
function TendederoMovil({ d }: { d: string }) {
  return (
    <Capa className="pp-tendedero">
      <defs>
        <pattern id="pp-esparto" width={9} height={9} patternUnits="userSpaceOnUse">
          <rect width={9} height={9} fill="#d9ad6e" />
          <path d="M-2 11 L11 -2" stroke="#92612f" strokeWidth={2.6} />
          <path d="M-2 7 L7 -2 M4 13 L13 4" stroke="#f3d39c" strokeWidth={1.3} />
        </pattern>
      </defs>
      <g className="pp-cuerda-baja">
        <path d={d} fill="none" stroke="#4b2a12" strokeWidth={9} strokeLinecap="round" />
        <path d={d} fill="none" stroke="url(#pp-esparto)" strokeWidth={5.5} strokeLinecap="round" />
      </g>
      {ROPA.map((p, i) => {
        const y = cuerdaAbajo(p.x);
        const h = (p.w * 342) / 384;
        const giro = pendiente(p.x) * 0.6;
        const bote = 6 * 4 * ((p.x - POSTE_I) / (POSTE_D - POSTE_I)) * (1 - (p.x - POSTE_I) / (POSTE_D - POSTE_I));
        return (
          <g key={i} className="pp-bote" style={{ "--bote": `${bote.toFixed(1)}px` } as CSSProperties}>
            <g className="pp-colgada" style={{ transformOrigin: `${p.x}px ${y}px`, animationDelay: `${-i * 0.9}s`, animationDuration: `${3.6 + (i % 3) * 0.7}s` }}>
              <g transform={`rotate(${giro} ${p.x} ${y})`}>
                <image href={p.src} x={p.x - p.w / 2} y={y - h * 0.1} width={p.w} height={h} />
                {p.pinzas.map((dx) => (
                  <PinzaCuerda key={dx} x={p.x + dx} y={y + 2} giro={0} />
                ))}
              </g>
            </g>
          </g>
        );
      })}
      <g className="pp-bote" style={{ "--bote": "5.6px" } as CSSProperties}>
        <Pajaro x={1120} />
      </g>
    </Capa>
  );
}

// ---------- Hojas volando y luz ----------

const HOJAS = [
  { top: 22, dur: 19, retraso: -3, c: "#9cc94a", s: 1 },
  { top: 48, dur: 23, retraso: -12, c: "#c9d65a", s: 0.8 },
  { top: 12, dur: 27, retraso: -20, c: "#7fb240", s: 0.7 },
  { top: 64, dur: 21, retraso: -7, c: "#e0b84a", s: 0.9 },
  { top: 35, dur: 31, retraso: -26, c: "#a9cf55", s: 0.65 },
];

function Hojas() {
  return (
    <div className="pp-hojas" aria-hidden>
      {HOJAS.map((h, i) => (
        <div key={i} className="pp-hoja" style={{ top: `${h.top}%`, animationDuration: `${h.dur}s`, animationDelay: `${h.retraso}s` }}>
          <svg viewBox="0 0 40 24" style={{ width: `${36 * h.s}px`, animationDelay: `${h.retraso * 0.3}s` }}>
            <path d="M2 12 C 10 1, 28 0, 38 12 C 28 22, 10 22, 2 12 Z" fill={h.c} />
            <path d="M4 12 C 14 10, 26 10, 36 12" stroke="#4d7a22" strokeWidth={1.6} fill="none" opacity={0.7} />
            <path d="M8 9 C 16 5, 26 5, 32 9" stroke="#ffffff" strokeWidth={1.6} fill="none" opacity={0.35} />
          </svg>
        </div>
      ))}
    </div>
  );
}

/** El fondo pintado entero (todas las capas, de atrás a delante). */
export function EscenaPintada() {
  return (
    <div className="pp-escena" aria-hidden>
      <Cielo />
      <Nubes />
      <Tormenta />
      <Paisaje />
      <Lluvia />
      <Tendedero />
      <Hojas />
      <div className="pp-luz" />
    </div>
  );
}

// ---------- Título colgado ----------

/** Cuerda de arriba, de la que cuelgan las letras del título (en coordenadas del escenario de 1920 × 1080). */
const cuerdaArriba = (x: number) => {
  const t = (x + 40) / 2000;
  return 46 + 2 * 120 * t * (1 - t);
};

/** Letras del título con su ancho aproximado (en px, a 196 px de cuerpo) y cuánto sube la caja para pinzarla arriba. */
const LETRAS: { l: string; w: number; alta: boolean }[] = [
  { l: "T", w: 112, alta: true },
  { l: "e", w: 110, alta: false },
  { l: "n", w: 112, alta: false },
  { l: "d", w: 116, alta: true },
  { l: "e", w: 110, alta: false },
  { l: "d", w: 116, alta: true },
  { l: "e", w: 110, alta: false },
  { l: "r", w: 80, alta: false },
  { l: "o", w: 112, alta: false },
];

export function TituloColgado() {
  const hueco = 14;
  const total = LETRAS.reduce((s, l) => s + l.w, 0) + hueco * (LETRAS.length - 1);
  let x = ANCHO / 2 - total / 2;
  const d = `M-40 46 Q${ANCHO / 2} ${46 + 120} ${ANCHO + 40} 46`;
  return (
    <div className="pp-titulo" role="img" aria-label="Tendedero">
      <svg className="pp-cuerda-alta" viewBox={`0 0 ${ANCHO} 300`} aria-hidden>
        <path d={d} fill="none" stroke="#4b2a12" strokeWidth={10} strokeLinecap="round" />
        <path d={d} fill="none" stroke="url(#pp-esparto-ui)" strokeWidth={6.5} strokeLinecap="round" />
        <defs>
          <pattern id="pp-esparto-ui" width={10} height={10} patternUnits="userSpaceOnUse">
            <rect width={10} height={10} fill="#d9ad6e" />
            <path d="M-2 12 L12 -2" stroke="#92612f" strokeWidth={2.8} />
            <path d="M-2 8 L8 -2 M4 14 L14 4" stroke="#f3d39c" strokeWidth={1.4} />
          </pattern>
        </defs>
      </svg>
      {LETRAS.map((letra, i) => {
        const cx = x + letra.w / 2;
        x += letra.w + hueco;
        const y = cuerdaArriba(cx);
        return (
          <div
            key={i}
            className={`pp-letra ${letra.alta ? "alta" : "baja"}`}
            style={{ left: `${cx}px`, top: `${y}px`, animationDelay: `${-i * 0.55}s` } as CSSProperties}
            aria-hidden
          >
            <span>{letra.l}</span>
            <img className="pp-pinza-letra" src={pinzaMadera} alt="" draggable={false} />
          </div>
        );
      })}
    </div>
  );
}

// ---------- Iconos de los botones (mismo trazo marrón) ----------

const TRAZO = { stroke: "#4a2a14", strokeWidth: 4.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function IconoLibro() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <path d="M8 22 Q24 14 40 22 V66 Q24 58 8 66 Z" fill="#fbf1dc" {...TRAZO} />
      <path d="M72 22 Q56 14 40 22 V66 Q56 58 72 66 Z" fill="#f3e2bf" {...TRAZO} />
      <path d="M15 32 Q24 28 32 32 M15 42 Q24 38 32 42 M15 52 Q24 48 32 52" fill="none" {...TRAZO} strokeWidth={2.6} opacity={0.6} />
      {/* Calcetín asomando por la página derecha */}
      <path d="M50 12 h14 v24 q0 4 3 7 l6 6 q4 5 -1 10 q-5 5 -10 0 l-11 -11 q-3 -3 -3 -8 Z" fill="#4f86c6" {...TRAZO} />
      <path d="M50 12 h14 v7 h-14 Z" fill="#e8eef6" {...TRAZO} strokeWidth={3.5} />
      <path d="M51 27 h12" stroke="#e8eef6" strokeWidth={3.5} strokeLinecap="round" />
    </svg>
  );
}

export function IconoGlobo() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <path d="M18 54 A28 28 0 0 0 62 54" fill="none" {...TRAZO} />
      <path d="M40 64 V72 M28 74 H52" fill="none" {...TRAZO} />
      <circle cx={40} cy={36} r={24} fill="#5fa6dc" {...TRAZO} />
      <path d="M26 24 q6 -4 12 0 q2 6 -4 9 q-4 3 -2 8 q-6 2 -9 -4 q-3 -7 3 -13 Z" fill="#7cbf4e" stroke="#4a2a14" strokeWidth={3} strokeLinejoin="round" />
      <path d="M46 38 q6 -3 11 2 q1 8 -6 12 q-4 2 -5 -4 q-3 -5 0 -10 Z" fill="#7cbf4e" stroke="#4a2a14" strokeWidth={3} strokeLinejoin="round" />
      <path d="M16 36 H64 M40 12 Q28 36 40 60 M40 12 Q52 36 40 60" fill="none" stroke="#4a2a14" strokeWidth={2.2} opacity={0.45} />
      <path d="M28 20 q4 -3 9 -3" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />
    </svg>
  );
}

export function IconoMedalla() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <path d="M24 6 L36 34 L46 30 L36 6 Z" fill="#d9573e" {...TRAZO} />
      <path d="M56 6 L44 34 L34 30 L44 6 Z" fill="#4f86c6" {...TRAZO} />
      <circle cx={40} cy={52} r={20} fill="#f2b632" {...TRAZO} />
      <circle cx={40} cy={52} r={13} fill="#f7cf5c" stroke="#b9801c" strokeWidth={2.5} />
      <path d="M40 43 l3 6 6.5 1 -4.8 4.5 1.2 6.5 -5.9 -3 -5.9 3 1.2 -6.5 -4.8 -4.5 6.5 -1 Z" fill="#fff3c4" stroke="#b9801c" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

/** Rueda dentada de 8 dientes, generada. */
export function IconoEngranaje() {
  const pts: string[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const p = (ang: number, r: number) => `${(40 + Math.cos(ang) * r).toFixed(1)} ${(40 + Math.sin(ang) * r).toFixed(1)}`;
    const paso = (Math.PI * 2) / n;
    pts.push(p(a - paso * 0.3, 24), p(a - paso * 0.17, 33), p(a + paso * 0.17, 33), p(a + paso * 0.3, 24));
  }
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <path d={`M${pts.join(" L")} Z`} fill="#e4ba7a" {...TRAZO} />
      <circle cx={40} cy={40} r={10} fill="#8a5a34" {...TRAZO} />
      <path d="M26 30 a17 17 0 0 1 10 -8" stroke="#fff3d6" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />
    </svg>
  );
}

export function IconoPuerta() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <path d="M16 72 V22 Q16 10 30 10 H38 Q52 10 52 22 V72 Z" fill="#c8693f" {...TRAZO} />
      <path d="M22 66 V24 Q22 16 30 16 H38 Q46 16 46 24 V66" fill="none" stroke="#8a3e22" strokeWidth={3} strokeLinecap="round" />
      <circle cx={42} cy={44} r={3.4} fill="#f2b632" stroke="#4a2a14" strokeWidth={2} />
      <path d="M10 72 H58" {...TRAZO} />
      <path d="M56 40 H72 M65 32 L73 40 L65 48" fill="none" {...TRAZO} stroke="#f3e2bf" strokeWidth={8} />
      <path d="M56 40 H72 M65 32 L73 40 L65 48" fill="none" {...TRAZO} />
    </svg>
  );
}

/** Pinza de madera que se engancha a un botón (da un saltito al pasar el ratón). */
export function PinzaBoton({ className }: { className?: string }) {
  return <img className={`pp-pinza-boton ${className ?? ""}`} src={pinzaMadera} alt="" draggable={false} />;
}

// ---------- Escalado del escenario ----------

/** Escala del escenario de 1920 × 1080 para que quepa entero en el contenedor. */
export function useEscala() {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setK(Math.min(el.clientWidth / ANCHO, el.clientHeight / ALTO) || 1);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, k };
}
