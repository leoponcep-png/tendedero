import { useId, type CSSProperties } from "react";
import { tono } from "../arte/color";
import { IconoCarta } from "../arte/Iconos";
import { ArtePrenda, Pinza } from "../arte/Prendas";
import { ACCIONES, CUERDAS, TIPOS, type Prenda } from "./Prototipos";
import cuerdas from "../../../../data/cuerdas.json";

// Arte de la «Mesa de cartas»: cartas de cuerda que juntas forman el tendedero, cartas de prenda que se
// cuelgan con pinzas y cartas de acción con marco. Todo en SVG/CSS para que escale sin perder nitidez.

/** Medidas de la carta de cuerda en unidades SVG: 3 huecos de 60 de ancho; la cuerda cruza a la altura Y_CUERDA. */
export const ANCHO_CUERDA = 180;
export const ALTO_CUERDA = 138;
export const Y_CUERDA = 26;
/** Fracción de la altura de la carta a la que va la cuerda (para colocar prendas encima con CSS). */
export const FRACCION_CUERDA = Y_CUERDA / ALTO_CUERDA;

const TEXTO_CUERDA: Record<string, string> = Object.fromEntries(cuerdas.cartas.map((c) => [c.efecto ?? "basica", c.texto]));

/** El trazo de la cuerda: empieza y acaba a la misma altura en el borde, así las cartas vecinas empalman. */
function trazo(comba = 9) {
  return `M-1 ${Y_CUERDA} Q${ANCHO_CUERDA / 2} ${Y_CUERDA + comba * 2} ${ANCHO_CUERDA + 1} ${Y_CUERDA}`;
}

