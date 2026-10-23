import { useId, type ReactElement } from "react";
import { tono } from "../arte/color";

// Ilustraciones «de bosque» para la versión D, inspiradas en el aspecto de Root: tinta gruesa y oscura,
// colores planos algo apagados, una sola sombra marcada por pieza y papel con grano. Todo es SVG propio.

export const TINTA = "#2b2019";
export const CREMA = "#f2e6cc";

/** Los colores de las prendas, pasados a la paleta apagada del bosque. */
const PALETA: Record<string, string> = {
  "#f4f1ea": "#efe5cf",
  "#4a7fd0": "#4f7fa6",
  "#d2513f": "#c2553a",
  "#e8c23a": "#e1a73a",
};
export const colorBosque = (hex: string) => PALETA[hex] ?? hex;

const trazo = { stroke: TINTA, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Filtro de «tinta a mano»: tiembla un poco el trazo para que no parezca vector perfecto. */
export function DefsBosque() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="tinta-bosque" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="1.8" />
      </filter>
      {/* Acuarela: bordes que se corren y color que se aclara por dentro */}
      <filter id="acuarela" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="2" result="ruido" />
        <feDisplacementMap in="SourceGraphic" in2="ruido" scale="7" result="corrido" />
        <feGaussianBlur in="corrido" stdDeviation="1.2" result="suave" />
        <feComposite in="suave" in2="corrido" operator="arithmetic" k2=".75" k3=".45" />
      </filter>
      {/* Impresionista: pinceladas cortas que rompen la forma */}
      <filter id="pincel" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="turbulence" baseFrequency="0.09 0.04" numOctaves="2" seed="9" result="trazos" />
        <feDisplacementMap in="SourceGraphic" in2="trazos" scale="6" result="movido" />
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="3" result="grano" />
        <feColorMatrix in="grano" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.7 1.35" result="huecos" />
        <feComposite in="movido" in2="huecos" operator="in" />
      </filter>
      {/* Pixel art: rejilla de bloques */}
      {/* En unidades del dibujo (todos caben en 200 × 140) para que la rejilla empiece en 0,0 */}
      <filter id="pixel" filterUnits="userSpaceOnUse" x="0" y="0" width="200" height="140">
        <feFlood x="2" y="2" width="1" height="1" />
        <feComposite width="5" height="5" />
        <feTile result="rejilla" />
        <feComposite in="SourceGraphic" in2="rejilla" operator="in" />
        <feMorphology operator="dilate" radius="2.5" />
      </filter>
      {/* Grabado: borde áspero, como tinta de linóleo */}
      <filter id="rugoso" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" />
        <feDisplacementMap in="SourceGraphic" scale="2.6" />
      </filter>
      <pattern id="pat-rayas" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
        <rect width="3" height="8" fill="#ffffff" opacity=".35" />
      </pattern>
      <pattern id="pat-cuadros" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="6" height="12" fill="#ffffff" opacity=".22" />
        <rect width="12" height="6" fill="#000000" opacity=".1" />
      </pattern>
      <pattern id="pat-punto" width="8" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 0 L4 6 L8 0" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="1.6" />
      </pattern>
      <pattern id="pat-lunares" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="2" fill="#fff" opacity=".55" />
        <circle cx="9" cy="9" r="2" fill="#fff" opacity=".55" />
      </pattern>
      <pattern id="pat-rizo" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r=".8" fill="#ffffff" opacity=".35" />
        <circle cx="3" cy="3" r=".8" fill="#000000" opacity=".12" />
      </pattern>
      <pattern id="pat-rayado" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="1.8" height="5" fill={TINTA} />
      </pattern>
      <pattern id="pat-semitono" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
        <circle cx="3" cy="3" r="1.7" fill="#1d1b3a" opacity=".55" />
      </pattern>
      <linearGradient id="sombra-tejado" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={TINTA} stopOpacity=".22" />
        <stop offset="1" stopColor={TINTA} stopOpacity="0" />
      </linearGradient>
    </svg>
  );
}

