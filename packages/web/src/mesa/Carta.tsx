import { useDraggable } from "@dnd-kit/core";
import { defCarta, type Partida } from "@tendedero/motor";
import { useMesa } from "./contexto";

export function FichaCarta({ partida, id }: { partida: Partida; id: string }) {
  const def = defCarta(partida, id);
  return (
    <div className={`ficha-carta mazo-${def.mazo}`} title={def.texto}>
      <span className="tipo-carta">{def.mazo === "cuerdas" ? "Cuerda" : def.grupo}</span>
      <strong>{def.nombre}</strong>
      {def.texto && <small>{def.texto}</small>}
    </div>
  );
}

/** Carta en la mano. Las de cuerda se arrastran a un hueco del tendedero. */
export function CartaMano({ id, jugador, activa }: { id: string; jugador: number; activa: boolean }) {
  const { partida } = useMesa();
  const esCuerda = defCarta(partida, id).mazo === "cuerdas";
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `carta:${id}`,
    data: { tipo: "cuerda", jugador, carta: id },
    disabled: !activa || !esCuerda,
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`arrastrable ${isDragging ? "arrastrando" : ""} ${activa && esCuerda ? "" : "quieta"}`}>
      <FichaCarta partida={partida} id={id} />
    </div>
  );
}
