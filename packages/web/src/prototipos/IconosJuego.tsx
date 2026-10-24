import { useId, type ReactElement } from "react";
import { Chispa, COLOR, CREMA, GotaBosque, ICONOS_BOSQUE, MiniPrenda, Nube, PinzaBosque, Soga, Sol, TINTA } from "./ArteBosque";

// Ilustraciones de las cartas que no son de prenda ni de acción: paisajes de las cartas del día (tiempo y sucesos),
// dibujos de los objetivos y emblemas de cada mazo. Usan las mismas piezas que los iconos (ArteBosque): tinta de 3,
// colores del estilo activo, sombras (.sombra) y destellos, para que todas las cartas parezcan de la misma familia.

const trazo = { stroke: TINTA, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const relleno = (c: string) => ({ style: { fill: c } });
const linea = (c: string) => ({ style: { stroke: c } });
type Tipo = "calcetin" | "camiseta" | "toalla";

// ---------- Paisajes de las cartas del día (168 × 49, la proporción de su ventana) ----------
// Siempre la misma composición: cielo con lo que trae el día en el centro, colinas, y el tendedero de poste a poste
// con un calcetín, una camiseta y una toalla. Todo cabe dentro del paisaje: nada se corta por el borde.

const CIELO: Record<string, [string, string]> = {
  soleado: ["#7cc4ec", "#d8f0f8"],
  lluvia: ["#7d93a8", "#c3cfd9"],
  viento: ["#94cde6", "#e1f2f6"],
  "tormenta-repentina": ["#4a5274", "#8a8fab"],
  "ola-de-calor": ["#ff9d5c", "#ffe08a"],
  "vecina-sacude-alfombra": ["#8fcbe6", "#e6f4f4"],
  "pinzas-viejas": ["#9d8fc4", "#f2d6c6"],
  "ropa-se-engancha": ["#9fd4c4", "#eef6dc"],
  "viento-traicionero": ["#86b6e2", "#dceefa"],
};
const CAMPO: Record<string, [string, string]> = {
  "ola-de-calor": ["#d6bc62", "#b39a45"],
  "tormenta-repentina": ["#5f7d5a", "#4a6647"],
  lluvia: ["#77a06b", "#5d8655"],
  "pinzas-viejas": ["#93a874", "#768c5c"],
};

/** Altura de la cuerda del paisaje en x (va de un poste al otro y cae por el centro). */
const yCuerda = (x: number) => {
  const t = (x - 16) / 136;
  return 22 + 2 * 10 * t * (1 - t);
};
const ANCLA: Record<Tipo, [number, number, number]> = {
  // punto por donde se cuelga (en unidades del dibujo de la prenda) y escala en el paisaje
  calcetin: [30, 6, 0.27],
  camiseta: [60, 7, 0.21],
  toalla: [90, 6, 0.16],
};

/** Prenda colgada en la cuerda del paisaje, con su pinza; `giro` la mece (viento). */
function Colgada({ tipo, x, c, giro = 0, enganchada = false }: { tipo: Tipo; x: number; c: string; giro?: number; enganchada?: boolean }) {
  const [ax, ay, s] = ANCLA[tipo];
  const y = yCuerda(x);
  return (
    <g>
      <g transform={`translate(${x} ${y}) rotate(${giro})`}>
        <MiniPrenda tipo={tipo} c={c} x={-ax * s} y={-ay * s} s={s} />
      </g>
      <g transform={`translate(${x} ${y - 2.8}) scale(.4)`}>
        <PinzaBosque x={0} />
      </g>
      {enganchada && (
        <g fill="none" strokeLinecap="round">
          <path d={`M${x - 6} ${y + 2} c3 -5 8 2 4 4 c-5 2 -2 -6 3 -4 c5 2 2 6 -2 5`} stroke={TINTA} strokeWidth="2.8" />
          <path d={`M${x - 6} ${y + 2} c3 -5 8 2 4 4 c-5 2 -2 -6 3 -4 c5 2 2 6 -2 5`} {...linea(COLOR.cuerda)} strokeWidth="1.2" />
        </g>
      )}
    </g>
  );
}

function Poste({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 2.2} y="18" width="4.4" height="37" rx="1.2" {...relleno(COLOR.madera)} stroke={TINTA} strokeWidth="1.4" />
      <path d={`M${x + 0.5} 20 V52`} stroke={TINTA} strokeWidth=".6" opacity=".35" />
      <circle cx={x} cy="22" r="1.7" fill={COLOR.metal} stroke={TINTA} strokeWidth="1" />
    </g>
  );
}

