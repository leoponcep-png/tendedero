import { useState } from "react";
import { useT } from "../i18n";
import { Invitacion } from "../prototipos/perfil/PanelAmigos";
import "../prototipos/perfil/perfil.css";
import { usePlataforma, type OpcionesSala } from "./index";
import "./plataforma.css";

// «Invitar amigos» de la sala de espera. En Steam abre el diálogo de invitar de Steam (el amigo recibe la invitación
// y, si la acepta, le sale el aviso «… te invita a jugar»). Sin Steam enseña el hueco con su mensaje y deja copiar el
// código de la sala, como siempre.

/** El botón y su ventana. `sala`: el código de la sala online, las plazas y tu nombre. */
export function BotonInvitarAmigos({ sala, className }: { sala: OpcionesSala; className?: string }) {
  const t = useT();
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button className={className ?? "pf-boton"} onClick={() => setAbierta(true)}>
        {t("invitar.boton")}
      </button>
      {abierta && <InvitarAmigos sala={sala} onCerrar={() => setAbierta(false)} />}
    </>
  );
}

export function InvitarAmigos({ sala, onCerrar }: { sala: OpcionesSala; onCerrar: () => void }) {
  const t = useT();
  const p = usePlataforma();
  const [estado, setEstado] = useState<"" | "hecho" | "error">("");

  const invitarSteam = async () => {
    const r = await p.invitarASala(sala);
    setEstado(r.disponible ? "hecho" : "error");
  };

  return (
    <div className="pf-capa" role="dialog" aria-modal aria-label={t("invitar.titulo")} onClick={onCerrar}>
      <div className="pf-ventana mp" onClick={(e) => e.stopPropagation()}>
        <div className="pf-ventana-cabeza">
          <h2>{t("invitar.titulo")}</h2>
          <button className="pf-boton" onClick={onCerrar}>
            {t("comun.cerrar")}
          </button>
        </div>

        {p.nombre === "steam" ? (
          <>
            <p>{t("invitar.steamAyuda")}</p>
            <button className="pf-boton pf-principal" onClick={invitarSteam}>
              {t("invitar.steamAbrir")}
            </button>
            {estado === "hecho" && <p className="pf-bien">{t("invitar.steamHecho")}</p>}
            {estado === "error" && (
              <>
                <p className="pf-error">{t("invitar.steamError")}</p>
                <Invitacion codigo={sala.codigo} />
              </>
            )}
          </>
        ) : (
          <>
            <div className="pf-hueco">
              <span className="mp-sello-steam">{t("steam.soloSteam")}</span>
              <p>{t("invitar.localAyuda")}</p>
            </div>
            <Invitacion codigo={sala.codigo} />
          </>
        )}
      </div>
    </div>
  );
}
