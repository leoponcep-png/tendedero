import { useState } from "react";
import { fecha as fechaIdioma, useT } from "../../i18n";
import { Barra, DibujoRecompensa, nombreRecompensa } from "./Comunes";
import { IconoPerfil } from "./Iconos";
import { descripcionLogro, nombreLogro, type EstadoLogro } from "./logros";

// Pestaña «Logros»: todos, con su progreso y su recompensa.

const fecha = (iso?: string) => (iso ? fechaIdioma(iso, { day: "numeric", month: "long", year: "numeric" }) : "");

export function PanelLogros({ estados, color }: { estados: EstadoLogro[]; color: string }) {
  const t = useT();
  const [filtro, setFiltro] = useState<"todos" | "pendientes" | "conseguidos">("todos");
  const hechos = estados.filter((s) => s.conseguido).length;
  // Se cuentan las cosas que regalan (un logro puede dar varias).
  const premios = estados.reduce((n, s) => n + (s.logro.recompensas?.length ?? 0), 0);
  const premiosHechos = estados.reduce((n, s) => n + (s.conseguido ? (s.logro.recompensas?.length ?? 0) : 0), 0);
  // Primero lo que está a punto de caer, luego lo conseguido.
  const orden = [...estados].sort((a, b) => Number(a.conseguido) - Number(b.conseguido) || b.actual / b.logro.meta - a.actual / a.logro.meta);
  const lista = orden.filter((s) => (filtro === "todos" ? true : filtro === "conseguidos" ? s.conseguido : !s.conseguido));

  return (
    <div className="mp-logros">
      <div className="mp-logros-resumen">
        <div>
          <strong>
            {hechos} <small>{t("logros.deTotal", { n: estados.length })}</small>
          </strong>
          <span>{t("logros.conseguidos")}</span>
          <Barra actual={hechos} meta={estados.length} />
        </div>
        <div>
          <strong>
            {premiosHechos} <small>{t("logros.deTotal", { n: premios })}</small>
          </strong>
          <span>{t("logros.recompensas")}</span>
          <Barra actual={premiosHechos} meta={premios} />
        </div>
        <div className="mp-filtros">
          {(["todos", "pendientes", "conseguidos"] as const).map((f) => (
            <button key={f} className={filtro === f ? "activa" : ""} onClick={() => setFiltro(f)}>
              {f === "todos" ? t("logros.filtroTodos") : f === "pendientes" ? t("logros.filtroPendientes") : t("logros.filtroConseguidos")}
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
              <strong>{nombreLogro(logro)}</strong>
              <span>{descripcionLogro(logro)}</span>
              {!!logro.recompensas?.length && <small className="mp-logro-regalo">{logro.recompensas.map(nombreRecompensa).join(" · ")}</small>}
              {conseguido ? (
                <small className="mp-logro-fecha">{cuando ? t("logros.conseguidoEl", { fecha: fecha(cuando) }) : t("logros.conseguido")}</small>
              ) : (
                <div className="mp-logro-progreso">
                  <Barra actual={actual} meta={logro.meta} />
                  <small>
                    {actual}/{logro.meta}
                  </small>
                </div>
              )}
            </div>
            {!!logro.recompensas?.length && (
              <div className="mp-logro-premio" title={t("logros.recompensaDe", { recompensa: logro.recompensas.map(nombreRecompensa).join(" · ") })}>
                <div className="mp-logro-premios">
                  {logro.recompensas.map((r) => (
                    <DibujoRecompensa key={`${r.tipo}:${r.id}`} r={r} color={color} />
                  ))}
                </div>
                <small>{conseguido ? t("logros.desbloqueado") : t("logros.recompensa")}</small>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
