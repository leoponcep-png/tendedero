import type { Partida } from "@tendedero/motor";

/** Clasificación tras el recuento de objetivos. */
export function Final({ partida, onCerrar, onNueva }: { partida: Partida; onCerrar: () => void; onNueva: () => void }) {
  const final = partida.final!;
  const primero = partida.primeroEnLlegar;
  return (
    <div className="fondo-modal">
      <div className="modal">
        <h2>Fin de la partida</h2>
        <p className="nota">
          {primero !== null
            ? `${partida.jugadores[primero].nombre} llegó primero a ${partida.ajustes.umbralFinal} puntos; se terminó la ronda y se contaron los objetivos.`
            : "Se acabó la ropa antes de que nadie llegara al final; se terminó la ronda y se contaron los objetivos."}
        </p>
        <table className="tabla-final">
          <thead>
            <tr>
              <th>Puesto</th>
              <th>Jugador</th>
              <th>Puntos de partida</th>
              <th>Objetivos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {final.map((r) => (
              <tr key={r.jugador} className={r.puesto === 1 ? "ganador" : ""}>
                <td>{r.puesto}.º</td>
                <td>
                  {partida.jugadores[r.jugador].nombre}
                  {r.jugador === primero && <span className="etiqueta-primero">llegó primero</span>}
                </td>
                <td>{r.puntosPartida}</td>
                <td>
                  {r.objetivos.map((o) => (
                    <div key={o.objetivo} className="linea-objetivo">
                      {o.nombre}: {o.cantidad} → <strong>+{o.puntos}</strong>
                    </div>
                  ))}
                </td>
                <td className="total">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="acciones-modal">
          <button onClick={onCerrar}>Ver la mesa</button>
          <button className="principal" onClick={onNueva}>
            Nueva partida
          </button>
        </div>
      </div>
    </div>
  );
}
