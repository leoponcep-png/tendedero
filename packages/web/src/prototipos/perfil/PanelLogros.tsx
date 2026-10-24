import { useState } from "react";
import { Barra, DibujoRecompensa, nombreRecompensa } from "./Comunes";
import { IconoPerfil } from "./Iconos";
import type { EstadoLogro } from "./logros";

// Pestaña «Logros»: todos, con su progreso y su recompensa.

const fecha = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
};

export function PanelLogros({ estados, color }: { estados: EstadoLogro[]; color: string }) {
  const [filtro, setFiltro] = useState<"todos" | "pendientes" | "conseguidos">("todos");
  const hechos = estados.filter((s) => s.conseguido).length;
  const premios = estados.filter((s) => s.logro.recompensa);
  const premiosHechos = premios.filter((s) => s.conseguido).length;
  // Primero lo que está a punto de caer, luego lo conseguido.
  const orden = [...estados].sort((a, b) => Number(a.conseguido) - Number(b.conseguido) || b.actual / b.logro.meta - a.actual / a.logro.meta);
  const lista = orden.filter((s) => (filtro === "todos" ? true : filtro === "conseguidos" ? s.conseguido : !s.conseguido));

  return (
    <div className="mp-logros">
      <div className="mp-logros-resumen">
        <div>
          <strong>
            {hechos} <small>de {estados.length}</small>
          </strong>
          <span>logros conseguidos</span>
          <Barra actual={hechos} meta={estados.length} />
        </div>
        <div>
          <strong>
            {premiosHechos} <small>de {premios.length}</small>
          </strong>
          <span>recompensas desbloqueadas</span>
          <Barra actual={premiosHechos} meta={premios.length} />
        </div>
        <div className="mp-filtros">
          {(["todos", "pendientes", "conseguidos"] as const).map((f) => (
            <button key={f} className={filtro === f ? "activa" : ""} onClick={() => setFiltro(f)}>
              {f === "todos" ? "Todos" : f === "pendientes" ? "Por conseguir" : "Conseguidos"}
            </button>
          ))}
        </div>
      </div>

      <ul className="mp-lista-logros">
        {lista.map(({ logro, actual, conseguido, fecha: cuando }) => (
          <li key={logro.id} className={`mp-logro ${conseguido ? "conseguido" : ""}`}>
            <span className="mp-logro-icono">
              <IconoPerfil icono={logro.icono} />
            </span>
            <div className="mp-logro-texto">
              <strong>{logro.nombre}</strong>
              <span>{logro.descripcion}</span>
              {conseguido ? (
                <small className="mp-logro-fecha">✓ Conseguido{cuando ? ` el ${fecha(cuando)}` : ""}</small>
              ) : (
                <div className="mp-logro-progreso">
                  <Barra actual={actual} meta={logro.meta} />
                  <small>
                    {actual}/{logro.meta}
                  </small>
                </div>
              )}
            </div>
            {logro.recompensa && (
              <div className="mp-logro-premio" title={`Recompensa: ${nombreRecompensa(logro.recompensa)}`}>
                <DibujoRecompensa r={logro.recompensa} color={color} />
                <small>{conseguido ? "Desbloqueado" : "Recompensa"}</small>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
