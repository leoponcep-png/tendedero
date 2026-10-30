import { useState } from "react";
import { useT } from "../i18n";
import { plataforma, quitarInvitacion, rutaSalaInvitado, useInvitaciones } from "./index";
import "./plataforma.css";

// Aviso de invitación recibida, en cualquier pantalla: «Lu te invita a jugar. Aceptar / Rechazar». Va montado al
// lado de <App /> en main.tsx. En Steam llega cuando un amigo te invita desde su sala; sin Steam no llega ninguna
// (en modo desarrollo se puede probar con tendederoProbarInvitacion() en la consola).

export function AvisoInvitacion() {
  const t = useT();
  const cola = useInvitaciones();
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState("");
  const inv = cola[0];
  if (!inv) return null;

  const cerrar = () => {
    setError("");
    setEntrando(false);
    quitarInvitacion(inv);
  };
  const aceptar = async () => {
    setEntrando(true);
    const r = await plataforma().aceptarInvitacion(inv);
    if (!r.disponible) {
      setEntrando(false);
      setError(t("recibida.error"));
      return;
    }
    cerrar();
    location.hash = rutaSalaInvitado(r.valor);
  };
  const rechazar = () => {
    plataforma().rechazarInvitacion(inv);
    cerrar();
  };

  return (
    <div className="pf-aviso-capa" role="alertdialog" aria-live="assertive" aria-label={inv.de ? t("recibida.texto", { nombre: inv.de }) : t("recibida.alguien")}>
      <div className="pf-aviso">
        <span className="pf-aviso-sobre" aria-hidden>
          ✉
        </span>
        <div className="pf-aviso-texto">
          <strong>{inv.de ? t("recibida.texto", { nombre: inv.de }) : t("recibida.alguien")}</strong>
          <small>{t("recibida.detalle", { codigo: inv.codigo, n: inv.miembros, max: inv.plazas ?? "?" })}</small>
          {error && <small className="pf-error">{error}</small>}
        </div>
        <div className="pf-aviso-botones">
          <button className="pf-boton pf-principal" onClick={aceptar} disabled={entrando}>
            {t("recibida.aceptar")}
          </button>
          <button className="pf-boton" onClick={rechazar} disabled={entrando}>
            {t("recibida.rechazar")}
          </button>
        </div>
        {cola.length > 1 && <span className="pf-aviso-mas">+{cola.length - 1}</span>}
      </div>
    </div>
  );
}
