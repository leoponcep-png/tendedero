import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { tono } from "../arte/color";
import { colorEstilo, COLOR, CREMA, GotaBosque, ICONOS_BOSQUE, IconoBosque, MiniPrenda, nombreColor, PinzaBosque, PrendaBosque, Soga, TINTA } from "./ArteBosque";
import { EMBLEMAS, IconoDia, IlustraObjetivo } from "./IconosJuego";
import { LIENZO, MM } from "./medidas";
import { cartaTraducida, t, textoCarta, textoObjetivo, tLibre, useIdioma } from "../i18n";
import cuerdasJson from "../../../../data/cuerdas.json";
import diaJson from "../../../../data/dia.json";
import objetivosJson from "../../../../data/objetivos.json";
import { ACCIONES, TIPOS, type Prenda } from "./Prototipos";
import "./CartasJuego.css";

export { EscenaDia, IconoDia, IlustraObjetivo, Emblema } from "./IconosJuego";
export { IconoBosque } from "./ArteBosque";

// Componentes físicos de la versión D, dibujados como serán en la mesa: carta de cuerda apaisada con sus
// tres huecos, loseta de cartón con la leyenda, cartas de prenda, de acción, del día y de objetivo, y dorsos.
// Medidas reales en medidas.ts: acción, objetivo 63 × 88 mm; cuerda y día 88 × 63 mm; prenda 41 × 63 mm.
// Las cartas tienen marco de color con trama de risografía, cinta con el nombre, ventana de ilustración,
// medallón con el emblema del mazo y caja de texto cosida; las letras se dimensionan con el ancho de la carta
// (unidades cqw), así que la misma carta vale para la mano, la mesa o la lupa. Estilos en CartasJuego.css.

/** Carta de cuerda: 180 × 128 unidades (proporción de una carta de 88 × 63 mm tumbada). */
export const CUERDA_W = LIENZO.cuerda.ancho;
export const CUERDA_H = LIENZO.cuerda.alto;
/** Altura de la cuerda en el borde de la carta: es la misma en todas, para que empalmen. */
export const CUERDA_Y = 16;
/** Huecos para colgar: arriba y alto, en unidades de la carta. */
export const HUECO_Y = 24;
export const HUECO_ALTO = 78;
/** Altura de la cuerda en el modo «borde» (prendas por debajo de la carta). */
export const Y_CUERDA_BORDE = 108;
const TEXTOS: Record<string, string> = Object.fromEntries(cuerdasJson.cartas.map((c) => [c.efecto ?? "basica", c.texto]));

/** Color de la banda y nombre de cada clase de cuerda. Los colores salen del estilo de dibujo cuando pueden. */
const BANDA: Record<string, [string, string]> = {
  basica: ["#d8c39b", "Cuerda básica"],
  tejadillo: [COLOR.rojo, "Tejadillo"],
  resistente: ["#7d8b93", "Cuerda resistente"],
  "secado-rapido": [COLOR.amarillo, "Secado rápido"],
  "modificador-puntuacion": [COLOR.rojo, "Pinzas rojas"],
  fragil: ["#b9a27a", "Cuerda vieja"],
};
const PINZAS_PLURAL: Record<string, string> = { blanco: "blancas", azul: "azules", rojo: "rojas", amarillo: "amarillas" };

export const LEYENDA: { id: string; nombre: string; texto: string }[] = [
  { id: "basica", nombre: "Básica", texto: "Sin habilidad." },
  { id: "tejadillo", nombre: "Tejadillo", texto: "No se moja, ni la de debajo." },
  { id: "resistente", nombre: "Resistente", texto: "No se cae ni la mueven." },
  { id: "secado-rapido", nombre: "Secado rápido", texto: "Seca 2 por día." },
  { id: "modificador-puntuacion", nombre: "Pinzas de color", texto: "+1 por prenda de su color." },
  { id: "fragil", nombre: "Vieja", texto: "Se rompe en 2 rondas." },
];

/** Longitud de un título: corto, medio o largo (el CSS elige la letra). */
/**
 * Longitud «a ojo» de un texto, en letras latinas: un ideograma chino o japonés o una sílaba coreana ocupa casi
 * el doble de ancho que una letra, así que cuenta por 1,8. Sirve para que los textos traducidos quepan igual.
 */
const ancho = (texto: string) => {
  let n = 0;
  for (const c of texto) n += /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(c) ? 1.8 : 1;
  return n;
};
const largo = (texto: string, cortos: number, medios: number) => {
  const n = ancho(texto);
  return n <= cortos ? "corto" : n <= medios ? "medio" : "largo";
};

/**
 * Para un <text> de SVG de una sola línea: si a este tamaño no cabe en `hueco` unidades, se comprime a lo ancho
 * (textLength) en vez de salirse de la carta. Los nombres traducidos (alemán, ruso…) pueden ser largos.
 */
const ajustarTexto = (texto: string, tam: number, hueco: number) =>
  ancho(texto) * tam * 0.56 > hueco ? { textLength: hueco, lengthAdjust: "spacingAndGlyphs" as const } : {};

/** Id de /data/cuerdas.json de cada clase de cuerda (las de pinzas de color van por su color). */
const ID_CUERDA: Record<string, string> = { basica: "basica", tejadillo: "tejadillo", resistente: "resistente", "secado-rapido": "secado-rapido", fragil: "vieja" };

/**
 * Tamaño de letra (en cqw) para que un texto llene su caja sin salirse: la caja mide `area` cqw² y cada letra
 * ocupa más o menos 0,62 × 1,14 de su tamaño. Se limita entre `min` y `max` para que no quede ni enorme ni ilegible.
 */
const tamTexto = (texto: string, area: number, max: number, min = 3.4) =>
  ({ "--tam-texto": `${Math.max(min, Math.min(max, Math.sqrt((0.7 * area) / (0.62 * 1.14 * ancho(texto))))).toFixed(2)}cqw` }) as CSSProperties;

