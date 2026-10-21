import { useDroppable } from "@dnd-kit/core";
import { defCarta, esValida, tipoDe, type CartaTendida } from "@tendedero/motor";
import { useAdmite, useMesa, type Destino } from "./contexto";
import { FichaPrenda } from "./Prenda";

export function Tendedero({ jugador }: { jugador: number }) {
  const { partida } = useMesa();
  return (
    <div className="tendedero">
      {partida.jugadores[jugador].lineas.map((_, l) => (
        <Linea key={l} jugador={jugador} indice={l} />
      ))}
    </div>
  );
}

function Linea({ jugador, indice }: { jugador: number; indice: number }) {
  const { partida } = useMesa();
  const linea = partida.jugadores[jugador].lineas[indice];
  const libres = partida.ajustes.tendedero.cartasPorLinea - linea.cartas.length;
  return (
    <div className="linea">
      <div className="poste" title="Tablero de inicio">
        <span>{indice + 1}</span>
      </div>
      {linea.cartas.map((t, pos) => (
        <CartaEnLinea key={t.carta} jugador={jugador} linea={indice} posicion={pos} tendida={t} />
      ))}
      {libres > 0 && <Hueco jugador={jugador} linea={indice} />}
      {Array.from({ length: Math.max(0, libres - 1) }, (_, i) => (
        <div key={i} className="hueco vacio" />
      ))}
    </div>
  );
}

function Hueco({ jugador, linea }: { jugador: number; linea: number }) {
  const destino: Destino = { tipo: "hueco", jugador, linea };
  const { setNodeRef, isOver } = useDroppable({ id: `hueco:${jugador}:${linea}`, data: destino });
  const admite = useAdmite(destino);
  return (
    <div ref={setNodeRef} className={`hueco siguiente ${admite ? "admite" : ""} ${isOver ? "encima" : ""}`}>
      <span>cuerda aquí</span>
    </div>
  );
}

function CartaEnLinea({ jugador, linea, posicion, tendida }: { jugador: number; linea: number; posicion: number; tendida: CartaTendida }) {
  const { partida, movimiento } = useMesa();
  const def = defCarta(partida, tendida.carta);
  return (
    <div className={`carta-cuerda mazo-${def.mazo} ${tendida.protegida ? "protegida" : ""}`} title={def.texto}>
      <div className="nombre-cuerda">
        {def.nombre}
        {tendida.protegida && <span title="Protegida hasta el próximo turno de su dueño"> · protegida</span>}
      </div>
      <div className="espacios" style={{ gridTemplateColumns: `repeat(${def.espacios}, var(--celda))` }}>
        {Array.from({ length: def.espacios }, (_, i) => (
          <Espacio key={i} destino={{ tipo: "espacio", jugador, linea, posicion, inicio: i }} />
        ))}
        {tendida.colgadas.map((c) => (
          <div
            key={c.prenda}
            className={`colgada ${movimiento?.objetivo?.prenda === c.prenda ? "moviendo" : ""}`}
            style={{ gridColumn: `${c.inicio + 1} / span ${tipoDe(partida, c.prenda).espacios}` }}
          >
            <FichaPrenda partida={partida} id={c.prenda} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Espacio({ destino }: { destino: Destino & { tipo: "espacio" } }) {
  const { partida, movimiento, jugar } = useMesa();
  const { setNodeRef, isOver } = useDroppable({
    id: `espacio:${destino.jugador}:${destino.linea}:${destino.posicion}:${destino.inicio}`,
    data: destino,
  });
  const admite = useAdmite(destino);

  // Segundo paso de una acción de mover: se pulsa el espacio de destino.
  const { linea, posicion, inicio } = destino;
  const movida =
    movimiento && movimiento.objetivo?.jugador === destino.jugador
      ? { ...movimiento, objetivo: { ...movimiento.objetivo, destino: { linea, posicion, inicio } } }
      : null;
  const destinoValido = movida !== null && esValida(partida, movida);

  return (
    <div
      ref={setNodeRef}
      className={`espacio ${admite || destinoValido ? "admite" : ""} ${isOver ? "encima" : ""} ${destinoValido ? "pulsable" : ""}`}
      style={{ gridColumn: destino.inicio + 1 }}
      onClick={destinoValido ? () => jugar(movida) : undefined}
    >
      <span className="pinza" />
    </div>
  );
}