// ---------- Prendas ----------
// Los colores salen de variables CSS (--p-azul, --p-rojo...) para que cada estilo de dibujo tenga su paleta.
// Cada dibujo marca sus partes con clases que el estilo enciende o cambia: .sombra (sombreado), .patron (tejido),
// .brillo (reflejos tipo anime) y .detalle (costuras y pliegues para el estilo detallado).

const NOMBRE_COLOR: Record<string, string> = { "#f4f1ea": "blanco", "#4a7fd0": "azul", "#d2513f": "rojo", "#e8c23a": "amarillo" };
/** Color de una prenda en el estilo activo (variable CSS con el tono del bosque de reserva). */
export const colorEstilo = (hex: string) => (NOMBRE_COLOR[hex] ? `var(--p-${NOMBRE_COLOR[hex]}, ${PALETA[hex]})` : hex);
const oscuro = (c: string, p = 30) => `color-mix(in srgb, ${c}, var(--ilu-sombra, #1d140e) ${p}%)`;
const claro = (c: string, p = 35) => `color-mix(in srgb, ${c}, #fff ${p}%)`;

function Calcetin({ c }: { c: string }) {
  const contorno = "M17 6 H43 V42 C43 46 45 49 48 52 L54 58 C60 64 56 74 47 74 C43 74 40 72 38 70 L20 52 C18 50 17 47 17 44 Z";
  return (
    <g>
      <path d={contorno} style={{ fill: c }} {...trazo} />
      <path className="patron" d={contorno} />
      <path className="sombra" d="M36 8 H41.5 V43 C41.5 47 43.5 50 46.5 53 L52.5 59 C57 63.5 55 71 49 72.5 C53 66 49 61 44 56 C39 51 36 47 36 42 Z" style={{ fill: oscuro(c) }} />
      <path className="sombra" d="M17 34 C22 41 27 45 33 47 L20 52 C18 50 17 47 17 44 Z" style={{ fill: oscuro(c) }} />
      <path d="M17 6 H43 V17 H17 Z" style={{ fill: claro(c) }} {...trazo} />
      <path d="M19 10.5 H41 M19 13.5 H41" style={{ stroke: oscuro(c) }} strokeWidth="2" />
      <path className="detalle" d="M20.5 19 V44 C20.5 47 21.5 49 23.5 51 L39.5 67 M40 19 V42" />
      <path className="detalle" d="M44 58 C48 60 52 62 54 66" />
      <path className="brillo" d="M23 22 C22 30 22 37 24 43" />
      <path d={contorno} fill="none" {...trazo} />
    </g>
  );
}

function Camiseta({ c }: { c: string }) {
  const contorno = "M44 7 L22 15 L5 33 L19 45 L30 36 V73 H90 V36 L101 45 L115 33 L98 15 L76 7 C73 15 67 19 60 19 C53 19 47 15 44 7 Z";
  return (
    <g>
      <path d={contorno} style={{ fill: c }} {...trazo} />
      <path className="patron" d={contorno} />
      <path className="sombra" d="M78 8 L98 15 L115 33 L101 45 L90 36 V73 H74 C78 58 76 40 80 24 Z" style={{ fill: oscuro(c) }} />
      <path className="sombra" d="M5 33 L19 45 L22 42 L9 31 Z M30 36 V44 L22 42 Z" style={{ fill: oscuro(c) }} opacity=".8" />
      <path d="M44 7 C47 15 53 19 60 19 C67 19 73 15 76 7" fill="none" stroke={TINTA} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M46 9 C49 15 54 17 60 17 C66 17 71 15 74 9" fill="none" style={{ stroke: claro(c) }} strokeWidth="1.6" />
      <path d="M36 50 h12 v12 h-12 z" style={{ fill: claro(c, 18) }} {...trazo} strokeWidth={2.2} />
      <path d="M30 36 L22 28 M90 36 L98 28" stroke={TINTA} strokeWidth="2.2" />
      <path className="detalle" d="M33 69 H87 M8 34 L20 43.5 M112 34 L100 43.5 M44 30 C47 42 45 56 47 68 M66 26 C64 40 68 54 66 68" />
      <path className="detalle" d="M38 52 h8" />
      <path className="brillo" d="M38 26 C42 34 40 42 41 46 M52 30 L54 40" />
      <path d={contorno} fill="none" {...trazo} />
    </g>
  );
}

