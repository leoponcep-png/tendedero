import type { CSSProperties, HTMLAttributes } from "react";
import { tono } from "../arte/color";
import { colorEstilo, CieloSoleado, CREMA, GotaBosque, ICONOS_BOSQUE, IconoBosque, PinzaBosque, PrendaBosque, TINTA } from "./ArteBosque";
import cuerdasJson from "../../../../data/cuerdas.json";
import { ACCIONES, CUERDAS, TIPOS, type Prenda } from "./Prototipos";

// Componentes físicos de la versión D, dibujados como serán en la mesa: carta de cuerda apaisada con sus
// tres huecos, loseta de cartón con la leyenda, cartas de prenda y de acción, y dorsos.

/** Carta de cuerda: 180 × 128 unidades (proporción de una carta de 88 × 63 mm tumbada). */
export const CUERDA_W = 180;
export const CUERDA_H = 128;
/** Altura de la cuerda en el borde de la carta: es la misma en todas, para que empalmen. */
export const CUERDA_Y = 16;
/** Huecos para colgar: arriba y alto, en unidades de la carta. */
export const HUECO_Y = 24;
export const HUECO_ALTO = 78;
/** Altura de la cuerda en el modo «borde» (prendas por debajo de la carta). */
export const Y_CUERDA_BORDE = 108;
const TEXTOS: Record<string, string> = Object.fromEntries(cuerdasJson.cartas.map((c) => [c.efecto ?? "basica", c.texto]));

const BANDA: Record<string, [string, string]> = {
  basica: ["#d8c39b", "Cuerda básica"],
  tejadillo: ["#c2553a", "Tejadillo"],
  resistente: ["#7d8b93", "Cuerda resistente"],
  "secado-rapido": ["#e1a73a", "Secado rápido"],
  "modificador-puntuacion": ["#c2553a", "Pinzas rojas"],
  fragil: ["#b9a27a", "Cuerda vieja"],
};

export const LEYENDA: { id: string; nombre: string; texto: string }[] = [
  { id: "basica", nombre: "Básica", texto: "Sin habilidad." },
  { id: "tejadillo", nombre: "Tejadillo", texto: "No se moja, ni la de debajo." },
  { id: "resistente", nombre: "Resistente", texto: "No se cae ni la mueven." },
  { id: "secado-rapido", nombre: "Secado rápido", texto: "Seca 2 por día." },
  { id: "modificador-puntuacion", nombre: "Pinzas de color", texto: "+1 por prenda de su color." },
  { id: "fragil", nombre: "Vieja", texto: "Se rompe en 2 rondas." },
];

