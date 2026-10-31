import type { ReactElement } from "react";
import { TINTA_CARTA, TONOS } from "./ArtePrendas";

// Piezas de la carta de cuerda en el estilo «cozy» (el de la carta de prenda): soga de esparto de dos hilos
// retorcidos con contorno de tinta, pinzas de madera (o del color de la carta) con su muelle, e iconos de los
// medallones. Todo es SVG limpio, sin filtros que deformen los trazos. Unidades de la carta: 180 × 128.

const T = TINTA_CARTA;

/** Colores de cada carta de cuerda: fondo (marco de acuarela) y tono oscuro (filete discontinuo, sombras). */
export const COLORES_CUERDA: Record<string, { fondo: string; oscuro: string }> = {
  basica: { fondo: "#ecd8ad", oscuro: "#b38b52" },
  tejadillo: { fondo: "#ea8a7c", oscuro: "#b9493b" },
  resistente: { fondo: "#b7bbbe", oscuro: "#6c757b" },
  "secado-rapido": { fondo: "#f4cc63", oscuro: "#c18f1f" },
  fragil: { fondo: "#ccb790", oscuro: "#8a734f" },
  blanco: { fondo: "#eee6d4", oscuro: "#ae9f84" },
  azul: { fondo: "#80aadd", oscuro: "#2c69ad" },
  rojo: { fondo: "#ea8a7c", oscuro: "#b9493b" },
  amarillo: { fondo: "#f4cc63", oscuro: "#c18f1f" },
};

type Punto = [number, number];
/** Punto y tangente (unitaria) de una curva cuadrática. */
function cuadratica(a: Punto, c: Punto, b: Punto, t: number): { p: Punto; d: Punto } {
  const u = 1 - t;
  const p: Punto = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  const dx = 2 * u * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
  const dy = 2 * u * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
  const l = Math.hypot(dx, dy) || 1;
  return { p, d: [dx / l, dy / l] };
}

/**
 * Soga de esparto de borde a borde: contorno de tinta, hilo oscuro de fondo y vueltas claras en diagonal que
 * dibujan los dos hilos retorcidos. `vieja`: deshilachada y con huecos; `gruesa`: gris y reforzada.
 */
