import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { nuevoCodigo } from "../online/protocolo";
import { usePlataforma, type OpcionesSala } from "./index";
import "./plataforma.css";

// «Partida rápida»: online contra cualquiera. En Steam busca una sala pública de Tendedero con hueco y entra; si no
// hay ninguna, abre una pública y tú eres el anfitrión (la sala de espera enseña «Buscando jugadores…» con la
// opción de rellenar con la IA, ver <BuscandoJugadores />). Sin Steam enseña el hueco con su mensaje y deja crear
// una sala con código o jugar contra la IA.

const CLAVE_RAPIDAS = "tendedero-salas-rapidas";

/** Apunta que la sala `codigo` es de partida rápida (para que su sala de espera diga «Buscando jugadores…»). */
function marcarSalaRapida(codigo: string) {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CLAVE_RAPIDAS) ?? "{}") as Record<string, number>;
    lista[codigo] = Date.now();
    sessionStorage.setItem(CLAVE_RAPIDAS, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento la sala funciona igual, sin el aviso de «Buscando».
  }
}

/** Cuándo se abrió la sala de partida rápida `codigo`, o null si no lo es. */
export function inicioSalaRapida(codigo: string): number | null {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CLAVE_RAPIDAS) ?? "{}") as Record<string, number>;
    return lista[codigo] ?? null;
  } catch {
    return null;
  }
}

export function PartidaRapida({
  plazas,
  nombre,
  onAnfitrion,
  onInvitado,
  onCrearSala,
  onContraIA,
  onCerrar,
}: {
  plazas: number;
  nombre: string;
  /** Hay que abrir una sala pública nueva con este código (como anfitrión). */
  onAnfitrion: (codigo: string) => void;
  /** Se ha encontrado sala: entrar como invitado. */
  onInvitado: (codigo: string) => void;
  /** Sin Steam: crear una sala con código, como siempre. */
  onCrearSala?: () => void;
  onContraIA?: () => void;
  onCerrar: () => void;
}) {
  const t = useT();
  const p = usePlataforma();
  const [fase, setFase] = useState<"buscando" | "error">("buscando");
  const [intento, setIntento] = useState(0);
  const cancelado = useRef(false);
  // Una búsqueda por intento (aunque React repita el efecto en desarrollo): cada una puede crear una sala en Steam.
  const lanzado = useRef(-1);

  useEffect(() => {
    if (p.nombre !== "steam" || lanzado.current === intento) return;
    lanzado.current = intento;
    cancelado.current = false;
    setFase("buscando");
    const sala: OpcionesSala = { codigo: nuevoCodigo(), plazas, nombre };
    p.partidaRapida(sala).then((r) => {
      if (cancelado.current) {
        if (r.disponible) p.salirSala();
        return;
      }
      if (!r.disponible) return setFase("error");
      if (r.valor.tipo === "unirse") return onInvitado(r.valor.codigo);
      marcarSalaRapida(r.valor.codigo);
      onAnfitrion(r.valor.codigo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, intento]);

  return (
    <div className="pf-capa" role="dialog" aria-modal aria-label={t("rapida.titulo")}>
      <div className="pf-ventana pf-rapida">
        <h2>{t("rapida.titulo")}</h2>
        {p.nombre !== "steam" ? (
          <>
            <div className="pf-hueco">
              <span className="mp-sello-steam">{t("steam.soloSteam")}</span>
              <p>{t("rapida.local")}</p>
            </div>
            <div className="pf-botones">
              {onCrearSala && (
                <button className="pf-boton pf-principal" onClick={onCrearSala}>
                  {t("rapida.crearSala")}
                </button>
              )}
              {onContraIA && (
                <button className="pf-boton" onClick={onContraIA}>
                  {t("rapida.contraIA")}
                </button>
              )}
              <button className="pf-boton" onClick={onCerrar}>
                {t("comun.cerrar")}
              </button>
            </div>
          </>
        ) : fase === "buscando" ? (
          <>
            <div className="pf-pinzas" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <p>{t("rapida.buscandoSalas")}</p>
            <button
              className="pf-boton"
              onClick={() => {
                cancelado.current = true;
                onCerrar();
              }}
            >
              {t("rapida.cancelar")}
            </button>
          </>
        ) : (
          <>
            <p className="pf-error">{t("rapida.error")}</p>
            <div className="pf-botones">
              <button className="pf-boton pf-principal" onClick={() => setIntento((n) => n + 1)}>
                {t("rapida.reintentar")}
              </button>
              <button className="pf-boton" onClick={onCerrar}>
                {t("comun.cerrar")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const reloj = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Para la sala de espera de una partida rápida (solo la del anfitrión): «Buscando jugadores… 0:23 · 2 de 4» y, si
 * tarda más de `paciencia` ms, el botón de rellenar las plazas libres con la IA. Si la sala no es de partida rápida
 * no enseña nada. (Al empezar la partida, la sala llama a plataforma().salaEmpezada() para dejar de salir en la
 * búsqueda.)
 */
export function BuscandoJugadores({ codigo, jugadores, plazas, empezada, onRellenarIA, paciencia = 30000 }: { codigo: string; jugadores: number; plazas: number; empezada: boolean; onRellenarIA: () => void; paciencia?: number }) {
  const t = useT();
  const p = usePlataforma();
  const inicio = inicioSalaRapida(codigo);
  const [ahora, setAhora] = useState(Date.now);

  useEffect(() => {
    if (!inicio || empezada) return;
    p.presencia({ donde: "sala", codigo });
    const cada = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(cada);
  }, [inicio, empezada, p, codigo]);

  if (!inicio || empezada) return null;
  const pasado = ahora - inicio;
  const llena = jugadores >= plazas;
  return (
    <div className="pf-buscando" role="status">
      <div className="pf-pinzas pequeno" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="pf-buscando-texto">
        <strong>{t("rapida.buscando")}</strong>
        <small>{t("rapida.tiempo", { tiempo: reloj(pasado), n: jugadores, max: plazas })}</small>
      </div>
      {!llena && pasado >= paciencia && (
        <div className="pf-buscando-ia">
          <small>{t("rapida.tarda")}</small>
          <button className="pf-boton pf-principal" onClick={onRellenarIA}>
            {t("rapida.rellenar")}
          </button>
        </div>
      )}
    </div>
  );
}
