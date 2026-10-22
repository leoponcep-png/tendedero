import { DndContext, DragOverlay, PointerSensor, pointerWithin, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import {
  cartaDeReaccion,
  cierraLaRonda,
  defCarta,
  efectoAccion,
  jugadorInicial,
  maxCuerdasRobadas,
  motivoInvalida,
  nombrePrenda,
  type Jugada,
  type JugadaDe,
  type Partida,
} from "@tendedero/motor";
import { useEffect, useState } from "react";
import { FichaCarta } from "../mesa/Carta";
import { admisible, ContextoMesa, jugadaDe, necesitaDestino, puedeJugarPor, type Arrastre, type Destino } from "../mesa/contexto";
import { Final } from "../mesa/Final";
import { FichaPrenda } from "../mesa/Prenda";
import { ZonaCentral } from "../mesa/ZonaCentral";
import { ZonaJugador } from "../mesa/ZonaJugador";

interface Props {
  partida: Partida;
  nombreConfig: string;
  /** Devuelve el motivo si la jugada no vale (online, el motivo llega después por `aviso`). */
  onJugada: (j: Jugada) => string | null;
  puedeDeshacer: boolean;
  onDeshacer: () => void;
  onSalir: () => void;
  onNueva: () => void;
  /** Online: el asiento de quien mira. Sin él, un mismo ordenador juega por todos (modo local). */
  miAsiento?: number;
  /** Online: estado de la conexión, que se muestra en la barra. */
  conexion?: React.ReactNode;
  /** Online: un aviso que llega del anfitrión (p. ej. una jugada rechazada). */
  avisoExterno?: string | null;
}

/** Qué pulsar para completar una acción de dos pasos. */
function textoSegundoPaso(p: Partida, j: JugadaDe<"jugarAccion">): string {
  const o = j.objetivo!;
  const cuerda = defCarta(p, p.jugadores[o.jugador].lineas[o.linea].cartas[o.posicion].carta).nombre;
  switch (efectoAccion(p, j.carta)?.blanco) {
    case "cambiarPrendas":
      return `Pulsa la prenda tuya con la que intercambiar ${nombrePrenda(p, o.prenda!)}.`;
    case "cambiarCuerdas":
      return `Pulsa otra carta de cuerda tuya para intercambiar lo colgado con ${cuerda}.`;
    case "moverCuerda":
      return `Pulsa otra carta de cuerda tuya para cambiarlas de sitio, o un hueco libre para llevar ${cuerda} al final de esa línea.`;
    default:
      return `Pulsa el espacio al que mover ${nombrePrenda(p, o.prenda!)}.`;
  }
}

/** El jugador atacado decide si anula el fastidio con su carta de reacción. */
function Reaccion({ partida, jugar, puede }: { partida: Partida; jugar: (j: Jugada) => void; puede: boolean }) {
  const { jugada, defensor } = partida.reaccion!;
  const atacante = partida.jugadores[jugada.jugador].nombre;
  const nombre = partida.jugadores[defensor].nombre;
  if (!puede) {
    return (
      <div className="franja-aviso reaccion">
        {atacante} le juega <strong>{defCarta(partida, jugada.carta).nombre}</strong> a {nombre}. Esperando a que {nombre} decida si lo anula…
      </div>
    );
  }
  const carta = cartaDeReaccion(partida, defensor);
  return (
    <div className="franja-aviso reaccion">
      <span>
        {atacante} le juega <strong>{defCarta(partida, jugada.carta).nombre}</strong> a {nombre}. {nombre}, ¿lo anulas con{" "}
        {carta ? defCarta(partida, carta).nombre : "tu carta de reacción"}?
      </span>
      <button className="principal" onClick={() => jugar({ tipo: "responder", jugador: defensor, anular: true })}>
        Sí, anularlo
      </button>
      <button onClick={() => jugar({ tipo: "responder", jugador: defensor, anular: false })}>No, dejarlo pasar</button>
    </div>
  );
}

const AYUDA_SOLTAR: Record<Arrastre["tipo"], string> = {
  prenda: "Las prendas se cuelgan en los espacios de tus cartas de cuerda.",
  cuerda: "Las cuerdas van en el siguiente hueco de una de tus líneas, o encima de una básica o vieja tuya para mejorarla.",
  accion: "Suelta la carta de acción sobre una carta de cuerda o una prenda colgada.",
};

function textoRobo(cuerdas: number, acciones: number): string {
  const parte = (n: number, una: string, varias: string) => `${n} ${n === 1 ? una : varias}`;
  return `${parte(cuerdas, "cuerda", "cuerdas")} + ${parte(acciones, "acción", "acciones")}`;
}

export function Mesa({ partida, nombreConfig, onJugada, puedeDeshacer, onDeshacer, onSalir, onNueva, miAsiento, conexion, avisoExterno }: Props) {
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [movimiento, setMovimiento] = useState<JugadaDe<"jugarAccion"> | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [verFinal, setVerFinal] = useState(true);
  // Cuántas de las cartas que se roban al terminar el turno son de cuerda.
  const [robarCuerdas, setRobarCuerdas] = useState(1);
  // Sin un pequeño margen de movimiento, cualquier clic sobre una prenda empezaría un arrastre.
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (avisoExterno) setAviso(avisoExterno);
  }, [avisoExterno]);

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
    // Las acciones de mover e intercambiar piden el destino en un segundo paso.
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
  const enReparto = turno.fase === "cesta" || turno.fase === "centro";
  const maxCuerdas = maxCuerdasRobadas(partida);
  const cuerdasElegidas = Math.min(robarCuerdas, maxCuerdas);
  const online = miAsiento !== undefined;
  const miTurno = puedeJugarPor({ miAsiento }, turno.jugador);
  // Online, tu tendedero va el primero.
  const orden = partida.jugadores.map((_, i) => i).sort((a, b) => Number(b === miAsiento) - Number(a === miAsiento));

  return (
    <ContextoMesa.Provider value={{ partida, arrastre, movimiento, jugar, miAsiento }}>
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
                  <strong>Ronda {partida.ronda}</strong> (abre {partida.jugadores[jugadorInicial(partida)].nombre}) ·{" "}
                  {enReparto ? `reparto de prendas, ${turno.fase === "cesta" ? "cestas" : "centro"}` : `turno ${turno.numero}`} · le toca a{" "}
                  <strong>{jugadorActivo.nombre}</strong>
                  {partida.ultimaRonda && <span className="etiqueta-ultima">última ronda</span>}
                </span>
              )}
              {!enReparto && (
                <span className="contadores">
                  cuerdas {turno.cuerdasJugadas}/
                  {ajustes.jugablesPorTurno.cuerdas + turno.cuerdasExtra} · acciones {turno.accionesJugadas}/{ajustes.jugablesPorTurno.acciones}
                </span>
              )}
            </div>
            <div className="acciones-barra">
              {partida.terminada ? (
                <button className="principal" onClick={() => setVerFinal(true)}>
                  Ver clasificación
                </button>
              ) : !miTurno ? (
                <span className="esperando">Esperando a {jugadorActivo.nombre}…</span>
              ) : (
                <>
                  <label className="elegir-robo">
                    Robar
                    <select value={cuerdasElegidas} onChange={(e) => setRobarCuerdas(Number(e.target.value))}>
                      {Array.from({ length: maxCuerdas + 1 }, (_, c) => maxCuerdas - c).map((c) => (
                        <option key={c} value={c}>
                          {textoRobo(c, ajustes.roboPorTurno.cartas - c)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="principal"
                    disabled={turno.fase !== "jugar" || partida.reaccion !== null}
                    onClick={() => jugar({ tipo: "terminarTurno", jugador: turno.jugador, cuerdas: cuerdasElegidas })}
                  >
                    {cierraLaRonda(partida, turno.jugador) ? "Terminar turno y acabar la ronda" : "Terminar turno"}
                  </button>
                </>
              )}
              {!online && (
                <button disabled={!puedeDeshacer} onClick={onDeshacer}>
                  Deshacer
                </button>
              )}
              <button onClick={partida.terminada ? onNueva : onSalir}>Salir</button>
            </div>
            <div className="info-partida">
              {conexion}
              {nombreConfig && <span>«{nombreConfig}» · </span>}
              {partida.semilla && (
                <>
                  semilla <code>{partida.semilla}</code>
                </>
              )}
            </div>
          </header>

          {!partida.terminada && turno.fase === "descartar" && (
            <div className="franja-aviso">
              {jugadorActivo.nombre} tiene {jugadorActivo.mano.length} cartas: descarta hasta quedarte con {ajustes.limiteMano}.
            </div>
          )}
          {!partida.terminada && enReparto && (
            <div className="franja-aviso">
              Reparto: {jugadorActivo.nombre} coge un color o un tipo {turno.fase === "cesta" ? "de una cesta (el resto va al centro)" : "del centro"}. Pulsa una prenda.
            </div>
          )}
          {movimiento && (
            <div className="franja-aviso">
              {textoSegundoPaso(partida, movimiento)}
              <button onClick={() => setMovimiento(null)}>Cancelar</button>
            </div>
          )}
          {partida.reaccion && <Reaccion partida={partida} jugar={jugar} puede={puedeJugarPor({ miAsiento }, partida.reaccion.defensor)} />}
          {aviso && <div className="aviso-jugada">{aviso}</div>}

          <div className="cuerpo-mesa">
            <div className="tablero">
              <ZonaCentral />
              <div className="jugadores">
                {orden.map((i) => (
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
