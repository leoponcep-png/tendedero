import { useEffect, useState } from "react";
import { DibujoRecompensa, nombreRecompensa } from "./Comunes";
import { IconoPerfil } from "./Iconos";
import { comprobarLogrosNuevos, EVENTO_LOGRO, type Logro } from "./logros";
import "./perfil.css";

// Aviso de «¡Nuevo logro!». Se puede poner en cualquier pantalla (la mesa, el menú): al montarse enseña los
// logros pendientes y después escucha los que se consigan con registrarPartida(). Uno detrás de otro.

export function AvisoLogros({ color = "#2f7a63", duracion = 6500 }: { color?: string; duracion?: number }) {
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
    const t = window.setTimeout(() => setCola((c) => c.slice(1)), duracion);
    return () => window.clearTimeout(t);
  }, [actual, duracion]);

  if (!actual) return null;
  return (
    <div className="mp-aviso-capa" aria-live="polite">
      <button key={actual.id} className="mp-aviso" onClick={() => setCola((c) => c.slice(1))} title="Cerrar">
        <span className="mp-aviso-rayos" aria-hidden />
        <span className="mp-aviso-medalla">
          <IconoPerfil icono={actual.icono} />
        </span>
        <span className="mp-aviso-texto">
          <span className="mp-aviso-titulo">¡Nuevo logro!</span>
          <strong>{actual.nombre}</strong>
          <span className="mp-aviso-desc">{actual.descripcion}</span>
          {actual.recompensa && (
            <span className="mp-aviso-premio">
              Has desbloqueado el {nombreRecompensa(actual.recompensa)}
            </span>
          )}
        </span>
        {actual.recompensa && (
          <span className="mp-aviso-dibujo">
            <DibujoRecompensa r={actual.recompensa} color={color} />
          </span>
        )}
        {cola.length > 1 && <span className="mp-aviso-mas">+{cola.length - 1}</span>}
      </button>
    </div>
  );
}