/** Rayas de lluvia por todo el paisaje (sin salirse de él). */
function Lluvia({ densa = false }: { densa?: boolean }) {
  const rayas = [];
  for (let i = 0; i < (densa ? 30 : 20); i++) {
    const x = 6 + ((i * 37) % 158);
    const y = 3 + ((i * 13) % 36);
    rayas.push(`M${x} ${y} l-1.6 4.4`);
  }
  return <path d={rayas.join(" ")} stroke="#eef7fc" strokeWidth="1.1" strokeLinecap="round" opacity=".9" />;
}

/** Remolino de viento (unos 20 × 12). */
function Remolino({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const d = "M0 9 H16 C22 9 23 2 18 1 C15 0.5 14 4 16 5";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" strokeLinecap="round">
      <path d={d} stroke={TINTA} strokeWidth={3 / s} />
      <path d={d} stroke="#f2fbff" strokeWidth={1.3 / s} />
    </g>
  );
}

/** Nube pequeña y limpia para el paisaje (unos 22 × 11, centrada en x, y). */
function Nubecita({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  const d = "M-9 4 C-13 4 -13 -1 -9 -1.5 C-9 -6 -3 -7 -1 -3.5 C1 -7.5 8 -6.5 8 -2 C12 -2 12.5 4 9 4 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d} {...relleno(c)} stroke={TINTA} strokeWidth={1.3 / s} strokeLinejoin="round" />
      <path d="M-8 4 H8.5 C10 4 10.6 2.6 10.2 1.6 C6 3 -3 3 -10.6 1.6 C-11 3 -10 4 -8 4 Z" className="sombra" style={{ fill: "#00000022" }} />
      <path d="M-7.5 -1 C-7.5 -3.5 -5 -4.8 -3 -3.6" fill="none" stroke="#ffffff" strokeWidth={1 / s} strokeLinecap="round" opacity=".9" />
    </g>
  );
}