function Toalla({ c }: { c: string }) {
  const cuerpo = "M8 6 H172 V64 H8 Z";
  return (
    <g>
      <path d={cuerpo} style={{ fill: c }} {...trazo} />
      <path className="patron" d={cuerpo} />
      <path className="sombra" d="M128 6 H172 V64 H128 Z" style={{ fill: oscuro(c) }} opacity=".85" />
      <path d="M8 6 H172 V17 H8 Z" style={{ fill: oscuro(c, 22) }} {...trazo} strokeWidth={2.4} />
      <path d="M8 44 H172 M8 52 H172" style={{ stroke: claro(c, 55) }} strokeWidth="4.5" />
      <path d="M8 44 H172 M8 52 H172" stroke={TINTA} strokeWidth="1" opacity=".35" />
      {Array.from({ length: 21 }, (_, i) => (
        <path key={i} d={`M${14 + i * 7.6} 65 v7`} stroke={TINTA} strokeWidth="2.2" strokeLinecap="round" />
      ))}
      <path className="detalle" d="M12 21 H168 M12 60 H168 M40 22 C44 32 41 40 44 58 M120 22 C116 32 120 42 117 58" />
      <path className="brillo" d="M20 24 C40 22 60 24 80 22 M20 30 L34 30" />
      <path d={cuerpo} fill="none" {...trazo} />
    </g>
  );
}

const DIBUJOS: Record<string, (p: { c: string }) => ReactElement> = { calcetin: Calcetin, camiseta: Camiseta, toalla: Toalla };

// ---------- Capa rica: ilustraciones detalladas (estilo fusión) ----------
// Encima del dibujo base, recortada a su silueta: estampados según el color, pliegues, costuras, puños de canalé,
// bordados y reflejos. Por defecto está apagada (.capa-rica) y el estilo la enciende.

const CONTORNOS: Record<string, string> = {
  calcetin: "M17 6 H43 V42 C43 46 45 49 48 52 L54 58 C60 64 56 74 47 74 C43 74 40 72 38 70 L20 52 C18 50 17 47 17 44 Z",
  camiseta: "M44 7 L22 15 L5 33 L19 45 L30 36 V73 H90 V36 L101 45 L115 33 L98 15 L76 7 C73 15 67 19 60 19 C53 19 47 15 44 7 Z",
  toalla: "M8 6 H172 V64 H8 Z",
};

const pliegue = (c: string) => `color-mix(in srgb, ${c}, var(--ilu-sombra, #1d140e) 38%)`;
const luz = "#ffffffcc";

