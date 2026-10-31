import type { CSSProperties, ReactNode } from "react";
import { useT } from "../i18n";
import { esEscritorio, salirDelJuego } from "../escritorio";
import { OfertaTutorial } from "../juego/tutorial/OfertaTutorial";
import { TINTA } from "./ArteBosque";
import { EscenaPintada, IconoEngranaje, IconoGlobo, IconoLibro, IconoMedalla, IconoPuerta, PinzaBoton, TituloColgado, useEscala } from "./PortadaPintada";
import "./portada.css";
import "./portada-pintada.css";

// Portada del juego (la escena pintada del jardín, en PortadaPintada.tsx) y piezas de las pantallas del menú,
// que siguen sobre la mesa de madera de la partida.

/** Colores de la rueda de ajustes de la cabecera. */
const TONO = {
  crema: "#f2e6cc",
  madera: "#c99a62",
};

/** Fondo de las pantallas del menú: la mesa de madera de la partida (la pone .mb) con su luz. */
export function FondoTendedero() {
  return <div className="mb-luz" aria-hidden />;
}

export type DestinoPortada = "jugar" | "aprender" | "online" | "perfil" | "ajustes";

/** ¿Están puestas las animaciones (Ajustes)? Se lee en cada pintado: al cerrar Ajustes la portada se vuelve a pintar. */
function hayAnimaciones() {
  try {
    return localStorage.getItem("tendedero-animaciones") !== "no";
  } catch {
    return true;
  }
}

/** La pantalla de título: la escena pintada del jardín con el título colgado y los botones de madera. */
export function PantallaTitulo({ onIr }: { onIr: (destino: DestinoPortada) => void }) {
  const t = useT();
  const { ref, k } = useEscala();
  const tabla = (destino: DestinoPortada, texto: string, icono: ReactNode, giro: number) => (
    <button className="pp-tabla" onClick={() => onIr(destino)} style={{ "--giro": `${giro}deg` } as CSSProperties}>
      <PinzaBoton />
      <span className="pp-tabla-icono">{icono}</span>
      <span className="pp-tabla-texto">{texto}</span>
    </button>
  );
  return (
    <div ref={ref} className={`pt-pantalla pp-portada ${hayAnimaciones() ? "" : "pp-quieta"}`}>
      <EscenaPintada />
      <div className="pp-escenario" style={{ transform: `translate(-50%, -50%) scale(${k})` }}>
        <TituloColgado />
        <div className="pp-cartel">
          <span className="pp-cartel-cuerda izq" aria-hidden />
          <span className="pp-cartel-cuerda der" aria-hidden />
          <p>{t("portada.lema")}</p>
        </div>
        <button className="pp-jugar" onClick={() => onIr("jugar")}>
          <PinzaBoton className="izq" />
          <PinzaBoton className="der" />
          <span className="pp-jugar-verde">
            <span className="pp-jugar-texto">{t("portada.jugar")}</span>
          </span>
        </button>
        <nav className="pp-tablas">
          {tabla("aprender", t("portada.aprender"), <IconoLibro />, -1.2)}
          {tabla("online", t("portada.online"), <IconoGlobo />, 0.8)}
          {tabla("perfil", t("portada.perfil"), <IconoMedalla />, -0.6)}
        </nav>
        <button className="pp-redondo izq" onClick={() => onIr("ajustes")} aria-label={t("portada.ajustes")} title={t("portada.ajustes")}>
          <PinzaBoton />
          <span className="pp-redondo-icono engranaje">
            <IconoEngranaje />
          </span>
        </button>
        {esEscritorio() && (
          <button className="pp-redondo der" onClick={salirDelJuego} aria-label={t("portada.salir")} title={t("portada.salir")}>
            <PinzaBoton />
            <span className="pp-redondo-icono">
              <IconoPuerta />
            </span>
          </button>
        )}
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
