import { ajustesIniciales, cestasPorDefecto, type Datos } from "@tendedero/motor";
import { useState } from "react";
import { useT } from "../i18n";
import { SelectorIdioma } from "../i18n/react";
import { PartidaContraIA, partidaGuardada } from "../juego/ContraIA";
import { guardarSala, leerSala, nuevaSala } from "../online/anfitrion";
import { nuevoCodigo } from "../online/protocolo";
import { SalaAnfitrion, SalaInvitado, type SalaNueva } from "../pantallas/SalaOnline";
import { DefsBosque } from "./ArteBosque";
import { leerConfig, MenuPartida, type ConfigPartida } from "./MenuPartida";
import "./prototipos.css";
import "./mesa-bosque.css";
import "./estilos-dibujo.css";
import "./taller.css";
import "./mesa-final.css";
import "./menu-partida.css";
import "./mesa-hud.css";
import "../juego/juego.css";

// Versión E · «Mesa final»: el juego de verdad con el aspecto de la mesa E. Antes de jugar, el menú (nombre,
// animal, rivales) y cómo se juega: contra la IA (de 2 a 4 jugadores) u online, creando una sala o entrando en
// una. La partida en sí está en src/juego (MesaJuego); aquí solo se elige y se enlaza con las salas online.

type Modo = "ia" | "crear" | "unirse";

/** Dónde se abren las salas jugadas con la mesa nueva (#/prototipos/e/anfitrion/… y #/prototipos/e/sala/…). */
const RUTA = "/prototipos/e";

function recordarNombre(nombre: string) {
  try {
    localStorage.setItem("tendedero-nombre", nombre);
  } catch {
    // Solo sirve para rellenar el nombre la próxima vez.
  }
}

export function MesaFinal({ onVersion, onVolver, datos, ruta = [] }: { onVersion: (v: string) => void; onVolver: () => void; datos: Datos; ruta?: string[] }) {
  // Si había una partida contra la IA a medias en esta pestaña, se sigue con ella.
  const [config, setConfig] = useState<ConfigPartida | null>(() => {
    const g = partidaGuardada();
    return g ? { jugadores: g.perfiles, dificultad: g.dificultad } : null;
  });
  // El estilo de dibujo ya está decidido: siempre la fusión.
  const estilo = "fusion";
  const [modo, setModo] = useState<Modo>("ia");
  const t = useT();
  const [codigo, setCodigo] = useState("");
  const ir = (r: string) => (location.hash = r);
  const volverAlMenu = () => {
    setConfig(null);
    ir(RUTA);
  };

  // Salas online abiertas desde esta interfaz: se juegan con la mesa nueva.
  const [que, sala] = ruta;
  const nueva: SalaNueva = { perfil: leerConfig().jugadores[0], ruta: `${RUTA}/sala` };
  if (que === "anfitrion" && sala) {
    const guardada = leerSala(sala);
    if (guardada) return <SalaAnfitrion key={sala} inicial={guardada} datos={datos} onSalir={volverAlMenu} nueva={nueva} />;
    return <SalaInvitado key={sala} codigo={sala} onSalir={volverAlMenu} nueva={nueva} />;
  }
  if (que === "sala" && sala) return <SalaInvitado key={sala} codigo={sala} onSalir={volverAlMenu} nueva={nueva} />;

  if (config) return <PartidaContraIA datos={datos} perfiles={config.jugadores} dificultad={config.dificultad} onSalir={() => setConfig(null)} />;

  /** Crea la sala online con tantas plazas como jugadores tenga el menú, y la abre como anfitrión. */
  function abrirSala(c: ConfigPartida, cod = nuevoCodigo()) {
    const yo = c.jugadores[0];
    recordarNombre(yo.nombre);
    if (!leerSala(cod)) {
      const base = ajustesIniciales(datos);
      const n = c.jugadores.length;
      guardarSala(nuevaSala(cod, { ...base, jugadores: n, cestas: { ...base.cestas, numero: cestasPorDefecto(datos, n) } }, yo.nombre, { animal: yo.animal, color: yo.color, tapete: yo.tapete }));
    }
    ir(`${RUTA}/anfitrion/${cod}`);
  }

  function empezar(c: ConfigPartida) {
    if (modo === "ia") return setConfig(c);
    if (modo === "crear") return abrirSala(c);
    const cod = codigo.trim().toLowerCase();
    if (!cod) return;
    recordarNombre(c.jugadores[0].nombre);
    ir(`${RUTA}/sala/${cod}`);
  }

  return (
    <div className={`proto mb me con-estilos estilo-${estilo}`}>
      <DefsBosque />
      <div className="escenario mb-escenario me-menu-fondo">
        <div className="mb-luz" aria-hidden />
        <SelectorIdioma className="mb-idioma me-idioma-esquina" />
        <div className="mj-modo" role="group" aria-label={t("menu.comoSeJuega")}>
          <span>{t("menu.comoJugais")}</span>
          <button className={modo === "ia" ? "activa" : ""} onClick={() => setModo("ia")}>
            {t("menu.modoIA")}
          </button>
          <button className={modo === "crear" ? "activa" : ""} onClick={() => setModo("crear")}>
            {t("menu.modoCrear")}
          </button>
          <button className={modo === "unirse" ? "activa" : ""} onClick={() => setModo("unirse")}>
            {t("menu.modoUnirse")}
          </button>
          {modo === "unirse" && (
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder={t("menu.codigoSala")} maxLength={12} aria-label={t("menu.codigoSala")} />
          )}
          <small>{modo === "ia" ? t("menu.ayudaIA") : modo === "crear" ? t("menu.ayudaCrear") : t("menu.ayudaUnirse")}</small>
        </div>
        <MenuPartida onEmpezar={empezar} onAbrirSala={(cod) => abrirSala(leerConfig(), cod)} />
      </div>
    </div>
  );
}
