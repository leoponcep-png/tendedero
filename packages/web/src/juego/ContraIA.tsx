// Partida contra la IA: tú juegas en el asiento 0 y los demás asientos los juega el motor (src/ia.ts) paso a
// paso, con una pausa entre jugada y jugada y esperando a que la mesa acabe de animar la anterior.

import { ajustesIniciales, aplicar, cestasPorDefecto, crearPartida, siguienteJugadaIA, vistaPara, type Datos, type Dificultad, type Jugada, type Partida } from "@tendedero/motor";
import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n";
import type { Perfil } from "../prototipos/MenuPartida";
import { MesaJuego } from "./MesaJuego";

interface Estado {
  partida: Partida;
  ultima: { jugada: Jugada; n: number } | null;
}

function nuevaPartida(datos: Datos, perfiles: Perfil[]): Estado {
  const base = ajustesIniciales(datos);
  const n = perfiles.length;
  const partida = crearPartida(datos, { ...base, jugadores: n, cestas: { ...base.cestas, numero: cestasPorDefecto(datos, n) } });
  perfiles.forEach((pf, i) => (partida.jugadores[i].nombre = pf.nombre));
  return { partida, ultima: null };
}

// La partida en curso se guarda en esta pestaña: recargar la página no te saca de ella.
const CLAVE = "tendedero-partida-ia";

export function partidaGuardada(): { perfiles: Perfil[]; partida: Partida; dificultad?: Dificultad } | null {
  try {
    const t = sessionStorage.getItem(CLAVE);
    return t ? (JSON.parse(t) as { perfiles: Perfil[]; partida: Partida; dificultad?: Dificultad }) : null;
  } catch {
    return null;
  }
}

function guardarPartida(perfiles: Perfil[], partida: Partida | null, dificultad?: Dificultad) {
  try {
    if (partida && !partida.terminada) sessionStorage.setItem(CLAVE, JSON.stringify({ perfiles, partida, dificultad }));
    else sessionStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento, recargar empieza de nuevo.
  }
}

/** El asiento de la IA que tiene que hacer algo ahora, si hay alguno (tú eres el 0). */
function quienJuegaIA(p: Partida): number | null {
  if (p.terminada) return null;
  const sinObjetivo = p.jugadores.findIndex((j, i) => i !== 0 && j.objetivosOfrecidos.length > 0);
  if (sinObjetivo >= 0) return sinObjetivo;
  // Hasta que no elijas tu objetivo no empieza nadie.
  if (p.jugadores[0].objetivosOfrecidos.length > 0) return null;
  if (p.reaccion) return p.reaccion.defensor !== 0 ? p.reaccion.defensor : null;
  return p.turno.jugador !== 0 ? p.turno.jugador : null;
}

/** Pausa antes de cada jugada de la IA, para que se pueda seguir lo que hace. */
function pausa(p: Partida): number {
  if (p.reaccion) return 900;
  if (p.turno.fase === "cesta" || p.turno.fase === "centro") return 650;
  return 800;
}

/** `dificultad`: nivel de la IA de los rivales (sin ella, «normal»). */
export function PartidaContraIA({ datos, perfiles, dificultad, onSalir }: { datos: Datos; perfiles: Perfil[]; dificultad?: Dificultad; onSalir: () => void }) {
  const [estado, setEstado] = useState<Estado>(() => {
    const g = partidaGuardada();
    return g && g.partida.jugadores.length === perfiles.length ? { partida: g.partida, ultima: null } : nuevaPartida(datos, perfiles);
  });
  const actual = useRef(estado);
  actual.current = estado;
  const [ocupada, setOcupada] = useState(false);
  const [partidaN, setPartidaN] = useState(0);

  function jugar(j: Jugada): string | null {
    const r = aplicar(actual.current.partida, j);
    if (!r.ok) return r.motivo;
    const nuevo = { partida: r.partida, ultima: { jugada: j, n: (actual.current.ultima?.n ?? 0) + 1 } };
    actual.current = nuevo;
    setEstado(nuevo);
    return null;
  }

  useEffect(() => guardarPartida(perfiles, estado.partida, dificultad), [perfiles, estado.partida, dificultad]);

  // La IA juega cuando la mesa está quieta y le toca a uno de sus asientos.
  useEffect(() => {
    if (ocupada) return;
    const quien = quienJuegaIA(estado.partida);
    if (quien === null) return;
    const t = setTimeout(() => {
      const p = actual.current.partida;
      let j: Jugada | null = null;
      try {
        j = siguienteJugadaIA(p, quien, { dificultad });
      } catch (e) {
        console.error(e);
      }
      // Si algo falla, que al menos pase el turno para que la partida no se quede parada.
      if (!j || jugar(j)) {
        if (p.turno.jugador === quien && p.turno.fase === "jugar") jugar({ tipo: "terminarTurno", jugador: quien, cuerdas: 0 });
      }
    }, pausa(estado.partida));
    return () => clearTimeout(t);
  }, [estado, ocupada]);

  // Lo que ves es lo mismo que vería un jugador online: sin las manos de la IA.
  const vista = useMemo(() => vistaPara(estado.partida, 0), [estado.partida]);

  return (
    <MesaJuego
      key={partidaN}
      partida={vista}
      ultima={estado.ultima}
      perfiles={perfiles}
      miAsiento={0}
      modo="ia"
      dificultad={dificultad}
      onJugada={jugar}
      onOcupado={setOcupada}
      onSalir={() => {
        if (estado.partida.terminada || confirm(t("mesa.confirmarAbandonar"))) {
          guardarPartida(perfiles, null);
          onSalir();
        }
      }}
      onNueva={() => {
        const nuevo = nuevaPartida(datos, perfiles);
        actual.current = nuevo;
        setEstado(nuevo);
        setOcupada(false);
        setPartidaN((n) => n + 1);
      }}
    />
  );
}