/** Paisaje de la carta del día: cielo, campo, el tendedero con su ropa y lo que trae el día. */
export function EscenaDia({ efecto, className }: { efecto: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const [arriba, abajo] = CIELO[efecto] ?? CIELO.soleado;
  const [lejos, cerca] = CAMPO[efecto] ?? ["#8fc27a", "#6ea05f"];
  const viento = efecto === "viento" || efecto === "viento-traicionero";
  const giro = viento ? 18 : 0;
  const vecina = efecto === "vecina-sacude-alfombra";
  return (
    <svg viewBox="0 0 168 49" className={`ilu ${className ?? ""}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`cielo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={arriba} />
          <stop offset="1" stopColor={abajo} />
        </linearGradient>
      </defs>
      <rect width="168" height="49" fill={`url(#cielo-${id})`} />
      <rect width="168" height="49" fill="url(#trama-puntos)" opacity=".45" />

      {/* Lo que trae el día, en el centro del cielo */}
      {efecto === "soleado" && <Sol x={84} y={10.5} r={5.4} rayos={12} />}
      {efecto === "ola-de-calor" && (
        <>
          <Sol x={84} y={10.5} r={5.6} c="#ff7a3d" rayos={14} />
          {[38, 118].map((x) => (
            <g key={x} fill="none" strokeLinecap="round">
              <path d={`M${x} 8 q2.5 -2 5 0 t5 0 t5 0`} stroke="#ff7a3d" strokeWidth="1.4" />
              <path d={`M${x + 2} 13 q2.5 -2 5 0 t5 0 t5 0`} stroke="#ff7a3d" strokeWidth="1.4" />
            </g>
          ))}
        </>
      )}
      {efecto === "lluvia" && (
        <>
          <Nubecita x={56} y={9} c="#e6ecf1" />
          <Nubecita x={110} y={8} c="#d5dde4" s={1.15} />
        </>
      )}
      {efecto === "tormenta-repentina" && (
        <>
          <Nubecita x={58} y={8} c="#8e9cad" s={1.1} />
          <Nubecita x={110} y={8} c="#7a879a" s={1.2} />
          <path d="M86 4 L80 13 H84 L81 20 L90 10 H85.5 L89 4 Z" {...relleno(COLOR.amarillo)} stroke={TINTA} strokeWidth="1.2" strokeLinejoin="round" />
        </>
      )}
      {viento && (
        <>
          <Remolino x={50} y={2} />
          <Remolino x={98} y={6} s={0.8} />
        </>
      )}
      {(efecto === "ropa-se-engancha" || vecina) && <Sol x={60} y={9.5} r={4} cara={false} rayos={10} />}
      {efecto === "pinzas-viejas" && (
        <g>
          <circle cx="84" cy="9.5" r="5.4" fill="#fbe7b0" stroke={TINTA} strokeWidth="1.3" />
          <circle cx="86.8" cy="7.6" r="4.6" fill={arriba} />
          <Chispa x={60} y={6} r={1.8} c="#fbe7b0" />
          <Chispa x={112} y={10} r={1.6} c="#fbe7b0" />
        </g>
      )}
      {efecto === "ropa-se-engancha" && (
        <g transform="translate(108 9)">
          <circle r="4.6" {...relleno(COLOR.fastidio)} stroke={TINTA} strokeWidth="1.2" />
          <path d="M0 -2.6 V0.8" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cy="2.6" r=".9" fill="#ffffff" />
        </g>
      )}

      {/* Campo */}
      <path d="M-2 36 Q34 28 78 34 Q124 27 170 32 V51 H-2 Z" fill={lejos} stroke={TINTA} strokeWidth="1.2" />
      <path d="M-2 42 Q46 37 92 42 Q132 38 170 42 V51 H-2 Z" fill={cerca} stroke={TINTA} strokeWidth="1.2" />
      <path d="M30 45 l1 -2 l1 2 M70 46 l1 -2 l1 2 M140 45 l1 -2 l1 2" fill="none" stroke={TINTA} strokeWidth=".8" opacity=".4" />

      {/* La casa de la vecina, a la derecha, con la alfombra al viento */}
      {vecina && (
        <g>
          <path d="M156.5 49 V9 L161.5 3 L166.5 9 V49 Z" fill="#f0d2a0" stroke={TINTA} strokeWidth="1.3" />
          <rect x="158.5" y="10" width="6" height="8" rx="1" fill="#bfe3f2" stroke={TINTA} strokeWidth="1.1" />
          <path d="M159 14 C154 15 150 12 145 14 L146 20 C150 19 154 22 159 20 Z" {...relleno(COLOR.azul)} stroke={TINTA} strokeWidth="1.1" />
          {[
            [140, 18, 2.2],
            [134, 22, 1.8],
            [128, 19, 1.5],
            [123, 24, 1.3],
          ].map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r={r} fill="#d8cbb4" stroke={TINTA} strokeWidth=".7" />
          ))}
        </g>
      )}

      {/* El tendedero */}
      <Poste x={16} />
      <Poste x={152} />
      <Soga d="M16 22 Q84 32 152 22" g={1.8} />
      {efecto === "pinzas-viejas" ? (
        <>
          <Colgada tipo="camiseta" x={84} c={COLOR.azul} />
          <Colgada tipo="toalla" x={122} c={COLOR.amarillo} />
          <g transform="translate(40 41) rotate(78)">
            <MiniPrenda tipo="calcetin" c={COLOR.rojo} x={-6} y={-4} s={0.2} />
          </g>
          <g transform="translate(50 30) rotate(35) scale(.34)">
            <PinzaBosque x={0} color="#b8a27e" />
          </g>
          <path d="M44 25 v-3 M50 23 v-3" stroke={TINTA} strokeWidth=".9" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Colgada tipo="calcetin" x={46} c={COLOR.rojo} giro={giro} />
          {vecina ? (
            <>
              <Colgada tipo="toalla" x={82} c={COLOR.amarillo} />
              <Colgada tipo="camiseta" x={118} c={COLOR.blanco} />
              <g fill="#d8cbb4" stroke={TINTA} strokeWidth=".5">
                <circle cx="114" cy="28" r=".9" />
                <circle cx="120" cy="31" r=".8" />
                <circle cx="117" cy="25" r=".7" />
              </g>
            </>
          ) : (
            <>
              <Colgada tipo="camiseta" x={84} c={COLOR.azul} giro={giro * 0.7} enganchada={efecto === "ropa-se-engancha"} />
              {efecto === "viento-traicionero" ? (
                <>
                  <g transform="translate(128 6) rotate(-20)">
                    <MiniPrenda tipo="toalla" c={COLOR.amarillo} x={-13} y={-1} s={0.16} />
                  </g>
                  <path d="M112 9 l5 1.5 M111 14 l5 1.5" stroke={TINTA} strokeWidth=".9" strokeLinecap="round" />
                </>
              ) : (
                <Colgada tipo="toalla" x={122} c={COLOR.amarillo} giro={giro * 0.5} />
              )}
            </>
          )}
        </>
      )}
      {efecto === "soleado" && (
        <>
          <Chispa x={58} y={34} r={2} />
          <Chispa x={108} y={33} r={1.8} />
        </>
      )}
      {(efecto === "lluvia" || efecto === "tormenta-repentina") && <Lluvia densa={efecto === "tormenta-repentina"} />}
    </svg>
  );
}

