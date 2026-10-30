import { useState } from "react";
import { useT } from "../../i18n";
import { Animal } from "../../prototipos/Animales";
import { leerConfig } from "../../prototipos/MenuPartida";
import { guiaTutorial } from "./escenario";
import { hayQueOfrecer, marcarOfrecido } from "./progreso";
import "./tutorial.css";

/** La primera vez que se abre el juego, el guía ofrece la partida tutorial. */
export function OfertaTutorial({ onAprender }: { onAprender: () => void }) {
  const t = useT();
  const [ver, setVer] = useState(hayQueOfrecer);
  if (!ver) return null;
  const cerrar = () => {
    marcarOfrecido();
    setVer(false);
  };
  return (
    <div className="tu-oferta-fondo">
      <div className="tu-oferta" role="dialog" aria-modal aria-labelledby="tu-oferta-titulo">
        <div className="tu-bocadillo centrado">
          <div className="tu-guia" aria-hidden>
            <Animal id={guiaTutorial(leerConfig().jugadores[0].animal)} className="tu-guia-animal" />
          </div>
          <div className="tu-cuerpo">
            <h2 id="tu-oferta-titulo">{t("tutorial.oferta.titulo")}</h2>
            <p>{t("tutorial.oferta.texto")}</p>
            <div className="tu-pie">
              <span className="tu-hueco" />
              <button className="tu-boton" onClick={cerrar}>
                {t("tutorial.oferta.no")}
              </button>
              <button
                className="tu-boton principal"
                autoFocus
                onClick={() => {
                  cerrar();
                  onAprender();
                }}
              >
                {t("portada.aprender")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
