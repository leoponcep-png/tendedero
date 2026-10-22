import { cumple, esValida, prendasDe, rondasDeClimaRestantes, type Jugada, type Origen, type Patron } from "@tendedero/motor";
import { useState } from "react";
import { useMesa } from "./contexto";
import { FichaCarta } from "./Carta";
import { FichaPrenda } from "./Prenda";
import { Objetivo, Zona } from "./ZonaJugador";

interface Seleccion {
  origen: Origen;
  prenda: string;
}

export function ZonaCentral() {
  const { partida } = useMesa();
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const mismo = (a: Origen, b: Origen) => (a === "centro" ? b === "centro" : b !== "centro" && a.cesta === b.cesta);

  const grupo = (origen: Origen, titulo: string, prendas: string[], clase: string) => (
    <div key={titulo} className={`${clase} ${seleccion && mismo(seleccion.origen, origen) ? "elegida" : ""}`}>
      <span className="titulo-cesta">{titulo}</span>
      <div className="prendas-cesta">
        {prendas.map((id) => (
          <button key={id} className="boton-prenda" onClick={() => setSeleccion({ origen, prenda: id })}>
            <FichaPrenda partida={partida} id={id} ancho="mini" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="zona-central">
      <div className="fila-central">
        <Zona titulo="Bolsa">
          <span className="contador-grande">{partida.bolsa.length}</span>
        </Zona>
        <div className="zona cestas">
          <h3>Cestas</h3>
          <div className="contenido-zona">
            {partida.cestas.map((c, i) => grupo({ cesta: i }, `${i + 1}`, c, "cesta"))}
            {grupo("centro", "Centro", partida.centro, "centro")}
          </div>
          {seleccion && <Coger seleccion={seleccion} onCerrar={() => setSeleccion(null)} />}
        </div>
      </div>

      <div className="fila-central">
        <Zona titulo={tituloClima(rondasDeClimaRestantes(partida))} vacia="Tiempo normal">
          {partida.clima && <FichaCarta partida={partida} id={partida.clima} />}
        </Zona>
        <Zona titulo={`Evento de la ronda ${partida.ronda}`} vacia="Ninguno">
          {partida.ultimoEvento && <FichaCarta partida={partida} id={partida.ultimoEvento} />}
        </Zona>
        <Mazo nombre="Cuerdas" mazo={partida.mazos.cuerdas.length} descarte={partida.descartes.cuerdas.length} />
        <Mazo nombre="Acciones" mazo={partida.mazos.acciones.length} descarte={partida.descartes.acciones.length} />
        <Mazo nombre="Clima y eventos" mazo={partida.mazos.clima.length} descarte={partida.descartes.clima.length} />
        <Zona titulo="Objetivos comunes" vacia="Ninguno definido todavía">
          {partida.objetivosComunes.map((id) => (
            <Objetivo key={id} id={id} />
          ))}
        </Zona>
      </div>

      <PistaPuntos />
    </section>
  );
}

/** Al pulsar una prenda de una cesta: coger todas las de su color o todas las de su tipo. */
function Coger({ seleccion, onCerrar }: { seleccion: Seleccion; onCerrar: () => void }) {
  const { partida, jugar } = useMesa();
  const prenda = partida.prendas[seleccion.prenda];
  const jugador = partida.turno.jugador;
  const prendas = prendasDe(partida, seleccion.origen) ?? [];
  // Tras deshacer o cambiar de turno, la prenda elegida puede ya no estar ahí.
  if (!prendas.includes(seleccion.prenda)) return null;

  const opcion = (patron: Patron, texto: string) => {
    const n = prendas.filter((id) => cumple(partida.prendas[id], patron)).length;
    const j: Jugada = { tipo: "draft", jugador, origen: seleccion.origen, patron };
    return (
      <button
        className="principal"
        disabled={!esValida(partida, j)}
        onClick={() => {
          jugar(j);
          onCerrar();
        }}
      >
        {texto} ({n})
      </button>
    );
  };

  return (
    <div className="coger">
      <span>{partida.jugadores[jugador].nombre} coge:</span>
      {opcion({ color: prenda.color }, `por color: ${partida.catalogo.colores[prenda.color].nombre.toLowerCase()}`)}
      {opcion({ tipo: prenda.tipo }, `por tipo: ${partida.catalogo.tipos[prenda.tipo].nombre.toLowerCase()}`)}
      <button onClick={onCerrar}>Cancelar</button>
    </div>
  );
}

function Mazo({ nombre, mazo, descarte }: { nombre: string; mazo: number; descarte: number }) {
  return (
    <Zona titulo={nombre}>
      <div className="mazo">
        <span className="contador-grande">{mazo}</span>
        <small>descarte: {descarte}</small>
      </div>
    </Zona>
  );
}

function PistaPuntos() {
  const { partida } = useMesa();
  const umbral = partida.ajustes.umbralFinal;
  const casillas = Array.from({ length: umbral + 1 }, (_, i) => i);
  return (
    <div className="zona pista">
      <h3>Pista de puntuación · final a {umbral}</h3>
      <div className="casillas">
        {casillas.map((n) => (
          <div key={n} className={`casilla ${n === umbral ? "meta" : ""}`}>
            <span className="numero-casilla">{n}</span>
            {partida.jugadores.map((j, i) =>
              Math.min(j.puntos, umbral) === n ? (
                <span key={i} className={`ficha-jugador j${i}`} title={j.nombre}>
                  {i + 1}
                </span>
              ) : null,
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function tituloClima(restantes: number | null): string {
  if (restantes === null) return "Clima activo";
  return restantes <= 1 ? "Clima activo · última ronda" : `Clima activo · ${restantes} rondas`;
}
