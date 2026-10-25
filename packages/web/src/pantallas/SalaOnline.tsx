import type { Datos } from "@tendedero/motor";
import { useEffect, useState } from "react";
import { nombreVisible, t, useT } from "../i18n";
import { textoMotivo } from "../i18n/juego";
import { MesaJuego } from "../juego/MesaJuego";
import { perfilesDe } from "../juego/vista";
import type { Perfil } from "../prototipos/MenuPartida";
import { useAnfitrion, type SalaGuardada } from "../online/anfitrion";
import { useInvitado } from "../online/invitado";
import { enlaceDeSala, type Asiento } from "../online/protocolo";
import { Portada } from "./Inicio";
import { Mesa } from "./Mesa";

/**
 * Sala jugada desde la mesa nueva (#/prototipos/e): `perfil` es tu animal y color, y `ruta` es dónde se abren
 * las salas en esa interfaz (para el enlace de invitación).
 */
export interface SalaNueva {
  perfil: Perfil;
  ruta: string;
}

function Enlace({ codigo, ruta }: { codigo: string; ruta?: string }) {
  const [copiado, setCopiado] = useState(false);
  const enlace = enlaceDeSala(codigo, ruta);
  return (
    <div className="enlace-sala">
      <span>
        {t("sala.codigo")} <strong className="codigo">{codigo}</strong>
      </span>
      <input readOnly value={enlace} onFocus={(e) => e.target.select()} aria-label={t("sala.enlace")} />
      <button
        onClick={() =>
          navigator.clipboard.writeText(enlace).then(
            () => {
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            },
            () => setCopiado(false),
          )
        }
      >
        {copiado ? t("sala.copiado") : t("sala.copiarEnlace")}
      </button>
    </div>
  );
}

