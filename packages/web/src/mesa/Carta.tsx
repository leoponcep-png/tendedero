import { useDraggable } from "@dnd-kit/core";
import { defCarta, efectoAccion, esValida, type Partida } from "@tendedero/motor";
import { useMesa } from "./contexto";

export function FichaCarta({ partida, id }: { partida: Partida; id: string }) {
  const def = defCarta(partida, id);
  return (
    <div className={`ficha-carta mazo-${def.mazo}`} title={def.texto}>
      <span className="tipo-carta">{def.mazo === "cuerdas" ? `Cuerda · ${def.grupo}` : def.grupo}</span>
      <strong>{def.nombre}</strong>
      {def.texto && <small>{def.texto}</small>}
    </div>
  );
}

/**
 * Carta en la mano. Las cuerdas se arrastran a un hueco del tendedero; las acciones, sobre
 * su objetivo (o se juegan con el botón si no lo necesitan). Al pasarse del límite, se descartan.
 */
export function CartaMano({ id, jugador, activa }: { id: string; jugador: number; activa: boolean }) {
  const { partida, jugar } = useMesa();
  const def = defCarta(partida, id);
  const descartando = activa && partida.turno.fase === "descartar";
  const sinObjetivo = def.mazo === "acciones" && efectoAccion(partida, id)?.blanco === "ninguno";
  const arrastrable = activa && !descartando && !sinObjetivo && partida.turno.fase === "jugar";
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