/** Fondo ilustrado de una carta de cuerda según su clase. */
export function ArteCartaCuerda({ efecto, pinzas, className }: { efecto: string | null; pinzas?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const W = ANCHO_CUERDA;
  const H = ALTO_CUERDA;
  const fondo: Record<string, [string, string]> = {
    tejadillo: ["#f2e6d2", "#e3d0b3"],
    "secado-rapido": ["#fff4d8", "#fbdcae"],
    resistente: ["#e6edf0", "#cfdade"],
    fragil: ["#ece0c6", "#d7c39c"],
    "modificador-puntuacion": [tono(pinzas ?? "#d2513f", 0.86), tono(pinzas ?? "#d2513f", 0.7)],
  };
  const [arriba, abajo] = fondo[efecto ?? ""] ?? ["#f6eedf", "#e8dbc3"];
  const vieja = efecto === "fragil";
  const gruesa = efecto === "resistente";
  const colorCuerda = vieja ? "#9c8a6c" : gruesa ? "#6b553a" : "#8a7356";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={arriba} />
          <stop offset="1" stopColor={abajo} />
        </linearGradient>
        <pattern id={`${id}-lino`} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 3 H6 M3 0 V6" stroke="#00000010" strokeWidth="1" />
        </pattern>
        <linearGradient id={`${id}-sombra`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2412" stopOpacity=".28" />
          <stop offset="1" stopColor="#3b2412" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-f)`} />
      <rect width={W} height={H} fill={`url(#${id}-lino)`} />

      {efecto === "secado-rapido" && (
        <g className="deco">
          <circle cx={W - 26} cy={H - 30} r={34} fill="#ffd45c" opacity=".25" />
          <circle cx={W - 26} cy={H - 30} r={15} fill="#ffc93c" stroke="#d98a1c" strokeWidth="2" />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i * Math.PI) / 5;
            return <line key={i} x1={W - 26 + Math.cos(a) * 19} y1={H - 30 + Math.sin(a) * 19} x2={W - 26 + Math.cos(a) * 25} y2={H - 30 + Math.sin(a) * 25} stroke="#e8a12a" strokeWidth="2.4" strokeLinecap="round" />;
          })}
          <path d={`M14 ${H - 22} q8 -6 16 0 t16 0 t16 0 M22 ${H - 12} q8 -6 16 0 t16 0`} fill="none" stroke="#f0a24a" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </g>
      )}

      {efecto === "fragil" && (
        <g className="deco" opacity=".55">
          <circle cx="40" cy="96" r="16" fill="#b89a68" opacity=".35" />
          <circle cx="132" cy="70" r="10" fill="#b89a68" opacity=".3" />
          <path d="M150 110 l10 -8 l-4 12 l12 -6" fill="none" stroke="#7a5f3a" strokeWidth="1.5" />
        </g>
      )}

      {efecto === "resistente" && (
        <g className="deco">
          <rect x="6" y={H - 34} width="26" height="20" rx="4" fill="#9aa3a8" stroke="#5f686d" strokeWidth="1.6" />
          <path d={`M12 ${H - 34} v-6 a7 7 0 0 1 14 0 v6`} fill="none" stroke="#5f686d" strokeWidth="3" />
          <circle cx="19" cy={H - 24} r="3" fill="#5f686d" />
        </g>
      )}

      {efecto === "modificador-puntuacion" && (
        <g className="deco">
          <circle cx={W - 24} cy={H - 30} r="15" fill={pinzas} stroke={tono(pinzas ?? "#d2513f", -0.45)} strokeWidth="2" />
          <text x={W - 24} y={H - 25} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
            +1
          </text>
        </g>
      )}

      {/* La sombra del tejadillo marca hasta dónde protege. */}
      {efecto === "tejadillo" && <rect x="0" y="14" width={W} height={H - 14} fill={`url(#${id}-sombra)`} />}

      {/* Cuerda: un trazo oscuro, uno claro trenzado encima y, en la vieja, fibras sueltas. */}
      <path className="cuerda-trazo" d={trazo()} pathLength={1} fill="none" stroke={tono(colorCuerda, -0.35)} strokeWidth={gruesa ? 7 : 4.4} strokeLinecap="round" />
      <path className="cuerda-trazo" d={trazo()} pathLength={1} fill="none" stroke={colorCuerda} strokeWidth={gruesa ? 5 : 2.8} strokeLinecap="round" />
      <path className="cuerda-trenza" d={trazo()} fill="none" stroke={tono(colorCuerda, 0.45)} strokeWidth={gruesa ? 2.4 : 1.3} strokeDasharray={gruesa ? "3 3" : "2 4"} />
      {vieja && (
        <g className="deco" stroke="#9c8a6c" strokeWidth="1.2" strokeLinecap="round">
          <path d="M70 34 l-3 7 M74 35 l2 8 M112 34 l-2 8 M116 33 l4 6" />
          <circle cx="92" cy="35" r="4.5" fill="#b8a27c" />
        </g>
      )}
      {efecto === "modificador-puntuacion" &&
        [30, 150].map((x) => (
          <g key={x} className="deco" transform={`translate(0 ${Y_CUERDA - 4})`}>
            <Pinza x={x} color={pinzas} />
          </g>
        ))}

      {efecto === "tejadillo" && (
        <g className="deco">
          <path d={`M-4 0 H${W + 4} V12 Q${W / 2} 18 -4 12 Z`} fill="#c4643d" stroke="#7a3518" strokeWidth="1.6" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${-6 + i * 14} 3 q7 10 14 0`} fill="none" stroke="#8f4426" strokeWidth="1.3" />
          ))}
          <path d={`M-4 12 Q${W / 2} 18 ${W + 4} 12`} fill="none" stroke="#5a2410" strokeWidth="2.2" />
        </g>
      )}
    </svg>
  );
}

/** Medallón de la esquina con el icono de la clase de cuerda. */
export function MedallonCuerda({ efecto }: { efecto: string | null }) {
  if (!efecto) return null;
  const iconos: Record<string, React.ReactElement> = {
    tejadillo: <path d="M3 12 L12 4 L21 12 M6 10 V19 H18 V10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />,
    "secado-rapido": <circle cx="12" cy="12" r="5" fill="currentColor" />,
    resistente: <path d="M7 12 h10 M9 7 a5 5 0 0 0 0 10 M15 7 a5 5 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="2.4" />,
    fragil: <path d="M5 12 h5 l2 -3 l2 6 l2 -3 h3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />,
    "modificador-puntuacion": <path d="M12 4 l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.8 -4.9 2.8 1.1 -5.3 -4 -3.7 5.4 -.6z" fill="currentColor" />,
  };
  return (
    <span className="medallon">
      <svg viewBox="0 0 24 24">{iconos[efecto]}</svg>
    </span>
  );
}

function puntosPinzas(espacios: number): number[] {
  if (espacios <= 1) return [30];
  return [30, 30 + (espacios - 1) * 60];
}

/** Gotas de humedad (con la clase .gotas para que la animación de evaporar las encuentre). */
function GotasCarta({ humedad }: { humedad: number }) {
  return (
    <svg className="pc-gotas" viewBox={`0 0 ${Math.max(1, humedad) * 11} 14`} style={{ width: `${Math.max(1, humedad) * 0.95}em` }} aria-label={`${humedad} de humedad`}>
      <g className="gotas">
        {Array.from({ length: humedad }, (_, i) => (
          <path key={i} transform={`translate(${5.5 + i * 11} 8)`} d="M0 -6 C2.6 -2.2 4 0 4 1.8 A4 4 0 0 1 -4 1.8 C-4 0 -2.6 -2.2 0 -6Z" fill="#5fb3e6" stroke="#1f5e86" strokeWidth="1" />
        ))}
      </g>
    </svg>
  );
}

const NOMBRE_TIPO: Record<string, string> = { calcetin: "Calcetín", camiseta: "Camiseta", toalla: "Toalla" };

/** Carta de prenda: la ropa dibujada sobre un fondo de su color, con sus puntos y su humedad. */
export function CartaPrenda({ p, pinzas, colorPinzas, className, ...resto }: { p: Prenda; pinzas?: boolean; colorPinzas?: string; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  const esp = TIPOS[p.tipo].espacios;
  const estilo = {
    "--c": p.color,
    "--c-osc": tono(p.color, -0.45),
    "--c-claro": tono(p.color, 0.72),
    "--c-medio": tono(p.color, 0.45),
    "--espacios": esp,
    ...resto.style,
  } as CSSProperties;
  return (
    <div {...resto} className={`pc pc-${p.tipo} ${className ?? ""}`} style={estilo}>
      <div className="pc-marco">
        <div className="pc-ilustra">
          <ArtePrenda tipo={p.tipo} color={p.color} espacios={esp} conPinzas={false} className="pc-arte" />
        </div>
        <div className="pc-pie">
          <span className="pc-puntos" title={`${TIPOS[p.tipo].puntos} puntos`}>
            {TIPOS[p.tipo].puntos}
          </span>
          <span className="pc-nombre">{NOMBRE_TIPO[p.tipo]}</span>
          {p.humedad > 0 ? <GotasCarta humedad={p.humedad} /> : <span className="pc-seca">seca</span>}
        </div>
      </div>
      {pinzas && (
        <svg className="pc-pinzas" viewBox={`0 0 ${60 * esp} 18`} preserveAspectRatio="xMidYMin meet" aria-hidden>
          {puntosPinzas(esp).map((x) => (
            <g key={x} className="pinza-una" style={{ transformOrigin: `${x}px 0px` }}>
              <Pinza x={x} color={colorPinzas} />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

/** Carta de acción con marco: cinta con el nombre, ventana ilustrada y texto. */
export function CaraAccion({ id }: { id: string }) {
  const def = ACCIONES[id];
  const grupo = def.grupo === "fastidio" ? "fastidio" : "tactica";
  return (
    <div className={`ca ca-${grupo}`}>
      <div className="ca-ventana">
        <span className="ca-deco" />
        <IconoCarta id={def.id} efecto={def.efecto} />
      </div>
      <div className="ca-cinta">
        <span>{def.nombre}</span>
      </div>
      <div className="ca-texto">{def.texto}</div>
      <div className="ca-tipo">{grupo === "fastidio" ? "Fastidio" : "Táctica"}</div>
    </div>
  );
}

/** Carta de cuerda en la mano (vertical): la cuerda en la ventana y su habilidad debajo. */
export function CaraCuerda({ efecto, pinzas }: { efecto: string | null; pinzas?: string }) {
  const clave = efecto ?? "basica";
  const nombre = efecto === "modificador-puntuacion" ? "Pinzas rojas" : CUERDAS[clave]?.nombre;
  return (
    <div className="ca ca-cuerda">
      <div className="ca-ventana">
        <ArteCartaCuerda efecto={efecto} pinzas={pinzas} className="ca-cuerda-arte" />
      </div>
      <div className="ca-cinta">
        <span>{nombre}</span>
      </div>
      <div className="ca-texto">{efecto === "modificador-puntuacion" ? "+1 punto por cada prenda roja que se seque aquí." : TEXTO_CUERDA[clave]}</div>
      <div className="ca-tipo">Cuerda</div>
    </div>
  );
}

export function DorsoMesa({ clase = "acciones" }: { clase?: "acciones" | "cuerdas" }) {
  return (
    <div className={`dm dm-${clase}`}>
      <svg viewBox="0 0 100 140" aria-hidden>
        <rect x="8" y="8" width="84" height="124" rx="8" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".7" />
        <rect x="13" y="13" width="74" height="114" rx="5" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".5" />
        <ellipse cx="50" cy="70" rx="32" ry="40" fill="currentColor" opacity=".12" />
        <path d="M22 56 Q50 70 78 56" fill="none" stroke="currentColor" strokeWidth="2.6" />
        {[34, 50, 66].map((x) => (
          <rect key={x} x={x - 3} y={56 + (x === 50 ? 5 : 2)} width="6" height="13" rx="1.6" fill="currentColor" />
        ))}
        <text x="50" y="96" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize="13" fontWeight="600" fill="currentColor">
          Tendedero
        </text>
        {[
          [18, 18],
          [82, 18],
          [18, 122],
          [82, 122],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="currentColor" />
        ))}
      </svg>
    </div>
  );
}

/** Carta del día, con su cielo. */
export function CartaDia() {
  return (
    <div className="carta-dia">
      <svg viewBox="0 0 100 70" aria-hidden>
        <defs>
          <linearGradient id="cielo-dia" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fc8ea" />
            <stop offset="1" stopColor="#dff0f8" />
          </linearGradient>
        </defs>
        <rect width="100" height="70" fill="url(#cielo-dia)" />
        <circle cx="34" cy="28" r="13" fill="#ffc93c" stroke="#e39b22" strokeWidth="2" />
        <path d="M40 58 C24 58 22 44 34 40 C34 28 52 24 57 34 C66 26 84 33 79 46 C90 48 87 59 76 58 Z" fill="#fff" stroke="#8aa0b4" strokeWidth="2" />
        <path d="M0 64 Q25 58 50 64 T100 62 V70 H0Z" fill="#9cc98a" />
      </svg>
      <div className="carta-dia-texto">
        <b>Nubes y claros</b>
        <span>Todo se seca 1</span>
      </div>
    </div>
  );
}
