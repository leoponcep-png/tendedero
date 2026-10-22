import { useDraggable } from "@dnd-kit/core";
import { defCarta, efectoAccion, esValida, OCULTA, type Partida } from "@tendedero/motor";
import { IconoCarta } from "../arte/Iconos";
import { useMesa } from "./contexto";

const NOMBRE_MAZO: Record<string, string> = { cuerdas: "Cuerda", acciones: "Acción", dia: "Día" };

export function FichaCarta({ partida, id }: { partida: Partida; id: string }) {
  // En el modo online, las cartas de los rivales llegan tapadas.
  if (id === OCULTA) return <DorsoCarta />;
  const def = defCarta(partida, id);
  return (
    <div className={`ficha-carta mazo-${def.mazo}`} title={def.texto}>
      <span className="tipo-carta">
        {NOMBRE_MAZO[def.mazo] ?? def.mazo} · {def.grupo}
      </span>
      <IconoCarta id={def.id} efecto={def.efecto} />
      <strong>{def.nombre}</strong>
      {def.texto && <small>{def.texto}</small>}
    </div>
  );
}

export function DorsoCarta() {
  return (
    <div className="ficha-carta dorso" title="Carta tapada">
      <span>Tendedero</span>
    </div>
  );
}

/**
 * Carta en la mano. Las cuerdas se arrastran a un hueco del tendedero; las acciones, sobre
 * su objetivo (o se juegan con el botón si no lo necesitan). Al pasarse del límite, se descartan.
 */
export function CartaMano(props: { id: string; jugador: number; activa: boolean }) {
  // Online, la mano de un rival llega tapada.
  if (props.id === OCULTA) {
    return (
      <div className="carta-mano">
        <DorsoCarta />
      </div>
    );
  }
  return <CartaManoVisible {...props} />;
}

function CartaManoVisible({ id, jugador, activa }: { id: string; jugador: number; activa: boolean }) {
  const { partida, jugar } = useMesa();
  const def = defCarta(partida, id);
  const descartando = activa && partida.turno.fase === "descartar";
  const blanco = def.mazo === "acciones" ? efectoAccion(partida, id)?.blanco : undefined;
  const sinObjetivo = blanco === "ninguno";
  // Las de reacción no se juegan en tu turno: se ofrecen cuando un rival te lanza un fastidio.
  const arrastrable = activa && !descartando && !sinObjetivo && blanco !== "reaccion" && partida.turno.fase === "jugar";
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `carta:${id}`,
    data: { tipo: def.mazo === "cuerdas" ? "cuerda" : "accion", jugador, carta: id },
    disabled: !arrastrable,
  });

  return (
    <div className="carta-mano">
      <div ref={setNodeRef} {...listeners} {...attributes} className={`arrastrable ${isDragging ? "arrastrando" : ""} ${arrastrable ? "" : "quieta"}`}>
        <FichaCarta partida={partida} id={id} />
      </div>
      {descartando && (
        <button className="boton-carta" onClick={() => jugar({ tipo: "descartar", jugador, carta: id })}>
          Descartar
        </button>
      )}
      {activa && !descartando && sinObjetivo && (
        <button
          className="boton-carta principal"
          disabled={!esValida(partida, { tipo: "jugarAccion", jugador, carta: id })}
          onClick={() => jugar({ tipo: "jugarAccion", jugador, carta: id })}
        >
          Jugar
        </button>
      )}
    </div>
  );
}
