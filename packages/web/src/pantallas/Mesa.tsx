import { DndContext, DragOverlay, PointerSensor, pointerWithin, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { cierraLaRonda, jugadorInicial, motivoInvalida, nombrePrenda, type Jugada, type JugadaDe, type Partida } from "@tendedero/motor";
import { useEffect, useState } from "react";
import { FichaCarta } from "../mesa/Carta";
import { admisible, ContextoMesa, jugadaDe, necesitaDestino, type Arrastre, type Destino } from "../mesa/contexto";
import { Final } from "../mesa/Final";
import { FichaPrenda } from "../mesa/Prenda";
import { ZonaCentral } from "../mesa/ZonaCentral";
import { ZonaJugador } from "../mesa/ZonaJugador";

interface Props {
  partida: Partida;
  nombreConfig: string;
  onJugada: (j: Jugada) => string | null;
  puedeDeshacer: boolean;
  onDeshacer: () => void;
  onSalir: () => void;
  onNueva: () => void;
}

const AYUDA_SOLTAR: Record<Arrastre["tipo"], string> = {
  prenda: "Las prendas se cuelgan en los espacios de tus cartas de cuerda.",
  cuerda: "Las cuerdas van en el siguiente hueco de una de tus líneas.",
  accion: "Suelta la carta de acción sobre una carta de cuerda o una prenda colgada.",
};

export function Mesa({ partida, nombreConfig, onJugada, puedeDeshacer, onDeshacer, onSalir, onNueva }: Props) {
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [movimiento, setMovimiento] = useState<JugadaDe<"jugarAccion"> | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [verFinal, setVerFinal] = useState(true);
  // Sin un pequeño margen de movimiento, cualquier clic sobre una prenda empezaría un arrastre.
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  // Al deshacer o cambiar la partida, se cancela un movimiento a medias y vuelve a mostrarse el final.
  useEffect(() => {
    setMovimiento(null);
    if (partida.terminada) setVerFinal(true);
  }, [partida]);

  function jugar(j: Jugada) {
    // Las acciones de mover piden el destino en un segundo paso.
    if (necesitaDestino(partida, j)) {
      if (admisible(partida, j)) setMovimiento(j);
      else setAviso(motivoInvalida(partida, j));
      return;
    }
    setAviso(onJugada(j));
  }

  function alEmpezar(e: DragStartEvent) {
    setMovimiento(null);
    setArrastre((e.active.data.current as Arrastre) ?? null);
  }

  function alSoltar(e: DragEndEvent) {
    const destino = e.over?.data.current as Destino | undefined;
    if (arrastre && destino) {
      const j = jugadaDe(partida, arrastre, destino);
      if (j) jugar(j);
      else setAviso(AYUDA_SOLTAR[arrastre.tipo]);
    }
    setArrastre(null);
  }

  const { turno, ajustes } = partida;
  const jugadorActivo = partida.jugadores[turno.jugador];

  return (
    <ContextoMesa.Provider value={{ partida, arrastre, movimiento, jugar }}>
      <DndContext sensors={sensores} collisionDetection={pointerWithin} onDragStart={alEmpezar} onDragEnd={alSoltar} onDragCancel={() => setArrastre(null)}>
        <div className="mesa">
          <header className="barra">
            <div className="estado-turno">
              {partida.terminada ? (
                <span>
                  <strong>Partida terminada</strong> · {partida.final!.filter((r) => r.puesto === 1).map((r) => partida.jugadores[r.jugador].nombre).join(" y ")} gana
                </span>
              ) : (
                <span>
                  <strong>Ronda {partida.ronda}</strong> (abre {partida.jugadores[jugadorInicial(partida)].nombre}) · turno {turno.numero} · le toca a <strong>{jugadorActivo.nombre}</strong>
                  {partida.ultimaRonda && <span className="etiqueta-ultima">última ronda</span>}
                </span>
              )}
              <span className="contadores">
                prendas cogidas {turno.drafts}/{ajustes.draftsPorTurno} · cuerdas {turno.cuerdasJugadas}/
                {ajustes.jugablesPorTurno.cuerdas + turno.cuerdasExtra} · acciones {turno.accionesJugadas}/{ajustes.jugablesPorTurno.acciones}
              </span>
            </div>
            <div className="acciones-barra">
              {partida.terminada ? (
                <button className="principal" onClick={() => setVerFinal(true)}>
                  Ver clasificación
                </button>
              ) : (
                <button className="principal" disabled={turno.fase === "descartar"} onClick={() => jugar({ tipo: "terminarTurno", jugador: turno.jugador })}>
                  {cierraLaRonda(partida, turno.jugador) ? "Terminar turno y acabar la ronda" : "Terminar turno"}
                </button>
              )}
              <button disabled={!puedeDeshacer} onClick={onDeshacer}>
                Deshacer
              </button>
              <button onClick={partida.terminada ? onNueva : onSalir}>Salir</button>
            </div>
            <div className="info-partida">
              {nombreConfig && <span>«{nombreConfig}» · </span>}
              semilla <code>{partida.semilla}</code>
            </div>
          </header>

          {!partida.terminada && turno.fase === "descartar" && (
            <div className="franja-aviso">
              {jugadorActivo.nombre} tiene {jugadorActivo.mano.length} cartas: descarta hasta quedarte con {ajustes.limiteMano}.
            </div>
          )}
          {movimiento && (
            <div className="franja-aviso">
              Pulsa el espacio al que mover {nombrePrenda(partida, movimiento.objetivo!.prenda!)}.
              <button onClick={() => setMovimiento(null)}>Cancelar</button>
            </div>
          )}
          {aviso && <div className="aviso-jugada">{aviso}</div>}

          <div className="cuerpo-mesa">
            <div className="tablero">
              <ZonaCentral />
              <div className="jugadores">
                {partida.jugadores.map((_, i) => (
                  <ZonaJugador key={i} indice={i} />
                ))}
              </div>
            </div>
            <aside className="registro">
              <h3>Registro</h3>
              <ol reversed>
                {[...partida.registro].reverse().map((linea, i) => (
                  <li key={partida.registro.length - i} className={linea.startsWith("—") ? "separador-turno" : ""}>
                    {linea}
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {arrastre?.tipo === "prenda" && <FichaPrenda partida={partida} id={arrastre.prenda} />}
          {arrastre && arrastre.tipo !== "prenda" && <FichaCarta partida={partida} id={arrastre.carta} />}
        </DragOverlay>
      </DndContext>

      {partida.terminada && verFinal && <Final partida={partida} onCerrar={() => setVerFinal(false)} onNueva={onNueva} />}
    </ContextoMesa.Provider>
  );
}