export function CartaCuerdaBosque({
  efecto,
  pinzas,
  modo = "huecos",
  className,
  ...resto
}: { efecto: string | null; pinzas?: string; modo?: "huecos" | "pinzas" | "borde" } & HTMLAttributes<HTMLDivElement>) {
  const clave = efecto ?? "basica";
  const [banda, nombre] = BANDA[clave] ?? BANDA.basica;
  const colorBanda = clave === "modificador-puntuacion" && pinzas ? colorEstilo(pinzas) : banda;
  const gruesa = clave === "resistente";
  const vieja = clave === "fragil";
  const W = CUERDA_W;
  const H = CUERDA_H;
  // En el modo «borde» la cuerda va abajo y las prendas asoman por debajo de la carta (la humedad queda tapada).
  const borde = modo === "borde";
  const yCuerda = borde ? Y_CUERDA_BORDE : CUERDA_Y;
  const cuerda = `M-2 ${yCuerda} Q${W / 2} ${yCuerda + 9} ${W + 2} ${yCuerda}`;
  const colorCuerda = vieja ? "#a48a63" : gruesa ? "#6b553a" : "#8a6c48";
  return (
    <div {...resto} className={`ccb ${className ?? ""}`} title={CUERDAS[clave]?.nombre}>
      <svg viewBox={`0 0 ${W} ${H}`} className="ilu" preserveAspectRatio="none" aria-hidden>
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="8" fill={vieja ? "#eadcbd" : CREMA} />
        {/* Tinte suave del tipo de cuerda en el fondo */}
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="8" fill={colorBanda} opacity=".1" />
        {vieja && (
          <g className="deco" opacity=".35">
            <circle cx="44" cy="70" r="14" fill="#a48a63" />
            <circle cx="140" cy="52" r="9" fill="#a48a63" />
          </g>
        )}
        {clave === "tejadillo" && !borde && (
          <g className="deco">
            <path d={`M1.5 1.5 H${W - 1.5} V13 Q${W / 2} 19 1.5 13 Z`} fill="#c2553a" stroke={TINTA} strokeWidth="2" />
            {Array.from({ length: 13 }, (_, i) => (
              <path key={i} d={`M${2 + i * 14} 3 q7 9 14 0`} fill="none" stroke={TINTA} strokeWidth="1.3" opacity=".6" />
            ))}
            <rect x="1.5" y="16" width={W - 3} height="30" fill="url(#sombra-tejado)" />
          </g>
        )}

        {/* Huecos donde se cuelgan las prendas, con la marca de la pinza (o solo las 3 pinzas, en el modo «pinzas») */}
        {modo === "pinzas" &&
          [30, 90, 150].map((x) => (
            <g key={x} className="hueco-carta" opacity=".45">
              <rect x={x - 5} y={CUERDA_Y - 4} width="10" height="22" rx="2.5" fill="#ffffff88" stroke={TINTA} strokeWidth="1.4" strokeDasharray="3 2" />
            </g>
          ))}
        {modo === "huecos" && [0, 1, 2].map((i) => (
          <g key={i} className="hueco-carta">
            <rect x={i * 60 + 5} y={HUECO_Y} width="50" height={HUECO_ALTO} rx="6" fill="#ffffff55" stroke={TINTA} strokeOpacity=".3" strokeWidth="1.4" strokeDasharray="4 3" />
            <path d={`M${i * 60 + 30} ${HUECO_Y + 26} v18 M${i * 60 + 21} ${HUECO_Y + 35} h18`} stroke={TINTA} strokeOpacity=".12" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}

        {/* La cuerda: de borde a borde */}
        <path className="cuerda-trazo" d={cuerda} pathLength={1} fill="none" stroke={TINTA} strokeWidth={gruesa ? 8 : 5.4} strokeLinecap="round" />
        <path className="cuerda-trazo" d={cuerda} pathLength={1} fill="none" stroke={colorCuerda} strokeWidth={gruesa ? 5 : 2.8} strokeLinecap="round" strokeDasharray={vieja ? "0.06 0.02 0.1 0.03" : undefined} />
        <path className="cuerda-trenza" d={cuerda} fill="none" stroke={tono(colorCuerda, 0.5)} strokeWidth={gruesa ? 2 : 1.2} strokeDasharray={gruesa ? "3 3" : "2 4"} />
        {vieja && (
          <g className="deco" stroke={TINTA} strokeWidth="1.4" strokeLinecap="round">
            <path d={`M84 ${yCuerda + 5} l-3 7 M88 ${yCuerda + 6} l2 7 M96 ${yCuerda + 6} l3 6`} />
          </g>
        )}

        {borde && clave === "tejadillo" && (
          <g className="deco" transform={`translate(0 ${yCuerda - 24})`}>
            <path d={`M1.5 0 H${W - 1.5} V13 Q${W / 2} 19 1.5 13 Z`} fill="#c2553a" stroke={TINTA} strokeWidth="2" />
            {Array.from({ length: 13 }, (_, i) => (
              <path key={i} d={`M${2 + i * 14} 2 q7 9 14 0`} fill="none" stroke={TINTA} strokeWidth="1.3" opacity=".6" />
            ))}
          </g>
        )}
        {/* Pinzas impresas en el borde: muerden las prendas que asoman por debajo */}
        {borde &&
          [30, 90, 150].map((x) => (
            <g key={x} transform={`translate(0 ${yCuerda - 4})`}>
              <PinzaBosque x={x} color={clave === "modificador-puntuacion" && pinzas ? colorEstilo(pinzas) : undefined} />
            </g>
          ))}

        {/* Banda con el icono y el nombre: abajo, o arriba en el modo «borde» */}
        {borde ? (
          <g>
            <path d={`M1.5 26 H${W - 1.5} V9.5 Q${W - 1.5} 1.5 ${W - 9.5} 1.5 H9.5 Q1.5 1.5 1.5 9.5 Z`} fill={colorBanda} />
            <path d={`M1.5 26 H${W - 1.5}`} stroke={TINTA} strokeWidth="2" />
            <circle cx="16" cy="13.5" r="10" fill={CREMA} stroke={TINTA} strokeWidth="2" />
            <g transform="translate(7 4.5) scale(.28)">{ICONOS_BOSQUE[clave]}</g>
            <text x="31" y="18.5" style={{ fontFamily: "var(--fuente-titulo)" }} fontWeight="800" fontSize="13" fill={clave === "secado-rapido" || clave === "basica" || vieja ? TINTA : CREMA}>
              {nombre}
            </text>
          </g>
        ) : (<>
        <path d={`M1.5 104 H${W - 1.5} V${H - 9.5} Q${W - 1.5} ${H - 1.5} ${W - 9.5} ${H - 1.5} H9.5 Q1.5 ${H - 1.5} 1.5 ${H - 9.5} Z`} fill={colorBanda} />
        <path d={`M1.5 104 H${W - 1.5}`} stroke={TINTA} strokeWidth="2" />
        <circle cx="16" cy="115" r="11" fill={CREMA} stroke={TINTA} strokeWidth="2" />
        <g transform="translate(6.5 105.5) scale(.3)">{ICONOS_BOSQUE[clave]}</g>
        <text x="32" y="120" style={{ fontFamily: "var(--fuente-titulo)" }} fontWeight="800" fontSize="13" fill={clave === "secado-rapido" || clave === "basica" || vieja ? TINTA : CREMA}>
          {nombre}
        </text>
        </>)}
        {/* Índice de esquina: se lee aunque la carta esté medio tapada en la mano */}
        {!borde && <g className="indice">
          <path d="M1.5 30 V9.5 Q1.5 1.5 9.5 1.5 H30 Q30 30 1.5 30 Z" fill={colorBanda} stroke={TINTA} strokeWidth="2" />
          <g transform="translate(2 2) scale(.36)">{ICONOS_BOSQUE[clave]}</g>
        </g>}
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="8" fill="none" stroke={TINTA} strokeWidth="3" />
      </svg>
      {borde && <div className="ccb-texto">{clave === "modificador-puntuacion" ? "+1 punto por cada prenda roja que se seque aquí." : TEXTOS[clave]}</div>}
    </div>
  );
}

/** Loseta de cartón al principio del tendedero: hace de poste y lleva la leyenda de las cuerdas. */
export function LosetaBosque({ lineas }: { lineas: number }) {
  return (
    <div className="loseta" style={{ "--lineas": lineas } as CSSProperties}>
      <div className="loseta-leyenda">
        <div className="loseta-titulo">Cuerdas</div>
        {LEYENDA.map((l) => (
          <div key={l.id} className="loseta-fila">
            <IconoBosque id={l.id} className="loseta-icono" />
            <div>
              <b>{l.nombre}</b>
              <span>{l.texto}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="loseta-poste" aria-hidden>
        {Array.from({ length: lineas }, (_, i) => (
          <span key={i} className="loseta-gancho" style={{ "--i": i } as CSSProperties}>
            <i>{i + 1}</i>
          </span>
        ))}
      </div>
    </div>
  );
}

function GotasPrenda({ humedad }: { humedad: number }) {
  return (
    <svg className="pb-gotas" viewBox={`0 0 ${Math.max(1, humedad) * 12} 16`} style={{ width: `${Math.max(1, humedad) * 0.95}em` }} aria-label={`${humedad} de humedad`}>
      <g className="gotas">
        {Array.from({ length: humedad }, (_, i) => (
          <GotaBosque key={i} x={6 + i * 12} y={9} r={0.95} />
        ))}
      </g>
    </svg>
  );
}

/** Carta de prenda: la ropa sobre su color, los puntos en una ficha y la humedad en gotas. */
export function CartaPrendaBosque({ p, pinzas, colorPinzas, className, ...resto }: { p: Prenda; pinzas?: boolean; colorPinzas?: string } & HTMLAttributes<HTMLDivElement>) {
  const esp = TIPOS[p.tipo].espacios;
  const c = colorEstilo(p.color);
  const estilo = { "--c": c, "--c-claro": `color-mix(in srgb, ${c}, #fff 70%)`, "--c-medio": `color-mix(in srgb, ${c}, #fff 45%)`, "--espacios": esp, ...resto.style } as CSSProperties;
  return (
    <div {...resto} className={`pb pb-${p.tipo} ${className ?? ""}`} style={estilo}>
      <div className="pb-marco">
        <div className="pb-ilustra">
          <PrendaBosque tipo={p.tipo} color={p.color} espacios={esp} className="pb-arte" />
        </div>
        <div className="pb-pie">
          <span className="pb-puntos">{TIPOS[p.tipo].puntos}</span>
          {p.humedad > 0 ? <GotasPrenda humedad={p.humedad} /> : <span className="pb-seca">seca</span>}
        </div>
      </div>
      {pinzas && (
        <svg className="pb-pinzas" viewBox={`0 0 ${60 * esp} 20`} preserveAspectRatio="xMidYMin meet" aria-hidden>
          {(esp === 1 ? [30] : [30, 30 + (esp - 1) * 60]).map((x) => (
            <g key={x} className="pinza-una">
              <PinzaBosque x={x} color={colorPinzas ? colorEstilo(colorPinzas) : undefined} />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

/** Carta de acción: banda con el nombre, ilustración, texto y tipo. */
export function CaraAccionBosque({ id }: { id: string }) {
  const def = ACCIONES[id];
  const grupo = def.grupo === "fastidio" ? "fastidio" : "tactica";
  return (
    <div className={`cb cb-${grupo}`}>
      <div className="cb-nombre">{def.nombre}</div>
      <div className="cb-ilustra">
        <IconoBosque id={def.efecto} className="cb-icono" />
      </div>
      <div className="cb-texto">{def.texto}</div>
      <div className="cb-tipo">{grupo === "fastidio" ? "Fastidio" : "Táctica"}</div>
    </div>
  );
}

export function DorsoBosque({ clase = "acciones" }: { clase?: "acciones" | "cuerdas" }) {
  return (
    <div className={`db db-${clase}`}>
      <svg viewBox="0 0 100 140" aria-hidden>
        <rect x="7" y="7" width="86" height="126" rx="9" fill="none" stroke={CREMA} strokeWidth="2.2" />
        <rect x="12" y="12" width="76" height="116" rx="6" fill="none" stroke={CREMA} strokeWidth="1" opacity=".6" />
        <g filter="url(#tinta-bosque)">
          <path d="M18 58 Q50 74 82 58" fill="none" stroke={TINTA} strokeWidth="6" strokeLinecap="round" />
          <path d="M18 58 Q50 74 82 58" fill="none" stroke="#d8b98a" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g transform="translate(0 56)" filter="url(#tinta-bosque)">
          <PinzaBosque x={36} color="#d8b98a" />
          <PinzaBosque x={64} color="#d8b98a" />
        </g>
        <text x="50" y="104" textAnchor="middle" style={{ fontFamily: "var(--fuente-titulo)" }} fontSize="15" fontWeight="800" fill={CREMA}>
          Tendedero
        </text>
      </svg>
    </div>
  );
}

export function CartaDiaBosque() {
  return (
    <div className="dia-bosque">
      <div className="dia-bosque-nombre">Soleado</div>
      <CieloSoleado className="dia-bosque-arte" />
      <div className="dia-bosque-texto">1 día: todas las prendas pierden 1 de humedad más al secarse.</div>
    </div>
  );
}
