import { ajustesIniciales, cestasPorDefecto, type Datos, type ModoJuego } from "@tendedero/motor";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { musica, pistaPedida, reproducir } from "../audio";
import { useT } from "../i18n";
import { PartidaContraIA, partidaGuardada } from "../juego/ContraIA";
import { TutorialPartida } from "../juego/tutorial/Tutorial";
import { guardarSala, leerSala, nuevaSala } from "../online/anfitrion";
import { nuevoCodigo } from "../online/protocolo";
import { entrarConNombre, SalaAnfitrion, SalaInvitado, type SalaNueva } from "../pantallas/SalaOnline";
import { DefsBosque } from "./ArteBosque";
import { leerConfig, MenuPartida, modoDe, type ConfigPartida } from "./MenuPartida";
import { leerNombreOnline, MenuOnline } from "./MenuOnline";
import { CabeceraMenu, FondoTendedero, PantallaTitulo, type DestinoPortada } from "./PortadaJuego";
import { VentanaAjustes } from "./VentanaAjustes";
import { plataforma } from "../plataforma";
import { InvitarAmigos } from "../plataforma/InvitarAmigos";
import { PartidaRapida } from "../plataforma/PartidaRapida";
import "./prototipos.css";
import "./mesa-bosque.css";
import "./estilos-dibujo.css";
import "./taller.css";
import "./mesa-final.css";
import "./menu-partida.css";
import "./mesa-hud.css";
import "../juego/juego.css";

// Versión E · «Mesa final»: el juego de verdad con el aspecto de la mesa E. Se abre con la portada (logo y
// botones grandes); desde ahí: Jugar (el menú de partida contra la IA), Online (crear sala o unirse con código),
// Perfil y logros, Ajustes y, en la aplicación de escritorio, Salir. La partida en sí está en src/juego
// (MesaJuego) y las salas online en pantallas/SalaOnline.
//
// Rutas: #/prototipos/e (portada), …/e/jugar, …/e/online, …/e/perfil, …/e/anfitrion/código y …/e/sala/código.

/** Dónde se abren las pantallas del juego nuevo. */
const RUTA = "/prototipos/e";

function recordarNombre(nombre: string) {
  try {
    localStorage.setItem("tendedero-nombre", nombre);
  } catch {
    // Solo sirve para rellenar el nombre la próxima vez.
  }
}

