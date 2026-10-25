// Dos vistazos de la mesa: la ventana con las prendas secas de un jugador (agrupadas como las cuentan los
// objetivos) y el mosaico con todos los tendederos a la vez mientras se mantiene pulsado un botón.

import type { Partida } from "@tendedero/motor";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { nombreVisible, tLibre, useT } from "../i18n";
import { nombreObjetivoId } from "../i18n/juego";
import { Animal } from "../prototipos/Animales";
import type { Perfil } from "../prototipos/MenuPartida";
import { CartaObjetivoJuego, CartaPrenda } from "./cartas";
import { SoloVer } from "./contexto";
import { Tapete } from "./piezas";

// ---------- Prendas secas de un jugador ----------

export function VentanaSecas({ p, jugador, perfil, yo, onCerrar }: { p: Partida; jugador: number; perfil: Perfil; yo: number; onCerrar: () => void }) {
  const t = useT();
  const secas = p.jugadores[jugador].seca;
  const tipos = Object.keys(p.catalogo.tipos);
  const colores = Object.keys(p.catalogo.colores);
  const cuantas = (filtro: (id: string) => boolean) => secas.filter(filtro).length;
  const mia = jugador === yo;
  const objetivos = mia ? [...p.objetivosComunes, ...(p.jugadores[yo].objetivoSecreto ? [p.jugadores[yo].objetivoSecreto!] : [])] : [];

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div className="fondo-modal mj-modal-fondo" onPointerDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="mj-modal mj-secas" style={{ "--jugador": perfil.color } as CSSProperties} role="dialog" aria-label={t("mesa.secas.titulo", { nombre: nombreVisible(perfil.nombre) })}>
        <h2>
          <Animal id={perfil.animal} className="mj-secas-animal" />
          {mia ? t("mesa.secas.tuyas") : t("mesa.secas.titulo", { nombre: nombreVisible(perfil.nombre) })}
          <small>{t("mesa.secas.total", { n: secas.length })}</small>
        </h2>
        {secas.length === 0 ? (
          <p>{t("mesa.secas.ninguna")}</p>
        ) : (
          <>
            {/* Por tipo, cada fila con sus cartas; y el recuento por color debajo, que es lo que piden los objetivos. */}
            <div className="mj-secas-tipos">
              {tipos.map((tipo) => {
                const ids = secas.filter((id) => p.prendas[id]?.tipo === tipo);
                if (!ids.length) return null;
                return (
                  <div key={tipo} className="mj-secas-fila">
                    <span className="mj-secas-cuenta">{tLibre(`reparto.tipo.${tipo}`, { n: ids.length })}</span>
                    <div className="mj-secas-cartas">
                      {[...ids]
                        .sort((a, b) => colores.indexOf(p.prendas[a].color) - colores.indexOf(p.prendas[b].color))
                        .map((id) => (
                          <CartaPrenda key={id} p={p} prenda={id} className="mj-seca-mini" data-lupa={`prenda:${id}`} />
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mj-secas-colores">
              <b>{t("mesa.secas.porColor")}</b>
              {colores.map((color) => {
                const n = cuantas((id) => p.prendas[id]?.color === color);
                return (
                  <span key={color} className={n ? "" : "cero"}>
                    <i className="me-muestra" style={{ background: p.catalogo.colores[color]?.hex }} />
                    {tLibre(`reparto.color.${color}`, { n })}
                  </span>
                );
              })}
            </div>
          </>
        )}
        {mia && objetivos.length > 0 && (
          <div className="mj-secas-objetivos">
            <h3>{t("mesa.secas.objetivos")}</h3>
            <div className="mj-objetivos">
              {objetivos.map((id) => {
                return (
                  <div key={id} className="mj-secas-objetivo" title={nombreObjetivoId(p, id)}>
                    <CartaObjetivoJuego p={p} id={id} jugador={yo} secreto={id === p.jugadores[yo].objetivoSecreto} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mj-menu-botones">
          <button className="principal" onClick={onCerrar}>
            {t("comun.cerrar")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Todos los tendederos a la vez ----------

/** Un tendedero del mosaico, escalado para que quepa entero en su celda. */
function Celda({ jugador, perfil, yo }: { jugador: number; perfil: Perfil; yo: number }) {
  const t = useT();
  const caja = useRef<HTMLDivElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const c = caja.current;
    const d = contenido.current;
    if (!c || !d) return;
    const ajustar = () => {
      const s = Math.min(c.clientWidth / d.offsetWidth, c.clientHeight / d.offsetHeight, 1.2);
      // Centrado en su celda y escalado para que quepa entero.
      d.style.transform = `translate(-50%, -50%) scale(${Math.max(0.1, s)})`;
    };
    const obs = new ResizeObserver(ajustar);
    obs.observe(c);
    obs.observe(d);
    ajustar();
    return () => obs.disconnect();
  }, []);
  return (
    <div className="mj-celda" style={{ "--jugador": perfil.color } as CSSProperties}>
      <div className="mj-celda-nombre">
        <Animal id={perfil.animal} className="mf-pestana-animal" />
        {jugador === yo ? t("mesa.tuTendedero") : t("mesa.tendederoDe", { nombre: nombreVisible(perfil.nombre) })}
      </div>
      <div className="mj-celda-caja" ref={caja}>
        <div className="mf-tendedero mj-celda-tendedero" ref={contenido}>
          <Tapete jugador={jugador} perfil={perfil} />
        </div>
      </div>
    </div>
  );
}

export function Mosaico({ perfiles, yo }: { perfiles: Perfil[]; yo: number }) {
  return (
    <SoloVer.Provider value={true}>
      <div className={`mj-mosaico n${perfiles.length}`} aria-live="polite">
        {perfiles.map((pf, j) => (
          <Celda key={j} jugador={j} perfil={pf} yo={yo} />
        ))}
      </div>
    </SoloVer.Provider>
  );
}