function ListaAsientos({ asientos, plazas, yo, onQuitar }: { asientos: Asiento[]; plazas: number; yo: number; onQuitar?: (asiento: number) => void }) {
  return (
    <ol className="asientos">
      {Array.from({ length: plazas }, (_, i) => {
        const a = asientos.find((x) => x.asiento === i);
        return (
          <li key={i} className={a ? (a.conectado ? "ocupado" : "ausente") : "libre"}>
            <span className={`ficha-jugador j${i}`}>{i + 1}</span>
            {a ? (
              <>
                <strong>{a.nombre}</strong>
                {i === yo && <span className="etiqueta-tu">{t("sala.tu")}</span>}
                {i === 0 && <span className="etiqueta-primero">{t("sala.anfitrion")}</span>}
                {!a.conectado && <span className="desconectado">{t("sala.desconectado")}</span>}
                {onQuitar && i !== 0 && (
                  <button className="boton-carta" onClick={() => onQuitar(i)}>
                    {t("sala.quitar")}
                  </button>
                )}
              </>
            ) : (
              <span className="vacia">{t("sala.esperando")}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Sala vista por quien la creó: invita, espera, empieza y juega. */
export function SalaAnfitrion({ inicial, datos, onSalir, nueva }: { inicial: SalaGuardada; datos: Datos; onSalir: () => void; nueva?: SalaNueva }) {
  const s = useAnfitrion(inicial, datos);
  useT();
  const tuPerfil = nueva?.perfil;
  // En la mesa nueva, los demás te ven con tu animal y tu color.
  useEffect(() => {
    if (tuPerfil) s.cambiarPerfil({ animal: tuPerfil.animal, color: tuPerfil.color, tapete: tuPerfil.tapete });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuPerfil?.animal, tuPerfil?.color, tuPerfil?.tapete]);
  const conectados = s.asientos.filter((a) => a.conectado).length;
  const estadoConexion = (
    <span className={`estado-conexion ${s.abierta ? "bien" : "mal"}`}>
      {t("sala.estado", { codigo: s.sala.codigo, estado: s.abierta ? t("sala.conectados", { n: conectados }) : (s.error ?? t("sala.abriendo")) })}
    </span>
  );

  if (s.vista && nueva) {
    const otros = s.asientos.map((a) => a.perfil);
    return (
      <MesaJuego
        partida={s.vista}
        ultima={s.ultima}
        perfiles={perfilesDe(s.vista, 0, nueva.perfil, otros)}
        miAsiento={0}
        modo="online"
        codigoSala={s.sala.codigo}
        conexion={estadoConexion}
        onJugada={s.jugar}
        onSalir={() => {
          if (confirm(t("sala.confirmarSalirAnfitrion"))) onSalir();
        }}
        onNueva={s.volverASala}
      />
    );
  }

  if (s.vista) {
    return (
      <Mesa
        partida={s.vista}
        nombreConfig=""
        miAsiento={0}
        conexion={estadoConexion}
        onJugada={s.jugar}
        puedeDeshacer={false}
        onDeshacer={() => {}}
        onSalir={() => {
          if (confirm("¿Salir? La partida queda guardada en este navegador y se reanuda al volver a esta sala.")) onSalir();
        }}
        onNueva={s.volverASala}
      />
    );
  }

  const nombre = s.sala.participantes[0]?.nombre ?? "";
  return (
    <main className="sala">
      <Portada />
      <h1>{t("sala.titulo")}</h1>
      {estadoConexion}
      {s.error && !s.abierta && <p className="error">{s.error}</p>}
      <p>{t("sala.pasaEnlace")}</p>
      <Enlace codigo={s.sala.codigo} ruta={nueva?.ruta} />
      <label className="campo">
        <span>{t("sala.tuNombre")}</span>
        <input value={nombre} maxLength={24} onChange={(e) => s.cambiarNombre(e.target.value)} />
      </label>
      <h2>
        {t("sala.jugadores", { n: s.asientos.length, max: s.sala.ajustes.jugadores })}
      </h2>
      <ListaAsientos asientos={s.asientos} plazas={s.sala.ajustes.jugadores} yo={0} onQuitar={s.quitar} />
      <div className="acciones-barra">
        <button onClick={onSalir}>{t("sala.cerrar")}</button>
        <button className="principal" disabled={s.asientos.length < 2 || !nombre.trim()} onClick={s.empezar}>
          {t("sala.empezarCon", { n: s.asientos.length })}
        </button>
      </div>
      {s.asientos.length < 2 && <p className="nota">{t("sala.faltan")}</p>}
    </main>
  );
}

function leerNombre(): string {
  try {
    return localStorage.getItem("tendedero-nombre") ?? "";
  } catch {
    return "";
  }
}

// Si esta pestaña ya estaba dentro de la sala, al recargar vuelve sola a la partida.
const claveDentro = (codigo: string) => `tendedero-dentro-${codigo}`;

function nombreDentro(codigo: string): string | null {
  try {
    return sessionStorage.getItem(claveDentro(codigo));
  } catch {
    return null;
  }
}

/** Sala vista por un invitado: pone su nombre, entra y juega. */
export function SalaInvitado({ codigo, onSalir, nueva }: { codigo: string; onSalir: () => void; nueva?: SalaNueva }) {
  const [borrador, setBorrador] = useState(() => leerNombre() || nueva?.perfil.nombre || "");
  const [nombre, setNombre] = useState<string | null>(() => nombreDentro(codigo));
  const perfil = nueva ? { animal: nueva.perfil.animal, color: nueva.perfil.color, tapete: nueva.perfil.tapete } : undefined;
  const s = useInvitado(codigo, nombre, perfil);
  useT();
  // El motivo de una jugada rechazada llega estructurado del anfitrión: se enseña en tu idioma.
  const aviso =
    s.aviso?.detalle && s.partida && s.sala
      ? textoMotivo(s.aviso.detalle, { p: s.partida, yo: s.sala.tuAsiento, nombre: (j) => nombreVisible(s.partida?.jugadores[j]?.nombre ?? "") })
      : (s.aviso?.texto ?? null);
  // Al salir a propósito, recargar ya no te mete de nuevo.
  const salir = () => {
    try {
      sessionStorage.removeItem(claveDentro(codigo));
    } catch {
      // Nada que borrar.
    }
    onSalir();
  };

  if (!nombre) {
    return (
      <main className="sala">
        <Portada />
        <h1>{t("sala.unirseA", { codigo })}</h1>
        <form
          className="unirse"
          onSubmit={(e) => {
            e.preventDefault();
            const n = borrador.trim();
            if (!n) return;
            try {
              localStorage.setItem("tendedero-nombre", n);
              sessionStorage.setItem(claveDentro(codigo), n);
            } catch {
              // Solo es para recordarlo la próxima vez.
            }
            setNombre(n);
          }}
        >
          <input autoFocus value={borrador} maxLength={24} onChange={(e) => setBorrador(e.target.value)} placeholder={t("sala.tuNombre")} aria-label={t("sala.tuNombre")} />
          <button className="principal" disabled={!borrador.trim()}>
            {t("sala.entrar")}
          </button>
        </form>
        <button onClick={onSalir}>{t("sala.volver")}</button>
      </main>
    );
  }

  const estadoConexion = (
    <span className={`estado-conexion ${s.fase === "dentro" ? "bien" : "mal"}`}>
      {t("sala.estado", { codigo, estado: s.fase === "dentro" ? t("sala.conectado") : s.fase === "rechazado" ? t("sala.fuera") : t("sala.reconectando") })}
    </span>
  );

  if (s.partida && s.sala && s.fase !== "rechazado" && nueva) {
    const otros = s.asientos.map((a) => a.perfil);
    return (
      <MesaJuego
        partida={s.partida}
        ultima={s.ultima}
        perfiles={perfilesDe(s.partida, s.sala.tuAsiento, nueva.perfil, otros)}
        miAsiento={s.sala.tuAsiento}
        modo="online"
        codigoSala={codigo}
        conexion={estadoConexion}
        avisoExterno={aviso}
        onJugada={s.jugar}
        onSalir={() => {
          if (confirm(t("sala.confirmarSalirInvitado"))) salir();
        }}
        onNueva={salir}
      />
    );
  }

  if (s.partida && s.sala && s.fase !== "rechazado") {
    return (
      <Mesa
        partida={s.partida}
        nombreConfig=""
        miAsiento={s.sala.tuAsiento}
        conexion={estadoConexion}
        avisoExterno={s.aviso?.texto ?? null}
        onJugada={s.jugar}
        puedeDeshacer={false}
        onDeshacer={() => {}}
        onSalir={() => {
          if (confirm("¿Salir de la partida? Puedes volver con el mismo enlace.")) salir();
        }}
        onNueva={salir}
      />
    );
  }

  return (
    <main className="sala">
      <Portada />
      <h1>{t("sala.salaN", { codigo })}</h1>
      {estadoConexion}
      {s.fase === "rechazado" && <p className="error">{s.error}</p>}
      {s.fase === "conectando" && <p>{t("sala.conectando")}</p>}
      {s.fase === "reconectando" && (
        <p className="aviso">
          {s.error ?? t("sala.cortada")} {t("sala.reintentando")}
        </p>
      )}
      {s.sala && s.fase === "dentro" && (
        <>
          <p>{t("sala.dentro")}</p>
          <ListaAsientos asientos={s.asientos} plazas={s.sala.plazas} yo={s.sala.tuAsiento} />
        </>
      )}
      <button onClick={salir}>{t("sala.salir")}</button>
    </main>
  );
}
