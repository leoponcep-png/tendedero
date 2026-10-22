import { useDroppable } from "@dnd-kit/core";
import { defCarta, efectoDeCuerda, rondasHastaRomperse, tipoDe, type CartaTendida, type Partida } from "@tendedero/motor";
import { ArteCuerda, ArtePoste } from "../arte/Escena";
import { movidaHacia, useAdmite, useMesa, type Destino } from "./contexto";
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
        <ArtePoste numero={indice + 1} />
      </div>
      {linea.cartas.map((t, pos) => (
        <CartaEnLinea key={t.carta} jugador={jugador} linea={indice} posicion={pos} tendida={t} />
      ))}
      {libres > 0 && <Hueco jugador={jugador} linea={indice} posicion={linea.cartas.length} />}
      {Array.from({ length: Math.max(0, libres - 1) }, (_, i) => (
        <div key={i} className="hueco vacio" />
      ))}
    </div>
  );
}

function Hueco({ jugador, linea, posicion }: { jugador: number; linea: number; posicion: number }) {
  const { partida, movimiento, jugar } = useMesa();
  const destino: Destino = { tipo: "hueco", jugador, linea };
  const { setNodeRef, isOver } = useDroppable({ id: `hueco:${jugador}:${linea}`, data: destino });
  const admite = useAdmite(destino);
  // Segundo paso de «Mover cuerda»: se pulsa el hueco adonde llevarla.
  const movida = movidaHacia(partida, movimiento, jugador, { linea, posicion, inicio: 0 });
  return (
    <div
      ref={setNodeRef}
      className={`hueco siguiente ${admite || movida ? "admite" : ""} ${isOver ? "encima" : ""} ${movida ? "pulsable" : ""}`}
      onClick={movida ? () => jugar(movida) : undefined}
    >
      <span>cuerda aquí</span>
    </div>
  );
}

/** Lo que conviene saber de una carta tendida: si la cubre un tejadillo, si se va a romper. */
function avisos(partida: Partida, jugador: number, linea: number, posicion: number, tendida: CartaTendida): string[] {
  const lista: string[] = [];
  if (tendida.protegida) lista.push("protegida");
  const arriba = partida.jugadores[jugador].lineas[linea - 1]?.cartas[posicion];
  if (arriba && efectoDeCuerda(partida, arriba.carta)?.efecto.cubreAbajo?.length) lista.push("bajo techo");
  const quedan = rondasHastaRomperse(partida, tendida);
  if (quedan !== null) lista.push(quedan <= 1 ? "se rompe al acabar la ronda" : `se rompe en ${quedan} rondas`);
  return lista;
}

function CartaEnLinea({ jugador, linea, posicion, tendida }: { jugador: number; linea: number; posicion: number; tendida: CartaTendida }) {
  const { partida, movimiento, jugar } = useMesa();
  const def = defCarta(partida, tendida.carta);
  const o = movimiento?.objetivo;
  const elegida = o && !o.prenda && o.jugador === jugador && o.linea === linea && o.posicion === posicion;
  const notas = avisos(partida, jugador, linea, posicion, tendida);
  const rompe = rondasHastaRomperse(partida, tendida) !== null;
  // Las cuerdas de pinzas de color pintan sus pinzas de ese color.
  const colorPinzas = def.efecto === "modificador-puntuacion" ? partida.catalogo.colores[String(def.parametros.color)]?.hex : undefined;
  return (
    <div className={`carta-cuerda mazo-${def.mazo} ${tendida.protegida ? "protegida" : ""} ${elegida ? "moviendo" : ""} ${rompe ? "fragil" : ""}`} title={def.texto}>
      <ArteCuerda efecto={def.efecto} espacios={def.espacios} colorPinzas={colorPinzas} />
      <div className="nombre-cuerda">
        {def.nombre}
        {notas.length > 0 && <span className="notas-cuerda"> · {notas.join(" · ")}</span>}
      </div>
      <div className="espacios" style={{ gridTemplateColumns: `repeat(${def.espacios}, var(--celda))` }}>
        {Array.from({ length: def.espacios }, (_, i) => (
          <Espacio key={i} destino={{ tipo: "espacio", jugador, linea, posicion, inicio: i }} />
        ))}
        {tendida.colgadas.map((c) => {
          // Para intercambiar con esta prenda o con esta carta se pulsa la propia prenda.
          const movida = movidaHacia(partida, movimiento, jugador, { linea, posicion, inicio: c.inicio });
          return (
            <div
              key={c.prenda}
              className={`colgada ${o?.prenda === c.prenda ? "moviendo" : ""} ${movida ? "pulsable" : ""}`}
              style={{ gridColumn: `${c.inicio + 1} / span ${tipoDe(partida, c.prenda).espacios}` }}
              onClick={movida ? () => jugar(movida) : undefined}
            >
              <FichaPrenda partida={partida} id={c.prenda} pinzaColor={colorPinzas} />
            </div>
          );
        })}
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

  // Segundo paso de una acción de mover o intercambiar: se pulsa el espacio de destino.
  const { linea, posicion, inicio } = destino;
  const movida = movidaHacia(partida, movimiento, destino.jugador, { linea, posicion, inicio });

  return (
    <div
      ref={setNodeRef}
      className={`espacio ${admite || movida ? "admite" : ""} ${isOver ? "encima" : ""} ${movida ? "pulsable" : ""}`}
      style={{ gridColumn: destino.inicio + 1 }}
      onClick={movida ? () => jugar(movida) : undefined}
    >
      <span className="pinza" />
    </div>
  );
}
