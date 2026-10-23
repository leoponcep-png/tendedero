import { useState, type CSSProperties } from "react";
import { Animal, ANIMALES } from "./Animales";

// Menú antes de empezar: tu nombre, tu animal y tu color, cuántos jugadores sois y quiénes son los rivales.
// El perfil se recuerda en este navegador para la próxima partida.

export type Perfil = { nombre: string; animal: string; color: string };
export type ConfigPartida = { jugadores: Perfil[] };

export const COLORES_JUGADOR = ["#2f7a63", "#c4643d", "#3f6fb5", "#8e5bb5", "#d39a1b", "#c2457a"];
const NOMBRES_RIVALES = ["Lu", "Bruno", "Marta", "Nico"];

const unico = <T,>(usados: T[], lista: T[], preferido: T) => (usados.includes(preferido) ? (lista.find((x) => !usados.includes(x)) ?? preferido) : preferido);

/** Rivales por defecto sin repetir animal ni color con los que ya hay. */
function rivales(yo: Perfil, cuantos: number, previos: Perfil[] = []): Perfil[] {
  const lista: Perfil[] = [];
  for (let i = 0; i < cuantos; i++) {
    const usados = [yo, ...lista];
    const anterior = previos[i];
    lista.push({
      nombre: anterior?.nombre ?? NOMBRES_RIVALES[i],
      animal: unico(
        usados.map((p) => p.animal),
        ANIMALES.map((a) => a.id),
        anterior?.animal || ANIMALES[(i + 1) % ANIMALES.length].id,
      ),
      color: unico(
        usados.map((p) => p.color),
        COLORES_JUGADOR,
        anterior?.color || COLORES_JUGADOR[(i + 1) % COLORES_JUGADOR.length],
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
  const yo = { nombre: "Tú", animal: "raton", color: COLORES_JUGADOR[0] };
  return { jugadores: [yo, ...rivales(yo, 1)] };
}

function guardarConfig(c: ConfigPartida) {
  try {
    localStorage.setItem("tendedero-partida", JSON.stringify(c));
  } catch {
    // Solo se pierde el recuerdo para la próxima vez.
  }
}

function ElegirAnimal({ valor, ocupados, onCambio, pequeño }: { valor: string; ocupados: string[]; onCambio: (id: string) => void; pequeño?: boolean }) {
  return (
    <div className={`menu-animales ${pequeño ? "pequeno" : ""}`}>
      {ANIMALES.map((a) => (
        <button key={a.id} className={`menu-animal ${a.id === valor ? "activa" : ""}`} disabled={ocupados.includes(a.id) && a.id !== valor} onClick={() => onCambio(a.id)} title={a.nombre}>
          <Animal id={a.id} />
          {!pequeño && <span>{a.nombre}</span>}
        </button>
      ))}
    </div>
  );
}

function ElegirColor({ valor, ocupados, onCambio }: { valor: string; ocupados: string[]; onCambio: (c: string) => void }) {
  return (
    <div className="menu-colores">
      {COLORES_JUGADOR.map((c) => (
        <button
          key={c}
          className={c === valor ? "activa" : ""}
          style={{ background: c }}
          disabled={ocupados.includes(c) && c !== valor}
          onClick={() => onCambio(c)}
          aria-label="Color del jugador"
        />
      ))}
    </div>
  );
}

export function MenuPartida({ onEmpezar }: { onEmpezar: (c: ConfigPartida) => void }) {
  const [config, setConfig] = useState(leerConfig);
  const [yo, ...otros] = config.jugadores;

  const cambiarYo = (cambio: Partial<Perfil>) => {
    const nuevo = { ...yo, ...cambio };
    // Si tu animal o color nuevo lo tenía un rival, a ese rival se le da otro.
    setConfig({ jugadores: [nuevo, ...rivales(nuevo, otros.length, otros.map((o) => ({ ...o, animal: o.animal === nuevo.animal ? "" : o.animal, color: o.color === nuevo.color ? "" : o.color })))] });
  };
  const cambiarRival = (i: number, cambio: Partial<Perfil>) => setConfig({ jugadores: [yo, ...otros.map((o, k) => (k === i ? { ...o, ...cambio } : o))] });
  const cuantos = (n: number) => setConfig({ jugadores: [yo, ...rivales(yo, n - 1, otros)] });

  const empezar = () => {
    const limpio = { jugadores: config.jugadores.map((p, i) => ({ ...p, nombre: p.nombre.trim() || (i === 0 ? "Tú" : NOMBRES_RIVALES[i - 1]) })) };
    guardarConfig(limpio);
    onEmpezar(limpio);
  };

  return (
    <div className="menu-partida">
      <section className="menu-tarjeta menu-perfil" style={{ "--jugador": yo.color } as CSSProperties}>
        <h1>Tu perfil</h1>
        <div className="menu-perfil-cabeza">
          <div className="menu-avatar">
            <Animal id={yo.animal} />
          </div>
          <label className="menu-nombre">
            <span>Tu nombre en el juego</span>
            <input value={yo.nombre} maxLength={16} onChange={(e) => cambiarYo({ nombre: e.target.value })} placeholder="Tu nombre" />
          </label>
        </div>
        <h2>Elige tu animal</h2>
        <ElegirAnimal valor={yo.animal} ocupados={[]} onCambio={(animal) => cambiarYo({ animal })} />
        <h2>Tu color</h2>
        <ElegirColor valor={yo.color} ocupados={[]} onCambio={(color) => cambiarYo({ color })} />
      </section>

      <section className="menu-tarjeta menu-mesa">
        <h1>La partida</h1>
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
                  <input value={o.nombre} maxLength={16} onChange={(e) => cambiarRival(i, { nombre: e.target.value })} />
                  <ElegirAnimal pequeño valor={o.animal} ocupados={usados.map((p) => p.animal)} onCambio={(animal) => cambiarRival(i, { animal })} />
                  <ElegirColor valor={o.color} ocupados={usados.map((p) => p.color)} onCambio={(color) => cambiarRival(i, { color })} />
                </div>
              </div>
            );
          })}
        </div>
        <button className="principal menu-empezar" onClick={empezar}>
          Empezar partida
        </button>
      </section>
    </div>
  );
}
