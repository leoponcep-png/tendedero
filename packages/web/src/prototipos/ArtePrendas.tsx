import { useId, type ReactElement, type ReactNode } from "react";
import { nombreColor } from "./ArteBosque";

// Ilustraciones de las prendas para la carta de prenda, en estilo de libro infantil «cozy»: contorno de tinta
// marrón con más peso en el lado de la sombra, sombreado suave por zonas, luces y detalles de tela (rayas,
// lunares, canalé, flecos). Todo es SVG limpio: sin filtros que muevan o deformen las líneas.
// Cada dibujo ocupa un lienzo de 140 × 100 (la proporción del hueco de la ilustración en la carta).

export const TINTA_CARTA = "#3b2516";
const T = TINTA_CARTA;

type Tonos = { base: string; sombra: string; oscuro: string; luz: string; fondo: string; acento: string; acento2: string };

/** Paleta de cada color del juego: tela, sombra, interior, luz, fondo pastel de la carta y los colores del estampado. */
export const TONOS: Record<string, Tonos> = {
  azul: { base: "#3f86cf", sombra: "#2c69ad", oscuro: "#1f4c80", luz: "#8ec1ee", fondo: "#c7ddf2", acento: "#fbf6ea", acento2: "#f2c14e" },
  rojo: { base: "#df4f3f", sombra: "#b93a2e", oscuro: "#862820", luz: "#f39a8a", fondo: "#f5c9bf", acento: "#fcf4e6", acento2: "#f2c14e" },
  amarillo: { base: "#f3bd3e", sombra: "#d79a26", oscuro: "#a8701a", luz: "#fde39a", fondo: "#f7e4ad", acento: "#ee7b2f", acento2: "#fffaf0" },
  blanco: { base: "#faf6ec", sombra: "#ddd4c2", oscuro: "#b4a68c", luz: "#ffffff", fondo: "#e2ddd2", acento: "#6faa72", acento2: "#4f8c58" },
};

export const tonosDe = (hex: string): Tonos => TONOS[nombreColor(hex) ?? ""] ?? { ...TONOS.blanco, base: hex };

const limpio = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

/**
 * Una pieza de tela: peso de tinta en el lado de la sombra (la silueta repetida un pelo abajo a la derecha, por
 * debajo), el relleno, lo que va dentro recortado a la silueta (estampado, sombras, luces) y el contorno encima.
 */
function Pieza({ d, base, id, grosor = 2.3, peso = 1, children }: { d: string; base: string; id: string; grosor?: number; peso?: number; children?: ReactNode }) {
  return (
    <g>
      {peso > 0 && <path d={d} fill={T} transform={`translate(${0.9 * peso} ${1.25 * peso})`} />}
      <path d={d} fill={base} />
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
      <path d={d} fill="none" stroke={T} strokeWidth={grosor} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Degradado de volumen: luz arriba a la izquierda y sombra abajo a la derecha. */
function Volumen({ id, x1, y1, x2, y2, luz = 0.3, sombra = 0.3 }: { id: string; x1: number; y1: number; x2: number; y2: number; luz?: number; sombra?: number }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop offset="0" stopColor="#fff" stopOpacity={luz} />
      <stop offset=".4" stopColor="#fff" stopOpacity="0" />
      <stop offset=".6" stopColor={T} stopOpacity="0" />
      <stop offset="1" stopColor={T} stopOpacity={sombra} />
    </linearGradient>
  );
}

/** Lunares al tresbolillo dentro de un rectángulo. */
function Lunares({ x0, y0, x1, y1, paso, r, c, opacidad = 1 }: { x0: number; y0: number; x1: number; y1: number; paso: number; r: number; c: string; opacidad?: number }) {
  const puntos: ReactElement[] = [];
  for (let fila = 0, y = y0; y <= y1; fila++, y += paso * 0.86)
    for (let x = x0 + (fila % 2 ? paso / 2 : 0); x <= x1; x += paso) puntos.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} />);
  return (
    <g fill={c} opacity={opacidad}>
      {puntos}
    </g>
  );
}

// ---------- Camiseta ----------

const CAMISETA =
  "M56 13 C50 15 44 16 38 18 C30 21 22 27 15 36 L27 50 C31 48 36 45 40 43 C41 58 40 74 41 88 C55 90.5 85 90.5 99 88 C100 74 99 58 100 43 C104 45 109 48 113 50 L125 36 C118 27 110 21 102 18 C96 16 90 15 84 13 C76 10.5 64 10.5 56 13 Z";