/** Fila de festones (medios círculos) de un borde: `abajo` cuelgan hacia abajo, si no, hacia arriba. */
function festones(x0: number, x1: number, y: number, n: number, abajo = true) {
  const paso = (x1 - x0) / n;
  const r = paso / 2;
  return `M${x0} ${y}` + Array.from({ length: n }, () => ` a${r} ${r} 0 0 ${abajo ? 0 : 1} ${paso} 0`).join("");
}

// ---------- Carta de cuerda ----------

export function CartaCuerdaBosque({
  efecto,
  pinzas,
  modo = "huecos",
  className,
  style,
  ...resto
}: { efecto: string | null; pinzas?: string; modo?: "huecos" | "pinzas" | "borde" } & HTMLAttributes<HTMLDivElement>) {
  const clave = efecto ?? "basica";
  const color = clave === "modificador-puntuacion" ? (pinzas ? nombreColor(pinzas) : undefined) ?? "rojo" : undefined;
  const [banda, nombreBase] = BANDA[clave] ?? BANDA.basica;
  useIdioma();
  const idCarta = color ? `pinzas-${PINZAS_PLURAL[color]}` : (ID_CUERDA[clave] ?? "basica");
  const nombre = textoCarta(idCarta, "nombre", color ? `Pinzas ${PINZAS_PLURAL[color]}` : nombreBase);
  const colorBanda = clave === "modificador-puntuacion" && pinzas ? colorEstilo(pinzas) : banda;
  const textoEs = color
    ? (cuerdasJson.cartas.find((c) => (c.parametros as { color?: string } | undefined)?.color === color)?.texto ?? TEXTOS[clave])
    : TEXTOS[clave];
  const textoCuerda = textoCarta(idCarta, "texto", textoEs);
  const gruesa = clave === "resistente";
  const vieja = clave === "fragil";
  const W = CUERDA_W;
  const H = CUERDA_H;
  // En el modo «borde» la cuerda va abajo y las prendas asoman por debajo de la carta (la humedad queda tapada).
  const borde = modo === "borde";
  const yCuerda = borde ? Y_CUERDA_BORDE : CUERDA_Y;
  const cuerda = `M-2 ${yCuerda} Q${W / 2} ${yCuerda + 9} ${W + 2} ${yCuerda}`;
  const colorCuerda = vieja ? "#a48a63" : gruesa ? "#6b553a" : "#8a6c48";
  const bandaF = { style: { fill: colorBanda } };
  const estilo = { "--banda": colorBanda, "--pinza-color": pinzas ? colorEstilo(pinzas) : undefined, ...style } as CSSProperties;
  return (
    <div {...resto} className={`ccb ccb-${clave} ${className ?? ""}`} style={estilo} title={nombre}>
      <svg viewBox={`0 0 ${W} ${H}`} className="ilu marco-carta" preserveAspectRatio="none" aria-hidden>
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="8" fill={vieja ? "#eadcbd" : CREMA} />
        {/* Tinte suave del tipo de cuerda y papel con trama */}
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="8" {...bandaF} opacity=".12" />
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="8" fill="url(#trama-fina-tinta)" opacity=".35" />
        {/* Filete cosido del color de la cuerda */}
        <rect x="5.5" y="5.5" width={W - 11} height={H - 11} rx="5" fill="none" style={{ stroke: colorBanda }} strokeWidth="1.4" strokeDasharray="4 2.6" opacity=".75" />
        {vieja && (
          <g className="deco" opacity=".35">
            <circle cx="44" cy="70" r="14" fill="#a48a63" />
            <circle cx="140" cy="52" r="9" fill="#a48a63" />
            <circle cx="122" cy="92" r="6" fill="#a48a63" />
          </g>
        )}
        {gruesa && (
          <g className="deco" fill={COLOR.metal} stroke={TINTA} strokeWidth="1.2">
            {[
              [10, 10],
              [170, 10],
              [10, 118],
              [170, 118],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" />
            ))}
          </g>
        )}
        {clave === "tejadillo" && !borde && (
          <g className="deco">
            <path d={`M1.5 1.5 H${W - 1.5} V13 Q${W / 2} 19 1.5 13 Z`} {...bandaF} stroke={TINTA} strokeWidth="2" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M${3 + i * 14.5} 3 q7.25 9 14.5 0`} fill="none" stroke={TINTA} strokeWidth="1.3" opacity=".6" />
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
        {modo === "huecos" &&
          [0, 1, 2].map((i) => (
            <g key={i} className="hueco-carta">
              <rect x={i * 60 + 5} y={HUECO_Y} width="50" height={HUECO_ALTO} rx="6" fill="#ffffff55" stroke={TINTA} strokeOpacity=".3" strokeWidth="1.4" strokeDasharray="4 3" />
              <path d={`M${i * 60 + 30} ${HUECO_Y + 26} v18 M${i * 60 + 21} ${HUECO_Y + 35} h18`} stroke={TINTA} strokeOpacity=".12" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}

        {/* Modo «borde»: caja de texto cosida y un adorno entre la caja y la cuerda */}
        {borde && (
          <g>
            <rect x="12" y="33" width="156" height="47" rx="6" fill="#ffffff" opacity=".6" />
            <rect x="12" y="33" width="156" height="47" rx="6" fill="none" stroke={TINTA} strokeWidth="1.2" />
            <rect x="15.5" y="36.5" width="149" height="40" rx="4" fill="none" style={{ stroke: colorBanda }} strokeWidth="1.2" strokeDasharray="3 2.2" />
            {clave !== "tejadillo" && (
              <g className="deco">
                <path d="M54 91 H82 M98 91 H126" stroke={TINTA} strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
                <path d="M90 86 L95 91 L90 96 L85 91 Z" {...bandaF} stroke={TINTA} strokeWidth="1.3" />
                <circle cx="78" cy="91" r="1.3" fill={TINTA} opacity=".45" />
                <circle cx="102" cy="91" r="1.3" fill={TINTA} opacity=".45" />
              </g>
            )}
          </g>
        )}

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
            <rect x="1.5" y="12" width={W - 3} height="14" fill="url(#sombra-tejado)" />
            <path d={`M1.5 0 H${W - 1.5} V13 Q${W / 2} 19 1.5 13 Z`} {...bandaF} stroke={TINTA} strokeWidth="2" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M${3 + i * 14.5} 2 q7.25 9 14.5 0`} fill="none" stroke={TINTA} strokeWidth="1.3" opacity=".6" />
            ))}
            <path d={`M4 3 H${W - 4}`} stroke="#ffffff" strokeWidth="1.6" opacity=".4" strokeLinecap="round" />
          </g>
        )}
        {/* Pinzas impresas en el borde: muerden las prendas que asoman por debajo */}
        {borde &&
          [30, 90, 150].map((x) => (
            <g key={x} transform={`translate(0 ${yCuerda - 4})`}>
              <PinzaBosque x={x} color={clave === "modificador-puntuacion" && pinzas ? colorEstilo(pinzas) : undefined} />
            </g>
          ))}

        {/* Cabecera con medallón, icono y nombre: arriba en el modo «borde», abajo en los otros */}
        {borde ? (
          <g>
            <path d={`M1.5 28 H${W - 1.5} V9.5 Q${W - 1.5} 1.5 ${W - 9.5} 1.5 H9.5 Q1.5 1.5 1.5 9.5 Z`} {...bandaF} />
            <path d={festones(1.5, W - 1.5, 28, 30)} {...bandaF} stroke={TINTA} strokeWidth="1.4" strokeLinejoin="round" />
            <path d={`M1.5 28 H${W - 1.5} V9.5 Q${W - 1.5} 1.5 ${W - 9.5} 1.5 H9.5 Q1.5 1.5 1.5 9.5 Z`} fill="url(#trama-fina)" />
            <path d={`M1.5 10 V9.5 Q1.5 1.5 9.5 1.5 H${W - 9.5} Q${W - 1.5} 1.5 ${W - 1.5} 9.5 V10 Z`} fill="#ffffff" opacity=".25" />
            <circle cx="19" cy="16" r="12.5" fill={CREMA} stroke={TINTA} strokeWidth="2.2" />
            <circle cx="19" cy="16" r="10.2" fill="none" style={{ stroke: colorBanda }} strokeWidth="1.5" opacity=".85" />
            <g transform="translate(10.7 7.7) scale(.26)">{ICONOS_BOSQUE[clave]}</g>
            <text x="37" y="20.6" className="ccb-nombre" style={{ fontFamily: "var(--fuente-titulo)" }} fontWeight="800" fontSize="14.5" fill="#ffffff" stroke={TINTA} strokeWidth="3.2" strokeLinejoin="round" paintOrder="stroke" {...ajustarTexto(nombre, 14.5, W - 37 - 8)}>
              {nombre}
            </text>
          </g>
        ) : (
          <g>
            <path d={`M1.5 104 H${W - 1.5} V${H - 9.5} Q${W - 1.5} ${H - 1.5} ${W - 9.5} ${H - 1.5} H9.5 Q1.5 ${H - 1.5} 1.5 ${H - 9.5} Z`} {...bandaF} />
            <path d={`M1.5 104 H${W - 1.5} V${H - 9.5} Q${W - 1.5} ${H - 1.5} ${W - 9.5} ${H - 1.5} H9.5 Q1.5 ${H - 1.5} 1.5 ${H - 9.5} Z`} fill="url(#trama-fina)" />
            <path d={festones(1.5, W - 1.5, 104, 30, false)} {...bandaF} stroke={TINTA} strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="17" cy="115" r="11.5" fill={CREMA} stroke={TINTA} strokeWidth="2.2" />
            <g transform="translate(8.7 106.7) scale(.26)">{ICONOS_BOSQUE[clave]}</g>
            <text x="33" y="120" className="ccb-nombre" style={{ fontFamily: "var(--fuente-titulo)" }} fontWeight="800" fontSize="13.5" fill="#ffffff" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" paintOrder="stroke" {...ajustarTexto(nombre, 13.5, W - 33 - 8)}>
              {nombre}
            </text>
          </g>
        )}
        {/* Índice de esquina: se lee aunque la carta esté medio tapada en la mano */}
        {!borde && (
          <g className="indice">
            <path d="M1.5 30 V9.5 Q1.5 1.5 9.5 1.5 H30 Q30 30 1.5 30 Z" {...bandaF} stroke={TINTA} strokeWidth="2" />
            <path d="M1.5 30 V9.5 Q1.5 1.5 9.5 1.5 H30 Q30 30 1.5 30 Z" fill="url(#trama-fina)" />
            <g transform="translate(2 2) scale(.36)">{ICONOS_BOSQUE[clave]}</g>
          </g>
        )}
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="8" fill="none" stroke={TINTA} strokeWidth="3" />
      </svg>
      {borde && (
        <div className="ccb-texto" style={tamTexto(textoCuerda, 79 * 24.7, 6.6)}>
          {textoCuerda}
        </div>
      )}
    </div>
  );
}

