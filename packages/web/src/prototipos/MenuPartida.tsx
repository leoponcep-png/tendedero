import { DIFICULTADES, MODOS_JUEGO, type Dificultad, type ModoJuego } from "@tendedero/motor";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { esNombreTu, nombreVisible, t, useT, type Clave } from "../i18n";
import { Animal, ANIMALES } from "./Animales";
import { AvisoLogros } from "./perfil/AvisoLogros";
import { COLORES, nombreAnimal, nombreColor, nombreTapete } from "./perfil/catalogo";
import { MuestraTapete } from "./perfil/Comunes";
import { calcularEstadisticas } from "./perfil/estadisticas";
import { IconoPerfil, type Icono } from "./perfil/Iconos";
import { actualizarLogros, bloqueo, estadoLogros, EVENTO_LOGRO, logrosConseguidos, respetarElegidas } from "./perfil/logros";
import { PanelAmigos } from "./perfil/PanelAmigos";
import { PanelLogros } from "./perfil/PanelLogros";
import { PanelPerfil } from "./perfil/PanelPerfil";
import { PanelRecords } from "./perfil/PanelRecords";
import { leerPartidas } from "./perfil/registro";
import "./perfil/perfil.css";
import "./tapetes.css";

// Menú antes de empezar, con pestañas: la partida (cuántos jugáis y quiénes son los rivales), tu perfil
// (nombre, animal, color y tapete), tus récords, tus logros y tus amigos. Todo se recuerda en este navegador.

/**
 * `tapete`: diseño de tapete elegido (desbloqueable); el color del tapete sale de `color`.
 * `marco`, `titulo` y `fondo`: recompensas que se ven en la mesa (marco del avatar en el panel de jugador,
 * título bajo el nombre y fondo de la mesa de quien juega). Ids en perfil/catalogo.ts.
 */
export type Perfil = { nombre: string; animal: string; color: string; tapete?: string; marco?: string; titulo?: string; fondo?: string };
/** `dificultad`: nivel de la IA de los rivales (sin ella, «normal»). `modo`: modo de juego (sin él, «normal»). */
export type ConfigPartida = { jugadores: Perfil[]; dificultad?: Dificultad; modo?: ModoJuego };

/** El modo de juego de una configuración guardada; si no tiene o ya no existe, el normal. */
export const modoDe = (c: { modo?: string } | null | undefined): ModoJuego =>
  c?.modo && (MODOS_JUEGO as readonly string[]).includes(c.modo) ? (c.modo as ModoJuego) : "normal";

export const COLORES_JUGADOR = COLORES.map((c) => c.valor);
const NOMBRES_RIVALES = ["Lu", "Bruno", "Marta", "Nico"];

const unico = <T,>(usados: T[], lista: T[], preferido: T) => (usados.includes(preferido) ? (lista.find((x) => !usados.includes(x)) ?? preferido) : preferido);

/** Rivales por defecto sin repetir animal ni color con los que ya hay (solo con lo ya desbloqueado). */
function rivales(yo: Perfil, cuantos: number, previos: Perfil[] = [], animales = ANIMALES.map((a) => a.id), colores = COLORES_JUGADOR): Perfil[] {
  const lista: Perfil[] = [];
  for (let i = 0; i < cuantos; i++) {
    const usados = [yo, ...lista];
    const anterior = previos[i];
    lista.push({
      nombre: anterior?.nombre ?? NOMBRES_RIVALES[i],
      animal: unico(
        usados.map((p) => p.animal),
        animales,
        anterior?.animal || animales[(i + 1) % animales.length],
      ),
      color: unico(
        usados.map((p) => p.color),
        colores,
        anterior?.color || colores[(i + 1) % colores.length],
      ),
    });
  }
  return lista;
}

export function leerConfig(): ConfigPartida {
  try {
    const guardada = JSON.parse(localStorage.getItem("tendedero-partida") ?? "null") as ConfigPartida | null;
    if (guardada && (guardada.jugadores?.length ?? 0) >= 2) return guardada;
  } catch {
    // Sin almacenamiento se empieza con los valores de siempre.
  }
  const yo = { nombre: t("menu.tu"), animal: "raton", color: COLORES_JUGADOR[0], tapete: "basico" };
  return { jugadores: [yo, ...rivales(yo, 1)] };
}

