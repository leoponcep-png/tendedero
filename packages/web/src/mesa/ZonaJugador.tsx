import { puntuarObjetivo } from "@tendedero/motor";
import type { ReactNode } from "react";
import { useMesa } from "./contexto";
import { CartaMano, FichaCarta } from "./Carta";
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

        {jugador.trofeos.length > 0 && (
          <Zona titulo="Trofeos" cantidad={jugador.trofeos.length}>
            {jugador.trofeos.map((id) => (
              <FichaCarta key={id} partida={partida} id={id} />
            ))}
          </Zona>
        )}

        <Zona titulo={jugador.objetivoSecreto ? "Objetivos" : "Elige tu objetivo secreto"} vacia="Ningún objetivo definido todavía">
          {jugador.objetivoSecreto
            ? [
                <Objetivo key="secreto" id={jugador.objetivoSecreto} jugador={indice} secreto />,
                ...partida.objetivosComunes.map((id) => <Objetivo key={id} id={id} jugador={indice} />),
              ]
            : jugador.objetivosOfrecidos.map((id) => (
                <div key={id} className="objetivo-ofrecido">
                  <Objetivo id={id} />
                  <button onClick={() => jugar({ tipo: "elegirObjetivo", jugador: indice, objetivo: id })}>Quedármelo</button>
                </div>
              ))}
        </Zona>
      </div>
    </section>
  );
}

/** Carta de objetivo; con `jugador`, muestra cuánto lleva y cuántos puntos le daría ahora. */
export function Objetivo({ id, jugador, secreto }: { id: string; jugador?: number; secreto?: boolean }) {
  const { partida } = useMesa();
  const o = partida.catalogo.objetivos[id];
  const progreso = jugador === undefined ? null : puntuarObjetivo(partida, jugador, o);
  return (
    <div className={`objetivo ${secreto ? "secreto" : ""}`} title={o.texto}>
      <span className="tipo-carta">{secreto ? "Secreto" : jugador === undefined ? "Objetivo" : "Común"}</span>
      <strong>{o.nombre}</strong>
      <small>{o.texto}</small>
      <small className="niveles">
        <span className="alcanzado">
          cada {o.cada} → {o.puntos} pts, sin límite
        </span>
      </small>
      {progreso && (
        <small className="progreso">
          llevas {progreso.cantidad} · ahora darían {progreso.puntos} pts
        </small>
      )}
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
