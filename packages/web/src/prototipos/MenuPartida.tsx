import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Animal, ANIMALES } from "./Animales";
import { AvisoLogros } from "./perfil/AvisoLogros";
import { COLORES, nombreColor, nombreTapete } from "./perfil/catalogo";
import { MuestraTapete } from "./perfil/Comunes";
import { calcularEstadisticas } from "./perfil/estadisticas";
import { IconoPerfil, type Icono } from "./perfil/Iconos";
import { actualizarLogros, bloqueo, estadoLogros, EVENTO_LOGRO, logrosConseguidos } from "./perfil/logros";
import { PanelAmigos } from "./perfil/PanelAmigos";
import { PanelLogros } from "./perfil/PanelLogros";
import { PanelPerfil } from "./perfil/PanelPerfil";
import { PanelRecords } from "./perfil/PanelRecords";
import { leerPartidas } from "./perfil/registro";
import "./perfil/perfil.css";
import "./tapetes.css";

// Menú antes de empezar, con pestañas: la partida (cuántos jugáis y quiénes son los rivales), tu perfil
// (nombre, animal, color y tapete), tus récords, tus logros y tus amigos. Todo se recuerda en este navegador.

/** `tapete`: diseño de tapete elegido (desbloqueable); el color del tapete sale de `color`. */
export type Perfil = { nombre: string; animal: string; color: string; tapete?: string };
export type ConfigPartida = { jugadores: Perfil[] };

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
  const yo = { nombre: "Tú", animal: "raton", color: COLORES_JUGADOR[0], tapete: "basico" };
  return { jugadores: [yo, ...rivales(yo, 1)] };
}

/** Si en la configuración guardada hay algo aún bloqueado (p. ej. se borraron los logros), se cambia por algo libre. */
function sinBloqueados(c: ConfigPartida, hechos: Record<string, string>): ConfigPartida {
  const animales = ANIMALES.map((a) => a.id).filter((id) => !bloqueo("animal", id, hechos));
  const colores = COLORES_JUGADOR.filter((v) => !bloqueo("color", v, hechos));
  const [yo, ...otros] = c.jugadores;
  const limpio: Perfil = {
    ...yo,
    animal: animales.includes(yo.animal) ? yo.animal : animales[0],
    color: colores.includes(yo.color) ? yo.color : colores[0],
    tapete: yo.tapete && !bloqueo("tapete", yo.tapete, hechos) ? yo.tapete : "basico",
  };
  const previos = otros.map((o) => ({ ...o, animal: animales.includes(o.animal) && o.animal !== limpio.animal ? o.animal : "", color: colores.includes(o.color) && o.color !== limpio.color ? o.color : "" }));
  return { jugadores: [limpio, ...rivales(limpio, otros.length, previos, animales, colores)] };
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
        <button key={a.id} className={`menu-animal ${a.id === valor ? "activa" : ""}`} disabled={ocupados.includes(a.id) && a.id !== valor} onClick={() => onCambio(a.id)} title={a.nombre}>
          <Animal id={a.id} />
        </button>
      ))}
    </div>
  );
}

function ElegirColor({ valor, ocupados, disponibles, onCambio }: { valor: string; ocupados: string[]; disponibles: string[]; onCambio: (c: string) => void }) {
  return (
    <div className="menu-colores">
      {disponibles.map((c) => (
        <button key={c} className={c === valor ? "activa" : ""} style={{ background: c }} disabled={ocupados.includes(c) && c !== valor} onClick={() => onCambio(c)} aria-label={nombreColor(c)} title={nombreColor(c)} />
      ))}
    </div>
  );
}

type Pestana = "partida" | "perfil" | "records" | "logros" | "amigos";
const PESTANAS: { id: Pestana; nombre: string; icono: Icono }[] = [
  { id: "partida", nombre: "Partida", icono: "cesta" },
  { id: "perfil", nombre: "Perfil", icono: "perfil" },
  { id: "records", nombre: "Récords", icono: "grafica" },
  { id: "logros", nombre: "Logros", icono: "medalla" },
  { id: "amigos", nombre: "Amigos", icono: "amigos" },
];

/**
 * `onAbrirSala` (opcional): si se pasa, las invitaciones de la pestaña Amigos muestran «Abrir la sala» con el
 * código creado (el enlace que se comparte es #/sala/código).
 */
