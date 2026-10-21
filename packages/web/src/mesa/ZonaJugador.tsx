import type { ReactNode } from "react";
import { useMesa } from "./contexto";
import { CartaMano } from "./Carta";
import { FichaPrenda, PrendaArrastrable } from "./Prenda";
import { Tendedero } from "./Tendedero";

export function ZonaJugador({ indice }: { indice: number }) {
  const { partida, jugar } = useMesa();
  const jugador = partida.jugadores[indice];
  const activa = partida.turno.jugador === indice;

  return (
    <section className={`zona-jugador ${activa ? "activa" : ""}`}>
      <header>
        <h2>{jugador.nombre}</h2>
        <span className="puntos">{jugador.puntos} pts</span>
        {activa && <span className="etiqueta-turno">su turno</span>}
      </header>

      <Tendedero jugador={indice} />

      <div className="filas-jugador">
        <Zona titulo="Por tender" vacia="Coge prendas de una cesta o del centro" cantidad={jugador.pendientes.length}>
          {jugador.pendientes.map((id) => (
            <PrendaArrastrable key={id} id={id} jugador={indice} activa={activa} />
          ))}
        </Zona>

        <Zona titulo="Mano" vacia="Sin cartas" cantidad={jugador.mano.length}>
          {jugador.mano.map((id) => (
            <CartaMano key={id} id={id} jugador={indice} activa={activa} />
          ))}
        </Zona>

        <Zona titulo="Ropa seca" vacia="Todavía nada" cantidad={jugador.seca.length}>
          {jugador.seca.map((id) => (
            <FichaPrenda key={id} partida={partida} id={id} ancho="mini" />
          ))}
        </Zona>

        <Zona titulo="Objetivo secreto" vacia="Ningún objetivo definido todavía">
          {jugador.objetivoSecreto ? (
            <Objetivo id={jugador.objetivoSecreto} />
          ) : (
            jugador.objetivosOfrecidos.map((id) => (
              <div key={id} className="objetivo-ofrecido">
                <Objetivo id={id} />
                <button onClick={() => jugar({ tipo: "elegirObjetivo", jugador: indice, objetivo: id })}>Quedármelo</button>
              </div>
            ))
          )}
        </Zona>
      </div>
    </section>
  );
}

export function Objetivo({ id }: { id: string }) {
  const { partida } = useMesa();
  const o = partida.catalogo.objetivos[id];
  return (
    <div className="objetivo" title={o.texto}>
      <strong>{o.nombre}</strong>
      {o.niveles.length > 0 && <small>{o.niveles.map((n) => `${n.requisito} → ${n.puntos} pts`).join(" · ")}</small>}
    </div>
  );
}

export function Zona({ titulo, vacia = "", cantidad, children }: { titulo: string; vacia?: string; cantidad?: number; children: ReactNode }) {
  const hay = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="zona">
      <h3>
        {titulo}
        {cantidad !== undefined && <span className="cantidad">{cantidad}</span>}
      </h3>
      <div className="contenido-zona">{hay ? children : <span className="vacia">{vacia}</span>}</div>
    </div>
  );
}
