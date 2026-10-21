import { useDraggable } from "@dnd-kit/core";
import { nombrePrenda, tipoDe, type Partida } from "@tendedero/motor";
import { useMesa } from "./contexto";

// Siluetas por id de tipo. Un tipo nuevo en prendas.json sin silueta se dibuja como un círculo.
const SILUETAS: Record<string, string> = {
  calcetin: "M8 2h7v10l4 3.5c2 2 1.2 5.5-1.6 6.2-1.4.4-2.8-.1-3.9-1.1L8.6 15.6C8.2 15.2 8 14.6 8 14z",
  camiseta: "M8.5 3 3 6l-1.5 4.5 3.5 1.5 1.2-2V21h11.6V10l1.2 2 3.5-1.5L21 6l-5.5-3c-.6 1.8-1.9 2.8-3.5 2.8S9.1 4.8 8.5 3z",
  toalla: "M4 3h16v18H4z",
};

export function Silueta({ tipo, color }: { tipo: string; color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="silueta" aria-hidden>
      {SILUETAS[tipo] ? <path d={SILUETAS[tipo]} fill={color} /> : <circle cx="12" cy="12" r="8" fill={color} />}
      {tipo === "toalla" && <path d="M4 16.5h16M4 18.5h16" className="rayas" />}
    </svg>
  );
}

/** Dibujo de una prenda con su humedad. `ancho="espacios"` la hace tan ancha como los espacios que ocupa. */
export function FichaPrenda({ partida, id, ancho = "espacios" }: { partida: Partida; id: string; ancho?: "espacios" | "mini" }) {
  const prenda = partida.prendas[id];
  const tipo = tipoDe(partida, id);
  const color = partida.catalogo.colores[prenda.color];
  return (
    <div
      className={`ficha-prenda ${ancho}`}
      style={ancho === "espacios" ? { width: `calc(${tipo.espacios} * var(--celda) - 6px)` } : undefined}
      title={`${nombrePrenda(partida, id)} · ${tipo.espacios} esp. · humedad ${prenda.humedad} · ${tipo.puntos} pts`}
    >
      <Silueta tipo={prenda.tipo} color={color.hex} />
      <span className="humedad" title="Humedad">
        {prenda.humedad}
      </span>
    </div>
  );
}

export function PrendaArrastrable({ id, jugador, activa }: { id: string; jugador: number; activa: boolean }) {
  const { partida } = useMesa();
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `prenda:${id}`,
    data: { tipo: "prenda", jugador, prenda: id },
    disabled: !activa,
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`arrastrable ${isDragging ? "arrastrando" : ""} ${activa ? "" : "quieta"}`}>
      <FichaPrenda partida={partida} id={id} />
    </div>
  );
}
