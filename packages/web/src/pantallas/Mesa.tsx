import { DndContext, DragOverlay, PointerSensor, pointerWithin, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { Jugada, Partida } from "@tendedero/motor";
import { useEffect, useState } from "react";
import { FichaCarta } from "../mesa/Carta";
import { ContextoMesa, jugadaDe, type Arrastre, type Destino } from "../mesa/contexto";
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
}

export function Mesa({ partida, nombreConfig, onJugada, puedeDeshacer, onDeshacer, onSalir }: Props) {
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Sin un pequeño margen de movimiento, cualquier clic sobre una prenda empezaría un arrastre.
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const jugar = (j: Jugada) => setAviso(onJugada(j));

  function alEmpezar(e: DragStartEvent) {
    setArrastre((e.active.data.current as Arrastre) ?? null);
  }

  function alSoltar(e: DragEndEvent) {
    const destino = e.over?.data.current as Destino | undefined;
    if (arrastre && destino) {
      const j = jugadaDe(arrastre, destino);
      if (j) jugar(j);
      else setAviso(arrastre.tipo === "prenda" ? "Las prendas se cuelgan en los espacios de tus cartas de cuerda." : "Las cuerdas van en el siguiente hueco de una de tus líneas.");
    }
    setArrastre(null);
  }

  const { turno, ajustes } = partida;
  const jugadorActivo = partida.jugadores[turno.jugador];

  return (
    <ContextoMesa.Provider value={{ partida, arrastre, jugar }}>
      <DndContext sensors={sensores} collisionDetection={pointerWithin} onDragStart={alEmpezar} onDragEnd={alSoltar} onDragCancel={() => setArrastre(null)}>
        <div className="mesa">
          <header className="barra">
            <div className="estado-turno">
              <span>
                <strong>Turno {turno.numero}</strong> · le toca a <strong>{jugadorActivo.nombre}</strong>
              </span>
              <span className="contadores">
                prendas cogidas {turno.drafts}/{ajustes.draftsPorTurno} · cuerdas jugadas {turno.cuerdasJugadas}/{ajustes.jugablesPorTurno.cuerdas}
              </span>
            </div>
            <div className="acciones-barra">
              <button className="principal" onClick={() => jugar({ tipo: "terminarTurno", jugador: turno.jugador })}>
                Terminar turno
              </button>
              <button disabled={!puedeDeshacer} onClick={onDeshacer}>
                Deshacer
              </button>
              <button onClick={onSalir}>Salir</button>
            </div>
            <div className="info-partida">
              {nombreConfig && <span>«{nombreConfig}» · </span>}
              semilla <code>{partida.semilla}</code>
            </div>
          </header>

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
          {arrastre?.tipo === "cuerda" && <FichaCarta partida={partida} id={arrastre.carta} />}
        </DragOverlay>
      </DndContext>
    </ContextoMesa.Provider>
  );
}
