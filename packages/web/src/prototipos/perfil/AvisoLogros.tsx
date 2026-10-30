import { useEffect, useState } from "react";
import { reproducir } from "../../audio";
import { useT } from "../../i18n";
import { DibujoRecompensa, nombreRecompensa } from "./Comunes";
import { IconoPerfil } from "./Iconos";
import { comprobarLogrosNuevos, descripcionLogro, EVENTO_LOGRO, nombreLogro, type Logro } from "./logros";
import "./perfil.css";

// Aviso de «¡Nuevo logro!». Se puede poner en cualquier pantalla (la mesa, el menú): al montarse enseña los
// logros pendientes y después escucha los que se consigan con registrarPartida(). Uno detrás de otro.

export function AvisoLogros({ color = "#2f7a63", duracion = 6500 }: { color?: string; duracion?: number }) {
  const t = useT();
  const [cola, setCola] = useState<Logro[]>([]);

  useEffect(() => {
    const recoger = () => {
      const nuevos = comprobarLogrosNuevos();
      if (nuevos.length) setCola((c) => [...c, ...nuevos]);
    };
    recoger();
    window.addEventListener(EVENTO_LOGRO, recoger);
    return () => window.removeEventListener(EVENTO_LOGRO, recoger);
  }, []);

  const actual = cola[0];
  useEffect(() => {
    if (!actual) return;
    reproducir("logro");
    const t = window.setTimeout(() => setCola((c) => c.slice(1)), duracion);
    return () => window.clearTimeout(t);
  }, [actual, duracion]);

  if (!actual) return null;
  return (
    <div className="mp-aviso-capa" aria-live="polite">
      <button key={actual.id} className="mp-aviso" onClick={() => setCola((c) => c.slice(1))} title={t("comun.cerrar")}>
        <span className="mp-aviso-rayos" aria-hidden />
        <span className="mp-aviso-medalla">
          <IconoPerfil icono={actual.icono} />
        </span>
        <span className="mp-aviso-texto">
          <span className="mp-aviso-titulo">{t("logros.nuevo")}</span>
          <strong>{nombreLogro(actual)}</strong>
          <span className="mp-aviso-desc">{descripcionLogro(actual)}</span>
          {!!actual.recompensas?.length && <span className="mp-aviso-premio">{t("logros.hasDesbloqueado", { recompensa: actual.recompensas.map(nombreRecompensa).join(" · ") })}</span>}
        </span>
        {!!actual.recompensas?.length && (
          <span className="mp-aviso-dibujo">
            {actual.recompensas.slice(0, 3).map((r) => (
              <DibujoRecompensa key={`${r.tipo}:${r.id}`} r={r} color={color} />
            ))}
          </span>
        )}
        {cola.length > 1 && <span className="mp-aviso-mas">+{cola.length - 1}</span>}
      </button>
    </div>
  );
}