function CamisetaRica({ c, nombre }: { c: string; nombre: string }) {
  return (
    <g>
      {nombre === "azul" && Array.from({ length: 7 }, (_, i) => <rect key={i} x="0" y={24 + i * 7} width="120" height="3.2" fill="#fffaf0" opacity=".85" />)}
      {nombre === "rojo" && <rect width="120" height="78" fill="url(#pat-lunares)" />}
      {nombre === "amarillo" && <rect width="120" height="78" fill="url(#pat-cuadros)" opacity="1" />}
      {nombre === "blanco" && (
        <g transform="translate(60 45)">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <path key={i} d={`M${Math.cos(a) * 8} ${Math.sin(a) * 8} L${Math.cos(a) * 13} ${Math.sin(a) * 13}`} stroke="#ffb627" strokeWidth="2.6" strokeLinecap="round" />;
          })}
          <circle r="6.5" fill="#ffc531" stroke={TINTA} strokeWidth="1.4" />
          <path d="M-2.6 1 q2.6 2.4 5.2 0" fill="none" stroke={TINTA} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      {/* Pliegues bajo las mangas y en el bajo, que cae un poco */}
      <path d="M30 37 C34 44 33 52 36 60 C34 52 32 46 30 42 Z M90 37 C86 44 87 52 84 60 C86 52 88 46 90 42 Z" style={{ fill: pliegue(c) }} opacity=".7" />
      <path d="M42 73 C45 66 48 64 50 73 M66 73 C69 67 72 66 74 73" style={{ stroke: pliegue(c) }} strokeWidth="1.6" fill="none" />
      <path d="M50 24 C52 32 51 40 53 48" style={{ stroke: pliegue(c) }} strokeWidth="1.3" fill="none" opacity=".7" />
      {/* Puños de las mangas y cuello de canalé */}
      <path d="M8 30.5 L21.5 42.5 M112 30.5 L98.5 42.5" stroke={TINTA} strokeWidth="1.4" />
      <path d="M9.5 29 L23 41 M110.5 29 L97 41" stroke="#fffaf0" strokeWidth="1" opacity=".6" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10;
        const x = 44 + (76 - 44) * t;
        const y = 7 + Math.sin(Math.PI * t) * 12;
        return <path key={i} d={`M${x} ${y} l0 3.2`} stroke={TINTA} strokeWidth=".9" opacity=".55" />;
      })}
      {/* Costuras laterales y del bajo */}
      <path d="M31.5 38 V71.5 H88.5 V38" fill="none" stroke={TINTA} strokeWidth=".9" strokeDasharray="2 1.8" opacity=".55" />
      {/* Etiqueta y reflejos */}
      <rect x="57" y="20" width="6" height="4" rx="1" fill="#fffaf0" stroke={TINTA} strokeWidth=".8" />
      <path d="M36 22 C40 30 38 40 40 46" stroke={luz} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M44 26 L45 32" stroke={luz} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function CalcetinRico({ c, nombre }: { c: string; nombre: string }) {
  const parche = nombre === "blanco" ? "#ff5a4f" : "#fffaf0";
  return (
    <g>
      {nombre === "azul" && [26, 33].map((y) => <rect key={y} x="0" y={y} width="60" height="3.5" fill="#fffaf0" opacity=".9" />)}
      {nombre === "rojo" && [26, 33].map((y) => <rect key={y} x="0" y={y} width="60" height="3.5" fill="#ffc531" opacity=".95" />)}
      {nombre === "amarillo" && <path d="M14 30 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" fill="none" stroke="#ff7a3d" strokeWidth="2.4" strokeLinejoin="round" />}
      {nombre === "blanco" && <path d="M30 34 C27 30 22 33 25 37 L30 41 L35 37 C38 33 33 30 30 34 Z" fill="#ff5a4f" stroke={TINTA} strokeWidth="1" />}
      {/* Puño de canalé */}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${20 + i * 3.4} 7 V16`} stroke={TINTA} strokeWidth=".9" opacity=".5" />
      ))}
      {/* Talón y punta de otro color */}
      <path d="M17 41 C21 47 26 50 32 51 L22 54 C19 51 17 48 17 44 Z" fill={parche} opacity=".95" />
      <path d="M45 58 C52 60 57 64 56 70 C55 73 51 75 47 74 C49 69 48 63 45 58 Z" fill={parche} opacity=".95" />
      <path d="M17 41 C21 47 26 50 32 51 M45 58 C52 60 57 64 56 70" fill="none" stroke={TINTA} strokeWidth="1.1" strokeDasharray="1.8 1.6" />
      <path d="M38 22 V40" style={{ stroke: pliegue(c) }} strokeWidth="1.2" opacity=".6" />
      <path d="M22 20 C21 28 21 34 23 40" stroke={luz} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

function ToallaRica({ c, nombre }: { c: string; nombre: string }) {
  return (
    <g>
      {/* Rizo de toalla */}
      <rect width="180" height="78" fill="url(#pat-rizo)" />
      {/* Cenefa tejida entre las dos bandas */}
      <path d={`M8 48 ${Array.from({ length: 20 }, (_, i) => `L${12 + i * 8.2} ${i % 2 ? 45.5 : 50.5}`).join(" ")}`} fill="none" stroke={nombre === "rojo" ? "#ffc531" : "#ff5a4f"} strokeWidth="1.8" />
      {/* Sombra del doblez y arrugas */}
      <rect x="8" y="17" width="164" height="5" style={{ fill: pliegue(c) }} opacity=".45" />
      <path d="M40 24 C44 32 41 38 43 42 M118 24 C114 31 118 36 116 42" style={{ stroke: pliegue(c) }} strokeWidth="1.6" fill="none" />
      {/* Patito bordado */}
      <g transform="translate(146 31)">
        <ellipse cx="0" cy="3" rx="8" ry="5.5" fill="#ffc531" stroke={TINTA} strokeWidth="1.2" />
        <circle cx="5.5" cy="-3.5" r="4" fill="#ffc531" stroke={TINTA} strokeWidth="1.2" />
        <path d="M9 -3.5 l4 1 l-4 1.6 z" fill="#ff7a3d" stroke={TINTA} strokeWidth=".8" />
        <circle cx="6.4" cy="-4.4" r=".9" fill={TINTA} />
        <path d="M-9 4 C-9 9 -4 10 1 9" fill="none" stroke={TINTA} strokeWidth=".8" strokeDasharray="1.4 1.2" />
      </g>
      {/* Presilla para colgar */}
      <path d="M86 6 C86 -1 94 -1 94 6" fill="none" stroke={TINTA} strokeWidth="1.6" />
      <path d="M20 26 C40 24 60 26 78 24" stroke={luz} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

const RICOS: Record<string, (p: { c: string; nombre: string }) => ReactElement> = { calcetin: CalcetinRico, camiseta: CamisetaRica, toalla: ToallaRica };

/** Capa detallada, recortada a la silueta de la prenda y con el contorno de tinta repasado encima. */
function CapaRica({ tipo, c, nombre }: { tipo: string; c: string; nombre: string }) {
  const id = useId().replace(/:/g, "");
  const Rico = RICOS[tipo];
  const contorno = CONTORNOS[tipo];
  if (!Rico || !contorno) return null;
  return (
    <g className="capa-rica">
      <clipPath id={`silueta-${id}`}>
        <path d={contorno} />
      </clipPath>
      <g clipPath={`url(#silueta-${id})`}>
        <Rico c={c} nombre={nombre} />
      </g>
      <path d={contorno} fill="none" {...trazo} />
    </g>
  );
}

