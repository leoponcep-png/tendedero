import { ajustesIniciales, cestasPorDefecto, type Datos } from "@tendedero/motor";
import { useState } from "react";
import { PartidaContraIA, partidaGuardada } from "../juego/ContraIA";
import { guardarSala, leerSala, nuevaSala } from "../online/anfitrion";
import { nuevoCodigo } from "../online/protocolo";
import { SalaAnfitrion, SalaInvitado, type SalaNueva } from "../pantallas/SalaOnline";
import { DefsBosque } from "./ArteBosque";
import { ESTILOS } from "./MesaBosque";
import { leerConfig, MenuPartida, type ConfigPartida } from "./MenuPartida";
import { Barra } from "./Prototipos";
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

function leerEstilo(): string {
  try {
    return localStorage.getItem("tendedero-estilo") ?? "fusion";
  } catch {
    return "fusion";
  }
}

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
    return g ? { jugadores: g.perfiles } : null;
  });
  const [estilo, setEstiloActual] = useState(leerEstilo);
  const [modo, setModo] = useState<Modo>("ia");
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

  if (config) return <PartidaContraIA datos={datos} perfiles={config.jugadores} onSalir={() => setConfig(null)} />;

  function elegirEstilo(id: string) {
    setEstiloActual(id);
    try {
      localStorage.setItem("tendedero-estilo", id);
    } catch {
      // Sin almacenamiento solo se pierde la elección al recargar.
    }
  }

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
      <Barra version="e" onVersion={onVersion} onVolver={onVolver} ocupado onReiniciar={() => {}} />
      <nav className="mb-estilos">
        <span>Estilo de dibujo:</span>
        {ESTILOS.map((e) => (
          <button key={e.id} className={e.id === estilo ? "activa" : ""} onClick={() => elegirEstilo(e.id)}>
            {e.nombre}
          </button>
        ))}
      </nav>
      <div className="escenario mb-escenario me-menu-fondo">
        <div className="mb-luz" aria-hidden />
        <div className="mj-modo" role="group" aria-label="Cómo se juega">
          <span>¿Cómo jugáis?</span>
          <button className={modo === "ia" ? "activa" : ""} onClick={() => setModo("ia")}>
            Contra la IA
          </button>
          <button className={modo === "crear" ? "activa" : ""} onClick={() => setModo("crear")}>
            Online: crear sala
          </button>
          <button className={modo === "unirse" ? "activa" : ""} onClick={() => setModo("unirse")}>
            Online: unirse
          </button>
          {modo === "unirse" && (
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de la sala" maxLength={12} aria-label="Código de la sala" />
          )}
          <small>
            {modo === "ia"
              ? "Los rivales los juega el ordenador."
              : modo === "crear"
                ? "Se abre una sala con tantas plazas como jugadores elijas; pasa el enlace a tus amigos."
                : "Escribe el código que te han pasado y pulsa «Empezar partida»."}
          </small>
        </div>
        <MenuPartida onEmpezar={empezar} onAbrirSala={(cod) => abrirSala(leerConfig(), cod)} />
      </div>
    </div>
  );
}
