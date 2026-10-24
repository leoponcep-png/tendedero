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

/**
 * Filtros de los estilos de dibujo. «tinta-bosque» antes hacía temblar el trazo (feTurbulence + feDisplacementMap),
 * pero deformaba y recortaba los dibujos (los «glitch» de las cartas). Ahora no cambia nada: se conserva el id porque
 * prendas, animales y piezas lo siguen nombrando, y el estilo fusión le añade su sombra de risografía por CSS.
 * Todas las regiones de filtro son amplias para que ningún trazo se corte por el borde de la región.
 */
export function DefsBosque() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="tinta-bosque" x="-25%" y="-25%" width="150%" height="150%">
        <feOffset dx="0" dy="0" />
      </filter>
      {/* Acuarela: bordes que se corren y color que se aclara por dentro */}
      <filter id="acuarela" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="2" result="ruido" />
        <feDisplacementMap in="SourceGraphic" in2="ruido" scale="7" result="corrido" />
        <feGaussianBlur in="corrido" stdDeviation="1.2" result="suave" />
        <feComposite in="suave" in2="corrido" operator="arithmetic" k2=".75" k3=".45" />
      </filter>
      {/* Impresionista: pinceladas cortas que rompen la forma */}
      <filter id="pincel" x="-25%" y="-25%" width="150%" height="150%">
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
      <filter id="rugoso" x="-25%" y="-25%" width="150%" height="150%">
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
      {/* Tramas de risografía para marcos y paisajes de las cartas */}
      <pattern id="trama-puntos" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
        <circle cx="2" cy="2" r=".75" fill="#ffffff" opacity=".55" />
      </pattern>
      <pattern id="trama-tinta" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
        <circle cx="1.5" cy="1.5" r=".55" fill={TINTA} opacity=".35" />
      </pattern>
      <pattern id="trama-fina" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
        <circle cx=".8" cy=".8" r=".34" fill="#ffffff" opacity=".5" />
      </pattern>
      <pattern id="trama-fina-tinta" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
        <circle cx=".8" cy=".8" r=".3" fill={TINTA} opacity=".3" />
      </pattern>
      <pattern id="trama-rayas" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="1.1" height="3" fill="#000000" opacity=".16" />
      </pattern>
      <pattern id="trama-cuadros" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="3" height="6" fill="#ffffff" opacity=".16" />
        <rect width="6" height="3" fill="#ffffff" opacity=".16" />
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
/** Nombre del color de una prenda o de unas pinzas («rojo», «azul»...), si es uno de los cuatro del juego. */
export const nombreColor = (hex: string): string | undefined => NOMBRE_COLOR[hex];
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
    // overflow visible: la presilla de la toalla y el contorno de tinta asoman un pelo por arriba y no deben cortarse.
    <svg viewBox={`0 0 ${60 * espacios} 78`} className={`ilu ${className ?? ""}`} preserveAspectRatio="xMidYMid meet" overflow="visible" aria-hidden>
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

// ---------- Iconos (cuerdas, acciones, tiempo y sucesos), 64 × 64 ----------
// Todos hablan el mismo idioma: contorno de tinta de 3, colores planos de la paleta del estilo activo (variables CSS),
// una sombra (.sombra) que cada estilo enciende o cambia, algún reflejo blanco y piezas comunes (cuerda trenzada,
// prendas en miniatura, sol con cara, nube, flechas y destellos) para que se reconozcan como de la misma familia.

/** Colores de los iconos: salen del estilo de dibujo activo, con el tono del bosque de reserva. */
export const COLOR = {
  rojo: "var(--p-rojo, #c2553a)",
  azul: "var(--p-azul, #4f7fa6)",
  amarillo: "var(--p-amarillo, #e1a73a)",
  blanco: "var(--p-blanco, #efe5cf)",
  madera: "var(--pinza, #c99a62)",
  fastidio: "var(--fastidio, #b5523b)",
  tactica: "var(--tactica, #4f7d6a)",
  crema: "var(--crema, #f2e6cc)",
  agua: "#6fb2dc",
  nube: "#eef2f4",
  nubarron: "#8e9cad",
  metal: "#a9b1b5",
  cuerda: "#d8b98a",
  cuerdaVieja: "#a48a63",
  hierba: "#8aa37b",
  mejilla: "#ff8f86",
};
/** Color de las pinzas de la carta «Pinzas de color» (la carta lo pone en --pinza-color). */
const PINZA_COLOR = "var(--pinza-color, var(--p-rojo, #c2553a))";
const relleno = (c: string) => ({ style: { fill: c } });
const linea = (c: string) => ({ style: { stroke: c } });

const nube = "M18 46 C8 46 6 34 15 31 C14 21 27 16 33 23 C37 13 54 14 55 26 C63 25 66 37 59 41 C64 45 60 50 53 49 Z";
const RAYO = "M36 4 L20 32 H31 L25 58 L46 24 H35 L42 4 Z";

/** Cuerda trenzada: contorno de tinta, el color y la trenza en discontinuo. */
export function Soga({ d, g = 5, c = COLOR.cuerda }: { d: string; g?: number; c?: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={TINTA} strokeWidth={g + 3.2} />
      <path d={d} {...linea(c)} strokeWidth={g} />
      <path d={d} style={{ stroke: oscuro(c, 32) }} strokeWidth={g * 0.38} strokeDasharray={`${g * 0.5} ${g * 0.6}`} />
    </g>
  );
}