const BOLSILLO = "M80 40 H94.5 V50.5 C94.5 52.3 93.2 53.5 91.5 53.5 H83 C81.3 53.5 80 52.3 80 50.5 Z";
/** Puño de la manga izquierda (la derecha es su reflejo). */
const PUNO = "M12 36 L18.6 30.4 L32.6 47.4 L27 52.5 Z";

/** Margarita pequeña para la camiseta amarilla. */
function Margarita({ x, y, r = 3 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r * 0.62} rx={r * 0.38} ry={r * 0.6} transform={`rotate(${a})`} fill="#fffaf0" />
      ))}
      <circle r={r * 0.36} fill="#ee7b2f" />
    </g>
  );
}

function Camiseta({ n, t, u }: { n: string; t: Tonos; u: string }) {
  // Estampado: rayas (azul), lunares (rojo), margaritas (amarillo) y lisa con ribetes verdes (blanco)
  const estampado = (
    <>
      {n === "azul" && Array.from({ length: 10 }, (_, i) => <rect key={i} x="0" y={27.5 + i * 6.6} width="140" height="3.3" fill={t.acento} />)}
      {n === "rojo" && <Lunares x0={8} y0={16} x1={134} y1={94} paso={8.4} r={1.85} c={t.acento} />}
      {n === "amarillo" &&
        [
          [48, 34], [66, 30], [88, 34], [57, 48], [77, 46], [49, 62], [68, 60], [88, 62], [58, 76], [79, 76], [24, 37], [116, 37], [96, 48],
        ].map(([x, y]) => <Margarita key={`${x}-${y}`} x={x} y={y} r={3.1} />)}
    </>
  );
  const ribete = n === "blanco" ? t.acento : n === "amarillo" ? t.acento : t.sombra;
  const manga = (
    <g>
      {/* Puño: otro tono, con su raya de costura y la sombra de dentro de la manga en el borde */}
      <path d={PUNO} fill={ribete} opacity={n === "blanco" || n === "amarillo" ? 1 : 0.55} />
      <path d="M18.6 30.4 L32.6 47.4" stroke={T} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16.2 33.4 L29.8 49.6" stroke="#fff" strokeOpacity=".35" strokeWidth=".9" />
      <path d="M15 36 L27 50" stroke={T} strokeOpacity=".45" strokeWidth="3.4" />
      {/* Sombra de la axila y luz del hombro */}
      <path d="M40 42.5 C46 47 47.5 57 45.5 68 C43.5 60 42.5 51 39.5 46.5 Z" fill={T} opacity=".2" />
      <path d="M31 25.5 C27 28 24 31 21.5 34" stroke="#fff" strokeOpacity=".4" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </g>
  );
  return (
    <g>
      <defs>
        <Volumen id={`${u}-vol`} x1={30} y1={14} x2={112} y2={92} luz={0.28} sombra={0.34} />
      </defs>
      <Pieza d={CAMISETA} base={t.base} id={`${u}-cam`}>
        {estampado}
        {manga}
        <g transform="translate(140 0) scale(-1 1)">{manga}</g>
        {/* Lado de la sombra y pliegues del bajo */}
        <path d="M91 38 C96 54 95 72 99 90 L106 90 L106 38 Z" fill={T} opacity=".14" />
        <path d="M50 89.5 C52 82 51 76 54 70 M88 89.5 C86 81 88.5 77 85 71 M63 89.5 C64 86 64.5 83 63.5 80" stroke={T} strokeOpacity=".38" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M51.4 89 C53.4 82 52.4 76 55.4 70.5 M89.4 89 C87.6 81.5 90 77 86.6 71.5" stroke="#fff" strokeOpacity=".35" strokeWidth=".9" fill="none" strokeLinecap="round" />
        {/* Costura del bajo */}
        <path d="M42 84.3 C56 86.6 84 86.6 98 84.3" stroke={T} strokeOpacity=".5" strokeWidth=".9" strokeDasharray="2.2 1.7" fill="none" />
        {/* Volumen y luces */}
        <rect width="140" height="100" fill={`url(#${u}-vol)`} />
        <path d="M46.5 24 C42.5 30.5 41.5 37 42.5 43" stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M50.5 22.5 L51.5 26.5" stroke="#fff" strokeOpacity=".55" strokeWidth="1.8" strokeLinecap="round" />
      </Pieza>
      {/* Interior del cuello, etiqueta y cuello de canalé */}
      <path d="M57 13.4 C64 11.4 76 11.4 83 13.4 C80 20 75 23.5 70 23.5 C65 23.5 60 20 57 13.4 Z" fill={t.oscuro} />
      <path d="M58.5 14 C65 12.4 75 12.4 81.5 14" stroke={T} strokeOpacity=".35" strokeWidth="1.6" fill="none" />
      <rect x="66.4" y="13.2" width="7.2" height="4.2" rx="1" fill="#fffaf0" stroke={T} strokeWidth=".8" />
      <path d="M55.5 13 C59 21.6 64 26 70 26 C76 26 81 21.6 84.5 13" stroke={T} strokeWidth="6.2" fill="none" strokeLinecap="round" />
      <path d="M55.5 13 C59 21.6 64 26 70 26 C76 26 81 21.6 84.5 13" stroke={n === "blanco" || n === "amarillo" ? ribete : t.sombra} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M56.6 13.6 C60 21 64.5 24.8 70 24.8 C75.5 24.8 80 21 83.4 13.6" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" fill="none" />
      {/* Bolsillo con su vista y pespunte */}
      <Pieza d={BOLSILLO} base={t.base} id={`${u}-bol`} grosor={1.5} peso={0.6}>
        {n === "azul" && Array.from({ length: 3 }, (_, i) => <rect key={i} x="78" y={41 + i * 4.6} width="20" height="2.3" fill={t.acento} />)}
        {n === "rojo" && <Lunares x0={81} y0={41} x1={96} y1={55} paso={6} r={1.3} c={t.acento} />}
        {n === "amarillo" && <Margarita x={87.2} y={47.5} r={2.6} />}
        {n === "blanco" && (
          // Hojita bordada
          <g transform="translate(87.3 47.6) rotate(-30)">
            <path d="M0 -4 C2.6 -2 2.6 2 0 4 C-2.6 2 -2.6 -2 0 -4 Z" fill={t.acento} stroke={t.acento2} strokeWidth=".6" />
            <path d="M0 -3.4 V4.8" stroke={t.acento2} strokeWidth=".6" />
          </g>
        )}
        <rect x="78" y="38" width="20" height="5" fill={T} opacity=".12" />
        <path d="M80 43 H94.5" stroke={T} strokeOpacity=".55" strokeWidth=".9" />
        <path d="M81.6 44.5 V50.3 C81.6 51.4 82.3 52 83.3 52 H91.2 C92.2 52 92.9 51.4 92.9 50.3 V44.5" stroke={T} strokeOpacity=".45" strokeWidth=".6" strokeDasharray="1.3 1" fill="none" />
      </Pieza>
    </g>
  );
}

