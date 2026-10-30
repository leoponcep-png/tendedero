import type { ReactNode } from "react";
import { useT } from "../i18n";
import { esEscritorio, salirDelJuego } from "../escritorio";
import { OfertaTutorial } from "../juego/tutorial/OfertaTutorial";
import { MiniPrenda, Soga, TINTA } from "./ArteBosque";
import "./portada.css";

// Portada del juego, sobre la mesa de madera de siempre: el rótulo «Tendedero» en una placa de cartón como las
// de las cartas (tinta marrón, colores apagados), colgada de una cuerdecita con dos pinzas y un par de prendas
// pequeñas, y debajo los botones del menú en fichas de papel crema como las del menú de partida.

/** Colores apagados del juego (los de reserva del estilo bosque), para que el rótulo no chille. */
const TONO = {
  crema: "#f2e6cc",
  carton: "#e6d3ad",
  ribete: "#c9a46a",
  madera: "#c99a62",
  rojo: "#c2553a",
  azul: "#4f7fa6",
  mostaza: "#e1a73a",
};

/** Altura de la cuerda del rótulo en x (cae un poco en el centro). */
const cuerdaY = (x: number) => {
  const t = x / 640;
  return 34 + 2 * t * (1 - t) * 28;
};

/** Pinza de madera, vertical, con el muelle en (x, y). */
function Pinza({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-5} y={-12} width={10} height={30} rx={2.8} fill={TONO.madera} stroke={TINTA} strokeWidth={2.4} />
      <path d="M0 -11 V17" stroke={TINTA} strokeWidth={1.2} opacity={0.55} />
      <circle cx={0} cy={0} r={3.6} fill="#a9b1b5" stroke={TINTA} strokeWidth={1.8} />
    </g>
  );
}

/** El rótulo «Tendedero»: placa de cartón con ribete, colgada con dos pinzas, y una prenda a cada lado. */
export function LogoTendedero({ className }: { className?: string }) {
  return (
    <svg className={`pt-logo ${className ?? ""}`} viewBox="0 0 640 200" role="img" aria-label="Tendedero">
      <Soga d="M0 34 Q320 90 640 34" g={4} c="#d8b98a" />
      {/* Prendas pequeñas a los lados */}
      <g className="pt-colgada" style={{ transformOrigin: `58px ${cuerdaY(58)}px` }}>
        <MiniPrenda tipo="calcetin" c={TONO.azul} x={58 - 30 * 0.78} y={cuerdaY(58) - 3} s={0.78} giro={4} />
        <Pinza x={58} y={cuerdaY(58) + 3} />
      </g>
      <g className="pt-colgada" style={{ transformOrigin: `586px ${cuerdaY(586)}px`, animationDelay: "-1.4s" }}>
        <MiniPrenda tipo="camiseta" c={TONO.rojo} x={586 - 60 * 0.62} y={cuerdaY(586) - 3} s={0.62} giro={-3} />
        <Pinza x={586} y={cuerdaY(586) + 3} />
      </g>
      {/* Placa */}
      <g>
        <rect x={112} y={58} width={416} height={124} rx={16} fill="#00000033" transform="translate(0 7)" />
        <rect x={112} y={58} width={416} height={124} rx={16} fill={TONO.crema} stroke={TINTA} strokeWidth={4} />
        <rect x={121} y={67} width={398} height={106} rx={10} fill="none" stroke={TONO.ribete} strokeWidth={2.6} />
        <rect x={126} y={72} width={388} height={96} rx={7} fill={TONO.carton} opacity={0.45} />
        <path d="M150 150 H490" stroke={TONO.ribete} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
        <text x={320} y={138} textAnchor="middle" className="pt-rotulo" fill={TINTA}>
          Tendedero
        </text>
      </g>
      <Pinza x={190} y={cuerdaY(190) + 4} />
      <Pinza x={450} y={cuerdaY(450) + 4} />
    </svg>
  );
}

/** Fondo de las pantallas del menú: la mesa de madera de la partida (la pone .mb) con su luz. */
export function FondoTendedero() {
  return <div className="mb-luz" aria-hidden />;
}

export type DestinoPortada = "jugar" | "aprender" | "online" | "perfil" | "ajustes";

/** La pantalla de título. */
export function PantallaTitulo({ onIr }: { onIr: (destino: DestinoPortada) => void }) {
  const t = useT();
  const boton = (destino: DestinoPortada, texto: string, principal = false): ReactNode => (
    <button className={`pt-boton ${principal ? "principal" : ""}`} onClick={() => onIr(destino)}>
      {texto}
    </button>
  );
  return (
    <div className="pt-pantalla pt-titulo">
      <FondoTendedero />
      <div className="pt-centro">
        <LogoTendedero />
        <p className="pt-lema">{t("portada.lema")}</p>
        <nav className="pt-botones menu-tarjeta">
          {boton("jugar", t("portada.jugar"), true)}
          {boton("aprender", t("portada.aprender"))}
          {boton("online", t("portada.online"))}
          {boton("perfil", t("portada.perfil"))}
          {boton("ajustes", t("portada.ajustes"))}
          {esEscritorio() && (
            <button className="pt-boton pt-salir" onClick={salirDelJuego}>
              {t("portada.salir")}
            </button>
          )}
        </nav>
      </div>
      <OfertaTutorial onAprender={() => onIr("aprender")} />
    </div>
  );
}

/** Rueda dentada de ajustes, en tinta. */
function IconoAjustes() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path
        d="M32 6 l5 7 8-3 1 8 8 1-3 8 7 5-7 5 3 8-8 1-1 8-8-3-5 7-5-7-8 3-1-8-8-1 3-8-7-5 7-5-3-8 8-1 1-8 8 3 Z"
        fill={TONO.madera}
        stroke={TINTA}
        strokeWidth={3.4}
        strokeLinejoin="round"
      />
      <circle cx={32} cy={32} r={9} fill={TONO.crema} stroke={TINTA} strokeWidth={3.4} />
    </svg>
  );
}

/** Barra de arriba de las pantallas del menú: volver a la portada, el título y el botón de ajustes. */
export function CabeceraMenu({ titulo, onVolver, onAjustes }: { titulo?: string; onVolver: () => void; onAjustes?: () => void }) {
  const t = useT();
  return (
    <header className="pt-cabecera">
      <button className="pt-redondo" onClick={onVolver} aria-label={t("portada.volver")} title={t("portada.volver")}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{t("portada.volver")}</span>
      </button>
      {titulo && <h1>{titulo}</h1>}
      {onAjustes ? (
        <button className="pt-redondo pt-engranaje" onClick={onAjustes} aria-label={t("portada.ajustes")} title={t("portada.ajustes")}>
          <IconoAjustes />
        </button>
      ) : (
        <span className="pt-redondo-hueco" />
      )}
    </header>
  );
}