export function PrendaBosque({ tipo, color, espacios, className }: { tipo: string; color: string; espacios: number; className?: string }) {
  const Dibujo = DIBUJOS[tipo];
  return (
    <svg viewBox={`0 0 ${60 * espacios} 78`} className={`ilu ${className ?? ""}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
      <g filter="url(#tinta-bosque)">
        {Dibujo ? <Dibujo c={colorEstilo(color)} /> : null}
        <CapaRica tipo={tipo} c={colorEstilo(color)} nombre={NOMBRE_COLOR[color] ?? ""} />
      </g>
    </svg>
  );
}

/** Pinza de madera con su muelle. */
export function PinzaBosque({ x, color = "var(--pinza, #c99a62)" }: { x: number; color?: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={-4.5} y={-2} width={9} height={20} rx={2.5} style={{ fill: color }} stroke={TINTA} strokeWidth={2} />
      <path d={`M0 -1 V17`} style={{ stroke: oscuro(color, 40) }} strokeWidth={1.2} />
      <circle cx={0} cy={6} r={3.6} fill="#a9b1b5" stroke={TINTA} strokeWidth={1.6} />
      <g className="capa-rica">
        <path d="M-2.6 10 q1 3 0 6 M2.6 -0.5 q-1 2 0 3.5" fill="none" stroke={TINTA} strokeWidth=".7" opacity=".5" />
        <path d="M-2.4 6 h4.8 M-2.4 4.4 h4.8 M-2.4 7.6 h4.8" stroke={TINTA} strokeWidth=".6" opacity=".7" />
        <circle cx={-1.4} cy={4.6} r={1} fill="#fff" opacity=".8" />
      </g>
    </g>
  );
}

/** Gota de humedad con contorno de tinta. */
export function GotaBosque({ x = 0, y = 0, r = 1 }: { x?: number; y?: number; r?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${r})`}
      d="M0 -7 C3 -2.5 5 0 5 2.4 A5 5 0 0 1 -5 2.4 C-5 0 -3 -2.5 0 -7Z"
      fill="#6fb2dc"
      stroke={TINTA}
      strokeWidth={1.6 / r}
    />
  );
}