const SOMBRA_MINI: Record<string, string> = {
  calcetin: "M36 8 H41.5 V43 C41.5 47 43.5 50 46.5 53 L52.5 59 C57 63.5 55 71 49 72.5 C53 66 49 61 44 56 C39 51 36 47 36 42 Z",
  camiseta: "M78 8 L98 15 L115 33 L101 45 L90 36 V73 H74 C78 58 76 40 80 24 Z",
  toalla: "M128 6 H172 V64 H128 Z",
};
const DETALLE_MINI: Record<string, string> = {
  calcetin: "M17 17 H43",
  camiseta: "M44 7 C47 15 53 19 60 19 C67 19 73 15 76 7",
  toalla: "M8 17 H172",
};

/** Prenda en miniatura para iconos y escenas: silueta, sombra y contorno con un grosor que no depende de la escala. */
export function MiniPrenda({
  tipo,
  c,
  x = 0,
  y = 0,
  s = 0.3,
  giro = 0,
  fantasma = false,
}: {
  tipo: "calcetin" | "camiseta" | "toalla";
  c: string;
  x?: number;
  y?: number;
  s?: number;
  giro?: number;
  fantasma?: boolean;
}) {
  const contorno = CONTORNOS[tipo];
  const t = 2.6 / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`} opacity={fantasma ? 0.45 : undefined}>
      <path d={contorno} {...relleno(fantasma ? "#ffffff" : c)} />
      {!fantasma && (
        <>
          <path className="sombra" d={SOMBRA_MINI[tipo]} style={{ fill: oscuro(c) }} />
          {tipo === "toalla" && <path d="M8 44 H172 M8 52 H172" stroke="#ffffff" strokeOpacity=".7" strokeWidth={t * 0.9} />}
          <path d={DETALLE_MINI[tipo]} fill="none" stroke={TINTA} strokeWidth={t * 0.7} />
        </>
      )}
      <path d={contorno} fill="none" stroke={TINTA} strokeWidth={t} strokeLinejoin="round" strokeDasharray={fantasma ? `${t * 1.6} ${t * 1.1}` : undefined} />
    </g>
  );
}

/** Destello de cuatro puntas (brillo anime). */
export function Chispa({ x, y, r = 5, c = "#ffffff" }: { x: number; y: number; r?: number; c?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${r / 5})`}
      d="M0 -5 C0.8 -1.2 1.2 -0.8 5 0 C1.2 0.8 0.8 1.2 0 5 C-0.8 1.2 -1.2 0.8 -5 0 C-1.2 -0.8 -0.8 -1.2 0 -5 Z"
      {...relleno(c)}
      stroke={TINTA}
      strokeWidth={(1.3 * 5) / r}
      strokeLinejoin="round"
    />
  );
}

/** Flecha gruesa de tinta con punta; `punta` es [x, y, ángulo] del final del trazo. */
export function Flecha({ d, punta, c }: { d: string; punta: [number, number, number]; c: string }) {
  const [x, y, a] = punta;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={d} fill="none" stroke={TINTA} strokeWidth="7" />
      <path d={d} fill="none" {...linea(c)} strokeWidth="3.6" />
      <path transform={`translate(${x} ${y}) rotate(${a})`} d="M-2 -6.5 L8 0 L-2 6.5 Z" {...relleno(c)} stroke={TINTA} strokeWidth="2.2" />
    </g>
  );
}

/** Sol con rayos y, si se quiere, con cara (ojos cerrados, sonrisa y mofletes). */
export function Sol({ x, y, r = 12, c = COLOR.amarillo, cara = true, rayos = 10 }: { x: number; y: number; r?: number; c?: string; cara?: boolean; rayos?: number }) {
  const punto = (a: number, rr: number) => `${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`;
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: rayos }, (_, i) => {
        const a = (i * 2 * Math.PI) / rayos - Math.PI / 2;
        return <path key={i} d={`M${punto(a + 0.2, r * 1.12)} L${punto(a, r * 1.75)} L${punto(a - 0.2, r * 1.12)} Z`} {...relleno(c)} stroke={TINTA} strokeWidth="2" strokeLinejoin="round" />;
      })}
      <circle r={r} {...relleno(c)} />
      <path className="sombra" d={`M${punto(-0.35, r)} A${r} ${r} 0 0 1 ${punto(1.9, r)} A${r * 1.15} ${r * 1.15} 0 0 0 ${punto(-0.35, r)} Z`} style={{ fill: oscuro(c, 22) }} />
      <circle cx={-r * 0.4} cy={-r * 0.42} r={r * 0.2} fill="#ffffff" opacity=".75" />
      {cara && (
        <g fill="none" stroke={TINTA} strokeWidth="1.8" strokeLinecap="round">
          <path d={`M${-r * 0.48} ${-r * 0.02} q${r * 0.16} ${-r * 0.22} ${r * 0.32} 0 M${r * 0.16} ${-r * 0.02} q${r * 0.16} ${-r * 0.22} ${r * 0.32} 0`} />
          <path d={`M${-r * 0.26} ${r * 0.3} q${r * 0.26} ${r * 0.3} ${r * 0.52} 0`} />
          <circle cx={-r * 0.58} cy={r * 0.3} r={r * 0.13} fill={COLOR.mejilla} stroke="none" opacity=".8" />
          <circle cx={r * 0.58} cy={r * 0.3} r={r * 0.13} fill={COLOR.mejilla} stroke="none" opacity=".8" />
        </g>
      )}
      <circle r={r} fill="none" stroke={TINTA} strokeWidth="2.6" />
    </g>
  );
}