export function SogaCozy({ a, c, b, gruesa = false, vieja = false }: { a: Punto; c: Punto; b: Punto; gruesa?: boolean; vieja?: boolean }) {
  const d = `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
  const ancho = gruesa ? 6.4 : 4.6;
  const claro = gruesa ? "#d3d7da" : vieja ? "#dcc9a2" : "#efd9a8";
  const oscuro = gruesa ? "#737b81" : vieja ? "#9a8261" : "#b98d54";
  const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (gruesa ? 3.6 : 3.1));
  const vueltas: ReactElement[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // En la vieja faltan algunas vueltas (la soga está gastada)
    if (vieja && (i % 9 === 4 || i % 13 === 7)) continue;
    const { p, d: [dx, dy] } = cuadratica(a, c, b, t);
    const nx = -dy;
    const ny = dx;
    const h = ancho * 0.42;
    const s = ancho * 0.36;
    vueltas.push(<path key={i} d={`M${p[0] + nx * h - dx * s} ${p[1] + ny * h - dy * s} L${p[0] - nx * h + dx * s} ${p[1] - ny * h + dy * s}`} />);
  }
  return (
    <g className="soga">
      <path className="cuerda-trazo" d={d} pathLength={1} fill="none" stroke={T} strokeWidth={ancho + 1.8} strokeLinecap="round" />
      <path className="cuerda-trazo" d={d} pathLength={1} fill="none" stroke={oscuro} strokeWidth={ancho} strokeLinecap="round" />
      <g className="cuerda-trenza" stroke={claro} strokeWidth={gruesa ? 1.9 : 1.45} strokeLinecap="round">
        {vueltas}
      </g>
      {/* Raya de luz por encima, a lo largo */}
      <path d={d} fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth=".8" transform={`translate(0 ${-ancho * 0.22})`} />
      {gruesa && (
        // Refuerzo: alma de acero que asoma entre los hilos
        <path d={d} fill="none" stroke="#5d666c" strokeWidth=".7" strokeDasharray="1.2 5" opacity=".7" />
      )}
    </g>
  );
}

/**
 * Pinza de madera (o del color de las pinzas) con su muelle, en x. Ocupa lo mismo que PinzaBosque
 * (9 de ancho, de y −2 a 18) para que las prendas sigan colgando del mismo sitio.
 */
export function PinzaCozy({ x, color }: { x: number; color?: string }) {
  const tono = color ? TONOS[color] : undefined;
  const base = tono?.base ?? "#d8a464";
  const sombra = tono?.sombra ?? "#a8733d";
  return (
    <g transform={`translate(${x} 0)`} className="pinza-cozy">
      <rect x="-4.1" y="-1.4" width="9.2" height="20" rx="2" fill={T} />
      <rect x="-4.6" y="-2" width="9.2" height="20" rx="2" fill={base} stroke={T} strokeWidth="1.3" />
      {/* Las dos patas de la pinza, con la ranura en medio y algo de veta o brillo */}
      <path d="M2 -1 V17" stroke={sombra} strokeWidth="2.4" opacity=".55" />
      <path d="M0 -1.2 V17.2" stroke={T} strokeWidth=".8" opacity=".7" />
      <path d="M-2.7 0 V15.6" stroke="#fff" strokeWidth="1" opacity=".45" strokeLinecap="round" />
      {!tono && <path d="M-1.6 2 C-1 6 -1.9 10 -1.2 15 M2.4 1.4 C2.8 5 2.1 9 2.6 13" stroke="#9c6d3a" strokeWidth=".45" opacity=".55" fill="none" />}
      {/* Muelle de alambre */}
      <path d="M-3.4 6.6 L3.4 9.4" stroke={T} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M-3.4 6.6 L3.4 9.4" stroke="#b9c0c4" strokeWidth=".9" strokeLinecap="round" />
      <circle cx="0" cy="8" r="2" fill="#c9cfd2" stroke={T} strokeWidth=".9" />
      <circle cx="-.6" cy="7.4" r=".6" fill="#fff" opacity=".8" />
    </g>
  );
}

// ---------- Iconos de los medallones (lienzo de −12 a 12) ----------

const cuerdaIcono = (d: string, ancho = 2.6) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={T} strokeWidth={ancho + 1.6} />
    <path d={d} stroke="#d9b277" strokeWidth={ancho} />
    <path d={d} stroke="#f3dfb2" strokeWidth={ancho * 0.45} strokeDasharray="1.2 1.6" />
  </g>
);

/** Rollo de cuerda (básica). */
function Rollo() {
  return (
    <g>
      {cuerdaIcono("M0 -9 A9 8.6 0 1 1 -0.1 -9 M0 -5.8 A5.8 5.5 0 1 1 -0.1 -5.8 M0 -2.6 A2.6 2.4 0 1 1 -0.1 -2.6")}
      {cuerdaIcono("M6.4 6 C8.6 8 10 9.4 11.4 11.6", 2.4)}
    </g>
  );
}

/** Tejadito de tejas rojas sobre un trozo de cuerda. */
function Tejadito() {
  const tejado = "M-12 2.6 L0 -9.4 L12 2.6 Z";
  return (
    <g strokeLinejoin="round">
      <clipPath id="tejadito-icono">
        <path d={tejado} />
      </clipPath>
      <path d={tejado} fill={T} transform="translate(.6 .8)" />
      <path d={tejado} fill="#d4604a" />
      <g clipPath="url(#tejadito-icono)" fill="none" stroke="#8f3326" strokeWidth=".75">
        {[-5.4, -1.4, 2.6].map((y, f) => (
          <path key={y} d={Array.from({ length: 9 }, (_, i) => `M${-13 + i * 3.2 + (f % 2 ? 1.6 : 0)} ${y} a1.6 1.6 0 0 0 3.2 0`).join(" ")} />
        ))}
      </g>
      <path d={tejado} fill="none" stroke={T} strokeWidth="1.3" />
      <path d="M-9.4 0.4 L-1 -7.8" stroke="#fff" strokeOpacity=".55" strokeWidth="1" strokeLinecap="round" />
      {cuerdaIcono("M-9 7.4 Q0 9.6 9 7.4", 1.6)}
      <path d="M-5 4.6 C-5.6 5.8 -5.6 6.8 -4.6 7.2 C-3.8 6.8 -3.8 5.8 -4.4 4.6 Z" fill="#6fb2dc" stroke={T} strokeWidth=".55" />
      <path d="M5 4.6 C4.4 5.8 4.4 6.8 5.4 7.2 C6.2 6.8 6.2 5.8 5.6 4.6 Z" fill="#6fb2dc" stroke={T} strokeWidth=".55" />
    </g>
  );
}

/** Candado dorado (resistente). */
function Candado() {
  return (
    <g strokeLinejoin="round">
      <path d="M-5 -1 V-4.6 A5 5 0 0 1 5 -4.6 V-1" fill="none" stroke={T} strokeWidth="4.2" />
      <path d="M-5 -1 V-4.6 A5 5 0 0 1 5 -4.6 V-1" fill="none" stroke="#b9c0c4" strokeWidth="2.2" />
      <rect x="-8.2" y="-1.6" width="16.4" height="12.4" rx="2.4" fill={T} transform="translate(.5 .7)" />
      <rect x="-8.2" y="-1.6" width="16.4" height="12.4" rx="2.4" fill="#f3c24a" stroke={T} strokeWidth="1.3" />
      <rect x="-8.2" y="6.6" width="16.4" height="4.2" rx="2" fill="#d79a26" opacity=".7" />
      <circle cx="0" cy="3" r="1.8" fill={T} />
      <path d="M-.7 3.6 L-1 7 H1 L.7 3.6 Z" fill={T} />
      <path d="M-6.2 0.4 V5" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/** Solecito sonriente (secado rápido). */
function Solecito() {
  return (
    <g>
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d="M-1.6 -7.4 L0 -11.4 L1.6 -7.4 Z" transform={`rotate(${i * 36})`} fill="#f39a2b" stroke={T} strokeWidth=".7" strokeLinejoin="round" />
      ))}
      <circle r="6.6" fill="#ffcf3f" stroke={T} strokeWidth="1.2" />
      <circle cx="-2.3" cy="-1" r=".8" fill={T} />
      <circle cx="2.3" cy="-1" r=".8" fill={T} />
      <path d="M-2.4 1.8 Q0 3.9 2.4 1.8" fill="none" stroke={T} strokeWidth=".9" strokeLinecap="round" />
      <circle cx="-3.8" cy="1.4" r="1" fill="#f38b6b" opacity=".6" />
      <circle cx="3.8" cy="1.4" r="1" fill="#f38b6b" opacity=".6" />
    </g>
  );
}

/** Cuerda con nudo y puntas deshilachadas (vieja). */
function Nudo() {
  return (
    <g>
      {cuerdaIcono("M-11 4 C-7 4 -5 0 -1.6 0 M1.6 0 C5 0 7 -4 11 -4", 2.6)}
      <ellipse cx="0" cy="0" rx="4.2" ry="3.4" fill="#d9b277" stroke={T} strokeWidth="1.2" />
      <path d="M-2.6 -1.6 C-0.6 0.6 0.6 0.6 2.6 -1.6 M-2.4 1.8 C-0.6 -0.4 0.6 -0.4 2.4 1.8" stroke="#f3dfb2" strokeWidth=".8" fill="none" />
      <g stroke={T} strokeWidth=".7" strokeLinecap="round">
        <path d="M-11 4 l-1.8 -1.4 M-11 4 l-2 .6 M-11 4 l-1.4 2" />
        <path d="M11 -4 l1.8 -1.6 M11 -4 l2 .4 M11 -4 l1.6 1.8" />
      </g>
    </g>
  );
}

/** Pinza de color, inclinada (las de pinzas de color). */
function PinzaIcono({ color }: { color: string }) {
  const t = TONOS[color] ?? TONOS.rojo;
  return (
    <g transform="rotate(38)">
      <rect x="-3.1" y="-11" width="6.2" height="22" rx="1.8" fill={T} transform="translate(.6 .6)" />
      <rect x="-3.1" y="-11" width="6.2" height="22" rx="1.8" fill={t.base} stroke={T} strokeWidth="1.2" />
      <path d="M1.4 -10 V10" stroke={t.sombra} strokeWidth="1.8" opacity=".6" />
      <path d="M0 -10.4 V10.4" stroke={T} strokeWidth=".7" />
      <path d="M-1.9 -9 V8" stroke="#fff" strokeWidth=".8" opacity=".5" strokeLinecap="round" />
      <path d="M-2.6 -1.6 L2.6 1.6" stroke={T} strokeWidth="1.6" strokeLinecap="round" />
      <circle r="1.6" fill="#c9cfd2" stroke={T} strokeWidth=".7" />
    </g>
  );
}

/** Icono del medallón de cada carta de cuerda (clave del efecto; color de las pinzas si las tiene). */
export function IconoCuerdaCozy({ clave, color }: { clave: string; color?: string }) {
  if (clave === "tejadillo") return <Tejadito />;
  if (clave === "resistente") return <Candado />;
  if (clave === "secado-rapido") return <Solecito />;
  if (clave === "fragil") return <Nudo />;
  if (clave === "modificador-puntuacion") return <PinzaIcono color={color ?? "rojo"} />;
  return <Rollo />;
}

/**
 * Tejadillo pintado, en el estilo del medallón (icono-tejadillo.png): dos filas de tejas curvas rojas con luz y
 * sombra, caballete arriba, borde de tinta marrón y sombra bajo el canto. Va de x0 a x1 y `y` es el canto de abajo
 * (la punta de las tejas de la fila de abajo); ocupa de y − 13,4 a y, más la sombra hasta y + 3,5. Va suelto, por
 * encima de la cuerda y de las pinzas, sin tocarlas.
 */
export function TejadoCozy({ x0, x1, y, id }: { x0: number; x1: number; y: number; id: string }) {
  const w = 12;
  const r = w / 2;
  // La punta, un poco achatada: la teja curva vista desde abajo
  const ry = 4.4;
  const n = Math.ceil((x1 - x0) / w) + 2;
  // Una teja de canal vista de frente: costados rectos y la punta redonda hacia abajo
  const teja = (x: number, arriba: number, punta: number) => `M${x} ${arriba} H${x + w} V${punta - ry} A${r} ${ry} 0 0 1 ${x} ${punta - ry} Z`;
  const fila = (arriba: number, punta: number, desfase: number) =>
    Array.from({ length: n }, (_, j) => x0 - w + desfase + j * w).map((x) => ({ x, d: teja(x, arriba, punta), arriba, punta }));
  const abajo = fila(y - 9.5, y, 0);
  const encima = fila(y - 11.4, y - 5.2, w / 2);
  const cumbre = { arriba: y - 13.4, abajo: y - 10.4 };
  const pinta = (tejas: ReturnType<typeof fila>, k: string) =>
    tejas.map(({ x, d, arriba, punta }) => (
      <g key={`${k}${x}`}>
        <path d={d} fill={`url(#${id}-teja)`} />
        {/* Volumen de la teja curva: luz a la izquierda, sombra a la derecha y más oscura en la punta */}
        <path d={d} fill={`url(#${id}-curva)`} />
        <path d={`M${x + w - 0.6} ${punta - ry} A${r - 0.6} ${ry - 0.6} 0 0 1 ${x + r} ${punta - 0.6}`} stroke="#6e1e10" strokeOpacity=".45" strokeWidth="1.3" fill="none" />
        <path d={d} fill="none" stroke={T} strokeWidth=".85" />
        <path d={`M${x + 2.6} ${arriba + 0.6} V${punta - ry - 0.4}`} stroke="#ffd7c2" strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M${x + 1.8} ${punta - ry + 0.3} Q${x + 2.3} ${punta - 1.4} ${x + 4.6} ${punta - 1}`} stroke="#ffe6d8" strokeOpacity=".8" strokeWidth=".7" fill="none" strokeLinecap="round" />
      </g>
    ));
  return (
    <g className="deco" strokeLinejoin="round">
      <defs>
        <linearGradient id={`${id}-teja`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ec7f5c" />
          <stop offset=".5" stopColor="#d85b3e" />
          <stop offset=".82" stopColor="#b8432b" />
          <stop offset="1" stopColor="#8f2d1b" />
        </linearGradient>
        <linearGradient id={`${id}-curva`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset=".7" stopColor="#5a160a" stopOpacity="0" />
          <stop offset="1" stopColor="#5a160a" stopOpacity=".32" />
        </linearGradient>
        <linearGradient id={`${id}-cumbre`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f39572" />
          <stop offset=".55" stopColor="#d65a3d" />
          <stop offset="1" stopColor="#a63a25" />
        </linearGradient>
        <linearGradient id={`${id}-sombra`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T} stopOpacity=".32" />
          <stop offset="1" stopColor={T} stopOpacity="0" />
        </linearGradient>
        <clipPath id={id}>
          <rect x={x0} y={cumbre.arriba - 1} width={x1 - x0} height={y - cumbre.arriba + 6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {/* Sombra que echa el canto del tejado (un poco corrida hacia abajo) */}
        <g fill={T} opacity=".3" transform="translate(.5 1.6)">
          {abajo.map(({ x, d }) => (
            <path key={x} d={d} />
          ))}
        </g>
        <rect x={x0} y={y - 1} width={x1 - x0} height="4.5" fill={`url(#${id}-sombra)`} />
        {pinta(abajo, "a")}
        {/* La fila de arriba monta sobre la de abajo y le deja su sombra */}
        <g fill={T} opacity=".28" transform="translate(.3 1.1)">
          {encima.map(({ x, d }) => (
            <path key={x} d={d} />
          ))}
        </g>
        {pinta(encima, "b")}
        {/* Caballete: una teja corrida a lo largo, con su sombra sobre la fila de arriba */}
        <rect x={x0} y={cumbre.abajo - 0.2} width={x1 - x0} height="1.3" fill={T} opacity=".3" />
        <rect x={x0 - 2} y={cumbre.arriba} width={x1 - x0 + 4} height={cumbre.abajo - cumbre.arriba} rx="1.3" fill={`url(#${id}-cumbre)`} stroke={T} strokeWidth=".9" />
        <path d={`M${x0} ${cumbre.arriba + 0.9} H${x1}`} stroke="#ffd9c6" strokeOpacity=".6" strokeWidth=".6" />
      </g>
    </g>
  );
}

/** Emblema del dorso de cuerdas: el rollo de cuerda con una pinza de madera mordiéndolo (lienzo de −12 a 12). */
export function EmblemaCuerdas() {
  return (
    <g>
      <Rollo />
      <g transform="translate(6.6 -6.4) rotate(28) scale(.5) translate(0 -8)">
        <PinzaCozy x={0} />
      </g>
    </g>
  );
}

// ---------- Emblemas de los dorsos (lienzo de −12 a 12) ----------

/** Acciones: un rayo con un destello. */
export function EmblemaAcciones() {
  const rayo = "M2.4 -11 L-7 1.6 H-1 L-3.6 11 L7 -2.4 H1 L4.6 -11 Z";
  return (
    <g strokeLinejoin="round">
      <path d={rayo} fill={T} transform="translate(.7 .9)" />
      <path d={rayo} fill="#ffc531" stroke={T} strokeWidth="1.3" />
      <path d="M2.6 -9.4 L-4.6 0.4" stroke="#fff" strokeOpacity=".7" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M8.6 -9 L9.4 -6.8 L11.6 -6 L9.4 -5.2 L8.6 -3 L7.8 -5.2 L5.6 -6 L7.8 -6.8 Z" fill="#fff6c8" stroke={T} strokeWidth=".7" />
      <path d="M-8.4 6 L-7.9 7.4 L-6.5 7.9 L-7.9 8.4 L-8.4 9.8 L-8.9 8.4 L-10.3 7.9 L-8.9 7.4 Z" fill="#fff6c8" stroke={T} strokeWidth=".6" />
    </g>
  );
}

/** Días: sol detrás de una nube. */
export function EmblemaDias() {
  const nube = "M-9.6 7.4 C-12.4 7.4 -12.6 3 -9.6 2.6 C-9.6 -0.8 -5.4 -2 -3.6 0.4 C-2.4 -2.6 2.6 -2.4 3 1.2 C5.8 0.6 7.4 3.4 6 5.4 C7.6 6.8 6.4 8.6 4.6 8.4 Z";
  return (
    <g>
      <g transform="translate(3.2 -3.2) scale(.92)">
        <Solecito />
      </g>
      <path d={nube} fill={T} transform="translate(.6 .8)" />
      <path d={nube} fill="#fbfaf6" stroke={T} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M-9 4.2 C-8.6 2.2 -6.6 1.4 -5 2.2" stroke="#c9d6e2" strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Objetivos: estrella dorada con corona de hojas. */
export function EmblemaObjetivos() {
  const estrella = "M0 -8.4 L2.4 -3 L8.2 -2.4 L3.8 1.6 L5.1 7.4 L0 4.4 L-5.1 7.4 L-3.8 1.6 L-8.2 -2.4 L-2.4 -3 Z";
  // Corona: hojas a lo largo de un arco por cada lado, de abajo arriba (ángulos en grados, con y hacia abajo)
  const hojas = Array.from({ length: 6 }, (_, i) => {
    const g = 112 + i * 25;
    const a = (g * Math.PI) / 180;
    return { x: Math.cos(a) * 10, y: Math.sin(a) * 10, g };
  });
  return (
    <g>
      {[1, -1].map((lado) => (
        <g key={lado} transform={`scale(${lado} 1)`}>
          <path d="M-3.6 9.4 A10 10 0 0 1 -6.6 -7.6" fill="none" stroke="#2f7d4a" strokeWidth=".9" strokeLinecap="round" />
          {hojas.map((h) => (
            <ellipse key={h.g} cx={h.x} cy={h.y} rx="1.45" ry="2.8" transform={`rotate(${h.g + 15} ${h.x} ${h.y})`} fill="#4caa64" stroke={T} strokeWidth=".5" />
          ))}
        </g>
      ))}
      <path d={estrella} fill={T} transform="translate(.6 .8)" />
      <path d={estrella} fill="#ffc531" stroke={T} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M-1.6 -3.4 L-5.4 -1.8" stroke="#fff" strokeOpacity=".75" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}