/**
 * Un perfil guardado que ya usa algo que ahora es recompensa (de antes de que hubiera logros) se respeta: eso queda
 * desbloqueado para siempre. Los rivales guardados también conservan su animal y su color.
 */
function respetarGuardado(c: ConfigPartida, hechos: Record<string, string>): ConfigPartida {
  const [yo] = c.jugadores;
  respetarElegidas(
    [
      { tipo: "animal", id: yo.animal },
      { tipo: "color", id: yo.color },
      { tipo: "tapete", id: yo.tapete ?? "" },
      { tipo: "marco", id: yo.marco ?? "" },
      { tipo: "titulo", id: yo.titulo ?? "" },
      { tipo: "fondo", id: yo.fondo ?? "" },
    ],
    hechos,
  );
  return c;
}

function guardarConfig(c: ConfigPartida) {
  try {
    localStorage.setItem("tendedero-partida", JSON.stringify(c));
  } catch {
    // Solo se pierde el recuerdo para la próxima vez.
  }
}

function ElegirAnimal({ valor, ocupados, disponibles, onCambio }: { valor: string; ocupados: string[]; disponibles: string[]; onCambio: (id: string) => void }) {
  return (
    <div className="menu-animales pequeno">
      {ANIMALES.filter((a) => disponibles.includes(a.id) || a.id === valor).map((a) => (
        <button key={a.id} className={`menu-animal ${a.id === valor ? "activa" : ""}`} disabled={ocupados.includes(a.id) && a.id !== valor} onClick={() => onCambio(a.id)} title={nombreAnimal(a.id)}>
          <Animal id={a.id} />
        </button>
      ))}
    </div>
  );
}

function ElegirColor({ valor, ocupados, disponibles, onCambio }: { valor: string; ocupados: string[]; disponibles: string[]; onCambio: (c: string) => void }) {
  return (
    <div className="menu-colores">
      {(disponibles.includes(valor) ? disponibles : [...disponibles, valor]).map((c) => (
        <button key={c} className={c === valor ? "activa" : ""} style={{ background: c }} disabled={ocupados.includes(c) && c !== valor} onClick={() => onCambio(c)} aria-label={nombreColor(c)} title={nombreColor(c)} />
      ))}
    </div>
  );
}

export type Pestana = "partida" | "perfil" | "records" | "logros" | "amigos";
const PESTANAS: { id: Pestana; nombre: Clave; icono: Icono }[] = [
  { id: "partida", nombre: "menu.pestana.partida", icono: "cesta" },
  { id: "perfil", nombre: "menu.pestana.perfil", icono: "perfil" },
  { id: "records", nombre: "menu.pestana.records", icono: "grafica" },
  { id: "logros", nombre: "menu.pestana.logros", icono: "medalla" },
  { id: "amigos", nombre: "menu.pestana.amigos", icono: "amigos" },
];

/**
 * `vista`: «jugar» enseña solo cómo será la partida y el botón de empezar; «perfil», solo el perfil, los récords,
 * los logros y los amigos (cada cosa en su pantalla de la portada, para no mezclarlas).
 * `onAbrirSala` (opcional): si se pasa, las invitaciones de la pestaña Amigos muestran «Abrir la sala» con el
 * código creado.
 */