// ---------- Iconos (cuerdas y acciones), 64 × 64 ----------

const nube = "M18 46 C8 46 6 34 15 31 C14 21 27 16 33 23 C37 13 54 14 55 26 C63 25 66 37 59 41 C64 45 60 50 53 49 Z";

export const ICONOS_BOSQUE: Record<string, ReactElement> = {
  basica: (
    <g {...trazo}>
      <circle cx="32" cy="32" r="18" fill="#d8b98a" />
      <path d="M32 32 m-11 0 a11 11 0 1 1 11 11 a6 6 0 1 1 -6 -6" fill="none" stroke="#7a5a34" strokeWidth="3.4" />
      <circle cx="32" cy="32" r="18" fill="none" />
    </g>
  ),
  tejadillo: (
    <g {...trazo}>
      <path d="M8 34 L32 12 L56 34 Z" fill="#c2553a" />
      <path d="M14 30 H50 M20 24 H44" stroke={TINTA} strokeWidth="2" />
      <path d="M18 34 V52 H46 V34" fill={CREMA} />
      <path d="M28 52 V42 H36 V52" fill="#7a5a34" />
    </g>
  ),
  resistente: (
    <g {...trazo}>
      <path d="M20 30 a12 12 0 0 1 24 0 V38" fill="none" stroke="#6f7a80" strokeWidth="7" />
      <path d="M20 30 a12 12 0 0 1 24 0 V38" fill="none" stroke={TINTA} strokeWidth="2" />
      <rect x="14" y="32" width="36" height="22" rx="5" fill="#a9b1b5" />
      <circle cx="32" cy="43" r="4" fill={TINTA} />
    </g>
  ),
  "secado-rapido": (
    <g {...trazo}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <path key={i} d={`M${32 + Math.cos(a) * 18} ${32 + Math.sin(a) * 18} L${32 + Math.cos(a + 0.18) * 27} ${32 + Math.sin(a + 0.18) * 27} L${32 + Math.cos(a - 0.18) * 27} ${32 + Math.sin(a - 0.18) * 27} Z`} fill="#e1a73a" strokeWidth="2" />;
      })}
      <circle cx="32" cy="32" r="14" fill="#f2c25a" />
      <path d="M26 34 q6 5 12 0" fill="none" strokeWidth="2.4" />
    </g>
  ),
  "modificador-puntuacion": (
    <g {...trazo}>
      <rect x="22" y="8" width="13" height="38" rx="4" fill="#c2553a" />
      <circle cx="28.5" cy="22" r="5" fill="#a9b1b5" />
      <circle cx="46" cy="44" r="12" fill="#f2c25a" />
      <text x="46" y="49.5" textAnchor="middle" fontSize="15" fontWeight="800" fill={TINTA} stroke="none" style={{ fontFamily: "var(--fuente-texto)" }}>
        +1
      </text>
    </g>
  ),
  fragil: (
    <g {...trazo}>
      <path d="M6 30 Q16 36 26 31" fill="none" stroke="#a48a63" strokeWidth="6" />
      <path d="M38 33 Q48 28 58 34" fill="none" stroke="#a48a63" strokeWidth="6" />
      <path d="M6 30 Q16 36 26 31 M38 33 Q48 28 58 34" fill="none" strokeWidth="1.8" />
      <path d="M26 31 l3 -6 M26 31 l4 4 M27 32 l1 7 M38 33 l-3 -6 M38 33 l-4 5" strokeWidth="2" />
      <path d="M30 46 l3 4 l-3 4 l3 4" fill="none" stroke="#c2553a" strokeWidth="2.6" />
    </g>
  ),
  "rafaga-de-viento": (
    <g {...trazo} fill="none">
      <path d="M6 22 H38 C46 22 48 12 41 10 C36 9 34 14 37 16" strokeWidth="5.5" stroke={TINTA} />
      <path d="M6 22 H38 C46 22 48 12 41 10 C36 9 34 14 37 16" strokeWidth="2.4" stroke="#d8e7ee" />
      <path d="M10 34 H50 C60 34 61 22 53 21 C47 20 46 26 49 28" strokeWidth="5.5" stroke={TINTA} />
      <path d="M10 34 H50 C60 34 61 22 53 21 C47 20 46 26 49 28" strokeWidth="2.4" stroke="#d8e7ee" />
      <path d="M4 46 H34 C42 46 43 56 36 57 C31 58 30 52 33 51" strokeWidth="5.5" stroke={TINTA} />
      <path d="M4 46 H34 C42 46 43 56 36 57 C31 58 30 52 33 51" strokeWidth="2.4" stroke="#d8e7ee" />
    </g>
  ),
  "retrasar-secado": (
    <g {...trazo}>
      <path d={nube} fill="#e8ecef" />
      <path d="M40 30 C44 32 52 32 54 28" fill="none" stroke="#b8c3cb" strokeWidth="2" />
      <GotaBosque x={32} y={56} r={1.15} />
    </g>
  ),
  "mojar-cuerda-rival": (
    <g {...trazo}>
      <path d={nube} fill="#9fb0bd" />
      <GotaBosque x={20} y={56} />
      <GotaBosque x={33} y={60} />
      <GotaBosque x={46} y={56} />
    </g>
  ),
  "secar-prenda": (
    <g {...trazo}>
      <path d="M6 54 Q32 40 58 54 V60 H6 Z" fill="#8aa37b" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4 + 0.2;
        return <path key={i} d={`M${32 + Math.cos(a) * 15} ${28 + Math.sin(a) * 15} L${32 + Math.cos(a) * 23} ${28 + Math.sin(a) * 23}`} stroke="#e1a73a" strokeWidth="5" />;
      })}
      <circle cx="32" cy="28" r="12" fill="#f2c25a" />
    </g>
  ),
  "reducir-humedad": (
    <g {...trazo}>
      <GotaBosque x={28} y={34} r={2.6} />
      <circle cx="46" cy="44" r="10" fill={CREMA} />
      <path d="M41 44 H51" strokeWidth="3.4" />
    </g>
  ),
};

