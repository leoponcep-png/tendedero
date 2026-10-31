import { HUMEDAD_MAXIMA_POR_DEFECTO } from "@tendedero/motor";
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { tono } from "../arte/color";
import { colorEstilo, COLOR, CREMA, GotaBosque, ICONOS_BOSQUE, IconoBosque, nombreColor, PinzaBosque, PrendaBosque, TINTA } from "./ArteBosque";
import { EMBLEMAS, IconoDia, IlustraObjetivo } from "./IconosJuego";
import { DibujoPrenda, GotaCozy, imagenPrenda, TINTA_CARTA } from "./ArtePrendas";
import { COLORES_CUERDA, EmblemaAcciones, EmblemaCuerdas, EmblemaDias, EmblemaObjetivos, IconoCuerdaCozy, PinzaCozy, SogaCozy, TejadoCozy } from "./ArteCuerdas";
import "./carta-prenda.css";
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
 * Título de una sola línea en SVG (nombre de la carta de cuerda): siempre con la misma letra y la misma anchura de
 * letra; si a `tam` no cabe en `hueco` unidades, se baja el tamaño (nunca se estrecha). El tamaño se calcula a ojo
 * y luego se mide de verdad con la fuente ya cargada. Los nombres traducidos (alemán, ruso…) pueden ser largos.
 */
