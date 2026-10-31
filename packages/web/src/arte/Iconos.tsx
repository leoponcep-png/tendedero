import type { ReactElement } from "react";

// Iconos beta de las cartas, en un lienzo de 64 × 64. Se buscan por id de carta y, si no hay, por efecto.
// Trazo oscuro común para que todos se vean de la misma familia.

const T = "#3a2f25";
const t = { stroke: T, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const Sol = ({ x = 32, y = 32, r = 11 }: { x?: number; y?: number; r?: number }) => (
  <g>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return <line key={i} x1={x + Math.cos(a) * (r + 4)} y1={y + Math.sin(a) * (r + 4)} x2={x + Math.cos(a) * (r + 10)} y2={y + Math.sin(a) * (r + 10)} {...t} stroke="#d98a1c" strokeWidth={3} />;
    })}
    <circle cx={x} cy={y} r={r} fill="#ffc93c" {...t} />
  </g>
);

const Nube = ({ x = 0, y = 0, fill = "#e9eef2" }: { x?: number; y?: number; fill?: string }) => (
  <path transform={`translate(${x} ${y})`} d="M14 38 C6 38 6 27 14 27 C14 18 26 15 30 22 C34 13 50 15 49 26 C58 26 58 38 50 38 Z" fill={fill} {...t} />
);

const Gota = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -7 C3 -2.6 4.6 0 4.6 2.2 A4.6 4.6 0 0 1 -4.6 2.2 C-4.6 0 -3 -2.6 0 -7Z" fill="#5fb3e6" stroke="#1f5e86" strokeWidth={1.4} />
);

const Viento = ({ y = 0 }: { y?: number }) => (
  <g transform={`translate(0 ${y})`} fill="none" {...t} strokeWidth={3} stroke="#5b7f95">
    <path d="M8 24 H40 C48 24 48 14 41 14 C37 14 36 18 37 20" />
    <path d="M8 34 H50 C58 34 58 45 50 45 C46 45 45 41 46 39" />
    <path d="M14 44 H32" />
  </g>
);