export function MenuPartida({
  onEmpezar,
  onAbrirSala,
  onAprender,
  vista = "jugar",
}: {
  onEmpezar: (c: ConfigPartida) => void;
  onAbrirSala?: (codigo: string) => void;
  /** Abre la partida tutorial «Aprender a jugar» (sin ella, no sale el botón). */
  onAprender?: () => void;
  vista?: "jugar" | "perfil";
}) {
  const t = useT();
  const jugar = vista === "jugar";
  const [pestana, setPestana] = useState<Pestana>(jugar ? "partida" : "perfil");
  // Al abrir el menú se ponen al día los logros con las partidas guardadas (los nuevos salen en el aviso).
  const [partidas, setPartidas] = useState(() => {
    const lista = leerPartidas();
    actualizarLogros(lista);
    return lista;
  });
  const [hechos, setHechos] = useState(logrosConseguidos);
  const [config, setConfig] = useState(() => respetarGuardado(leerConfig(), logrosConseguidos()));
  const [yoGuardado, ...otros] = config.jugadores;
  // Si no te has cambiado el nombre, se ve el «Tú» del idioma elegido.
  const yo = esNombreTu(yoGuardado.nombre) ? { ...yoGuardado, nombre: t("menu.tu") } : yoGuardado;

  useEffect(() => {
    const refrescar = () => {
      setPartidas(leerPartidas());
      setHechos(logrosConseguidos());
    };
    window.addEventListener(EVENTO_LOGRO, refrescar);
    return () => window.removeEventListener(EVENTO_LOGRO, refrescar);
  }, []);

  const estadisticas = useMemo(() => calcularEstadisticas(partidas), [partidas]);
  const estados = useMemo(() => estadoLogros(partidas), [partidas, hechos]);
  const animalesLibres = ANIMALES.map((a) => a.id).filter((id) => !bloqueo("animal", id, hechos));
  const coloresLibres = COLORES_JUGADOR.filter((c) => !bloqueo("color", c, hechos));
  const conseguidos = estados.filter((s) => s.conseguido).length;

  // Lo que no se cambia (p. ej. la dificultad al tocar los rivales) se conserva.
  const cambiarConfig = (c: ConfigPartida) => {
    const nueva = { ...config, ...c };
    setConfig(nueva);
    guardarConfig(nueva);
  };
  const dificultad: Dificultad = config.dificultad && DIFICULTADES.includes(config.dificultad) ? config.dificultad : "normal";
  const modo = modoDe(config);
  const cambiarYo = (cambio: Partial<Perfil>) => {
    const nuevo = { ...yo, ...cambio };
    // Si tu animal o color nuevo lo tenía un rival, a ese rival se le da otro.
    const previos = otros.map((o) => ({ ...o, animal: o.animal === nuevo.animal ? "" : o.animal, color: o.color === nuevo.color ? "" : o.color }));
    cambiarConfig({ jugadores: [nuevo, ...rivales(nuevo, otros.length, previos, animalesLibres, coloresLibres)] });
  };
  const cambiarRival = (i: number, cambio: Partial<Perfil>) => cambiarConfig({ jugadores: [yo, ...otros.map((o, k) => (k === i ? { ...o, ...cambio } : o))] });
  const cuantos = (n: number) => cambiarConfig({ jugadores: [yo, ...rivales(yo, n - 1, otros, animalesLibres, coloresLibres)] });

  const empezar = () => {
    const limpio = { jugadores: [yo, ...otros].map((p, i) => ({ ...p, nombre: p.nombre.trim() || (i === 0 ? t("menu.tu") : NOMBRES_RIVALES[i - 1]) })), dificultad, modo };
    guardarConfig(limpio);
    onEmpezar(limpio);
  };

  return (
    <div className="menu-partida mp" style={{ "--jugador": yo.color } as CSSProperties}>
      <AvisoLogros color={yo.color} />

      <aside className="menu-tarjeta mp-ficha">
        <MuestraTapete className="mp-tapete-grande" animal={yo.animal} color={yo.color} tapete={yo.tapete} marco={yo.marco} titulo={yo.titulo} nombre={nombreVisible(yo.nombre.trim()) || t("menu.tu")} />
        <p className="mp-ficha-detalle">{t("menu.fichaDetalle", { animal: nombreAnimal(yo.animal), color: nombreColor(yo.color), tapete: nombreTapete(yo.tapete) })}</p>
        {!jugar && (
          <div className="mp-ficha-cifras">
            <button onClick={() => setPestana("records")}>
              <strong>{estadisticas.partidas}</strong>
              <span>{t("menu.cifraPartidas", { n: estadisticas.partidas })}</span>
            </button>
            <button onClick={() => setPestana("records")}>
              <strong>{estadisticas.ganadas}</strong>
              <span>{t("menu.cifraGanadas", { n: estadisticas.ganadas })}</span>
            </button>
            <button onClick={() => setPestana("logros")}>
              <strong>
                {conseguidos}/{estados.length}
              </strong>
              <span>{t("menu.cifraLogros")}</span>
            </button>
          </div>
        )}
        {jugar && (
          <button className="principal menu-empezar" onClick={empezar}>
            {t("menu.empezar")}
          </button>
        )}
        {jugar && onAprender && (
          <button className="menu-aprender" onClick={onAprender}>
            {t("portada.aprender")}
          </button>
        )}
      </aside>

      <section className="menu-tarjeta mp-contenido">
        {!jugar && (
          <nav className="mp-pestanas" role="tablist">
            {PESTANAS.filter((p) => p.id !== "partida").map((p) => (
              <button key={p.id} role="tab" aria-selected={pestana === p.id} className={pestana === p.id ? "activa" : ""} onClick={() => setPestana(p.id)}>
                <IconoPerfil icono={p.icono} />
                <span>{t(p.nombre)}</span>
                {p.id === "logros" && <small className="mp-pestana-num">{conseguidos}</small>}
              </button>
            ))}
          </nav>
        )}

        <div className="mp-panel" role="tabpanel">
          {pestana === "partida" && (
            <div className="mp-partida">
              <h2>{t("menu.cuantosJugais")}</h2>
              <div className="menu-cuantos">
                {[2, 3, 4].map((n) => (
                  <button key={n} className={config.jugadores.length === n ? "activa" : ""} onClick={() => cuantos(n)}>
                    {t("menu.jugadores", { n })}
                  </button>
                ))}
              </div>
              <h2>{t("menu.dificultad")}</h2>
              <div className="menu-cuantos menu-dificultad" role="group" aria-label={t("menu.dificultad")}>
                {DIFICULTADES.map((d) => (
                  <button key={d} className={dificultad === d ? "activa" : ""} aria-pressed={dificultad === d} onClick={() => cambiarConfig({ jugadores: config.jugadores, dificultad: d })}>
                    {t(`menu.dificultad.${d}`)}
                  </button>
                ))}
              </div>
              <p className="menu-ayuda-dificultad">{t(`menu.ayudaDificultad.${dificultad}`)}</p>
              <h2>{t("menu.modoJuego")}</h2>
              <div className="menu-cuantos menu-modo-juego" role="group" aria-label={t("menu.modoJuego")}>
                {MODOS_JUEGO.map((m) => (
                  <button key={m} className={modo === m ? "activa" : ""} aria-pressed={modo === m} onClick={() => cambiarConfig({ jugadores: config.jugadores, modo: m })}>
                    {t(`menu.modoJuego.${m}`)}
                  </button>
                ))}
              </div>
              <p className="menu-ayuda-dificultad">{t(`menu.ayudaModoJuego.${modo}`)}</p>
              <h2>{t("menu.rivales")}</h2>
              <div className="menu-rivales">
                {otros.map((o, i) => {
                  const usados = config.jugadores.filter((_, k) => k !== i + 1);
                  return (
                    <div key={i} className="menu-rival" style={{ "--jugador": o.color } as CSSProperties}>
                      <div className="menu-avatar pequeno">
                        <Animal id={o.animal} />
                      </div>
                      <div className="menu-rival-datos">
                        <input value={o.nombre} maxLength={16} onChange={(e) => cambiarRival(i, { nombre: e.target.value })} aria-label={t("menu.nombreRival")} />
                        <ElegirAnimal valor={o.animal} disponibles={animalesLibres} ocupados={usados.map((p) => p.animal)} onCambio={(animal) => cambiarRival(i, { animal })} />
                        <ElegirColor valor={o.color} disponibles={coloresLibres} ocupados={usados.map((p) => p.color)} onCambio={(color) => cambiarRival(i, { color })} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {pestana === "perfil" && <PanelPerfil yo={yo} hechos={hechos} onCambio={cambiarYo} />}
          {pestana === "records" && <PanelRecords e={estadisticas} />}
          {pestana === "logros" && <PanelLogros estados={estados} color={yo.color} />}
          {pestana === "amigos" && <PanelAmigos partidas={partidas} onAbrirSala={onAbrirSala} />}
        </div>
      </section>
    </div>
  );
}