// ---------- Calcetín ----------

const PIERNA =
  "M53 25 C53 38 53.5 50 53 60 C52 72 55 83 65 88 C73 92 85 92.5 95 91.5 C105 90.5 109 82 103 75 C99 70 92 67.5 87 63.5 C82.5 59.5 80.5 54 80.5 47 C80.5 39 80.5 32 80.5 25 Z";
const PUNO_CALCETIN = "M49.5 9 C60 7.4 73 7.4 84 9 C84.9 15 84.9 21.5 84 28 C73 29.4 60 29.4 49.5 28 C48.6 21.5 48.6 15 49.5 9 Z";
const TALON = "M53 62.5 C60 64.5 66.6 71 68.6 79 C69.9 84 70.5 88 71 93";
const PUNTERA = "M91 65.5 C95 72 95.6 83 90.6 93";

function Calcetin({ n, t, u }: { n: string; t: Tonos; u: string }) {
  // Talón y puntera de otro tono; estampado: zigzag (amarillo), rayas (azul y blanco), lunares (rojo)
  const parche = n === "amarillo" ? "#e8892c" : n === "azul" ? t.oscuro : n === "rojo" ? t.acento : t.acento;
  const puno = n === "amarillo" ? t.sombra : n === "blanco" ? t.base : t.sombra;
  return (
    <g transform="translate(68 51) scale(1.08) rotate(-6) translate(-77 -50)">
      <defs>
        <Volumen id={`${u}-vol`} x1={48} y1={20} x2={108} y2={92} luz={0.3} sombra={0.32} />
      </defs>
      <Pieza d={PIERNA} base={t.base} id={`${u}-pie`}>
        {n === "amarillo" && (
          <g fill="none" stroke={t.acento} strokeLinejoin="round" strokeLinecap="round">
            <path d={`M50 41 ${Array.from({ length: 9 }, (_, i) => `L${53.5 + i * 3.6} ${i % 2 ? 41 : 36.6}`).join(" ")}`} strokeWidth="2.2" />
            <path d={`M50 47 ${Array.from({ length: 9 }, (_, i) => `L${53.5 + i * 3.6} ${i % 2 ? 47 : 43.4}`).join(" ")}`} strokeWidth="1.3" />
          </g>
        )}
        {(n === "azul" || n === "blanco") && (
          <g fill={n === "azul" ? t.acento : t.acento}>
            <rect x="45" y="34" width="45" height="4.2" />
            <rect x="45" y="41.6" width="45" height="4.2" />
          </g>
        )}
        {n === "rojo" && <Lunares x0={52} y0={32} x1={110} y1={92} paso={7.6} r={1.6} c={t.acento} />}
        {/* Talón y puntera con su pespunte */}
        <path d={`${TALON} L40 96 L40 60 Z`} fill={parche} />
        <path d={`${PUNTERA} L116 96 L116 60 Z`} fill={parche} />
        <path d={TALON} stroke={T} strokeWidth="1.1" fill="none" />
        <path d={PUNTERA} stroke={T} strokeWidth="1.1" fill="none" />
        <path d={TALON} stroke={T} strokeOpacity=".5" strokeWidth=".7" strokeDasharray="1.6 1.3" fill="none" transform="translate(-2.2 1.4)" />
        <path d={PUNTERA} stroke={T} strokeOpacity=".5" strokeWidth=".7" strokeDasharray="1.6 1.3" fill="none" transform="translate(2.3 .2)" />
        {/* Sombras: lado derecho de la pierna, empeine y planta */}
        <path d="M74.5 26 C75.5 40 75.5 52 78 58 C82 63 88 66 94 69 L106 74 L106 26 Z" fill={T} opacity=".14" />
        <path d="M58 86.5 C70 92.5 86 93.5 99 91 L99 97 L58 97 Z" fill={T} opacity=".2" />
        <path d="M80.5 51 C78.4 53.6 77.6 56.6 78.4 59.4 M85 61.4 C83.2 62.6 82.4 64.4 82.8 66.2" stroke={T} strokeOpacity=".35" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <rect width="140" height="100" fill={`url(#${u}-vol)`} />
        {/* Luces */}
        <path d="M57.8 31 C57.3 41 57.3 50 57.8 59" stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M58.6 71 C59.6 77 62.4 81.4 66.4 83.6" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path d="M96 75.5 C98.4 76.4 100 78 100.6 80.2" stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </Pieza>
      {/* Puño de canalé, con la boca del calcetín */}
      <Pieza d={PUNO_CALCETIN} base={puno} id={`${u}-puno`} grosor={2.2}>
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i}>
            <path d={`M${52.6 + i * 3.25} 11 V28.5`} stroke={T} strokeOpacity=".32" strokeWidth=".9" />
            <path d={`M${53.8 + i * 3.25} 11 V28.5`} stroke="#fff" strokeOpacity=".28" strokeWidth=".7" />
          </g>
        ))}
        {n === "blanco" && <rect x="45" y="20.5" width="45" height="3.2" fill={t.acento} />}
        <path d="M76 9 C78 15 78 22 77 29 L86 29 L86 9 Z" fill={T} opacity=".14" />
        <rect x="45" y="5" width="45" height="7" fill="#fff" opacity=".15" />
      </Pieza>
      <path d="M51 10 C60 6.6 73 6.6 82.6 10 C73 12.8 60 12.8 51 10 Z" fill={t.oscuro} stroke={T} strokeWidth="1" strokeLinejoin="round" />
    </g>
  );
}