export function MenuPartida({ onEmpezar, onAbrirSala }: { onEmpezar: (c: ConfigPartida) => void; onAbrirSala?: (codigo: string) => void }) {
  const [pestana, setPestana] = useState<Pestana>("partida");
  // Al abrir el menú se ponen al día los logros con las partidas guardadas (los nuevos salen en el aviso).
  const [partidas, setPartidas] = useState(() => {
    const lista = leerPartidas();
    actualizarLogros(lista);
    return lista;
  });
  const [hechos, setHechos] = useState(logrosConseguidos);
  const [config, setConfig] = useState(() => sinBloqueados(leerConfig(), logrosConseguidos()));
  const [yo, ...otros] = config.jugadores;

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

  const cambiarConfig = (c: ConfigPartida) => {
    setConfig(c);
    guardarConfig(c);
  };
  const cambiarYo = (cambio: Partial<Perfil>) => {
    const nuevo = { ...yo, ...cambio };
    // Si tu animal o color nuevo lo tenía un rival, a ese rival se le da otro.
    const previos = otros.map((o) => ({ ...o, animal: o.animal === nuevo.animal ? "" : o.animal, color: o.color === nuevo.color ? "" : o.color }));
    cambiarConfig({ jugadores: [nuevo, ...rivales(nuevo, otros.length, previos, animalesLibres, coloresLibres)] });
  };
  const cambiarRival = (i: number, cambio: Partial<Perfil>) => cambiarConfig({ jugadores: [yo, ...otros.map((o, k) => (k === i ? { ...o, ...cambio } : o))] });
  const cuantos = (n: number) => cambiarConfig({ jugadores: [yo, ...rivales(yo, n - 1, otros, animalesLibres, coloresLibres)] });

  const empezar = () => {
    const limpio = { jugadores: config.jugadores.map((p, i) => ({ ...p, nombre: p.nombre.trim() || (i === 0 ? "Tú" : NOMBRES_RIVALES[i - 1]) })) };
    guardarConfig(limpio);
    onEmpezar(limpio);
  };

  return (
    <div className="menu-partida mp" style={{ "--jugador": yo.color } as CSSProperties}>
      <AvisoLogros color={yo.color} />

      <aside className="menu-tarjeta mp-ficha">
        <MuestraTapete className="mp-tapete-grande" animal={yo.animal} color={yo.color} tapete={yo.tapete} nombre={yo.nombre.trim() || "Tú"} />
        <p className="mp-ficha-detalle">
          {ANIMALES.find((a) => a.id === yo.animal)?.nombre} · {nombreColor(yo.color)} · Tapete {nombreTapete(yo.tapete).toLowerCase()}
        </p>
        <button className="mp-ficha-editar" onClick={() => setPestana("perfil")}>
          Cambiar personaje y tapete
        </button>
        <div className="mp-ficha-cifras">
          <button onClick={() => setPestana("records")}>
            <strong>{estadisticas.partidas}</strong>
            <span>partidas</span>
          </button>
          <button onClick={() => setPestana("records")}>
            <strong>{estadisticas.ganadas}</strong>
            <span>ganadas</span>
          </button>
          <button onClick={() => setPestana("logros")}>
            <strong>
              {conseguidos}/{estados.length}
            </strong>
            <span>logros</span>
          </button>
        </div>
        <button className="principal menu-empezar" onClick={empezar}>
          Empezar partida
        </button>
      </aside>

      <section className="menu-tarjeta mp-contenido">
        <nav className="mp-pestanas" role="tablist">
          {PESTANAS.map((p) => (
            <button key={p.id} role="tab" aria-selected={pestana === p.id} className={pestana === p.id ? "activa" : ""} onClick={() => setPestana(p.id)}>
              <IconoPerfil icono={p.icono} />
              <span>{p.nombre}</span>
              {p.id === "logros" && <small className="mp-pestana-num">{conseguidos}</small>}
            </button>
          ))}
        </nav>

        <div className="mp-panel" role="tabpanel">
          {pestana === "partida" && (
            <div className="mp-partida">
              <h2>¿Cuántos jugáis?</h2>
              <div className="menu-cuantos">
                {[2, 3, 4].map((n) => (
                  <button key={n} className={config.jugadores.length === n ? "activa" : ""} onClick={() => cuantos(n)}>
                    {n} jugadores
                  </button>
                ))}
              </div>
              <h2>Rivales</h2>
              <div className="menu-rivales">
                {otros.map((o, i) => {
                  const usados = config.jugadores.filter((_, k) => k !== i + 1);
                  return (
                    <div key={i} className="menu-rival" style={{ "--jugador": o.color } as CSSProperties}>
                      <div className="menu-avatar pequeno">
                        <Animal id={o.animal} />
                      </div>
                      <div className="menu-rival-datos">
                        <input value={o.nombre} maxLength={16} onChange={(e) => cambiarRival(i, { nombre: e.target.value })} aria-label="Nombre del rival" />
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