function TituloSvg({ texto, tam, hueco, ...props }: { texto: string; tam: number; hueco: number } & Omit<SVGProps<SVGTextElement>, "fontSize">) {
  const ref = useRef<SVGTextElement>(null);
  const [tamano, setTamano] = useState(() => Math.min(tam, hueco / (ancho(texto) * 0.6)));
  useLayoutEffect(() => {
    const el = ref.current;
    let vivo = true;
    const medir = () => {
      if (!vivo || !el?.isConnected || typeof el.getComputedTextLength !== "function") return;
      const antes = el.getAttribute("font-size");
      el.setAttribute("font-size", String(tam));
      const largo = el.getComputedTextLength();
      if (!(largo > 0)) {
        // Sin medir (carta oculta): se queda el tamaño a ojo
        if (antes) el.setAttribute("font-size", antes);
        return;
      }
      const nuevo = Number((largo > hueco ? (tam * hueco) / largo : tam).toFixed(2));
      el.setAttribute("font-size", String(nuevo));
      setTamano(nuevo);
    };
    medir();
    const fuentes = typeof document !== "undefined" ? document.fonts : undefined;
    fuentes?.ready.then(medir);
    fuentes?.addEventListener?.("loadingdone", medir);
    return () => {
      vivo = false;
      fuentes?.removeEventListener?.("loadingdone", medir);
    };
  }, [texto, tam, hueco]);
  return (
    <text ref={ref} {...props} fontSize={tamano}>
      {texto}
    </text>
  );
}

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
  const idUnico = useId();
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
  if (borde) {
    // Carta de la partida (mano, mesa, lupa, galería): estilo «cozy» del de la carta de prenda
    const colores = COLORES_CUERDA[color ?? clave] ?? COLORES_CUERDA.basica;
    const uid = `cc${idUnico.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    // Piezas pintadas (src/arte/cuerdas): medallón entero, cuerda y pinzas. Si falta alguna, se dibuja en SVG.
    const pieza = (nombre: string) => PNG_CUERDAS[`../arte/cuerdas/${nombre}.png`];
    const medallonPng = pieza(`icono-${idCarta}`);
    const sogaPng = pieza(gruesa ? "cuerda-gris" : "cuerda-esparto");
    const pinzaPng = pieza(`pinza-${color ? { blanco: "blanca", azul: "azul", rojo: "roja", amarillo: "amarilla" }[color] : gruesa ? "gris" : "madera"}`);
    // La cuerda pintada va recta, a la altura del borde de siempre: así empalma con la carta de al lado
    const ySoga = yCuerda + 1.5;
    // Escala de las cuerdas pintadas: la soga mide 22 px de grueso en el PNG y aquí unos 6 de los 180 de ancho
    const k = 0.273;
    return (
      <div {...resto} className={`ccb ccb-${clave} ccb-cozy ccb-borde ${className ?? ""}`} style={{ ...estilo, "--fondo-cuerda": colores.fondo, "--oscuro-cuerda": colores.oscuro } as CSSProperties} title={nombre}>
        <svg viewBox={`0 0 ${W} ${H}`} className="ilu marco-carta" preserveAspectRatio="none" aria-hidden>
          {/* Marco del color de la cuerda (la acuarela y el grano van por CSS encima) */}
          <rect x="1" y="1" width={W - 2} height={H - 2} rx="9" fill={colores.fondo} />
          <rect x="1" y="1" width={W - 2} height={H - 2} rx="9" fill="#fff" opacity=".12" />
          <defs>
            <pattern id={`${uid}-lunares`} width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="1.75" cy="1.75" r="1" fill="#fff" opacity=".28" />
              <circle cx="5.25" cy="5.25" r="1" fill="#fff" opacity=".28" />
            </pattern>
            <linearGradient id={`${uid}-pergamino`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbf3df" />
              <stop offset=".6" stopColor="#f3e3c2" />
              <stop offset="1" stopColor="#e2c99a" />
            </linearGradient>
            <linearGradient id={`${uid}-pergamino-x`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#b08850" stopOpacity=".25" />
              <stop offset=".12" stopColor="#b08850" stopOpacity="0" />
              <stop offset=".88" stopColor="#b08850" stopOpacity="0" />
              <stop offset="1" stopColor="#b08850" stopOpacity=".3" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width={W - 2} height={H - 2} rx="9" fill={`url(#${uid}-lunares)`} />
          {/* Recuadro del texto: crema, con filete discontinuo del color de la carta */}
          <rect x="12" y="33.5" width="156" height="46" rx="7" fill="#fbf4e3" />
          <rect x="12" y="33.5" width="156" height="46" rx="7" fill="none" stroke={T_CARTA} strokeOpacity=".22" strokeWidth=".9" />
          <rect x="15.5" y="37" width="149" height="39" rx="4.6" fill="none" stroke={colores.oscuro} strokeWidth="1.3" strokeDasharray="3.6 2.4" strokeLinecap="round" />
          {/* La cuerda de esparto, de borde a borde, a la misma altura en todas */}
          {/* Recortada al interior redondeado de la carta (dentro del borde de tinta): no asoma nada por fuera y,
              con la carta de al lado pegada, sigue a la misma altura al otro lado del borde */}
          <clipPath id={`${uid}-corte`}>
            <rect x="1.9" y="1.9" width={W - 3.8} height={H - 3.8} rx="8.1" />
          </clipPath>
          <g clipPath={`url(#${uid}-corte)`}>
            {sogaPng ? (
              <g className="soga">
                {/* Dos tramos que se juntan debajo de la 3.ª pinza (ahí no se ven sus puntas redondas); recortados en el borde */}
                <g style={vieja ? { filter: "saturate(.6) brightness(.97) sepia(.12)" } : undefined}>
                  <image href={sogaPng} x="-8" y={ySoga - 17 * k} width={590 * k} height={36 * k} preserveAspectRatio="none" />
                  <image href={sogaPng} x="146" y={ySoga - 17 * k} width={590 * k} height={36 * k} preserveAspectRatio="none" />
                </g>
                {vieja && (
                  // Hebras sueltas finas de la cuerda gastada (el nudo ya lo enseña el medallón)
                  <g fill="none" strokeLinecap="round">
                    {[11, 24, 47, 61, 78, 103, 117, 129, 142, 163, 172].map((x, i) => {
                      const d = i % 2 ? `M${x} ${ySoga + 1.4} q.9 2 2.6 2.7` : `M${x} ${ySoga - 1.6} q1.3 -1.7 3 -2`;
                      return (
                        <g key={x}>
                          <path d={d} stroke="#6e5232" strokeWidth=".75" />
                          <path d={d} stroke="#d9c39a" strokeWidth=".35" />
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            ) : (
              <SogaCozy a={[-2, yCuerda]} c={[W / 2, yCuerda + 9]} b={[W + 2, yCuerda]} gruesa={gruesa} vieja={vieja} />
            )}
          </g>
          {clave === "tejadillo" && <TejadoCozy x0={1.9} x1={W - 1.9} y={94.2} id={`${uid}-tejado`} />}
          {/* Pinzas impresas en el borde: muerden la cuerda y las prendas que asoman por debajo. La pinza pintada
              (100 × 218 px) va derecha, con la cuerda pasando por la boca (la V de arriba, a 40 px de su borde de
              arriba): la soga se ve entre las dos patas y las puntas asoman por encima. Abajo la corta el borde de la
              carta, como si siguiera mordiendo la prenda. Sombra suave sobre la cuerda y el fondo. */}
          {pinzaPng && (
            <filter id={`${uid}-sombra-pinza`} x="-60%" y="-30%" width="220%" height="160%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation=".75" />
              <feOffset dx="1" dy="1.4" />
              <feComponentTransfer>
                <feFuncA type="linear" slope=".5" />
              </feComponentTransfer>
              <feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .06  0 0 0 1 0" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
          {[30, 90, 150].map((x) => {
            // Ancho de la pinza en la carta; el eje de la pinza está en el píxel 45,5 del PNG (no en el centro)
            const ancho = 15;
            const alto = (ancho * 218) / 100;
            return (
              <g key={x} clipPath={`url(#${uid}-corte)`}>
                {pinzaPng ? (
                  <image href={pinzaPng} x={x - (45.5 / 100) * ancho} y={ySoga - (40 / 218) * alto} width={ancho} height={alto} preserveAspectRatio="xMidYMid meet" filter={`url(#${uid}-sombra-pinza)`} />
                ) : (
                  <g transform={`translate(0 ${yCuerda - 4})`}>
                    <PinzaCozy x={x} color={color} />
                  </g>
                )}
              </g>
            );
          })}
          {/* Cabecera: cinta de pergamino ondulada con el nombre y medallón redondo con el icono */}
          <g className="ccb-cinta">
            <path d="M163 22 C170 22.6 173 27.6 170.6 31.4 C168.4 28.6 165.4 28 162 28.4 Z" fill="#cdb58a" stroke={T_CARTA} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M31 8.6 C62 5.6 110 7.6 150 5.8 C156 5.6 161 6.2 164.6 9.4 C168 12.4 166 16 163.4 17.6 C166.6 20 166.6 25.4 162 27.6 C120 29.8 70 27.6 31 30.2 Z" fill={T_CARTA} transform="translate(.8 1.2)" />
            <path d="M31 8.6 C62 5.6 110 7.6 150 5.8 C156 5.6 161 6.2 164.6 9.4 C168 12.4 166 16 163.4 17.6 C166.6 20 166.6 25.4 162 27.6 C120 29.8 70 27.6 31 30.2 Z" fill={`url(#${uid}-pergamino)`} stroke={T_CARTA} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M31 8.6 C62 5.6 110 7.6 150 5.8 C156 5.6 161 6.2 164.6 9.4 C168 12.4 166 16 163.4 17.6 C166.6 20 166.6 25.4 162 27.6 C120 29.8 70 27.6 31 30.2 Z" fill={`url(#${uid}-pergamino-x)`} />
            <path d="M36 11 C70 8.6 110 10.4 152 8.6" stroke="#fff" strokeOpacity=".55" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M36 26.6 C72 24.8 118 26.6 158 24.6" stroke="#c9ad7a" strokeOpacity=".6" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M159.6 9.6 C162.6 11.6 162.6 15.4 160.4 17" stroke="#c9ad7a" strokeWidth=".9" fill="none" />
          </g>
          <TituloSvg texto={nombre} tam={12.8} hueco={112} x="100" y="22.2" textAnchor="middle" className="ccb-nombre" fontWeight="800" fill={T_CARTA} style={{ fontFamily: '"Baloo 2", "Fredoka", var(--fuente-titulo), sans-serif' }} />
          <g className="ccb-medallon">
            <path d="M8 3.6 l1.6 3.2 M12.6 1.8 l.4 3.4" stroke="#f2b632" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="21.5" cy="18.4" r="14.6" fill={T_CARTA} transform="translate(.8 1.2)" />
                <circle cx="21.5" cy="18.4" r="14.6" fill="#fbf2dc" stroke={T_CARTA} strokeWidth="2" />
                <circle cx="21.5" cy="18.4" r="12" fill="none" stroke={colores.oscuro} strokeWidth="1.1" opacity=".75" />
          </g>
          <g className="ccb-icono">
            {medallonPng ? (
              // El medallón entero pintado (círculo crema, borde e icono)
              <image href={medallonPng} x="6.4" y="3.3" width="30.2" height="30.2" preserveAspectRatio="xMidYMid meet" />
            ) : (
              <g transform="translate(21.5 18.4) scale(.86)">
                <IconoCuerdaCozy clave={clave} color={color} />
              </g>
            )}
          </g>
          {/* Borde fino de tinta */}
          <rect x="1" y="1" width={W - 2} height={H - 2} rx="9" fill="none" stroke={T_CARTA} strokeWidth="1.8" />
        </svg>
        <div className="ccb-texto" style={tamTexto(textoCuerda, 81 * 24.7, 6.6, 3.5)}>
          {textoCuerda}
        </div>
      </div>
    );
  }
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
            <TituloSvg texto={nombre} tam={14.5} hueco={W - 37 - 8} x="37" y="20.6" className="ccb-nombre" style={{ fontFamily: "var(--fuente-titulo)" }} fontWeight="800" fill="#ffffff" stroke={TINTA} strokeWidth="3.2" strokeLinejoin="round" paintOrder="stroke" />
          </g>
        ) : (
          <g>
            <path d={`M1.5 104 H${W - 1.5} V${H - 9.5} Q${W - 1.5} ${H - 1.5} ${W - 9.5} ${H - 1.5} H9.5 Q1.5 ${H - 1.5} 1.5 ${H - 9.5} Z`} {...bandaF} />
            <path d={`M1.5 104 H${W - 1.5} V${H - 9.5} Q${W - 1.5} ${H - 1.5} ${W - 9.5} ${H - 1.5} H9.5 Q1.5 ${H - 1.5} 1.5 ${H - 9.5} Z`} fill="url(#trama-fina)" />
            <path d={festones(1.5, W - 1.5, 104, 30, false)} {...bandaF} stroke={TINTA} strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="17" cy="115" r="11.5" fill={CREMA} stroke={TINTA} strokeWidth="2.2" />
            <g transform="translate(8.7 106.7) scale(.26)">{ICONOS_BOSQUE[clave]}</g>
            <TituloSvg texto={nombre} tam={13.5} hueco={W - 33 - 8} x="33" y="120" className="ccb-nombre" style={{ fontFamily: "var(--fuente-titulo)" }} fontWeight="800" fill="#ffffff" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" paintOrder="stroke" />
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

/** Medallón pintado (src/arte/cuerdas/icono-<id>.png) de cada fila de la leyenda de la loseta. */
const ICONO_LEYENDA: Record<string, string> = { "modificador-puntuacion": "pinzas-rojas", fragil: "vieja" };

/** Loseta de cartón al principio del tendedero: hace de poste y lleva la leyenda de las cuerdas. */
export function LosetaBosque({ lineas }: { lineas: number }) {
  useIdioma();
  return (
    <div className="loseta" style={{ "--lineas": lineas } as CSSProperties}>
      <div className="loseta-leyenda">
        <div className="loseta-titulo">{t("loseta.titulo")}</div>
        {LEYENDA.map((l) => (
          <div key={l.id} className="loseta-fila">
            {PNG_CUERDAS[`../arte/cuerdas/icono-${ICONO_LEYENDA[l.id] ?? l.id}.png`] ? (
              // El mismo medallón pintado que lleva la carta de esa cuerda
              <img className="loseta-icono" src={PNG_CUERDAS[`../arte/cuerdas/icono-${ICONO_LEYENDA[l.id] ?? l.id}.png`]} alt="" draggable={false} />
            ) : (
              <svg className="loseta-icono" viewBox="-13 -13 26 26" aria-hidden>
                <IconoCuerdaCozy clave={l.id} />
              </svg>
            )}
            <div>
              <b>{tLibre(`leyenda.${l.id}.nombre`)}</b>
              <span>{tLibre(`leyenda.${l.id}.texto`)}</span>
            </div>
          </div>
        ))}
        {/* Recordatorio del tope de humedad: las filas de gotas de la carta de prenda */}
        <div className="loseta-fila loseta-humedad">
          <svg className="loseta-icono" viewBox="-8 -10 16 18" aria-hidden>
            <GotaCozy />
          </svg>
          <div>
            <b>{t("loseta.humedad.nombre")}</b>
            <span>{t("loseta.humedad.texto", { n: HUMEDAD_MAXIMA_POR_DEFECTO })}</span>
          </div>
        </div>
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
          <span className="pb-puntos">{p.puntos ?? TIPOS[p.tipo].puntos}</span>
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

/**
 * Cinta del nombre: cinta doblada (las puntas se meten por detrás y asoman un poco más abajo), del color de la carta,
 * con lunares y una luz arriba. Ocupa la misma caja que antes (x 3,6 a 59,4, y 4 a 15,8), así que el nombre cabe igual.
 * También vale para la carta del día (más ancha) con x0 y x1.
 */
function Cinta({ x0 = 3.6, x1 = 59.4, y0 = 4, y1 = 15.8, lunares }: { x0?: number; x1?: number; y0?: number; y1?: number; lunares: string }) {
  const h = y1 - y0;
  const banda = `M${x0} ${y0 + 0.5} C${x0 + 12} ${y0 - 0.4} ${x1 - 12} ${y0 + 0.6} ${x1} ${y0 - 0.1} V${y1 - 0.4} C${x1 - 12} ${y1 + 0.3} ${x0 + 12} ${y1 - 0.5} ${x0} ${y1 + 0.2} Z`;
  const cola = (lado: 1 | -1) => {
    const x = lado === 1 ? x1 : x0;
    const fuera = x + lado * 3.2;
    return `M${x - lado * 0.4} ${y0 + h * 0.3} H${fuera} L${fuera - lado * 1.4} ${y0 + h * 0.3 + (h + 1.6) / 2} L${fuera} ${y1 + 1.8} H${x - lado * 0.4} Z`;
  };
  const pliegue = (lado: 1 | -1) => {
    const x = lado === 1 ? x1 : x0;
    return `M${x} ${y1 - 0.4} L${x - lado * 1.6} ${y1 + 1.8} H${x} Z`;
  };
  return (
    <g strokeLinejoin="round">
      {([-1, 1] as const).map((l) => (
        <g key={l}>
          <path className="m-cinta-fondo" d={cola(l)} stroke={T_CARTA} strokeWidth=".45" />
          <path className="m-cinta-pliegue" d={pliegue(l)} stroke={T_CARTA} strokeWidth=".4" />
        </g>
      ))}
      <path d={banda} fill={T_CARTA} transform="translate(.25 .4)" />
      <path className="m-cinta" d={banda} />
      <path d={banda} fill={`url(#${lunares})`} />
      <path d={`M${x0 + 0.6} ${y0 + 1.3} C${x0 + 12} ${y0 + 0.5} ${x1 - 12} ${y0 + 1.4} ${x1 - 0.6} ${y0 + 0.8}`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".7" strokeLinecap="round" />
      <path d={banda} fill="none" stroke={T_CARTA} strokeWidth=".5" />
    </g>
  );
}

/** Lunares blancos suaves y luz en el centro, para los marcos y las ventanas (defs de cada SVG). */
function DefsCozy({ id }: { id: string }) {
  return (
    <>
      <pattern id={`lunares-${id}`} width="2.8" height="2.8" patternUnits="userSpaceOnUse">
        <circle cx=".7" cy=".7" r=".42" fill="#fff" opacity=".42" />
        <circle cx="2.1" cy="2.1" r=".42" fill="#fff" opacity=".42" />
      </pattern>
      <pattern id={`lunares-suaves-${id}`} width="2.8" height="2.8" patternUnits="userSpaceOnUse">
        <circle cx=".7" cy=".7" r=".38" fill="#fff" opacity=".6" />
        <circle cx="2.1" cy="2.1" r=".38" fill="#fff" opacity=".6" />
      </pattern>
      <radialGradient id={`luz-${id}`} cx="50%" cy="45%" r="60%">
        <stop offset="0" stopColor="#fff" stopOpacity=".55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </>
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
    return <ellipse key={a} className="m-hoja" cx={x} cy={y} rx="1.2" ry="2.5" transform={`rotate(${a} ${x} ${y})`} stroke={T_CARTA} strokeWidth=".32" />;
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
      <circle cx={x + 0.25} cy={y + 0.35} r={r} fill={T_CARTA} opacity=".85" />
      <circle className="m-medallon" cx={x} cy={y} r={r} stroke={T_CARTA} strokeWidth=".45" />
      <circle className="m-medallon-aro" cx={x} cy={y} r={r - 0.85} fill="none" strokeWidth=".5" />
      <g className="m-emblema" transform={`translate(${x - r * 0.68} ${y - r * 0.68}) scale(${(r * 1.36) / 24})`}>{EMBLEMAS[emblema]}</g>
    </g>
  );
}

/** Rombos del pie, a los lados del nombre del mazo. */
function RombosPie({ xs, y }: { xs: number[]; y: number }) {
  return (
    <>
      {xs.map((x) => (
        <path key={x} d={`M${x} ${y - 1.5} L${x + 1.5} ${y} L${x} ${y + 1.5} L${x - 1.5} ${y} Z`} fill="#fbf2dc" stroke={T_CARTA} strokeWidth=".32" />
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
  if (capa === "frente")
    return (
      <svg className="marco-carta cb-marco cb-marco-frente" viewBox={`0 0 ${V.ancho} ${V.alto}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <DefsCozy id={id} />
        </defs>
        <path d={ventana} fill="none" stroke={T_CARTA} strokeWidth=".5" strokeLinejoin="round" />
        {objetivo ? <Medallon x={31.5} y={45.6} r={4.3} emblema={emblema} /> : <Medallon x={31.5} y={46.6} r={4.7} emblema={emblema} />}
        <Cinta lunares={`lunares-${id}`} />
        <RombosPie xs={[9, 54]} y={84.7} />
      </svg>
    );
  return (
    <svg className="marco-carta cb-marco" viewBox={`0 0 ${V.ancho} ${V.alto}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <clipPath id={`ventana-${id}`}>
          <path d={ventana} />
        </clipPath>
        <DefsCozy id={id} />
      </defs>
      {/* Marco de acuarela del color del mazo, con lunares blancos suaves (la acuarela va por CSS encima) */}
      <rect className="m-marco" width={V.ancho} height={V.alto} rx="3.4" />
      <rect width={V.ancho} height={V.alto} rx="3.4" fill={`url(#lunares-${id})`} />
      <rect className="m-filete" x="1.15" y="1.15" width={V.ancho - 2.3} height={V.alto - 2.3} rx="2.6" fill="none" />
      {/* Panel de papel */}
      <rect className="m-panel" x="2.8" y="2.8" width="57.4" height="78.6" rx="2.2" />
      <rect x="2.8" y="2.8" width="57.4" height="78.6" rx="2.2" fill="none" stroke={T_CARTA} strokeWidth=".45" />
      {objetivo && <Laurel />}
      {/* Ventana de la ilustración, con rayos de sol y un ribete claro por dentro */}
      <path className="m-ventana" d={ventana} />
      <g clipPath={`url(#ventana-${id})`}>
        <rect width={V.ancho} height={V.alto} fill={`url(#lunares-suaves-${id})`} />
        <ellipse cx={centro[0]} cy={centro[1]} rx="22" ry="16" fill={`url(#luz-${id})`} />
      </g>
      {/* Caja de texto cosida (y placa de puntos en los objetivos) */}
      {objetivo ? (
        <>
          <rect className="m-placa" x="6" y="48.4" width="51" height="10.2" rx="5.1" stroke={T_CARTA} strokeWidth=".42" />
          <rect className="m-caja" x="5.5" y="60.6" width="52" height="19" rx="1.8" stroke={T_CARTA} strokeWidth=".4" />
          <rect className="m-pespunte" x="6.6" y="61.7" width="49.8" height="16.8" rx="1.2" fill="none" strokeWidth=".38" strokeDasharray="1.1 .8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect className="m-caja" x="5.5" y="51" width="52" height="28.6" rx="1.8" stroke={T_CARTA} strokeWidth=".4" />
          <rect className="m-pespunte" x="6.6" y="52.1" width="49.8" height="26.4" rx="1.2" fill="none" strokeWidth=".38" strokeDasharray="1.1 .8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ---------- Carta de acción (63 × 88 mm) ----------

/** Carta de acción: cinta con el nombre, ilustración en su ventana, emblema del grupo, texto y tipo. */
/**
 * Ilustraciones en PNG de las cartas de acción (fondo transparente, proporción de la ventana: 52 × 29 mm):
 * si existe src/arte/acciones/<id>.png, la carta la usa en vez del icono SVG. Va entre el fondo y el frente del
 * marco, así que la cinta del título y el medallón quedan por encima.
 */
/** Iconos en PNG para el medallón de las cartas de cuerda (src/arte/cuerdas/<id>.png, ids de data/cuerdas.json). */
const PNG_CUERDAS = import.meta.glob<string>("../arte/cuerdas/*.png", { eager: true, query: "?url", import: "default" });
const T_CARTA = TINTA_CARTA;

/** Emblemas pintados de los dorsos (src/arte/dorsos/emblema-<mazo>.png: acciones, cuerdas, dias, objetivos, prendas). */
const PNG_DORSOS = import.meta.glob<string>("../arte/dorsos/*.png", { eager: true, query: "?url", import: "default" });
const PNG_ACCIONES = import.meta.glob<string>("../arte/acciones/*.png", { eager: true, query: "?url", import: "default" });
/** Lo mismo para las cartas del día (src/arte/dias/<id>.png, ventana de 31 × 36 mm) y los objetivos (src/arte/objetivos/<id>.png, ventana redonda de 27,2 mm). */
const PNG_DIAS = import.meta.glob<string>("../arte/dias/*.png", { eager: true, query: "?url", import: "default" });
const PNG_OBJETIVOS = import.meta.glob<string>("../arte/objetivos/*.png", { eager: true, query: "?url", import: "default" });

export function CaraAccionBosque({ id }: { id: string }) {
  useIdioma();
  const def = ACCIONES[id];
  const grupo = def.grupo === "fastidio" ? "fastidio" : "tactica";
  const nombre = textoCarta(id, "nombre", def.nombre);
  const texto = textoCarta(id, "texto", def.texto);
  const png = PNG_ACCIONES[`../arte/acciones/${id}.png`];
  return (
    <div className={`cb cb-cozy cb-${grupo}`} data-accion={id}>
      <MarcoVertical t={grupo} emblema={grupo} capa="fondo" />
      {png ? (
        <div className="cb-ilustra cb-ilustra-png">
          <img src={png} alt="" className="cb-png" draggable={false} aria-hidden />
        </div>
      ) : (
        <div className="cb-ilustra">
          <IconoBosque id={def.efecto} className="cb-icono" />
        </div>
      )}
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
 * `ritmo`: el «cada X → Y puntos» de la partida, si no es el de los datos (cambia con el modo de juego).
 */
export function CartaObjetivoBosque({
  id,
  secreto = false,
  ritmo,
  className,
  ...resto
}: { id: string; secreto?: boolean; ritmo?: { cada: number; puntos: number } } & HTMLAttributes<HTMLDivElement>) {
  useIdioma();
  const o = OBJETIVOS[id] && { ...OBJETIVOS[id], ...(ritmo && { cada: ritmo.cada, puntos: ritmo.puntos }) };
  if (!o) return null;
  const nombre = textoObjetivo(id, "nombre", o.nombre);
  const texto = textoObjetivo(id, "texto", o.texto);
  return (
    <div {...resto} className={`cb cb-cozy co ${className ?? ""}`} data-objetivo={id} data-secreto={secreto || undefined}>
      <MarcoVertical t="objetivo" emblema="objetivo" capa="fondo" />
      {PNG_OBJETIVOS[`../arte/objetivos/${o.id}.png`] ? (
        <div className="co-ilustra co-ilustra-png">
          <img src={PNG_OBJETIVOS[`../arte/objetivos/${o.id}.png`]} alt="" className="co-png" draggable={false} aria-hidden />
        </div>
      ) : (
        <div className="co-ilustra">
          <IlustraObjetivo id={o.id} tipo={o.parametros?.tipo} color={o.parametros?.color} className="co-arte" />
        </div>
      )}
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
      <div className="cb-texto co-texto" style={tamTexto(texto, 79 * 26, 6.3)}>
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
        <defs>
          <DefsCozy id={id} />
        </defs>
        <rect x={v.x} y={v.y} width={v.ancho} height={v.alto} rx="2" fill="none" stroke={T_CARTA} strokeWidth=".5" />
        <Medallon x={centroX} y={v.y + v.alto} r={4.2} emblema={suceso ? "suceso" : "tiempo"} />
        {/* Sello de la duración: el número va encima, en HTML */}
        <circle cx={c.x + c.ancho - 4.15} cy={c.y + c.alto + 0.35} r="4.6" fill={T_CARTA} opacity=".85" />
        <circle className="m-medallon" cx={c.x + c.ancho - 4.4} cy={c.y + c.alto} r="4.6" stroke={T_CARTA} strokeWidth=".45" />
        <circle className="m-medallon-aro" cx={c.x + c.ancho - 4.4} cy={c.y + c.alto} r="3.7" fill="none" strokeWidth=".45" strokeDasharray=".9 .6" />
        <Cinta x0={4.2} x1={83.8} y0={3.6} y1={12.8} lunares={`lunares-${id}`} />
        <RombosPie xs={[12, 76]} y={60.1} />
      </svg>
    );
  return (
    <svg className="marco-carta dia-marco" viewBox={`0 0 ${D.ancho} ${D.alto}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <clipPath id={`ventana-dia-${id}`}>
          <rect x={v.x} y={v.y} width={v.ancho} height={v.alto} rx="2" />
        </clipPath>
        <DefsCozy id={id} />
      </defs>
      {/* Marco de acuarela con lunares (tiempo azul, suceso morado) */}
      <rect className="m-marco" width={D.ancho} height={D.alto} rx="3.4" />
      <rect width={D.ancho} height={D.alto} rx="3.4" fill={`url(#lunares-${id})`} />
      <rect className="m-filete" x="1.15" y="1.15" width={D.ancho - 2.3} height={D.alto - 2.3} rx="2.6" fill="none" />
      <rect className="m-panel" x="2.6" y="2.6" width="82.8" height="54.6" rx="2.2" />
      <rect x="2.6" y="2.6" width="82.8" height="54.6" rx="2.2" fill="none" stroke={T_CARTA} strokeWidth=".45" />
      {/* Ventana del icono, con rayos de sol y un ribete claro por dentro */}
      <rect className="m-ventana" x={v.x} y={v.y} width={v.ancho} height={v.alto} rx="2" />
      <g clipPath={`url(#ventana-dia-${id})`}>
        <rect width={D.ancho} height={D.alto} fill={`url(#lunares-suaves-${id})`} />
        <ellipse cx={centroX} cy={v.y + v.alto * 0.45} rx="16" ry="19" fill={`url(#luz-${id})`} />
      </g>
      {/* Caja de texto cosida */}
      <rect className="m-caja" x={c.x} y={c.y} width={c.ancho} height={c.alto} rx="1.8" stroke={T_CARTA} strokeWidth=".4" />
      <rect className="m-pespunte" x={c.x + 1.1} y={c.y + 1.1} width={c.ancho - 2.2} height={c.alto - 2.2} rx="1.2" fill="none" strokeWidth=".38" strokeDasharray="1.1 .8" strokeLinecap="round" />
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
    <div {...resto} className={`dia-bosque dia-carta dia-cozy ${suceso ? "dia-suceso" : "dia-tiempo"} ${className ?? ""}`} data-dia={d.id}>
      <MarcoDia suceso={suceso} capa="fondo" />
      {PNG_DIAS[`../arte/dias/${d.id}.png`] ? (
        <div className="dia-icono dia-icono-png">
          <img src={PNG_DIAS[`../arte/dias/${d.id}.png`]} alt="" className="dia-png" draggable={false} aria-hidden />
        </div>
      ) : (
        <div className="dia-icono">
          <IconoDia id={d.id} efecto={d.efecto} className="dia-icono-arte" />
        </div>
      )}
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
// Todos con el acabado «cozy»: marco de acuarela del color del mazo con su trama (cuadros vichy o lunares),
// filete crema y un medallón grande con el emblema del mazo. Sin textos, así no hay nada que traducir: se
// distinguen de un vistazo por el color y el emblema.

type ClaseDorso = "acciones" | "cuerdas" | "dias" | "objetivos" | "prendas";
const DORSO: Record<ClaseDorso, { medida: "accion" | "cuerda" | "prenda"; fondo: string; oscuro: string; trama: "vichy" | "lunares" }> = {
  acciones: { medida: "accion", fondo: "#4f9a6c", oscuro: "#2f6d48", trama: "vichy" },
  objetivos: { medida: "accion", fondo: "#f0a53a", oscuro: "#b9741a", trama: "lunares" },
  cuerdas: { medida: "cuerda", fondo: "#c99c5e", oscuro: "#8a6234", trama: "vichy" },
  dias: { medida: "cuerda", fondo: "#5c9fdc", oscuro: "#2c69ad", trama: "lunares" },
  prendas: { medida: "prenda", fondo: "#e79aa9", oscuro: "#b55a6e", trama: "lunares" },
};

/** Centro y radio (interior, en mm) del medallón de cada dorso: también lo usan las plantillas vacías. */
export function medallonDorso(clase: ClaseDorso) {
  const m = MM[DORSO[clase].medida];
  const r = clase === "prendas" ? 13.6 : DORSO[clase].medida === "cuerda" ? 16 : 17;
  return { cx: m.ancho / 2, cy: m.alto / 2, r: r - 2.2 };
}

/** Emblema de cada mazo, en un lienzo de −12 a 12. */
function EmblemaDorso({ clase }: { clase: ClaseDorso }) {
  if (clase === "acciones") return <EmblemaAcciones />;
  if (clase === "cuerdas") return <EmblemaCuerdas />;
  if (clase === "dias") return <EmblemaDias />;
  if (clase === "objetivos") return <EmblemaObjetivos />;
  // Prendas: la camiseta con el calcetín delante (las ilustraciones de las cartas)
  const prenda = (tipo: string, color: string, x: number, y: number, w: number) => {
    const png = imagenPrenda(tipo, color);
    return png ? (
      <image href={png} x={x} y={y} width={w} height={w * 0.89} preserveAspectRatio="xMidYMid meet" />
    ) : (
      <svg x={x} y={y} width={w} height={(w * 100) / 140} viewBox="0 0 140 100" overflow="visible">
        <DibujoPrenda tipo={tipo} color={color} />
      </svg>
    );
  };
  return (
    <g>
      {prenda("camiseta", "#d2513f", -14.5, -13.5, 24)}
      {prenda("calcetin", "#4a7fd0", -1, -3.5, 16.5)}
    </g>
  );
}

export function DorsoBosque({ clase = "acciones" }: { clase?: ClaseDorso }) {
  const d = DORSO[clase];
  const W = MM[d.medida].ancho;
  const H = MM[d.medida].alto;
  const u = `do${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { cx, cy } = medallonDorso(clase);
  const R = medallonDorso(clase).r + 2.2;
  // Radio del emblema pintado: casi todo el ancho de la carta (más pequeño en la carta mini y en las apaisadas)
  const RP = Math.min(W, H) * (clase === "prendas" ? 0.4 : 0.36);
  const emblemaPng = PNG_DORSOS[`../arte/dorsos/emblema-${clase}.png`];
  const rx = 3.2;
  return (
    <div className={`db db-${clase} db-cozy`} style={{ "--db": d.fondo } as CSSProperties}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="marco-carta" aria-hidden>
        <defs>
          <pattern id={`${u}-vichy`} width="7" height="7" patternUnits="userSpaceOnUse">
            <rect width="3.5" height="7" fill="#fff" opacity=".16" />
            <rect width="7" height="3.5" fill="#fff" opacity=".16" />
            <rect width="3.5" height="3.5" fill={d.oscuro} opacity=".18" />
          </pattern>
          <pattern id={`${u}-lunares`} width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx=".75" cy=".75" r=".45" fill="#fff" opacity=".5" />
            <circle cx="2.25" cy="2.25" r=".45" fill="#fff" opacity=".5" />
          </pattern>
          <radialGradient id={`${u}-luz`} cx="50%" cy="50%" r="55%">
            <stop offset="0" stopColor="#fff" stopOpacity=".28" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect className="d-fondo" width={W} height={H} rx={rx} fill={d.fondo} />
        <rect width={W} height={H} rx={rx} fill={`url(#${u}-${d.trama})`} />
        <rect width={W} height={H} rx={rx} fill={`url(#${u}-luz)`} />
        {/* Doble filete crema */}
        <rect x="2.6" y="2.6" width={W - 5.2} height={H - 5.2} rx="2.2" fill="none" stroke="#fbf2dc" strokeWidth=".75" />
        <rect x="3.7" y="3.7" width={W - 7.4} height={H - 7.4} rx="1.6" fill="none" stroke="#fbf2dc" strokeWidth=".3" opacity=".8" />
        {emblemaPng ? (
          // Emblema pintado (src/arte/dorsos/emblema-<mazo>.png): el medallón entero, grande y centrado, con una sombra suave
          <g>
            <circle cx={cx + 0.5} cy={cy + 0.8} r={RP * 0.93} fill={T_CARTA} opacity=".35" />
            <image className="d-emblema" href={emblemaPng} x={cx - RP} y={cy - RP} width={2 * RP} height={2 * RP} preserveAspectRatio="xMidYMid meet" />
          </g>
        ) : (
          <g>
            {/* Medallón crema con aro del color del mazo y el emblema */}
            <circle cx={cx + 0.5} cy={cy + 0.7} r={R} fill={T_CARTA} opacity=".9" />
            <circle className="d-medallon" cx={cx} cy={cy} r={R} fill="#fbf2dc" stroke={T_CARTA} strokeWidth=".6" />
            <circle className="d-aro" cx={cx} cy={cy} r={R - 1.5} fill="none" stroke={d.oscuro} strokeWidth=".9" />
            <circle cx={cx} cy={cy} r={R - 2.6} fill="none" stroke={T_CARTA} strokeWidth=".22" strokeDasharray=".9 .7" opacity=".45" />
            <g className="d-emblema" transform={`translate(${cx} ${cy}) scale(${(R - 3.4) / 12.4})`}>
              <EmblemaDorso clase={clase} />
            </g>
          </g>
        )}
        <rect width={W} height={H} rx={rx} fill="none" stroke={T_CARTA} strokeWidth=".5" />
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
