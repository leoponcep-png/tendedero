import { useDraggable } from "@dnd-kit/core";
import { nombrePrenda, tipoDe, type Partida } from "@tendedero/motor";
import { ArtePrenda } from "../arte/Prendas";
import { useMesa } from "./contexto";

/**
 * Prenda ilustrada con su humedad (en gotas). `ancho="espacios"` la dibuja tan ancha como los huecos que ocupa,
 * con sus pinzas; `"mini"`, en pequeño para cestas, centro y ropa seca.
 */
export function FichaPrenda({
  partida,
  id,
  ancho = "espacios",
  pinzaColor,
}: {
  partida: Partida;
  id: string;
  ancho?: "espacios" | "mini";
  pinzaColor?: string;
}) {
  const prenda = partida.prendas[id];
  const tipo = tipoDe(partida, id);
  const color = partida.catalogo.colores[prenda.color];
  const seca = prenda.humedad <= 0;
  return (
    <div
      className={`ficha-prenda ${ancho}`}
      style={ancho === "espacios" ? { width: `calc(${tipo.espacios} * var(--celda) - 4px)` } : { width: `calc(${tipo.espacios} * 26px)` }}
      title={`${nombrePrenda(partida, id)} · ${tipo.espacios} hueco${tipo.espacios === 1 ? "" : "s"} · humedad ${prenda.humedad} · ${tipo.puntos} pts`}
    >
      <ArtePrenda
        tipo={prenda.tipo}
        color={color.hex}
        espacios={tipo.espacios}
        humedad={seca || ancho === "mini" ? undefined : prenda.humedad}
        pinzaColor={pinzaColor}
        conPinzas={ancho === "espacios"}
        className="arte-prenda"
      />
      {ancho === "mini" && !seca && <span className="humedad-mini">{prenda.humedad}</span>}
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