/** Nube (o nubarrón) con su sombra, reflejo y, si se quiere, una cara enfadada. */
export function Nube({ x = 0, y = 0, s = 1, c = COLOR.nube, enfado = false }: { x?: number; y?: number; s?: number; c?: string; enfado?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={nube} {...relleno(c)} />
      <path className="sombra" d="M10 42 C24 47 46 47 60 41 C64 45 60 50 53 49 H18 C13 49 9 46 10 42 Z" style={{ fill: oscuro(c, 22) }} />
      <path d="M17 31 C17 26 21 23 25 24 M38 19 C42 16.5 47 17.5 49.5 21" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" opacity=".85" />
      {enfado && (
        <g stroke={TINTA} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M25 29 l7 3.5 M47 29 l-7 3.5" />
          <circle cx="30" cy="36" r="1.6" fill={TINTA} stroke="none" />
          <circle cx="42" cy="36" r="1.6" fill={TINTA} stroke="none" />
          <path d="M31 43 q5 -4 10 0" />
        </g>
      )}
      <path d={nube} fill="none" stroke={TINTA} strokeWidth={3 / s} strokeLinejoin="round" />
    </g>
  );
}

/** Pinza grande para iconos: dos palas, muelle y la raya del centro. */
function PinzaGrande({ c = COLOR.madera, rota = 0, x = 26, y = 4 }: { c?: string; rota?: number; x?: number; y?: number }) {
  return (
    <g transform={`rotate(${rota} ${x} ${y + 26})`}>
      <rect x={x - 8} y={y} width="16" height="48" rx="4.5" {...relleno(c)} />
      <path className="sombra" d={`M${x + 1} ${y + 1} H${x + 3.5} A4.5 4.5 0 0 1 ${x + 8} ${y + 5.5} V${y + 43.5} A4.5 4.5 0 0 1 ${x + 3.5} ${y + 48} H${x + 1} Z`} style={{ fill: oscuro(c, 25) }} />
      <path d={`M${x} ${y + 1} V${y + 47}`} stroke={TINTA} strokeWidth="1.6" />
      <path d={`M${x - 5} ${y + 28} V${y + 42}`} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <circle cx={x} cy={y + 18} r="6" fill={COLOR.metal} stroke={TINTA} strokeWidth="2.2" />
      <path d={`M${x - 3.5} ${y + 16} h7 M${x - 3.5} ${y + 18} h7 M${x - 3.5} ${y + 20} h7`} stroke={TINTA} strokeWidth="1" />
      <circle cx={x - 2} cy={y + 16} r="1.3" fill="#ffffff" />
      <rect x={x - 8} y={y} width="16" height="48" rx="4.5" fill="none" {...trazo} />
    </g>
  );
}

