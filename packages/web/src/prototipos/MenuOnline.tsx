import { useState, type CSSProperties, type ReactNode } from "react";
import { esNombreTu, useT } from "../i18n";
import { limpiarCodigo } from "../online/protocolo";
import { Animal } from "./Animales";
import { type Perfil } from "./MenuPartida";

// Pantalla «Online» de la portada: con qué nombre te ven, crear una sala (y cuántas plazas tiene), unirte con
// el código que te han pasado y el hueco de la partida rápida (emparejamiento, lo conecta la capa de Steam).

export function leerNombreOnline(perfil: Perfil): string {
  try {
    const guardado = localStorage.getItem("tendedero-nombre");
    if (guardado?.trim()) return guardado;
  } catch {
    // Sin almacenamiento se usa el del perfil.
  }
  return esNombreTu(perfil.nombre) ? "" : perfil.nombre;
}

export function MenuOnline({
  perfil,
  onCrear,
  onUnirse,
  partidaRapida,
}: {
  perfil: Perfil;
  onCrear: (nombre: string, plazas: number) => void;
  onUnirse: (nombre: string, codigo: string) => void;
  /** Hueco para la partida rápida: si no se pasa, sale el botón como «muy pronto». */
  partidaRapida?: ReactNode;
}) {
  const t = useT();
  const [nombre, setNombre] = useState(() => leerNombreOnline(perfil));
  const [plazas, setPlazas] = useState(4);
  const [codigo, setCodigo] = useState("");
  const limpio = nombre.trim();
  const cod = limpiarCodigo(codigo);

  return (
    <div className="ol-menu" style={{ "--jugador": perfil.color } as CSSProperties}>
      <section className="menu-tarjeta ol-tu">
        <div className="ol-avatar">
          <Animal id={perfil.animal} />
        </div>
        <label className="ol-nombre">
          <span>{t("sala.tuNombre")}</span>
          <input value={nombre} maxLength={24} onChange={(e) => setNombre(e.target.value)} placeholder={t("sala.tuNombre")} />
          <small>{limpio ? t("online.nombreAyuda") : t("online.nombreFalta")}</small>
        </label>
      </section>

      <div className="ol-opciones">
        <section className="menu-tarjeta ol-opcion">
          <h2>{t("online.crear")}</h2>
          <p>{t("online.crearAyuda")}</p>
          <div className="ol-plazas" role="group" aria-label={t("online.plazas")}>
            <span>{t("online.plazas")}</span>
            {[2, 3, 4].map((n) => (
              <button key={n} className={plazas === n ? "activa" : ""} aria-pressed={plazas === n} onClick={() => setPlazas(n)}>
                {n}
              </button>
            ))}
          </div>
          <button className="principal ol-accion" disabled={!limpio} onClick={() => onCrear(limpio, plazas)}>
            {t("online.crearBoton")}
          </button>
        </section>

        <section className="menu-tarjeta ol-opcion">
          <h2>{t("online.unirse")}</h2>
          <p>{t("online.unirseAyuda")}</p>
          <form
            className="ol-unirse"
            onSubmit={(e) => {
              e.preventDefault();
              if (limpio && cod) onUnirse(limpio, cod);
            }}
          >
            <input
              className="ol-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder={t("menu.codigoSala")}
              aria-label={t("menu.codigoSala")}
              maxLength={16}
              autoCapitalize="characters"
              spellCheck={false}
            />
            <button className="principal ol-accion" disabled={!limpio || cod.length < 4}>
              {t("sala.entrar")}
            </button>
          </form>
        </section>

        <section className="menu-tarjeta ol-opcion ol-rapida" data-hueco="partida-rapida">
          <h2>{t("online.rapida")}</h2>
          <p>{t("online.rapidaAyuda")}</p>
          {partidaRapida ?? (
            <button className="ol-accion" disabled>
              {t("online.pronto")}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