export function IconoBosque({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)">{ICONOS_BOSQUE[id] ?? <circle cx="32" cy="32" r="16" fill={CREMA} {...trazo} />}</g>
    </svg>
  );
}

// ---------- Animales de los jugadores ----------

/** Ratón con bufanda verde (Tú). */
export function Raton({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <circle cx="15" cy="20" r="12" fill="#9b8b78" />
        <circle cx="15" cy="20" r="6.5" fill="#e3a9a0" strokeWidth="2" />
        <circle cx="49" cy="20" r="12" fill="#9b8b78" />
        <circle cx="49" cy="20" r="6.5" fill="#e3a9a0" strokeWidth="2" />
        <path d="M12 38 C12 24 22 18 32 18 C42 18 52 24 52 38 C52 48 43 54 32 54 C21 54 12 48 12 38 Z" fill="#b3a490" />
        <path d="M40 22 C48 26 52 32 52 38 C52 46 46 52 38 53 C44 46 44 32 40 22 Z" fill="#9b8b78" stroke="none" />
        <path d="M12 38 C12 24 22 18 32 18 C42 18 52 24 52 38 C52 48 43 54 32 54 C21 54 12 48 12 38 Z" fill="none" />
        <circle cx="25" cy="35" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="39" cy="35" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="32" cy="43" r="3" fill="#d9776b" strokeWidth="2" />
        <path d="M22 44 L12 42 M22 47 L13 49 M42 44 L52 42 M42 47 L51 49" strokeWidth="1.4" />
        <path d="M14 52 Q32 62 50 52 L50 58 Q32 66 14 58 Z" fill="#3f8a6d" />
        <path d="M40 58 L44 64 L50 62 L46 56" fill="#3f8a6d" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

/** Zorra con pañuelo (Lu). */
export function Zorra({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d="M10 6 L24 20 L14 28 Z" fill="#c2553a" />
        <path d="M13 11 L20 19 L15 23 Z" fill={TINTA} stroke="none" />
        <path d="M54 6 L40 20 L50 28 Z" fill="#c2553a" />
        <path d="M51 11 L44 19 L49 23 Z" fill={TINTA} stroke="none" />
        <path d="M8 30 C10 20 20 16 32 16 C44 16 54 20 56 30 C56 40 46 48 32 56 C18 48 8 40 8 30 Z" fill="#c2553a" />
        <path d="M44 18 C52 22 56 26 56 30 C56 40 46 48 32 56 C42 46 48 32 44 18 Z" fill="#9f412b" stroke="none" />
        <path d="M8 30 C14 34 22 36 26 42 C28 46 30 50 32 56 C34 50 36 46 38 42 C42 36 50 34 56 30 C52 40 44 48 32 56 C20 48 12 40 8 30 Z" fill="#f2e6cc" />
        <path d="M8 30 C10 20 20 16 32 16 C44 16 54 20 56 30 C56 40 46 48 32 56 C18 48 8 40 8 30 Z" fill="none" />
        <path d="M21 31 q3 -3 6 0" fill="none" strokeWidth="2.6" />
        <path d="M37 31 q3 -3 6 0" fill="none" strokeWidth="2.6" />
        <path d="M29 50 h6 l-3 3 z" fill={TINTA} />
      </g>
    </svg>
  );
}

// ---------- Cesta y cielo ----------

export function CestaBosque({ className }: { className?: string }) {
  const m = "#c7955a";
  return (
    <svg viewBox="0 0 120 80" className={`ilu ${className ?? ""}`} aria-hidden preserveAspectRatio="none">
      <g filter="url(#tinta-bosque)">
        <path d="M8 24 H112 L101 74 C100 77 98 78 95 78 H25 C22 78 20 77 19 74 Z" fill={m} {...trazo} />
        <path d="M86 24 H112 L101 74 C100 77 98 78 95 78 H84 Z" fill={tono(m, -0.25)} />
        {Array.from({ length: 4 }, (_, i) => (
          <path key={i} d={`M${12 + i * 2.6} ${36 + i * 10} H${108 - i * 2.6}`} stroke={TINTA} strokeWidth="1.8" />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`v${i}`} d={`M${18 + i * 11} 26 L${25 + i * 9.4} 76`} stroke={tono(m, -0.4)} strokeWidth="1.6" />
        ))}
        <path d="M8 24 H112 L101 74 C100 77 98 78 95 78 H25 C22 78 20 77 19 74 Z" fill="none" {...trazo} />
        <rect x="3" y="16" width="114" height="11" rx="5.5" fill={tono(m, 0.15)} {...trazo} />
      </g>
    </svg>
  );
}

/** Ilustración de la carta del día «Soleado». */
export function CieloSoleado({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 64" className={`ilu ${className ?? ""}`} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="64" fill="#a9cfe0" />
      <g filter="url(#tinta-bosque)" {...trazo}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i * Math.PI) / 5;
          return <path key={i} d={`M${62 + Math.cos(a) * 14} ${24 + Math.sin(a) * 14} L${62 + Math.cos(a) * 21} ${24 + Math.sin(a) * 21}`} stroke="#e1a73a" strokeWidth="4" />;
        })}
        <circle cx="62" cy="24" r="10" fill="#f2c25a" />
        <path d="M-4 52 Q20 36 46 50 Q70 40 104 50 V68 H-4 Z" fill="#8aa37b" />
        <path d="M-4 60 Q30 50 60 58 Q84 54 104 60 V68 H-4 Z" fill="#6f8a62" />
        <path d="M20 46 V36 M14 40 L20 30 L26 40 Z" fill="#4f6b48" strokeWidth="2.2" />
      </g>
    </svg>
  );
}