/** Carta de cuerda en miniatura (para los iconos que hablan de cartas de cuerda). */
function MiniCartaCuerda({ x, y, giro = 0, c = COLOR.tactica }: { x: number; y: number; giro?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro} 15 10.5)`}>
      <rect width="30" height="21" rx="3" fill={CREMA} />
      <path d="M0 3 Q0 0 3 0 H27 Q30 0 30 3 V6 H0 Z" {...relleno(c)} />
      <path d="M0 6 H30" stroke={TINTA} strokeWidth="1.4" />
      <Soga d="M-1 16 Q15 19 31 16" g={2.4} />
      <rect width="30" height="21" rx="3" fill="none" {...trazo} strokeWidth={2.4} />
    </g>
  );
}

export const ICONOS_BOSQUE: Record<string, ReactElement> = {
  // ----- Cuerdas -----
  basica: (
    <g>
      <Soga d="M46 46 C51 51 55 54 60 55" g={5} />
      <path d="M60 55 l3 -2 M60 55 l3.5 1.5 M60 55 l1 3.5" stroke={TINTA} strokeWidth="1.4" strokeLinecap="round" />
      <Soga d="M13 33 A19 19 0 1 1 51 33 A19 19 0 1 1 13 33" g={5.5} />
      <Soga d="M20 33 A12 12 0 1 1 44 33 A12 12 0 1 1 20 33" g={5.5} />
      <Soga d="M27 33 A5 5 0 1 1 37 33 A5 5 0 1 1 27 33" g={4.5} />
      <g transform="translate(32 5) scale(1.15)">
        <PinzaBosque x={0} />
      </g>
    </g>
  ),
  tejadillo: (
    <g>
      <Soga d="M7 42 Q32 48 57 42" g={3.6} />
      <MiniPrenda tipo="camiseta" c={COLOR.azul} x={19} y={42.5} s={0.22} />
      <path d="M3 32 L32 7 L61 32 L55 36 L32 16 L9 36 Z" {...relleno(COLOR.rojo)} />
      <path className="sombra" d="M9 36 L32 16 L55 36 L52 37.5 L32 20.5 L12 37.5 Z" style={{ fill: oscuro(COLOR.rojo, 40) }} />
      <path d="M10.2 25.7 L14.6 30.8 M17.5 19.5 L20.8 25.4 M24.8 13.3 L27 19.8 M53.8 25.7 L49.4 30.8 M46.5 19.5 L43.2 25.4 M39.2 13.3 L37 19.8" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 29 L29 11" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
      <path d="M3 32 L32 7 L61 32 L55 36 L32 16 L9 36 Z" fill="none" {...trazo} />
      <circle cx="32" cy="8.5" r="2.8" {...relleno(COLOR.rojo)} {...trazo} strokeWidth={2} />
      <GotaBosque x={8} y={12} r={0.7} />
      <GotaBosque x={56} y={11} r={0.7} />
      <path d="M3 21 l-1.5 -3 M13 19 l1 -3.5 M51 19 l-1 -3.5 M61 21 l1.5 -3" {...linea(COLOR.agua)} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  resistente: (
    <g>
      <Soga d="M2 46 Q32 54 62 46" g={7} c="#a07a4e" />
      <path d="M21 32 V22 A11 11 0 0 1 43 22 V32" fill="none" stroke={TINTA} strokeWidth="10" strokeLinecap="round" />
      <path d="M21 32 V22 A11 11 0 0 1 43 22 V32" fill="none" stroke={COLOR.metal} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M23.4 29 V22 A8.6 8.6 0 0 1 28 14.6" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".75" />
      <rect x="13" y="29" width="38" height="27" rx="6" {...relleno(COLOR.amarillo)} />
      <path className="sombra" d="M39 29 H45 A6 6 0 0 1 51 35 V50 A6 6 0 0 1 45 56 H37 C41 48 41 38 39 29 Z" style={{ fill: oscuro(COLOR.amarillo) }} />
      <path d="M13 36 H51" style={{ stroke: oscuro(COLOR.amarillo, 30) }} strokeWidth="1.4" />
      <circle cx="32" cy="41.5" r="4" fill={TINTA} />
      <path d="M30 43 L29 50.5 H35 L34 43 Z" fill={TINTA} />
      {[
        [18, 33],
        [46, 33],
        [18, 51.5],
        [46, 51.5],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill={TINTA} />
      ))}
      <path d="M17.5 38 V47" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".6" />
      <rect x="13" y="29" width="38" height="27" rx="6" fill="none" {...trazo} />
    </g>
  ),
  "secado-rapido": (
    <g>
      {[20, 31, 42].map((y, i) => (
        <g key={y} strokeLinecap="round">
          <path d={`M${3 + i * 2} ${y} H17`} stroke={TINTA} strokeWidth="5" />
          <path d={`M${3 + i * 2} ${y} H17`} stroke="#ffffff" strokeWidth="2" />
        </g>
      ))}
      <Sol x={39} y={31} r={13} />
      <g opacity=".9">
        <GotaBosque x={10} y={55} r={0.75} />
        <path d="M15.5 51 q2 -2 0 -4 q-2 -2 0 -4" fill="none" {...linea(COLOR.agua)} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </g>
  ),
  "modificador-puntuacion": (
    <g>
      <PinzaGrande c={PINZA_COLOR} rota={-18} x={24} y={3} />
      <circle cx="45" cy="45" r="14" {...relleno(COLOR.amarillo)} />
      <path className="sombra" d="M55 36 A14 14 0 0 1 36 56 A16 16 0 0 0 55 36 Z" style={{ fill: oscuro(COLOR.amarillo) }} />
      <circle cx="45" cy="45" r="10.5" fill="none" style={{ stroke: oscuro(COLOR.amarillo, 35) }} strokeWidth="1.3" strokeDasharray="2 2" />
      <text x="45" y="50.5" textAnchor="middle" fontSize="15" fontWeight="800" fill={TINTA} style={{ fontFamily: "var(--fuente-titulo)" }}>
        +1
      </text>
      <circle cx="45" cy="45" r="14" fill="none" {...trazo} />
      <Chispa x={57} y={27} r={4.5} />
    </g>
  ),
  fragil: (
    <g>
      <g stroke={TINTA} strokeWidth="1" fill="none" opacity=".55">
        <path d="M2 62 V42 M2 62 L14 47 M2 62 L22 55 M2 62 H25" />
        <path d="M2 55 Q6 55 7.5 53.5 Q10 57.5 12.5 58.5 Q16 61 18 62 M2 48 Q8 48 11 49 Q14 53 18.5 56.5 Q22 60 25 62" />
      </g>
      <Soga d="M3 24 Q14 32 26 28" g={6} c={COLOR.cuerdaVieja} />
      <Soga d="M38 34 Q50 28 61 34" g={6} c={COLOR.cuerdaVieja} />
      <g stroke={TINTA} strokeWidth="1.5" strokeLinecap="round">
        <path d="M26 28 l5 -6 M26 28 l6 -1 M26 28 l5 4 M27 29 l2 7" />
        <path d="M38 34 l-5 -6 M38 34 l-6 1 M38 34 l-4 5 M37 33 l-1 -8" />
      </g>
      {[
        [10, 27.5],
        [18, 30.5],
        [48, 31],
        [56, 32.5],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="1.4" fill="#eadcbd" />
      ))}
      <path d="M32 15 V8 M25 17 l-3.5 -4.5 M39 17 l3.5 -4.5" {...linea(COLOR.fastidio)} strokeWidth="2.6" strokeLinecap="round" />
      <g transform="translate(48 50)">
        <ellipse cx="-4.5" cy="0" rx="5" ry="3.6" fill="#d9cbb0" stroke={TINTA} strokeWidth="1.4" transform="rotate(-20 -4.5 0)" />
        <ellipse cx="4.5" cy="0" rx="5" ry="3.6" fill="#d9cbb0" stroke={TINTA} strokeWidth="1.4" transform="rotate(20 4.5 0)" />
        <ellipse cx="0" cy="0.5" rx="1.6" ry="4.4" fill={TINTA} />
        <path d="M-1 -3.5 l-2 -3 M1 -3.5 l2 -3" stroke={TINTA} strokeWidth="1" strokeLinecap="round" />
      </g>
    </g>
  ),

  // ----- Acciones de fastidio -----
  "mojar-cuerda-rival": (
    <g>
      {/* Subido para que el medallón de la carta no tape la lluvia */}
      <Nube y={-12} c={COLOR.nubarron} enfado />
      <path d="M11 41 l-2.5 5 M25 42 l-2.5 5 M39 42 l-2.5 5 M53 41 l-2.5 5" {...linea(COLOR.agua)} strokeWidth="2.2" strokeLinecap="round" />
      <GotaBosque x={17} y={50} />
      <GotaBosque x={32} y={47} />
      <GotaBosque x={47} y={50} />
    </g>
  ),
  "rafaga-de-viento": (
    <g>
      <path d="M26 8 l7 2.5 M23 15 l7 2.5" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
      <MiniPrenda tipo="calcetin" c={COLOR.rojo} x={45} y={1} s={0.3} giro={30} />
      {["M3 38 H28 C38 38 40 26 32 24 C27 23 25 29 28 31", "M9 52 H42 C52 52 53 41 46 40 C41 39 40 45 43 46", "M3 45 H20"].map((d) => (
        <g key={d} fill="none" strokeLinecap="round">
          <path d={d} stroke={TINTA} strokeWidth="6" />
          <path d={d} stroke="#e3f1f7" strokeWidth="2.6" />
        </g>
      ))}
    </g>
  ),
  "pinza-rota": (
    <g>
      <g transform="rotate(-14 30 20)">
        <path d="M22 4 H38 Q40 4 40 7 V24 L37 27 L34 23 L31 28 L28 23 L25 27 L22 24 Z" {...relleno(COLOR.madera)} />
        <path className="sombra" d="M33 5 H38 Q39.5 5 39.5 7 V24 L37 26.5 L34 23 Z" style={{ fill: oscuro(COLOR.madera, 25) }} />
        <path d="M31 5 V22" stroke={TINTA} strokeWidth="1.5" />
        <path d="M22 4 H38 Q40 4 40 7 V24 L37 27 L34 23 L31 28 L28 23 L25 27 L22 24 Z" fill="none" {...trazo} />
      </g>
      <g transform="translate(1 8) rotate(10 31 46)">
        <path d="M22 34 L25 31 L28 35 L31 30 L34 35 L37 31 L40 34 V54 Q40 58 36 58 H26 Q22 58 22 54 Z" {...relleno(COLOR.madera)} />
        <path className="sombra" d="M34 35 L37 31 L39.5 33.5 V54 Q39.5 57.5 36 57.5 H33 Z" style={{ fill: oscuro(COLOR.madera, 25) }} />
        <path d="M31 37 V56" stroke={TINTA} strokeWidth="1.5" />
        <path d="M22 34 L25 31 L28 35 L31 30 L34 35 L37 31 L40 34 V54 Q40 58 36 58 H26 Q22 58 22 54 Z" fill="none" {...trazo} />
      </g>
      {/* El muelle de la pinza, saltando por los aires */}
      <g transform="translate(50 28) rotate(-25)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-7 0 l2 -4 l2.5 8 l2.5 -8 l2.5 8 l2.5 -8 l2 4" stroke={TINTA} strokeWidth="4.4" />
        <path d="M-7 0 l2 -4 l2.5 8 l2.5 -8 l2.5 8 l2.5 -8 l2 4" stroke={COLOR.metal} strokeWidth="2" />
      </g>
      <path d="M44 16 l-2 -3 M50 14 v-4 M56 17 l2 -3" fill="none" stroke={TINTA} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 31 l3.5 2 l-4 1.5 Z M14 39 l3 1 l-2.5 2 Z" {...relleno(COLOR.madera)} stroke={TINTA} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 22 l-5 -2 M9 27 h-6" {...linea(COLOR.fastidio)} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
  "retrasar-secado": (
    <g>
      <Sol x={43} y={20} r={10} cara={false} />
      <Nube x={-6} y={7} s={0.85} />
      <GotaBosque x={50} y={50} r={1.35} />
      <path d="M50 48.5 v6 M47 51.5 h6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  ),
  // Una pinza vacía donde estaba la prenda y la prenda, ya en otro hueco; la flecha va por encima de la cuerda.
  "mover-prenda-rival": (
    <g>
      <Soga d="M2 22 Q32 30 62 22" g={3.4} />
      <g transform="translate(9 23.5) scale(.6)">
        <PinzaBosque x={0} />
      </g>
      <MiniPrenda tipo="camiseta" c={COLOR.rojo} x={17.2} y={23} s={0.38} />
      <g transform="translate(0 23.6) scale(.5)">
        <PinzaBosque x={67.8} />
        <PinzaBosque x={92.2} />
      </g>
      <path d="M17 36 h-4 M18 41 h-4" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
      <Flecha d="M6 15 Q16 1 28 9" punta={[28, 9, 30]} c={COLOR.fastidio} />
    </g>
  ),
  // ----- Acciones tácticas -----
  "colocar-cuerda-extra": (
    <g>
      <g opacity=".85">
        <MiniCartaCuerda x={14} y={7} giro={10} c={COLOR.tactica} />
      </g>
      <MiniCartaCuerda x={5} y={16} giro={-6} c={COLOR.tactica} />
      <circle cx="47" cy="45" r="12.5" {...relleno(COLOR.tactica)} />
      <path className="sombra" d="M56 37 A12.5 12.5 0 0 1 39 55 A14 14 0 0 0 56 37 Z" style={{ fill: oscuro(COLOR.tactica, 30) }} />
      <path d="M47 39 V51 M41 45 H53" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="47" cy="45" r="12.5" fill="none" {...trazo} />
      <Chispa x={58} y={30} r={3.6} />
    </g>
  ),
  "secar-prenda": (
    <g>
      <Sol x={32} y={24} r={12} cara={false} rayos={12} />
      <MiniPrenda tipo="camiseta" c={COLOR.azul} x={10} y={26} s={0.37} />
      <Chispa x={8} y={47} r={5} />
      <Chispa x={57} y={47} r={4} />
      <Chispa x={54} y={9} r={3.4} c={COLOR.amarillo} />
    </g>
  ),
  "reducir-humedad": (
    <g>
      <GotaBosque x={26} y={33} r={2.7} />
      <path d="M19.5 33 q0 -6 4.5 -11" stroke="#ffffff" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".85" />
      <circle cx="45" cy="45" r="12" fill={CREMA} />
      <path className="sombra" d="M54 37 A12 12 0 0 1 37 54 A14 14 0 0 0 54 37 Z" style={{ fill: oscuro("#f2e6cc", 15) }} />
      <path d="M39 45 H51" {...linea(COLOR.tactica)} strokeWidth="4.6" strokeLinecap="round" />
      <circle cx="45" cy="45" r="12" fill="none" {...trazo} />
      <Chispa x={52} y={15} r={4.2} />
      <Chispa x={9} y={54} r={3} />
    </g>
  ),
  // Como «Mover una prenda rival», con un calcetín propio y la flecha verde.
  "mover-prenda-propia": (
    <g>
      <Soga d="M2 22 Q32 30 62 22" g={3.4} />
      <g transform="translate(12 23) scale(.7)">
        <PinzaBosque x={0} />
      </g>
      <MiniPrenda tipo="calcetin" c={COLOR.azul} x={30.5} y={22.7} s={0.45} />
      <g transform="translate(44 23.2) scale(.6)">
        <PinzaBosque x={0} />
      </g>
      <path d="M30 36 h-5 M31 41.5 h-5" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
      <Flecha d="M9 15 Q21 1 33 9.5" punta={[33, 9.5, 35]} c={COLOR.tactica} />
    </g>
  ),
  "proteger-cuerda": (
    <g>
      {/* Escudo verde con una carta de cuerda pintada: la cuerda y sus tres pinzas */}
      <path d="M32 5 L53 12 V29 C53 43 44 52 32 59 C20 52 11 43 11 29 V12 Z" {...relleno(COLOR.tactica)} />
      <path className="sombra" d="M32 5 L53 12 V29 C53 43 44 52 32 59 Z" style={{ fill: oscuro(COLOR.tactica, 25) }} />
      <path d="M32 10.5 L48 15.8 V29 C48 40 41 47.5 32 53 C23 47.5 16 40 16 29 V15.8 Z" fill={CREMA} stroke={TINTA} strokeWidth="1.6" />
      <Soga d="M16.5 27 Q32 33 47.5 27" g={2.6} />
      {[22, 32, 42].map((x) => (
        <g key={x} transform={`translate(${x} 27) scale(.6)`}>
          <PinzaBosque x={0} />
        </g>
      ))}
      <path d="M14 17 V28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <path d="M32 5 L53 12 V29 C53 43 44 52 32 59 C20 52 11 43 11 29 V12 Z" fill="none" {...trazo} />
      <Chispa x={56} y={7} r={3.6} />
      <Chispa x={8} y={50} r={2.8} />
    </g>
  ),
  "buscar-cuerda": (
    <g>
      {/* Mazo de cuerdas boca abajo y la carta que se roba, saliendo hacia arriba */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${5 + i * 2} ${40 - i * 2})`}>
          <rect width="30" height="21" rx="3" fill="#8a5a30" stroke={TINTA} strokeWidth="2.2" />
          <rect x="2.4" y="2.4" width="25.2" height="16.2" rx="1.6" fill="none" stroke={CREMA} strokeWidth="1" opacity=".8" />
        </g>
      ))}
      <path d="M14 46.5 Q24 49.5 34 46.5" fill="none" stroke={CREMA} strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
      <MiniCartaCuerda x={27} y={7} giro={14} c={COLOR.tactica} />
      <path d="M22 13 l-5 -2 M21 19 h-6" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
      <g transform="translate(51 48)">
        <circle r="9.5" {...relleno(COLOR.tactica)} {...trazo} strokeWidth={2.4} />
        <text y="4.2" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff" style={{ fontFamily: "var(--fuente-titulo)" }}>
          +1
        </text>
      </g>
    </g>
  ),
  "cambiar-prendas": (
    <g>
      <MiniPrenda tipo="calcetin" c={COLOR.rojo} x={-1} y={16} s={0.4} />
      <MiniPrenda tipo="camiseta" c={COLOR.azul} x={30} y={22} s={0.28} />
      <Flecha d="M13 13 Q32 0 47 13" punta={[47, 13, 41]} c={COLOR.tactica} />
      <Flecha d="M51 52 Q32 65 17 53" punta={[17, 53, -143]} c={COLOR.tactica} />
    </g>
  ),
  "cambiar-cuerdas": (
    <g>
      <Soga d="M2 11 Q22 16 42 11" g={3.6} />
      <MiniPrenda tipo="camiseta" c={COLOR.rojo} x={10} y={12.5} s={0.2} />
      <Soga d="M2 37 Q22 42 42 37" g={3.6} />
      <MiniPrenda tipo="calcetin" c={COLOR.amarillo} x={14} y={37} s={0.28} />
      <Flecha d="M50 32 V16" punta={[50, 16, -90]} c={COLOR.tactica} />
      <Flecha d="M58 28 V45" punta={[58, 45, 90]} c={COLOR.tactica} />
    </g>
  ),
  "mover-cuerda": (
    <g>
      <rect x="33" y="30" width="28" height="20" rx="3" fill="none" stroke={TINTA} strokeWidth="1.8" strokeDasharray="3 2.5" opacity=".6" />
      <MiniCartaCuerda x={3} y={8} giro={-10} c={COLOR.tactica} />
      <Flecha d="M17 40 Q24 55 38 49" punta={[38, 49, -25]} c={COLOR.tactica} />
    </g>
  ),
  "anular-fastidio": (
    <g>
      {/* Bocadillo que grita «¡NO!» y, debajo, el rayo de fastidio tachado */}
      <path d="M14 6 H50 Q60 6 60 16 V30 Q60 40 50 40 H30 L18 50 L21 40 H14 Q4 40 4 30 V16 Q4 6 14 6 Z" fill="#ffffff" {...trazo} />
      <path className="sombra" d="M50 6.5 Q59.5 6.5 59.5 16 V30 Q59.5 39.5 50 39.5 H44 Q54 36 54 26 V14 Q54 8 50 6.5 Z" style={{ fill: oscuro("#ffffff", 12) }} />
      <text x="32" y="30" textAnchor="middle" fontSize="20" fontWeight="800" style={{ fill: COLOR.tactica, fontFamily: "var(--fuente-titulo)" }} stroke={TINTA} strokeWidth="2.6" strokeLinejoin="round" paintOrder="stroke">
        ¡NO!
      </text>
      <g transform="translate(43.8 45.3) scale(.28)">
        <path d={RAYO} {...relleno(COLOR.amarillo)} stroke={TINTA} strokeWidth="6" strokeLinejoin="round" />
      </g>
      <circle cx="53" cy="54" r="8" fill="none" stroke={TINTA} strokeWidth="5.4" />
      <circle cx="53" cy="54" r="8" fill="none" {...linea(COLOR.fastidio)} strokeWidth="2.6" />
      <path d="M47.4 48.4 L58.6 59.6" stroke={TINTA} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M47.4 48.4 L58.6 59.6" {...linea(COLOR.fastidio)} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ),

  // ----- Tiempo y sucesos (cartas del día) -----
  soleado: (
    <g>
      <Sol x={32} y={32} r={15} rayos={12} />
    </g>
  ),
  lluvia: (
    <g>
      <Nube y={-9} c="#dfe6ec" />
      <path d="M14 45 l-3 7 M24 47 l-3 7 M36 45 l-3 7 M48 47 l-3 7 M58 44 l-3 7" {...linea(COLOR.agua)} strokeWidth="2.4" strokeLinecap="round" />
      <GotaBosque x={20} y={57} r={0.8} />
      <GotaBosque x={42} y={58} r={0.8} />
    </g>
  ),
  viento: (
    <g>
      {["M3 22 H34 C44 22 46 10 38 8 C33 7 31 13 34 15", "M8 36 H48 C58 36 59 48 51 49 C46 50 45 44 48 43", "M4 50 H30"].map((d) => (
        <g key={d} fill="none" strokeLinecap="round">
          <path d={d} stroke={TINTA} strokeWidth="6" />
          <path d={d} stroke="#e3f1f7" strokeWidth="2.6" />
        </g>
      ))}
      <g transform="translate(46 56) rotate(-30)">
        <path d="M-8 0 C-4 -6 4 -6 8 0 C4 6 -4 6 -8 0 Z" fill={COLOR.hierba} stroke={TINTA} strokeWidth="2" />
        <path d="M-8 0 H8" stroke={TINTA} strokeWidth="1.2" />
      </g>
    </g>
  ),
  "tormenta-repentina": (
    <g>
      <Nube y={-9} c={COLOR.nubarron} />
      <g transform="translate(18 26) scale(.6)">
        <path d={RAYO} {...relleno(COLOR.amarillo)} stroke={TINTA} strokeWidth={5} strokeLinejoin="round" />
      </g>
      <path d="M12 46 l-3 7 M46 46 l-3 7 M56 44 l-3 7" {...linea(COLOR.agua)} strokeWidth="2.4" strokeLinecap="round" />
      <GotaBosque x={50} y={58} r={0.8} />
    </g>
  ),
  "ola-de-calor": (
    <g>
      <Sol x={30} y={25} r={13} c="#ff8a3d" rayos={12} />
      {[50, 57].map((y) => (
        <g key={y} fill="none" strokeLinecap="round">
          <path d={`M4 ${y} q5 -4 10 0 t10 0 t10 0 t10 0 t10 0`} stroke={TINTA} strokeWidth="5" />
          <path d={`M4 ${y} q5 -4 10 0 t10 0 t10 0 t10 0 t10 0`} {...linea(COLOR.rojo)} strokeWidth="2.2" />
        </g>
      ))}
      <g transform="translate(55 12)">
        <rect x="-3.5" y="0" width="7" height="24" rx="3.5" fill="#ffffff" stroke={TINTA} strokeWidth="2" />
        <circle cx="0" cy="27" r="5.5" {...relleno(COLOR.rojo)} stroke={TINTA} strokeWidth="2" />
        <rect x="-1.4" y="6" width="2.8" height="18" {...relleno(COLOR.rojo)} />
      </g>
    </g>
  ),
  "vecina-sacude-alfombra": (
    <g>
      <rect x="4" y="5" width="30" height="27" rx="2" fill="#f6d7a8" {...trazo} />
      <path d="M4 12 H34 M19 12 V32" stroke={TINTA} strokeWidth="2" />
      <path d="M4 5 H34 V12 H4 Z" {...relleno(COLOR.rojo)} stroke={TINTA} strokeWidth="2.2" />
      <path d="M8 5 V12 M14 5 V12 M20 5 V12 M26 5 V12" stroke="#ffffff" strokeWidth="2" opacity=".7" />
      <path d="M17 30 C24 30 30 33 36 31 C42 29 46 33 50 32 L48 46 C44 47 40 43 34 45 C28 47 22 44 16 44 Z" {...relleno(COLOR.azul)} {...trazo} />
      <path d="M22 37 C28 38 34 36 40 37 C44 37.5 46 38 48 38" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity=".8" />
      <path d="M50 32 l3 -1 M49.4 36 l3 0 M48.8 40 l3 0.6 M48.2 44 l3 1" stroke={TINTA} strokeWidth="1.4" strokeLinecap="round" />
      {[
        [52, 52, 6],
        [40, 56, 5],
        [58, 42, 3.6],
        [28, 54, 3.4],
      ].map(([cx, cy, r]) => (
        <circle key={cx} cx={cx} cy={cy} r={r} fill="#d8cbb4" stroke={TINTA} strokeWidth="1.6" opacity=".95" />
      ))}
      <path d="M46 50 l-1 0.4 M34 60 l-1 -0.6 M60 56 l1 0.6" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  // Pinzas viejas: pinza agrietada en una cuerda vieja y el calcetín que se le cae
  "pinzas-viejas": (
    <g transform="translate(0 7)">
      <g stroke={TINTA} strokeWidth="1" fill="none" opacity=".5">
        <path d="M62 30 V48 M62 30 L50 42 M62 30 H44" />
        <path d="M62 37 Q57 36 55 36 Q54 33 54 30 M62 43 Q56 42 52 40 Q49 35 48 30" />
      </g>
      <Soga d="M2 14 Q32 22 62 14" g={3.4} c={COLOR.cuerdaVieja} />
      <g transform="translate(20 13) rotate(-12) scale(1.5)">
        <PinzaBosque x={0} color="#b8a27e" />
        <path d="M-4.5 9 l2.6 1.4 l-1.6 1.8 l2.6 1.6" fill="none" {...linea(COLOR.fastidio)} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(40 24) rotate(28)">
        <MiniPrenda tipo="calcetin" c={COLOR.azul} x={-11.4} y={-2.3} s={0.38} />
      </g>
      <path d="M33 22 v-4 M39 20 v-4 M45 21 v-4" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  // La ropa se engancha: camiseta con la cuerda enredada en el hombro
  "ropa-se-engancha": (
    <g transform="translate(0 5)">
      <Soga d="M2 18 Q32 26 62 18" g={3.6} />
      <MiniPrenda tipo="camiseta" c={COLOR.amarillo} x={9} y={20} s={0.38} giro={-5} />
      <path d="M21 18 c5 -8 13 3 6 6 c-7 3 -3 -9 4 -7 c7 2 3 9 -2 8 c-5 -1 -3 -7 2 -6" fill="none" stroke={TINTA} strokeWidth="4.4" strokeLinecap="round" />
      <path d="M21 18 c5 -8 13 3 6 6 c-7 3 -3 -9 4 -7 c7 2 3 9 -2 8 c-5 -1 -3 -7 2 -6" fill="none" {...linea(COLOR.cuerda)} strokeWidth="2" strokeLinecap="round" />
      <g transform="translate(53 47)">
        <circle r="8.5" {...relleno(COLOR.fastidio)} stroke={TINTA} strokeWidth="2.4" />
        <path d="M0 -4.6 V1.3" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <circle cy="4.6" r="1.6" fill="#ffffff" />
      </g>
    </g>
  ),
  // Viento traicionero: la toalla sale volando y deja la pinza sola en la cuerda
  "viento-traicionero": (
    <g>
      <Soga d="M2 46 Q32 52 62 46" g={3.4} />
      <g transform="translate(14 46.5) scale(.75)">
        <PinzaBosque x={0} />
      </g>
      {["M2 32 H13 C19 32 20 25 15 24 C12 23.5 11 27 13 28", "M4 38 H18"].map((d) => (
        <g key={d} fill="none" strokeLinecap="round">
          <path d={d} stroke={TINTA} strokeWidth="5.4" />
          <path d={d} stroke="#e3f1f7" strokeWidth="2.2" />
        </g>
      ))}
      <g transform="translate(22 30) rotate(-24)">
        <MiniPrenda tipo="toalla" c={COLOR.rojo} x={0} y={-10} s={0.24} />
      </g>
      <path d="M12 12 l7 2 M10 18 l7 2" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),};

export function IconoBosque({ id, className }: { id: string; className?: string }) {
  return (
    // Sin filtro de tinta temblorosa: los iconos de las cartas van con trazo limpio y sin recortes.
    <svg viewBox="0 0 64 64" className={`ilu icono-limpio ${className ?? ""}`} overflow="visible" aria-hidden>
      {ICONOS_BOSQUE[id] ?? <circle cx="32" cy="32" r="16" fill={CREMA} {...trazo} />}
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
      {/* Trazo limpio, sin el filtro de tinta temblorosa (daba microcortes en las cartas) */}
      <g {...trazo}>
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