// ---------- Toalla ----------

const CUERPO_TOALLA = "M26 27 C46 25 94 25 114 27 C116 45 118.4 62 119.6 80 C109 82.6 99 80.4 88.6 82.6 C78 84.8 66 81 55.6 83 C44 85 32 82.2 21 80.6 C22.4 62 24 45 26 27 Z";
const SOLAPA = "M20 12 C46 9 94 9 120 12 C121 18 121.2 25 120.6 31.4 C111 34.6 102 31.6 92 34 C82 36.6 74 32.6 64 34.6 C52 36.8 40 33 30 34.6 C26 35.2 22.4 33.8 19.6 32.2 C18.8 25 19 18 20 12 Z";

function Toalla({ n, t, u }: { n: string; t: Tonos; u: string }) {
  // Bandas tejidas del color de acento (blancas en la azul, crema en la roja, naranjas en la amarilla, verdes en la blanca)
  const banda = n === "azul" || n === "rojo" ? t.acento : t.acento;
  const rizo = (
    <g>
      <rect width="140" height="100" fill={`url(#${u}-rizo)`} />
    </g>
  );
  return (
    <g>
      <defs>
        <pattern id={`${u}-rizo`} width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <circle cx=".8" cy=".8" r=".55" fill={T} opacity=".1" />
          <circle cx="2.4" cy="2.4" r=".55" fill="#fff" opacity=".22" />
        </pattern>
        <Volumen id={`${u}-vol`} x1={22} y1={10} x2={118} y2={92} luz={0.3} sombra={0.34} />
      </defs>
      {/* Flecos del bajo: tinta debajo y el color de la toalla encima */}
      {Array.from({ length: 21 }, (_, i) => {
        const x = 27 + i * 4.3;
        const d = `M${x} 80 q${i % 2 ? 0.9 : -0.7} 5 ${i % 3 ? 0.3 : -0.5} 10`;
        return (
          <g key={i}>
            <path d={d} stroke={T} strokeWidth="2.7" strokeLinecap="round" fill="none" />
            <path d={d} stroke={i % 2 ? t.base : t.sombra} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </g>
        );
      })}
      <Pieza d={CUERPO_TOALLA} base={t.base} id={`${u}-cuerpo`}>
        {rizo}
        {/* Bandas tejidas cerca del bajo, con su cenefa */}
        <rect x="0" y="60" width="140" height="7" fill={banda} />
        <rect x="0" y="69.6" width="140" height="2.6" fill={banda} />
        <path d="M0 60 H140 M0 67 H140" stroke={T} strokeOpacity=".35" strokeWidth=".8" />
        <path d={`M20 63.5 ${Array.from({ length: 26 }, (_, i) => `L${23 + i * 4} ${i % 2 ? 63.5 : 61.6}`).join(" ")}`} stroke={n === "blanco" ? t.acento2 : n === "amarillo" ? "#fffaf0" : t.base} strokeWidth=".9" fill="none" opacity=".85" />
        {/* Sombra bajo la solapa, pliegues verticales y lado de la sombra */}
        <path d="M20 31 C40 36 60 33 80 36 C96 33 108 36 120 31 L120 41 C94 43 46 43 20 41 Z" fill={T} opacity=".22" />
        <path d="M50 36 C47 52 51 68 48 84 M90 36 C93 52 89 68 92 84" stroke={T} strokeOpacity=".09" strokeWidth="7" fill="none" />
        <path d="M50 36 C47 52 51 68 48 84 M90 36 C93 52 89 68 92 84" stroke={T} strokeOpacity=".28" strokeWidth="1.1" fill="none" />
        <path d="M52.4 38 C49.6 52 53.4 68 50.6 82 M92.4 38 C95.4 52 91.4 68 94.4 82" stroke="#fff" strokeOpacity=".3" strokeWidth="1" fill="none" />
        <path d="M107 26 C109 42 111 62 112 84 L122 84 L122 26 Z" fill={T} opacity=".12" />
        {/* Dobladillo del bajo */}
        <path d="M23.5 77 C34 78.6 44 80.6 56 79.2 C66 77.6 78 81 88.6 79 C99 77 109 79.2 117.6 76.8" stroke={T} strokeOpacity=".5" strokeWidth=".8" strokeDasharray="2 1.6" fill="none" />
        <rect width="140" height="100" fill={`url(#${u}-vol)`} />
        <path d="M29 42 C28.2 52 28.6 62 28.2 74" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </Pieza>
      {/* Presilla para colgar, por detrás de la solapa */}
      <path d="M65 11 C65 2.5 75 2.5 75 11" stroke={T} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M65 11 C65 2.5 75 2.5 75 11" stroke={t.sombra} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Solapa doblada por encima de la cuerda */}
      <Pieza d={SOLAPA} base={t.base} id={`${u}-solapa`}>
        {rizo}
        <rect x="0" y="19" width="140" height="3.4" fill={banda} />
        <path d="M0 19 H140 M0 22.4 H140" stroke={T} strokeOpacity=".3" strokeWidth=".7" />
        <path d="M20.4 28.4 C30 31 40 30 52 31 C64 32 74 29 86 30.6 C98 32 110 29.6 120.6 27.8" stroke={T} strokeOpacity=".45" strokeWidth=".8" strokeDasharray="2 1.6" fill="none" />
        <path d="M108 10 C109 18 109 26 108 34 L124 34 L124 10 Z" fill={T} opacity=".13" />
        <rect width="140" height="100" fill={`url(#${u}-vol)`} />
        <path d="M25 14.6 C50 12.6 80 12.6 102 13.6" stroke="#fff" strokeOpacity=".55" strokeWidth="1.9" strokeLinecap="round" fill="none" />
      </Pieza>
    </g>
  );
}