const PinzaGrande = ({ rota = false, color = "#c99a62" }: { rota?: boolean; color?: string }) => (
  <g transform="rotate(-20 32 32)">
    <rect x={26} y={8} width={12} height={48} rx={3} fill={color} {...t} />
    <line x1={32} y1={10} x2={32} y2={54} {...t} strokeWidth={1.4} />
    <rect x={23} y={24} width={18} height={7} rx={2} fill="#9aa3a8" {...t} strokeWidth={1.6} />
    {rota && <path d="M20 40 L30 36 L27 44 L38 41 L44 46" fill="none" stroke="#b3412f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
  </g>
);

const Camisa = ({ x = 0, y = 0, fill = "#4a7fd0", s = 1 }: { x?: number; y?: number; fill?: string; s?: number }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M22 10 L12 15 L4 25 L11 30 L16 25 V52 H48 V25 L53 30 L60 25 L52 15 L42 10 C40 15 36 17 32 17 C28 17 24 15 22 10 Z"
    fill={fill}
    {...t}
  />
);

const Flecha = ({ d, color = T }: { d: string; color?: string }) => (
  <g fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </g>
);

const Cuerda = ({ y = 30, color = "#8c7a62", grosor = 3 }: { y?: number; color?: string; grosor?: number }) => (
  <path d={`M4 ${y - 4} Q32 ${y + 6} 60 ${y - 4}`} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" />
);

const ICONOS: Record<string, ReactElement> = {
  // ---------- Acciones ----------
  "mojar-cuerda-rival": (
    <g>
      <path d="M14 18 L46 18 L42 50 H18 Z" fill="#9fb8c8" {...t} />
      <path d="M14 18 C14 10 46 10 46 18" fill="none" {...t} />
      <path d="M46 24 C56 24 58 34 52 40" fill="none" {...t} />
      <Gota x={28} y={56} />
      <Gota x={40} y={58} s={0.8} />
    </g>
  ),
  "rafaga-de-viento": (
    <g>
      <Viento />
      <Camisa x={34} y={6} s={0.45} fill="#d2513f" />
    </g>
  ),
  "pinza-rota": <PinzaGrande rota />,
  "retrasar-secado": (
    <g>
      <circle cx={32} cy={34} r={20} fill="#f5efe4" {...t} />
      <path d="M32 20 V34 L42 40" fill="none" {...t} strokeWidth={3} />
      <Gota x={50} y={16} />
    </g>
  ),
  "mover-prenda-rival": (
    <g>
      <Camisa x={6} y={14} s={0.55} fill="#e8c23a" />
      <Flecha d="M30 46 C40 50 50 46 56 36 M56 36 L48 37 M56 36 L56 44" color="#b3412f" />
    </g>
  ),
  "mover-prenda-propia": (
    <g>
      <Camisa x={6} y={14} s={0.55} fill="#4a7fd0" />
      <Flecha d="M30 46 C40 50 50 46 56 36 M56 36 L48 37 M56 36 L56 44" color="#2f6f5e" />
    </g>
  ),
  manguerazo: (
    <g>
      <path d="M6 58 Q6 42 20 38" fill="none" stroke="#5d8a4e" strokeWidth={6} strokeLinecap="round" />
      <path d="M18 34 L26 24 L32 30 L24 40 Z" fill="#e8c23a" {...t} />
      <path d="M30 24 Q42 18 52 26 M32 30 Q44 30 54 38" fill="none" stroke="#6fb2dc" strokeWidth={3} strokeLinecap="round" />
      <Gota x={50} y={48} />
      <Gota x={58} y={30} s={0.8} />
    </g>
  ),
  "cesto-ropa-sucia": (
    <g>
      <Camisa x={14} y={4} s={0.4} fill="#4a7fd0" />
      <path d="M10 30 H54 L48 56 H16 Z" fill="#c99a62" {...t} />
      <path d="M8 26 H56 V32 H8 Z" fill="#c99a62" {...t} />
      <path d="M14 42 H50" fill="none" {...t} strokeWidth={1.5} />
    </g>
  ),
  secador: (
    <g>
      <path d="M22 34 H30 L34 58 H24 Z" fill="#2f6f5e" {...t} />
      <path d="M12 14 H40 L48 18 V30 L40 34 H12 Z" fill="#2f6f5e" {...t} />
      <circle cx={14} cy={24} r={10} fill="#f5efe4" {...t} />
      <path d="M50 18 Q54 20 58 17 M50 24 Q55 26 60 23 M50 30 Q54 32 58 29" fill="none" stroke="#d2513f" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  "colocar-cuerda-extra": (
    <g>
      <Cuerda y={34} />
      <circle cx={46} cy={18} r={10} fill="#2f6f5e" {...t} />
      <path d="M46 12 V24 M40 18 H52" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  "secar-prenda": (
    <g>
      <Sol x={22} y={22} r={8} />
      <Camisa x={22} y={22} s={0.6} fill="#f4f1ea" />
    </g>
  ),
  "reducir-humedad": (
    <g>
      <Gota x={26} y={34} s={2.6} />
      <circle cx={46} cy={44} r={9} fill="#2f6f5e" {...t} />
      <path d="M41 44 H51" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  "proteger-cuerda": (
    <g>
      <path d="M32 8 L52 16 V32 C52 44 42 52 32 56 C22 52 12 44 12 32 V16 Z" fill="#7fb69e" {...t} />
      <path d="M22 32 L30 40 L44 24" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  "buscar-cuerda": (
    <g>
      <ellipse cx={26} cy={38} rx={16} ry={10} fill="none" stroke="#8c7a62" strokeWidth={4} />
      <ellipse cx={26} cy={38} rx={9} ry={5} fill="none" stroke="#8c7a62" strokeWidth={3} />
      <circle cx={42} cy={22} r={10} fill="#e4f1f7" {...t} />
      <path d="M49 29 L58 38" {...t} strokeWidth={4} />
    </g>
  ),
  "cambiar-prendas": (
    <g>
      <Camisa x={2} y={16} s={0.45} fill="#d2513f" />
      <Camisa x={34} y={16} s={0.45} fill="#4a7fd0" />
      <Flecha d="M18 12 C26 4 38 4 46 12 M46 12 L39 12 M46 12 L46 5" />
      <Flecha d="M46 54 C38 62 26 62 18 54 M18 54 L25 54 M18 54 L18 61" />
    </g>
  ),
  "cambiar-cuerdas": (
    <g>
      <Cuerda y={20} />
      <Cuerda y={46} />
      <Flecha d="M48 18 V44 M48 44 L43 38 M48 44 L53 38" />
      <Flecha d="M16 46 V20 M16 20 L11 26 M16 20 L21 26" />
    </g>
  ),
  "mover-cuerda": (
    <g>
      <Cuerda y={26} grosor={4} />
      <Flecha d="M12 46 H52 M52 46 L45 41 M52 46 L45 51" />
    </g>
  ),
  "anular-fastidio": (
    <g>
      <circle cx={32} cy={32} r={22} fill="#f6d5cf" stroke="#b3412f" strokeWidth={3} />
      <path d="M22 44 V28 C22 25 26 25 26 28 V36 V22 C26 19 30 19 30 22 V34 V20 C30 17 34 17 34 20 V34 V23 C34 20 38 20 38 23 V36 L41 32 C43 29 46 31 45 34 L40 44 C38 48 35 50 31 50 H28 C24 50 22 48 22 44 Z" fill="#f2c9a0" {...t} strokeWidth={1.8} />
    </g>
  ),

  // ---------- Mazo del día ----------
  soleado: <Sol />,
  "racha-de-sol": (
    <g>
      <Sol x={24} y={26} r={9} />
      <Sol x={44} y={40} r={7} />
    </g>
  ),
  chaparron: (
    <g>
      <Nube y={0} fill="#c9d4dc" />
      <Gota x={22} y={48} />
      <Gota x={36} y={52} />
    </g>
  ),
  lluvia: (
    <g>
      <Nube y={-4} fill="#9fb0bd" />
      <Gota x={16} y={46} />
      <Gota x={28} y={52} />
      <Gota x={40} y={46} />
      <Gota x={50} y={54} />
    </g>
  ),
  viento: <Viento y={2} />,
  "viento-traicionero": (
    <g>
      <Viento y={-2} />
      <path d="M44 48 C48 56 56 56 58 50" fill="none" stroke="#b3412f" strokeWidth={3} strokeLinecap="round" />
      <path d="M40 54 L44 48 L50 52" fill="none" stroke="#b3412f" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  "tormenta-repentina": (
    <g>
      <Nube y={-4} fill="#7d8b96" />
      <path d="M34 34 L26 48 H34 L28 60 L44 42 H36 L42 34 Z" fill="#ffd23c" {...t} strokeWidth={1.8} />
    </g>
  ),
  "ola-de-calor": (
    <g>
      <rect x={26} y={8} width={12} height={36} rx={6} fill="#fff" {...t} />
      <circle cx={32} cy={48} r={10} fill="#d2513f" {...t} />
      <rect x={29.5} y={22} width={5} height={24} fill="#d2513f" />
      <path d="M46 16 C50 20 46 24 50 28 M52 12 C56 16 52 20 56 24" fill="none" stroke="#d98a1c" strokeWidth={2.4} strokeLinecap="round" />
    </g>
  ),
  "vecina-sacude-alfombra": (
    <g>
      <rect x={6} y={10} width={30} height={40} rx={2} fill="#b46a4a" {...t} transform="rotate(-12 21 30)" />
      <path d="M12 18 H30 M12 26 H30 M12 34 H30" stroke="#e8c23a" strokeWidth={2} transform="rotate(-12 21 30)" />
      {[[44, 18], [50, 28], [42, 36], [54, 40], [48, 50]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill="#c7b9a6" />
      ))}
    </g>
  ),
  "pinzas-viejas": <PinzaGrande rota color="#a99a86" />,
  "ropa-se-engancha": (
    <g>
      <Cuerda y={18} />
      <path d="M32 18 V30 C32 38 44 38 44 30" fill="none" {...t} strokeWidth={3.5} />
      <Camisa x={16} y={30} s={0.5} fill="#e8c23a" />
    </g>
  ),

  // ---------- Cuerdas ----------
  basica: <Cuerda y={34} grosor={4} />,
  tejadillo: (
    <g>
      <path d="M4 26 L32 8 L60 26 Z" fill="#c4643d" {...t} />
      <path d="M12 21 H52 M20 16 H44" stroke="#8f4426" strokeWidth={1.6} />
      <Cuerda y={46} grosor={4} />
    </g>
  ),
  resistente: (
    <g>
      <Cuerda y={34} grosor={8} color="#6e5b43" />
      <Cuerda y={34} grosor={2} color="#c9b48f" />
    </g>
  ),
  "secado-rapido": (
    <g>
      <Sol x={32} y={22} r={7} />
      <Cuerda y={48} grosor={4} />
    </g>
  ),
  "modificador-puntuacion": (
    <g>
      <Cuerda y={22} grosor={3} />
      <PinzaGrande color="#e8c23a" />
    </g>
  ),
  fragil: (
    <g>
      <path d="M4 30 Q18 38 28 34" fill="none" stroke="#8c7a62" strokeWidth={4} strokeLinecap="round" />
      <path d="M36 34 Q46 38 60 30" fill="none" stroke="#8c7a62" strokeWidth={4} strokeLinecap="round" />
      <path d="M28 34 l2 -4 M28 34 l3 3 M36 34 l-3 -4 M36 34 l-2 4" stroke="#8c7a62" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  ),
};

// Objetivos: un icono por efecto.
const OBJETIVOS: Record<string, ReactElement> = {
  "prendas-secas": (
    <g>
      <Camisa x={6} y={8} s={0.8} fill="#f4f1ea" />
      <path d="M20 36 L28 44 L44 28" fill="none" stroke="#2f6f5e" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  "mismo-color": (
    <g>
      <Camisa x={2} y={14} s={0.5} fill="#4a7fd0" />
      <Camisa x={18} y={8} s={0.5} fill="#4a7fd0" />
      <Camisa x={34} y={14} s={0.5} fill="#4a7fd0" />
    </g>
  ),
  "juegos-de-colores": (
    <g>
      {["#f4f1ea", "#4a7fd0", "#d2513f", "#e8c23a"].map((c, i) => (
        <Camisa key={c} x={(i % 2) * 28 + 2} y={Math.floor(i / 2) * 28 + 2} s={0.42} fill={c} />
      ))}
    </g>
  ),
  "lineas-completas": (
    <g>
      <Cuerda y={22} grosor={3} />
      <Cuerda y={46} grosor={3} />
      <path d="M44 6 L50 12 L60 2" fill="none" stroke="#2f6f5e" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  "clases-de-cuerda": (
    <g>
      <Cuerda y={16} color="#8c7a62" />
      <Cuerda y={32} color="#c4643d" grosor={4} />
      <Cuerda y={48} color="#6e5b43" grosor={6} />
    </g>
  ),
  parejas: (
    <g>
      <path d="M14 8 H26 V34 L34 42 C38 46 34 54 28 50 L16 38 C14 36 14 34 14 32 Z" fill="#d2513f" {...t} />
      <path d="M34 8 H46 V34 L54 42 C58 46 54 54 48 50 L36 38 C34 36 34 34 34 32 Z" fill="#d2513f" {...t} />
    </g>
  ),
  "secadas-en": (
    <g>
      <path d="M4 24 L32 6 L60 24 Z" fill="#c4643d" {...t} />
      <Camisa x={14} y={22} s={0.55} fill="#f4f1ea" />
    </g>
  ),
  "cuerdas-llenas": (
    <g>
      <Cuerda y={14} />
      {[6, 24, 42].map((x) => (
        <rect key={x} x={x} y={18} width={16} height={30} rx={2} fill="#e8c23a" {...t} />
      ))}
    </g>
  ),
  "viejas-colocadas": (
    <g>
      <rect x={10} y={22} width={44} height={32} rx={3} fill="#7a9d5a" {...t} />
      <rect x={28} y={22} width={8} height={32} fill="#b3412f" />
      <path d="M32 22 C24 10 14 14 20 22 M32 22 C40 10 50 14 44 22" fill="none" stroke="#b3412f" strokeWidth={3} />
    </g>
  ),
  conjuntos: (
    <g>
      <path d="M6 10 H14 V30 L20 36 C23 39 20 44 16 41 L7 33 C6 32 6 31 6 30 Z" fill="#4a7fd0" {...t} strokeWidth={1.6} />
      <Camisa x={14} y={4} s={0.45} fill="#4a7fd0" />
      <rect x={20} y={36} width={38} height={22} rx={2} fill="#4a7fd0" {...t} />
    </g>
  ),
};

/** Icono de una carta por id; si no hay, por su efecto. */
export function IconoCarta({ id, efecto, objetivo }: { id: string; efecto?: string | null; objetivo?: boolean }) {
  const icono = (objetivo ? OBJETIVOS[efecto ?? ""] : undefined) ?? ICONOS[id] ?? ICONOS[efecto ?? ""];
  return (
    <svg viewBox="0 0 64 64" className="icono-carta" aria-hidden>
      {icono ?? <circle cx={32} cy={32} r={16} fill="#e6dccb" {...t} />}
    </svg>
  );
}