/** Loseta de cartón al principio del tendedero: hace de poste y lleva la leyenda de las cuerdas. */
export function LosetaBosque({ lineas }: { lineas: number }) {
  useIdioma();
  return (
    <div className="loseta" style={{ "--lineas": lineas } as CSSProperties}>
      <div className="loseta-leyenda">
        <div className="loseta-titulo">{t("loseta.titulo")}</div>
        {LEYENDA.map((l) => (
          <div key={l.id} className="loseta-fila">
            <IconoBosque id={l.id} className="loseta-icono" />
            <div>
              <b>{tLibre(`leyenda.${l.id}.nombre`)}</b>
              <span>{tLibre(`leyenda.${l.id}.texto`)}</span>
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

// ---------- Carta de prenda (mini, 41 × 63 mm) ----------

function GotasPrenda({ humedad }: { humedad: number }) {
  return (
    <svg className="pb-gotas" viewBox={`0 0 ${Math.max(1, humedad) * 12} 16`} style={{ width: `${Math.max(1, humedad) * 0.95}em` }} aria-label={t("carta.humedad", { n: humedad })}>
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
          {p.humedad > 0 ? <GotasPrenda humedad={p.humedad} /> : <span className="pb-seca">{t("carta.seca")}</span>}
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

// ---------- Marco de las cartas verticales (acción y objetivo), 63 × 88 mm ----------
// El marco va en dos capas: «fondo» (marco, papel, ventana con rayos, cajas) por debajo del dibujo y «frente»
// (borde de la ventana, medallón con el emblema, cinta del nombre, pie) por encima. Así el dibujo pasa siempre por
// detrás de la plantilla y nunca tapa el emblema ni la cinta.

type Tono = "fastidio" | "tactica" | "objetivo";
type Capa = "fondo" | "frente";
const V = LIENZO.vertical;

/** Ventanas de la ilustración: cada mazo tiene su forma. */
const VENTANA: Record<Tono, string> = {
  // Fastidio: esquinas cortadas, como una etiqueta de aviso
  fastidio: "M8.5 17.6 H54.5 L57.5 20.6 V43.6 L54.5 46.6 H8.5 L5.5 43.6 V20.6 Z",
  // Táctica: arco de ventana
  tactica: "M5.5 46.6 V29 C5.5 22.5 17 17.6 31.5 17.6 C46 17.6 57.5 22.5 57.5 29 V46.6 Z",
  // Objetivos: medallón redondo
  objetivo: "M17.9 31.5 A13.6 13.6 0 1 1 45.1 31.5 A13.6 13.6 0 1 1 17.9 31.5 Z",
};

/** Rayos de sol (manga) dentro de la ventana, desde su centro. */
function rayos(cx: number, cy: number, n = 18, r = 60) {
  return Array.from({ length: n }, (_, i) => {
    const a0 = (i * 2 * Math.PI) / n;
    const a1 = a0 + Math.PI / n;
    return `M${cx} ${cy} L${(cx + Math.cos(a0) * r).toFixed(2)} ${(cy + Math.sin(a0) * r).toFixed(2)} L${(cx + Math.cos(a1) * r).toFixed(2)} ${(cy + Math.sin(a1) * r).toFixed(2)} Z`;
  }).join(" ");
}

/** Cinta del nombre: cola de golondrina (fastidio), pergamino enrollado (táctica) o banderola en punta (objetivos). */
function Cinta({ t }: { t: Tono }) {
  const cuerpo = <rect className="m-cinta" x="3.6" y="4" width="55.8" height="11.8" rx=".8" />;
  const brillo = (
    <>
      <rect x="3.6" y="4" width="55.8" height="11.8" rx=".8" fill="url(#trama-fina)" />
      <rect x="3.6" y="4" width="55.8" height="3.4" rx=".8" fill="#ffffff" opacity=".24" />
      <rect x="3.6" y="4" width="55.8" height="11.8" rx=".8" fill="none" stroke={TINTA} strokeWidth=".55" />
    </>
  );
  if (t === "fastidio")
    return (
      <g>
        <path className="m-cinta-fondo" d="M5 6.4 H0.9 L3.1 10.1 L0.9 13.8 H5 Z M58 6.4 H62.1 L59.9 10.1 L62.1 13.8 H58 Z" stroke={TINTA} strokeWidth=".5" strokeLinejoin="round" />
        {cuerpo}
        {brillo}
      </g>
    );
  if (t === "tactica")
    return (
      <g>
        <circle className="m-cinta-fondo" cx="4.4" cy="11.6" r="3.1" stroke={TINTA} strokeWidth=".5" />
        <circle className="m-cinta-fondo" cx="58.6" cy="11.6" r="3.1" stroke={TINTA} strokeWidth=".5" />
        {cuerpo}
        {brillo}
        <path d="M4.4 8.5 A3.1 3.1 0 1 0 7.2 13 M58.6 8.5 A3.1 3.1 0 1 1 55.8 13" fill="none" stroke={TINTA} strokeWidth=".45" />
        <circle cx="4.4" cy="11.6" r="1" fill="none" stroke={TINTA} strokeWidth=".4" />
        <circle cx="58.6" cy="11.6" r="1" fill="none" stroke={TINTA} strokeWidth=".4" />
      </g>
    );
  return (
    <g>
      <path className="m-cinta" d="M1.2 9.9 L4.4 4 H58.6 L61.8 9.9 L58.6 15.8 H4.4 Z" />
      <path d="M1.2 9.9 L4.4 4 H58.6 L61.8 9.9 L58.6 15.8 H4.4 Z" fill="url(#trama-fina)" />
      <path d="M2.9 6.8 L4.4 4 H58.6 L60.1 6.8 Z" fill="#ffffff" opacity=".24" />
      <path d="M1.2 9.9 L4.4 4 H58.6 L61.8 9.9 L58.6 15.8 H4.4 Z" fill="none" stroke={TINTA} strokeWidth=".55" strokeLinejoin="round" />
    </g>
  );
}

/** Laurel alrededor del medallón de los objetivos. */
function Laurel() {
  // Hojas tangentes a un círculo alrededor de la ventana, de abajo a arriba por cada lado.
  const angulos = Array.from({ length: 7 }, (_, i) => 100 + i * 20);
  const hoja = (a: number) => {
    const r = (a * Math.PI) / 180;
    const x = (31.5 + Math.cos(r) * 16.2).toFixed(2);
    const y = (31.5 + Math.sin(r) * 16.2).toFixed(2);
    return <ellipse key={a} className="m-hoja" cx={x} cy={y} rx="1.2" ry="2.5" transform={`rotate(${a} ${x} ${y})`} stroke={TINTA} strokeWidth=".35" />;
  };
  return (
    <g>
      {angulos.map((a) => hoja(a))}
      {angulos.map((a) => hoja(180 - a))}
    </g>
  );
}

/** Medallón con un emblema (24 × 24) en el centro. */
function Medallon({ x, y, r, emblema }: { x: number; y: number; r: number; emblema: string }) {
  return (
    <g>
      <circle className="m-medallon" cx={x} cy={y} r={r} stroke={TINTA} strokeWidth=".55" />
      <circle className="m-medallon-aro" cx={x} cy={y} r={r - 0.9} fill="none" strokeWidth=".45" />
      <g transform={`translate(${x - r * 0.68} ${y - r * 0.68}) scale(${(r * 1.36) / 24})`}>{EMBLEMAS[emblema]}</g>
    </g>
  );
}

/** Rombos del pie, a los lados del nombre del mazo. */
function RombosPie({ xs, y }: { xs: number[]; y: number }) {
  return (
    <>
      {xs.map((x) => (
        <path key={x} d={`M${x} ${y - 1.5} L${x + 1.5} ${y} L${x} ${y + 1.5} L${x - 1.5} ${y} Z`} fill={CREMA} stroke={TINTA} strokeWidth=".35" />
      ))}
    </>
  );
}

/** Marco dibujado de una carta vertical, en su capa de fondo o de frente. */
function MarcoVertical({ t, emblema, capa }: { t: Tono; emblema: string; capa: Capa }) {
  const id = useId().replace(/:/g, "");
  const ventana = VENTANA[t];
  const objetivo = t === "objetivo";
  const centro: [number, number] = objetivo ? [31.5, 31.5] : [31.5, 33];
  const trama = t === "fastidio" ? "trama-rayas" : t === "tactica" ? "trama-cuadros" : "trama-fina";
  if (capa === "frente")
    return (
      <svg className="marco-carta cb-marco cb-marco-frente" viewBox={`0 0 ${V.ancho} ${V.alto}`} preserveAspectRatio="none" aria-hidden>
        <path d={ventana} fill="none" stroke={TINTA} strokeWidth=".6" strokeLinejoin="round" />
        {objetivo ? <Medallon x={31.5} y={45.6} r={4.3} emblema={emblema} /> : <Medallon x={31.5} y={46.6} r={4.7} emblema={emblema} />}
        <Cinta t={t} />
        <RombosPie xs={[9, 54]} y={84.7} />
      </svg>
    );
  return (
    <svg className="marco-carta cb-marco" viewBox={`0 0 ${V.ancho} ${V.alto}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <clipPath id={`ventana-${id}`}>
          <path d={ventana} />
        </clipPath>
      </defs>
      {/* Marco de color con su trama */}
      <rect className="m-marco" width={V.ancho} height={V.alto} rx="3.4" />
      <rect width={V.ancho} height={V.alto} rx="3.4" fill={`url(#${trama})`} />
      <rect width={V.ancho} height={V.alto} rx="3.4" fill="url(#trama-fina)" opacity=".7" />
      <rect className="m-filete" x="1.15" y="1.15" width={V.ancho - 2.3} height={V.alto - 2.3} rx="2.6" fill="none" />
      {/* Panel de papel */}
      <rect className="m-panel" x="2.8" y="2.8" width="57.4" height="78.6" rx="2.2" />
      <rect x="2.8" y="2.8" width="57.4" height="78.6" rx="2.2" fill="url(#trama-fina-tinta)" opacity=".28" />
      <rect x="2.8" y="2.8" width="57.4" height="78.6" rx="2.2" fill="none" stroke={TINTA} strokeWidth=".55" />
      {objetivo && <Laurel />}
      {/* Ventana de la ilustración, con rayos de sol y un ribete claro por dentro */}
      <path className="m-ventana" d={ventana} />
      <g clipPath={`url(#ventana-${id})`}>
        <path className="m-rayos" d={rayos(centro[0], centro[1])} />
        <rect width={V.ancho} height={V.alto} fill="url(#trama-fina)" />
        <path d={ventana} fill="none" stroke="#ffffff" strokeWidth="2.2" opacity=".65" />
      </g>
      {/* Caja de texto cosida (y placa de puntos en los objetivos) */}
      {objetivo ? (
        <>
          <rect className="m-placa" x="6" y="48.4" width="51" height="10.2" rx="5.1" stroke={TINTA} strokeWidth=".5" />
          <rect className="m-caja" x="5.5" y="60.6" width="52" height="19" rx="1.8" stroke={TINTA} strokeWidth=".45" />
          <rect className="m-pespunte" x="6.6" y="61.7" width="49.8" height="16.8" rx="1.2" fill="none" strokeWidth=".35" strokeDasharray="1 .8" />
        </>
      ) : (
        <>
          <rect className="m-caja" x="5.5" y="51" width="52" height="28.6" rx="1.8" stroke={TINTA} strokeWidth=".45" />
          <rect className="m-pespunte" x="6.6" y="52.1" width="49.8" height="26.4" rx="1.2" fill="none" strokeWidth=".35" strokeDasharray="1 .8" />
        </>
      )}
    </svg>
  );
}

// ---------- Carta de acción (63 × 88 mm) ----------

/** Carta de acción: cinta con el nombre, ilustración en su ventana, emblema del grupo, texto y tipo. */
export function CaraAccionBosque({ id }: { id: string }) {
  useIdioma();
  const def = ACCIONES[id];
  const grupo = def.grupo === "fastidio" ? "fastidio" : "tactica";
  const nombre = textoCarta(id, "nombre", def.nombre);
  const texto = textoCarta(id, "texto", def.texto);
  return (
    <div className={`cb cb-${grupo}`} data-accion={id}>
      <MarcoVertical t={grupo} emblema={grupo} capa="fondo" />
      <div className="cb-ilustra">
        <IconoBosque id={def.efecto} className="cb-icono" />
      </div>
      <MarcoVertical t={grupo} emblema={grupo} capa="frente" />
      <div className="cb-nombre" data-largo={largo(nombre, 14, 22)}>
        <span>{nombre}</span>
      </div>
      <div className="cb-texto" style={tamTexto(texto, 79 * 43.6, 7.4)}>
        <span>{texto}</span>
      </div>
      <div className="cb-tipo">{grupo === "fastidio" ? t("carta.fastidio") : t("carta.tactica")}</div>
    </div>
  );
}

// ---------- Carta de objetivo (63 × 88 mm) ----------

type Objetivo = { id: string; nombre: string; texto: string; cada: number; puntos: number; parametros?: { tipo?: string; color?: string } };
const OBJETIVOS: Record<string, Objetivo> = Object.fromEntries((objetivosJson.objetivos as Objetivo[]).map((o) => [o.id, o]));

/**
 * Carta de objetivo (data/objetivos.json): nombre, dibujo, «cada X → Y puntos» y texto. Todos los objetivos son
 * del mismo mazo y tienen el mismo aspecto: al empezar se roban 2 como comunes y 2 para cada jugador como secretos.
 * `secreto` solo queda marcado en el HTML (data-secreto) por si la mesa quiere señalarlo; no cambia el dibujo.
 */
export function CartaObjetivoBosque({ id, secreto = false, className, ...resto }: { id: string; secreto?: boolean } & HTMLAttributes<HTMLDivElement>) {
  useIdioma();
  const o = OBJETIVOS[id];
  if (!o) return null;
  const nombre = textoObjetivo(id, "nombre", o.nombre);
  const texto = textoObjetivo(id, "texto", o.texto);
  return (
    <div {...resto} className={`cb co ${className ?? ""}`} data-objetivo={id} data-secreto={secreto || undefined}>
      <MarcoVertical t="objetivo" emblema="objetivo" capa="fondo" />
      <div className="co-ilustra">
        <IlustraObjetivo id={o.id} tipo={o.parametros?.tipo} color={o.parametros?.color} className="co-arte" />
      </div>
      <MarcoVertical t="objetivo" emblema="objetivo" capa="frente" />
      <div className="cb-nombre" data-largo={largo(nombre, 14, 22)}>
        <span>{nombre}</span>
      </div>
      <div className="co-puntos" aria-label={t("carta.cadaAria", { cada: o.cada, puntos: o.puntos })}>
        <span className="co-cada">
          {t("carta.cada")} <b>{o.cada}</b>
        </span>
        <span className="co-flecha" aria-hidden>
          ➜
        </span>
        <span className="co-moneda">{o.puntos}</span>
        <span className="co-pts">{t("carta.puntos", { n: o.puntos })}</span>
      </div>
      <div className="cb-texto co-texto" style={tamTexto(texto, 79 * 28.2, 7)}>
        <span>{texto}</span>
      </div>
      <div className="cb-tipo">{t("carta.objetivo")}</div>
    </div>
  );
}

// ---------- Carta del día (88 × 63 mm, apaisada) ----------
// Iconográfica, como las de acción: marco de color con trama (azul tiempo, morado suceso), cinta en punta con el
// nombre, ventana cuadrada a la izquierda con un icono grande sobre rayos de sol, medallón del grupo bajo la ventana,
// caja de texto cosida a la derecha con el sello de los días que dura en su esquina, y el pie.

type Dia = { id: string; nombre: string; grupo: string; efecto: string; texto: string; parametros?: { dias?: number } };
const DIAS: Record<string, Dia> = Object.fromEntries((diaJson.cartas as Dia[]).map((d) => [d.id, d]));
const D = LIENZO.dia;
/** Ventana del icono y caja de texto de la carta del día, en mm. */
const VENTANA_DIA = { x: 5, y: 15.2, ancho: 31, alto: 36 };
const CAJA_DIA = { x: 39, y: 15.2, ancho: 44, alto: 36 };

function MarcoDia({ suceso, capa }: { suceso: boolean; capa: Capa }) {
  const id = useId().replace(/:/g, "");
  const v = VENTANA_DIA;
  const c = CAJA_DIA;
  const centroX = v.x + v.ancho / 2;
  if (capa === "frente")
    return (
      <svg className="marco-carta dia-marco dia-marco-frente" viewBox={`0 0 ${D.ancho} ${D.alto}`} preserveAspectRatio="none" aria-hidden>
        <rect x={v.x} y={v.y} width={v.ancho} height={v.alto} rx="2" fill="none" stroke={TINTA} strokeWidth=".6" />
        <Medallon x={centroX} y={v.y + v.alto} r={4.2} emblema={suceso ? "suceso" : "tiempo"} />
        {/* Sello de la duración: el número va encima, en HTML */}
        <circle className="m-medallon" cx={c.x + c.ancho - 4.4} cy={c.y + c.alto} r="4.6" stroke={TINTA} strokeWidth=".55" />
        <circle className="m-medallon-aro" cx={c.x + c.ancho - 4.4} cy={c.y + c.alto} r="3.7" fill="none" strokeWidth=".45" strokeDasharray=".9 .6" />
        <path className="m-cinta" d="M1.2 8.2 L4.2 3.6 H83.8 L86.8 8.2 L83.8 12.8 H4.2 Z" />
        <path d="M1.2 8.2 L4.2 3.6 H83.8 L86.8 8.2 L83.8 12.8 H4.2 Z" fill="url(#trama-fina)" />
        <path d="M2.8 5.8 L4.2 3.6 H83.8 L85.2 5.8 Z" fill="#ffffff" opacity=".24" />
        <path d="M1.2 8.2 L4.2 3.6 H83.8 L86.8 8.2 L83.8 12.8 H4.2 Z" fill="none" stroke={TINTA} strokeWidth=".55" strokeLinejoin="round" />
        <RombosPie xs={[12, 76]} y={60.1} />
      </svg>
    );
  return (
    <svg className="marco-carta dia-marco" viewBox={`0 0 ${D.ancho} ${D.alto}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <clipPath id={`ventana-dia-${id}`}>
          <rect x={v.x} y={v.y} width={v.ancho} height={v.alto} rx="2" />
        </clipPath>
      </defs>
      <rect className="m-marco" width={D.ancho} height={D.alto} rx="3.4" />
      <rect width={D.ancho} height={D.alto} rx="3.4" fill={`url(#${suceso ? "trama-rayas" : "trama-cuadros"})`} />
      <rect width={D.ancho} height={D.alto} rx="3.4" fill="url(#trama-fina)" opacity=".7" />
      <rect className="m-filete" x="1.15" y="1.15" width={D.ancho - 2.3} height={D.alto - 2.3} rx="2.6" fill="none" />
      <rect className="m-panel" x="2.6" y="2.6" width="82.8" height="54.6" rx="2.2" />
      <rect x="2.6" y="2.6" width="82.8" height="54.6" rx="2.2" fill="url(#trama-fina-tinta)" opacity=".28" />
      <rect x="2.6" y="2.6" width="82.8" height="54.6" rx="2.2" fill="none" stroke={TINTA} strokeWidth=".55" />
      {/* Ventana del icono, con rayos de sol y un ribete claro por dentro */}
      <rect className="m-ventana" x={v.x} y={v.y} width={v.ancho} height={v.alto} rx="2" />
      <g clipPath={`url(#ventana-dia-${id})`}>
        <path className="m-rayos" d={rayos(centroX, v.y + v.alto * 0.45, 18, 40)} />
        <rect width={D.ancho} height={D.alto} fill="url(#trama-fina)" />
        <rect x={v.x} y={v.y} width={v.ancho} height={v.alto} rx="2" fill="none" stroke="#ffffff" strokeWidth="2.2" opacity=".65" />
      </g>
      {/* Caja de texto cosida */}
      <rect className="m-caja" x={c.x} y={c.y} width={c.ancho} height={c.alto} rx="1.8" stroke={TINTA} strokeWidth=".45" />
      <rect className="m-pespunte" x={c.x + 1.1} y={c.y + 1.1} width={c.ancho - 2.2} height={c.alto - 2.2} rx="1.2" fill="none" strokeWidth=".35" strokeDasharray="1 .8" />
    </svg>
  );
}

/**
 * Carta del día: tiempo (azul) o suceso (morado). Con `id` (data/dia.json) dibuja su nombre, su icono, cuántos días
 * dura y su texto; sin `id`, es «Soleado».
 */
export function CartaDiaBosque({ id, className, ...resto }: { id?: string } & HTMLAttributes<HTMLDivElement> = {}) {
  useIdioma();
  const d = DIAS[id ?? "soleado"] ?? DIAS.soleado;
  const suceso = d.grupo === "sucesos";
  const dias = d.parametros?.dias ?? 1;
  const nombre = textoCarta(d.id, "nombre", d.nombre);
  // El texto en español empieza por «1 día:» o «2 días:»: la duración ya va en el sello. Las traducciones vienen sin ella.
  const sinDuracion = d.texto.replace(/^\d+ días?:\s*/, "");
  const texto = cartaTraducida(d.id, "texto") ? textoCarta(d.id, "texto", "") : sinDuracion.charAt(0).toUpperCase() + sinDuracion.slice(1);
  return (
    <div {...resto} className={`dia-bosque dia-carta ${suceso ? "dia-suceso" : "dia-tiempo"} ${className ?? ""}`} data-dia={d.id}>
      <MarcoDia suceso={suceso} capa="fondo" />
      <div className="dia-icono">
        <IconoDia id={d.id} efecto={d.efecto} className="dia-icono-arte" />
      </div>
      <MarcoDia suceso={suceso} capa="frente" />
      <div className="dia-bosque-nombre" data-largo={largo(nombre, 14, 19)}>
        <span>{nombre}</span>
      </div>
      <div className="dia-dias" aria-label={`${dias} ${t("carta.dias", { n: dias })}`}>
        <b>{dias}</b>
        <span>{t("carta.dias", { n: dias })}</span>
      </div>
      <div className="dia-bosque-texto" style={tamTexto(texto, 46.6 * 35, 6.2, 3.6)}>
        <span>{texto}</span>
      </div>
      <div className="dia-pie">{suceso ? t("carta.suceso") : t("carta.tiempo")}</div>
    </div>
  );
}

// ---------- Dorsos ----------

type ClaseDorso = "acciones" | "cuerdas" | "dias" | "objetivos" | "prendas";
/** Cada mazo: su tamaño (medidas.ts), su nombre, los emblemas del pie y la trama del fondo. */
const DORSO: Record<ClaseDorso, { medida: "accion" | "cuerda" | "prenda"; nombre: string; emblemas: string[]; trama: string }> = {
  acciones: { medida: "accion", nombre: "Acciones", emblemas: ["fastidio", "tactica"], trama: "trama-cuadros" },
  cuerdas: { medida: "cuerda", nombre: "Cuerdas", emblemas: ["cuerdas", "cuerdas"], trama: "trama-rayas" },
  dias: { medida: "cuerda", nombre: "Días", emblemas: ["tiempo", "suceso"], trama: "trama-cuadros" },
  objetivos: { medida: "accion", nombre: "Objetivos", emblemas: ["objetivo", "objetivo"], trama: "trama-cuadros" },
  // Prendas: carta mini (41 × 63 mm), el mazo del que se reparten las prendas
  prendas: { medida: "prenda", nombre: "Prendas", emblemas: ["calcetin", "camiseta", "toalla"], trama: "trama-puntos" },
};

/** Lo que va en el centro del dorso de cada mazo (cabe en un círculo de radio 11). */
function CentroDorso({ clase }: { clase: ClaseDorso }) {
  if (clase === "cuerdas") return <g transform="translate(-11.5 -11.5) scale(.36)">{ICONOS_BOSQUE.basica}</g>;
  if (clase === "dias") return <g transform="translate(-12 -12) scale(.375)">{ICONOS_BOSQUE.soleado}</g>;
  // Prendas: una camiseta con un calcetín delante
  if (clase === "prendas")
    return (
      <g>
        <MiniPrenda tipo="camiseta" c={COLOR.azul} x={-10.2} y={-8} s={0.17} />
        <MiniPrenda tipo="calcetin" c={COLOR.rojo} x={0.5} y={-4.5} s={0.17} giro={12} />
      </g>
    );
  if (clase === "objetivos")
    return (
      <g transform="translate(-11 -11) scale(.92)">
        <path
          d="M12 1.8 L14.9 8.3 L22 9 L16.6 13.7 L18.2 20.7 L12 17 L5.8 20.7 L7.4 13.7 L2 9 L9.1 8.3 Z"
          style={{ fill: COLOR.amarillo }}
          stroke={TINTA}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="9.6" cy="9.4" r="1.4" fill="#ffffff" opacity=".8" />
      </g>
    );
  // Acciones: una camiseta tendida entre dos pinzas
  return (
    <g>
      <Soga d="M-10.5 -5 Q0 -2 10.5 -5" g={1.3} />
      <g transform="translate(-9 -4.6) scale(.15)">
        <path d="M44 7 L22 15 L5 33 L19 45 L30 36 V73 H90 V36 L101 45 L115 33 L98 15 L76 7 C73 15 67 19 60 19 C53 19 47 15 44 7 Z" style={{ fill: COLOR.rojo }} stroke={TINTA} strokeWidth="5.5" strokeLinejoin="round" />
        <path d="M44 7 C47 15 53 19 60 19 C67 19 73 15 76 7" fill="none" stroke={TINTA} strokeWidth="5.5" />
      </g>
      <g transform="translate(0 -5.6) scale(.3)">
        <PinzaBosque x={-17} />
        <PinzaBosque x={17} />
      </g>
    </g>
  );
}

export function DorsoBosque({ clase = "acciones" }: { clase?: ClaseDorso }) {
  useIdioma();
  const d = DORSO[clase];
  const titulo = tLibre(`dorso.${clase}`);
  const horizontal = d.medida === "cuerda";
  const mini = d.medida === "prenda";
  const W = MM[d.medida].ancho;
  const H = MM[d.medida].alto;
  const cx = W / 2;
  const cy = horizontal ? H / 2 - 4 : mini ? H / 2 - 5 : H / 2 - 6;
  // En la carta mini el medallón y la cinta son más pequeños para que quepan
  const k = mini ? 0.78 : 1;
  const esquinas: [number, number, number][] = [
    [7.4, 7.4, 135],
    [W - 7.4, 7.4, -135],
    [7.4, H - 7.4, 45],
    [W - 7.4, H - 7.4, -45],
  ];
  return (
    <div className={`db db-${clase}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ilu marco-carta" aria-hidden>
        <rect className="d-fondo" width={W} height={H} rx="3.4" />
        <rect width={W} height={H} rx="3.4" fill={`url(#${d.trama})`} />
        <rect width={W} height={H} rx="3.4" fill="url(#trama-fina)" opacity=".6" />
        {/* Rayos desde el centro, muy suaves */}
        <path d={rayos(cx, cy, 24, 90)} fill="#ffffff" opacity=".07" />
        {/* Doble filete y esquinas con pinzas */}
        <rect x="2.6" y="2.6" width={W - 5.2} height={H - 5.2} rx="2.4" fill="none" stroke={CREMA} strokeWidth=".9" />
        <rect x="4.4" y="4.4" width={W - 8.8} height={H - 8.8} rx="1.6" fill="none" stroke={CREMA} strokeWidth=".4" strokeDasharray="1.4 1" opacity=".8" />
        {esquinas.map(([x, y, g]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${g}) scale(.3) translate(0 -8)`}>
            <PinzaBosque x={0} />
          </g>
        ))}
        {/* En el de cuerdas, la cuerda cruza de lado a lado, como en la cara */}
        {clase === "cuerdas" && <Soga d={`M-1 ${cy} Q${cx} ${cy + 6} ${W + 1} ${cy}`} g={2.2} />}
        {/* Medallón central */}
        <g transform={`translate(${cx} ${cy}) scale(${k})`}>
          <circle r="15.5" fill={TINTA} opacity=".3" transform="translate(.8 1.2)" />
          <circle className="d-medallon" r="15.5" stroke={TINTA} strokeWidth=".7" />
          <circle r="13.6" fill="none" className="d-aro" strokeWidth=".9" />
          <circle r="12.4" fill="none" stroke={TINTA} strokeWidth=".3" strokeDasharray="1 .8" opacity=".5" />
          <CentroDorso clase={clase} />
        </g>
        {/* Cinta con el nombre del mazo y sus emblemas debajo */}
        <g transform={`translate(${cx} ${cy + 17.5 * k}) scale(${k})`}>
          <path className="d-cinta" d="M-21 -4.4 H21 L18.6 0 L21 4.4 H-21 L-18.6 0 Z" stroke={TINTA} strokeWidth=".55" strokeLinejoin="round" />
          <path d="M-21 -4.4 H21 L20 -2.6 H-20 Z" fill="#ffffff" opacity=".25" />
          <text y="2.3" textAnchor="middle" className="d-titulo" fontSize="6.2" fontWeight="800" fill="#ffffff" stroke={TINTA} strokeWidth="1.3" strokeLinejoin="round" paintOrder="stroke" style={{ fontFamily: "var(--fuente-titulo)" }} {...ajustarTexto(titulo, 6.2, 36)}>
            {titulo}
          </text>
        </g>
        <g transform={`translate(${cx} ${horizontal ? H - 7.4 : mini ? H - 8.4 : H - 9})`}>
          {d.emblemas.map((e, i) => {
            // Emblemas de 5,8 mm separados por rombos, centrados en el pie
            const x = (i - (d.emblemas.length - 1) / 2) * 8.6;
            return (
              <g key={i}>
                {i > 0 && <path d={`M${x - 4.3} -1.4 L${x - 2.9} 0 L${x - 4.3} 1.4 L${x - 5.7} 0 Z`} fill={CREMA} stroke={TINTA} strokeWidth=".3" />}
                <g transform={`translate(${x - 2.9} -2.9) scale(.24)`}>{EMBLEMAS[e]}</g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** Lista de todas las cartas, para galerías y pruebas. */
export const CATALOGO_CARTAS = {
  acciones: Object.keys(ACCIONES),
  cuerdas: ["basica", "tejadillo", "resistente", "secado-rapido", "modificador-puntuacion", "fragil"],
  dias: Object.keys(DIAS),
  objetivos: Object.keys(OBJETIVOS),
};

/** Contenedor con el tamaño real de una carta, en milímetros convertidos a píxeles (para la galería). */
export function TamanoReal({ clase, mm = 2, children }: { clase: keyof typeof MM; mm?: number; children: ReactNode }) {
  return <div style={{ position: "relative", width: MM[clase].ancho * mm, height: MM[clase].alto * mm }}>{children}</div>;
}