// ---------- Iconos de las cartas del día (64 × 64) ----------
// Las cartas del día son iconográficas, como las de acción: un icono grande en la ventana. Casi todos son los de
// ICONOS_BOSQUE según el efecto; las cartas que comparten efecto con otra tienen aquí su propio dibujo.

/** Paraguas abierto (para «Días de lluvia»). */
function Paraguas({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const copa = "M-18 0 Q0 -24 18 0 Q13.5 -4 9 0 Q4.5 -4 0 0 Q-4.5 -4 -9 0 Q-13.5 -4 -18 0 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V17 Q0 21 -4 21 Q-7 21 -7 18" fill="none" stroke={TINTA} strokeWidth={5.4 / s} strokeLinecap="round" />
      <path d="M0 0 V17 Q0 21 -4 21 Q-7 21 -7 18" fill="none" {...linea(COLOR.madera)} strokeWidth={2.4 / s} strokeLinecap="round" />
      <path d={copa} {...relleno(COLOR.rojo)} />
      <path className="sombra" d="M0 -12 Q12 -10 18 0 Q13.5 -4 9 0 Q4.5 -4 0 0 Z" style={{ fill: "color-mix(in srgb, var(--p-rojo, #c2553a), #1d140e 30%)" }} />
      <path d="M0 -12 Q-4 -6 -9 0 M0 -12 Q4 -6 9 0 M0 -12 V0" fill="none" stroke={TINTA} strokeWidth={1.4 / s} />
      <path d="M-12 -6 Q-8 -11 -3 -12.5" fill="none" stroke="#ffffff" strokeWidth={1.8 / s} strokeLinecap="round" opacity=".8" />
      <path d={copa} fill="none" stroke={TINTA} strokeWidth={3 / s} strokeLinejoin="round" />
      <path d="M0 -12 V-15" stroke={TINTA} strokeWidth={2.4 / s} strokeLinecap="round" />
    </g>
  );
}