export function MesaFinal({ datos, ruta = [] }: { onVersion?: (v: string) => void; onVolver?: () => void; datos: Datos; ruta?: string[] }) {
  // Si había una partida contra la IA a medias en esta pestaña, se sigue con ella.
  const [config, setConfig] = useState<ConfigPartida | null>(() => {
    const g = partidaGuardada();
    return g ? { jugadores: g.perfiles, dificultad: g.dificultad, modo: modoDe(g.partida.ajustes) } : null;
  });
  const [ajustes, setAjustes] = useState(false);
  const t = useT();
  const ir = (r: string) => (location.hash = r);
  const aPortada = () => ir(RUTA);
  // Steam: «Invitar amigos» de la sala (código de la sala abierta) y la ventana de «Partida rápida».
  const [invitando, setInvitando] = useState<string | null>(null);
  const [rapida, setRapida] = useState(false);
  const volverAlMenu = () => {
    plataforma().salirSala(); // sale de la sala de Steam, si había (sin Steam no hace nada)
    setConfig(null);
    aPortada();
  };
  const abrirAjustes = useCallback(() => setAjustes(true), []);
  const cerrarAjustes = useCallback(() => setAjustes(false), []);

  const [que, sala] = ruta;
  // Música del menú (la partida pone la suya y, al salir, vuelve esta) y un clic en cada botón.
  useEffect(() => {
    if (pistaPedida() === null) musica("menu"); // si se entra directo a una partida, ya ha puesto la suya
    const clic = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest("button, [role=button]") : null;
      if (el && !el.closest("[data-carta], [data-prenda], [data-sin-clic]")) reproducir("boton");
    };
    window.addEventListener("click", clic, true);
    return () => {
      window.removeEventListener("click", clic, true);
      musica(null);
    };
  }, []);
  // Esc en un menú vuelve a la portada (con la ventana de ajustes abierta, solo la cierra).
  useEffect(() => {
    if (!(que === "jugar" || que === "online" || que === "perfil") || ajustes) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
      location.hash = RUTA;
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [que, ajustes]);

  const ventanaAjustes = ajustes && <VentanaAjustes onCerrar={cerrarAjustes} />;
  const perfilYo = leerConfig().jugadores[0];
  const nombreYo = leerNombreOnline(perfilYo) || perfilYo.nombre;
  const ventanaInvitar = invitando && <InvitarAmigos sala={{ codigo: invitando, plazas: leerSala(invitando)?.ajustes.jugadores ?? 4, nombre: nombreYo }} onCerrar={() => setInvitando(null)} />;
  const envolver = (contenido: ReactNode) => (
    <div className="proto mb me con-estilos estilo-fusion pt-raiz">
      <DefsBosque />
      {contenido}
      {ventanaAjustes}
      {ventanaInvitar}
    </div>
  );

  // Salas online abiertas desde esta interfaz: se juegan con la mesa nueva.
  const perfil = leerConfig().jugadores[0];
  const nueva: SalaNueva = { perfil: { ...perfil, nombre: leerNombreOnline(perfil) || perfil.nombre }, onAjustes: abrirAjustes, onInvitarAmigos: setInvitando };
  if (que === "anfitrion" && sala) {
    const guardada = leerSala(sala);
    if (guardada) return envolver(<SalaAnfitrion key={sala} inicial={guardada} datos={datos} onSalir={volverAlMenu} nueva={nueva} />);
    return envolver(<SalaInvitado key={sala} codigo={sala} onSalir={volverAlMenu} nueva={nueva} />);
  }
  if (que === "sala" && sala) return envolver(<SalaInvitado key={sala} codigo={sala} onSalir={volverAlMenu} nueva={nueva} />);

  // La partida tutorial «Aprender a jugar» (se abre desde la portada y desde el menú de partida).
  if (que === "aprender") return <TutorialPartida datos={datos} onSalir={aPortada} />;
  if (config) return <PartidaContraIA datos={datos} perfiles={config.jugadores} dificultad={config.dificultad} modo={modoDe(config)} onSalir={() => setConfig(null)} />;

  /** Crea la sala online con estas plazas y la abre como anfitrión. `modo`: sin él, el elegido en el menú de partida. */
  function abrirSala(nombre: string, plazas: number, cod = nuevoCodigo(), modo: ModoJuego = modoDe(leerConfig())) {
    const yo = leerConfig().jugadores[0];
    recordarNombre(nombre);
    if (!leerSala(cod)) {
      const base = ajustesIniciales(datos);
      guardarSala(nuevaSala(cod, { ...base, jugadores: plazas, cestas: { ...base.cestas, numero: cestasPorDefecto(datos, plazas) }, modo }, nombre, { animal: yo.animal, color: yo.color, tapete: yo.tapete }));
    }
    ir(`${RUTA}/anfitrion/${cod}`);
  }

  function unirse(nombre: string, cod: string) {
    entrarConNombre(cod, nombre);
    ir(`${RUTA}/sala/${cod}`);
  }

  const alPortada = (d: DestinoPortada) => (d === "ajustes" ? abrirAjustes() : ir(`${RUTA}/${d}`));

  if (que === "online") {
    return envolver(
      <div className="pt-pantalla pt-sub">
        <FondoTendedero />
        <CabeceraMenu titulo={t("online.titulo")} onVolver={aPortada} onAjustes={abrirAjustes} />
        <div className="pt-sub-contenido">
          <MenuOnline
            perfil={perfil}
            onCrear={(nombre, plazas, modo) => abrirSala(nombre, plazas, undefined, modo)}
            onUnirse={unirse}
            partidaRapida={
              <button className="principal ol-accion" onClick={() => setRapida(true)}>
                {t("rapida.boton")}
              </button>
            }
          />
          {rapida && (
            <PartidaRapida
              plazas={4}
              nombre={nombreYo}
              onAnfitrion={(cod) => {
                setRapida(false);
                abrirSala(nombreYo, 4, cod);
              }}
              onInvitado={(cod) => {
                setRapida(false);
                unirse(nombreYo, cod);
              }}
              onCrearSala={() => {
                setRapida(false);
                abrirSala(nombreYo, 4);
              }}
              onContraIA={() => {
                setRapida(false);
                ir(`${RUTA}/jugar`);
              }}
              onCerrar={() => setRapida(false)}
            />
          )}
        </div>
      </div>,
    );
  }

  if (que === "jugar" || que === "perfil") {
    return envolver(
      <div className="pt-pantalla pt-sub">
        <FondoTendedero />
        <CabeceraMenu titulo={que === "perfil" ? t("portada.perfil") : t("portada.jugar")} onVolver={aPortada} onAjustes={abrirAjustes} />
        <div className="pt-sub-contenido">
          <MenuPartida
            vista={que === "perfil" ? "perfil" : "jugar"}
            onAprender={() => ir(`${RUTA}/aprender`)}
            onEmpezar={setConfig}
            onAbrirSala={(cod) => {
              const c = leerConfig();
              abrirSala(leerNombreOnline(c.jugadores[0]) || c.jugadores[0].nombre, c.jugadores.length, cod);
            }}
          />
        </div>
      </div>,
    );
  }

  return envolver(<PantallaTitulo onIr={alPortada} />);
}