const DIBUJOS: Record<string, (p: { n: string; t: Tonos; u: string }) => ReactElement> = { camiseta: Camiseta, calcetin: Calcetin, toalla: Toalla };

/** El dibujo de una prenda (grupo SVG en un lienzo de 140 × 100), para meterlo en cualquier SVG. */
export function DibujoPrenda({ tipo, color }: { tipo: string; color: string }) {
  const u = `pc${limpio(useId())}`;
  const Dibujo = DIBUJOS[tipo];
  const n = nombreColor(color) ?? "blanco";
  return Dibujo ? <Dibujo n={n} t={tonosDe(color)} u={u} /> : null;
}

/** Ilustración de una prenda para la carta de prenda. */
export function PrendaCozy({ tipo, color, className }: { tipo: string; color: string; className?: string }) {
  const png = imagenPrenda(tipo, color);
  if (png) return <img src={png} alt="" className={`${className ?? ""} hp-arte-png`} draggable={false} aria-hidden />;
  return (
    <svg viewBox="0 0 140 100" className={className} preserveAspectRatio="xMidYMid meet" overflow="visible" aria-hidden>
      <DibujoPrenda tipo={tipo} color={color} />
    </svg>
  );
}

/**
 * Ilustraciones en PNG (fondo transparente) que sustituyen al dibujo SVG: si existe
 * src/arte/prendas/<tipo>-<color>.png (por ejemplo «camiseta-rojo.png»), la carta usa esa imagen.
 * Vale también <tipo>.png para todos los colores de ese tipo. Se ajusta al hueco sin deformarse (object-fit).
 */