const ICONOS_DIA: Record<string, ReactElement> = {
  // Racha de sol: dos soles, porque dura dos días
  "racha-de-sol": (
    <g>
      <Sol x={46} y={44} r={8} cara={false} rayos={10} />
      <Sol x={26} y={25} r={13} rayos={12} />
      <Chispa x={54} y={14} r={3.4} />
    </g>
  ),
  // Chaparrón: nube cargada y un buen golpe de agua
  chaparron: (
    <g>
      <Nube y={-12} c="#c9d3dc" />
      <path d="M12 40 l-3 7 M22 42 l-3 7 M42 42 l-3 7 M52 40 l-3 7 M32 44 l-3 7" {...linea(COLOR.agua)} strokeWidth="2.4" strokeLinecap="round" />
      <GotaBosque x={17} y={53} r={0.9} />
      <GotaBosque x={47} y={53} r={0.9} />
      <GotaBosque x={32} y={58} r={0.75} />
    </g>
  ),
  // Días de lluvia: nube pequeña y un paraguas abierto
  lluvia: (
    <g>
      <Nube x={5} y={-9} s={0.75} c="#dfe6ec" />
      <path d="M12 30 l-2 5 M54 28 l-2 5 M10 44 l-2 5 M56 42 l-2 5" {...linea(COLOR.agua)} strokeWidth="2.2" strokeLinecap="round" />
      <Paraguas x={32} y={41} s={1} />
      <GotaBosque x={13} y={53} r={0.7} />
      <GotaBosque x={51} y={54} r={0.7} />
    </g>
  ),
};

/** Icono de una carta del día: el suyo propio si lo tiene, si no el de su efecto. */
export function IconoDia({ id, efecto, className }: { id: string; efecto: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu icono-limpio ${className ?? ""}`} overflow="visible" aria-hidden>
      {ICONOS_DIA[id] ?? ICONOS_BOSQUE[efecto] ?? ICONOS_BOSQUE.soleado}
    </svg>
  );
}

// ---------- Dibujos de los objetivos (64 × 64) ----------

const COLOR_NOMBRE: Record<string, string> = { blanco: COLOR.blanco, azul: COLOR.azul, rojo: COLOR.rojo, amarillo: COLOR.amarillo };

/** Prenda grande y centrada para los objetivos de tipo de prenda. */
function PrendaSola({ tipo, c }: { tipo: Tipo; c: string }) {
  if (tipo === "calcetin") return <MiniPrenda tipo="calcetin" c={c} x={9} y={2} s={0.78} />;
  if (tipo === "camiseta") return <MiniPrenda tipo="camiseta" c={c} x={4} y={11} s={0.47} />;
  return <MiniPrenda tipo="toalla" c={c} x={2} y={17} s={0.34} />;
}

/** Cuadro de pintura de un color (objetivos «Todo …»): camiseta del color y una mancha de pintura. */
function TodoColor({ c }: { c: string }) {
  return (
    <g>
      <path d="M8 40 C2 30 10 16 22 14 C30 4 50 6 54 18 C64 22 64 38 56 44 C56 56 40 60 32 54 C20 60 6 54 8 40 Z" {...relleno(c)} opacity=".35" />
      <MiniPrenda tipo="camiseta" c={c} x={8} y={16} s={0.4} />
      <GotaBosque x={52} y={50} r={1.2} />
      <Chispa x={10} y={12} r={3.6} />
    </g>
  );
}

const OBJETIVOS: Record<string, () => ReactElement> = {
  calcetinero: () => (
    <g>
      <PrendaSola tipo="calcetin" c={COLOR.rojo} />
      <Chispa x={52} y={12} r={4} />
    </g>
  ),
  toallero: () => (
    <g>
      <PrendaSola tipo="toalla" c={COLOR.azul} />
      <Chispa x={56} y={10} r={4} />
    </g>
  ),
  camisetero: () => (
    <g>
      <PrendaSola tipo="camiseta" c={COLOR.amarillo} />
      <Chispa x={56} y={8} r={4} />
    </g>
  ),
  "coleccion-color": () => (
    <g>
      <MiniPrenda tipo="toalla" c={COLOR.azul} x={4} y={34} s={0.32} />
      <MiniPrenda tipo="camiseta" c={COLOR.azul} x={10} y={12} s={0.3} giro={-8} />
      <MiniPrenda tipo="calcetin" c={COLOR.azul} x={34} y={4} s={0.44} giro={12} />
    </g>
  ),
  arcoiris: () => (
    <g>
      {[COLOR.rojo, COLOR.amarillo, COLOR.azul, COLOR.blanco].map((c, i) => (
        <path key={i} d={`M${6 + i * 5} 50 A${26 - i * 5} ${26 - i * 5} 0 0 1 ${58 - i * 5} 50`} fill="none" stroke={TINTA} strokeWidth="7.4" />
      ))}
      {[COLOR.rojo, COLOR.amarillo, COLOR.azul, COLOR.blanco].map((c, i) => (
        <path key={i} d={`M${6 + i * 5} 50 A${26 - i * 5} ${26 - i * 5} 0 0 1 ${58 - i * 5} 50`} fill="none" {...linea(c)} strokeWidth="4.4" />
      ))}
      <Nube x={-8} y={30} s={0.45} />
      <Nube x={36} y={30} s={0.45} />
    </g>
  ),
  "monton-de-ropa": () => (
    <g>
      <path d="M6 46 H58 L54 60 H10 Z" {...relleno(COLOR.madera)} {...trazo} />
      <path d="M12 50 H52 M14 55 H50" stroke={TINTA} strokeWidth="1.2" opacity=".5" />
      <MiniPrenda tipo="toalla" c={COLOR.amarillo} x={6} y={30} s={0.3} giro={-4} />
      <MiniPrenda tipo="camiseta" c={COLOR.rojo} x={14} y={14} s={0.26} giro={6} />
      <MiniPrenda tipo="calcetin" c={COLOR.azul} x={40} y={4} s={0.34} giro={20} />
      <MiniPrenda tipo="calcetin" c={COLOR.blanco} x={4} y={10} s={0.3} giro={-25} />
    </g>
  ),
  "tendedero-completo": () => (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={2 + i * 15} y="18" width="15" height="11" rx="1.5" fill={CREMA} stroke={TINTA} strokeWidth="1.8" />
      ))}
      <Soga d="M0 26 Q32 30 64 26" g={2.4} />
      {[9.5, 24.5, 39.5, 54.5].map((x, i) => (
        <MiniPrenda key={x} tipo="calcetin" c={[COLOR.rojo, COLOR.azul, COLOR.amarillo, COLOR.blanco][i]} x={x - 6} y={28} s={0.2} />
      ))}
      <g transform="translate(48 50)">
        <circle r="10" {...relleno(COLOR.tactica)} {...trazo} />
        <path d="M-5 0 L-1.5 4 L5 -4" fill="none" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  ),
  "variedad-de-cuerdas": () => (
    <g>
      <g transform="translate(0 2) scale(.5)">{ICONOS_BOSQUE.tejadillo}</g>
      <g transform="translate(32 2) scale(.5)">{ICONOS_BOSQUE.resistente}</g>
      <g transform="translate(0 32) scale(.5)">{ICONOS_BOSQUE["secado-rapido"]}</g>
      <g transform="translate(32 32) scale(.5)">{ICONOS_BOSQUE.basica}</g>
    </g>
  ),
  "todo-blanco": () => <TodoColor c={COLOR.blanco} />,
  "todo-azul": () => <TodoColor c={COLOR.azul} />,
  "todo-rojo": () => <TodoColor c={COLOR.rojo} />,
  "todo-amarillo": () => <TodoColor c={COLOR.amarillo} />,
  parejas: () => (
    <g>
      <MiniPrenda tipo="calcetin" c={COLOR.rojo} x={2} y={10} s={0.62} giro={-6} />
      <g transform="translate(64 0) scale(-1 1)">
        <MiniPrenda tipo="calcetin" c={COLOR.rojo} x={2} y={10} s={0.62} giro={-6} />
      </g>
      <path d="M32 14 C29 8 21 11 24 17 L32 24 L40 17 C43 11 35 8 32 14 Z" {...relleno(COLOR.fastidio)} stroke={TINTA} strokeWidth="2" />
    </g>
  ),
  "bajo-techo": () => ICONOS_BOSQUE.tejadillo,
  "a-toda-prisa": () => ICONOS_BOSQUE["secado-rapido"],
  "cuerdas-llenas": () => (
    <g>
      <rect x="2" y="12" width="60" height="44" rx="5" fill={CREMA} stroke={TINTA} strokeWidth="2.4" />
      <Soga d="M0 22 Q32 28 64 22" g={3.4} />
      {[12, 32, 52].map((x) => (
        <g key={x}>
          <MiniPrenda tipo="calcetin" c={COLOR.azul} x={x - 9} y={22} s={0.3} />
          <g transform={`translate(${x} 20) scale(.55)`}>
            <PinzaBosque x={0} />
          </g>
        </g>
      ))}
    </g>
  ),
  "regalo-envenenado": () => (
    <g>
      <rect x="10" y="26" width="44" height="32" rx="3" fill="#7fa36b" {...trazo} />
      <path className="sombra" d="M40 27 H52 V57 H40 Z" fill="#5b7f4c" />
      <rect x="6" y="18" width="52" height="11" rx="2.5" fill="#97bd80" {...trazo} />
      <Soga d="M32 18 V58" g={4} c={COLOR.cuerdaVieja} />
      <Soga d="M32 18 C22 6 14 12 22 18 M32 18 C42 6 50 12 42 18" g={3.4} c={COLOR.cuerdaVieja} />
      <path d="M22 18 l-3 3 M22 18 l-4 0 M42 18 l3 3 M42 18 l4 0" stroke={TINTA} strokeWidth="1.3" strokeLinecap="round" />
      <g transform="translate(51 46)">
        <path d="M0 -7 C3 -2.5 5 0 5 2.4 A5 5 0 0 1 -5 2.4 C-5 0 -3 -2.5 0 -7Z" fill="#9b5cc4" stroke={TINTA} strokeWidth="1.8" />
        <path d="M-1.8 1.2 h0.1 M1.8 1.2 h0.1 M-1.6 4 q1.6 -1 3.2 0" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
    </g>
  ),
  "conjunto-completo": () => (
    <g>
      <MiniPrenda tipo="toalla" c={COLOR.amarillo} x={2} y={42} s={0.33} />
      <MiniPrenda tipo="camiseta" c={COLOR.amarillo} x={2} y={14} s={0.3} />
      <MiniPrenda tipo="calcetin" c={COLOR.amarillo} x={34} y={4} s={0.4} />
      <Chispa x={56} y={44} r={4.4} />
    </g>
  ),
};

/** Dibujo de un objetivo (data/objetivos.json): según su id, o según el tipo o color que cuenta. */
export function IlustraObjetivo({ id, tipo, color, className }: { id: string; tipo?: string; color?: string; className?: string }) {
  const dibujo = OBJETIVOS[id]?.() ?? (color ? <TodoColor c={COLOR_NOMBRE[color] ?? COLOR.rojo} /> : tipo ? <PrendaSola tipo={tipo as Tipo} c={COLOR.rojo} /> : ICONOS_BOSQUE.basica);
  return (
    <svg viewBox="0 0 64 64" className={`ilu icono-limpio ${className ?? ""}`} overflow="visible" aria-hidden>
      {dibujo}
    </svg>
  );
}

// ---------- Emblemas de mazo (24 × 24) ----------
// Van en el medallón de cada carta y en su dorso: dicen de un vistazo de qué mazo es.

export const EMBLEMAS: Record<string, ReactElement> = {
  // Fastidio: rayo
  fastidio: <path d="M14 1.5 L6 13 H11 L8.5 22.5 L18 9.5 H13 L16.5 1.5 Z" {...relleno(COLOR.amarillo)} stroke={TINTA} strokeWidth="1.6" strokeLinejoin="round" />,
  // Táctica: destello de idea
  tactica: (
    <g>
      <path d="M12 1.5 C13 8 16 11 22.5 12 C16 13 13 16 12 22.5 C11 16 8 13 1.5 12 C8 11 11 8 12 1.5 Z" fill="#ffffff" stroke={TINTA} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1.6" {...relleno(COLOR.amarillo)} stroke={TINTA} strokeWidth="1" />
    </g>
  ),
  // Cuerdas: madeja
  cuerdas: (
    <g fill="none" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" stroke={TINTA} strokeWidth="5" />
      <circle cx="12" cy="12" r="8.5" stroke={COLOR.cuerda} strokeWidth="2.8" />
      <circle cx="12" cy="12" r="3.5" stroke={TINTA} strokeWidth="5" />
      <circle cx="12" cy="12" r="3.5" stroke={COLOR.cuerda} strokeWidth="2.8" />
    </g>
  ),
  // Tiempo: sol tras una nube
  tiempo: (
    <g>
      <circle cx="15" cy="9" r="6" {...relleno(COLOR.amarillo)} stroke={TINTA} strokeWidth="1.5" />
      <path d="M5 19 C1.5 19 1.5 14 5 13.5 C5 10 10 9 11.5 11.5 C13 8.5 19 9.5 18.5 13.5 C21.5 13.5 22 19 18.5 19 Z" fill="#ffffff" stroke={TINTA} strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  ),
  // Suceso: exclamación en un bocadillo
  suceso: (
    <g>
      <path d="M12 2 C18 2 22 5.5 22 10.5 C22 15.5 18 19 12 19 L7 22.5 L8 18 C4 16.5 2 14 2 10.5 C2 5.5 6 2 12 2 Z" fill="#ffffff" stroke={TINTA} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 5.5 V11.5" stroke={TINTA} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.5" fill={TINTA} />
    </g>
  ),
  // Prendas: calcetín, camiseta y toalla (pie del dorso del mazo de prendas)
  calcetin: <MiniPrenda tipo="calcetin" c={COLOR.rojo} x={-0.75} y={-1.6} s={0.34} />,
  camiseta: <MiniPrenda tipo="camiseta" c={COLOR.azul} x={0.3} y={4.2} s={0.195} />,
  toalla: <MiniPrenda tipo="toalla" c={COLOR.amarillo} x={-0.8} y={6.5} s={0.142} />,
  // Objetivo: estrella
  objetivo: (
    <path
      d="M12 1.8 L14.9 8.3 L22 9 L16.6 13.7 L18.2 20.7 L12 17 L5.8 20.7 L7.4 13.7 L2 9 L9.1 8.3 Z"
      {...relleno(COLOR.amarillo)}
      stroke={TINTA}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  ),
  // Objetivo común (de antes; se deja por compatibilidad): estrella
  comun: (
    <path
      d="M12 1.8 L14.9 8.3 L22 9 L16.6 13.7 L18.2 20.7 L12 17 L5.8 20.7 L7.4 13.7 L2 9 L9.1 8.3 Z"
      {...relleno(COLOR.amarillo)}
      stroke={TINTA}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  ),
  // Objetivo secreto: ojo que guiña dentro de un sello
  secreto: (
    <g>
      <path d="M2 12 C6 5.5 18 5.5 22 12 C18 18.5 6 18.5 2 12 Z" fill="#ffffff" stroke={TINTA} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.6" fill="#7a4fb0" stroke={TINTA} strokeWidth="1.2" />
      <circle cx="13" cy="11" r="1" fill="#ffffff" />
      <path d="M4 5 l2 2.2 M12 2.5 v2.6 M20 5 l-2 2.2" stroke={TINTA} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),
};

export function Emblema({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`ilu emblema ${className ?? ""}`} aria-hidden>
      {EMBLEMAS[id]}
    </svg>
  );
}