const PNGS = import.meta.glob<string>("../arte/prendas/*.png", { eager: true, query: "?url", import: "default" });
export function imagenPrenda(tipo: string, color: string): string | undefined {
  const n = nombreColor(color) ?? "blanco";
  return PNGS[`../arte/prendas/${tipo}-${n}.png`] ?? PNGS[`../arte/prendas/${tipo}.png`];
}

export const tieneDibujoCozy = (tipo: string) => tipo in DIBUJOS || !!PNGS[`../arte/prendas/${tipo}.png`] || Object.keys(PNGS).some((k) => k.startsWith(`../arte/prendas/${tipo}-`));

/**
 * Gota de la escala de humedad: degradado azul, brillo blanco y contorno oscuro. Lienzo de unos 14 × 16
 * centrado en 0,0 (como GotaBosque), para que encaje en las mismas filas.
 */
export function GotaCozy({ x = 0, y = 0 }: { x?: number; y?: number }) {
  const u = `gc${limpio(useId())}`;
  const gota = "M0 -7.6 C2.4 -4 5.3 -0.9 5.3 2.3 A5.3 5.3 0 0 1 -5.3 2.3 C-5.3 -0.9 -2.4 -4 0 -7.6 Z";
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={u} cx="-1.6" cy="0.2" r="8.4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9fd8f7" />
          <stop offset=".55" stopColor="#4aa3dd" />
          <stop offset="1" stopColor="#1f6fae" />
        </radialGradient>
      </defs>
      <path d={gota} fill="#1d3d5c" transform="translate(.35 .5)" />
      <path d={gota} fill={`url(#${u})`} stroke="#1d3d5c" strokeWidth=".95" strokeLinejoin="round" />
      <path d="M-2.9 2.6 C-3.3 0.6 -2.6 -1.4 -1.2 -3.4" stroke="#fff" strokeWidth="1.15" strokeLinecap="round" fill="none" opacity=".9" />
      <circle cx="-2.5" cy="4.6" r=".7" fill="#fff" opacity=".75" />
      <path d="M1.4 6.3 C3 5.8 4 4.6 4.3 3.2" stroke="#bfe6fb" strokeWidth=".7" strokeLinecap="round" fill="none" opacity=".7" />
    </g>
  );
}
