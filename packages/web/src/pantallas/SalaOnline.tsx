import type { Datos } from "@tendedero/motor";
import { useState } from "react";
import { useAnfitrion, type SalaGuardada } from "../online/anfitrion";
import { useInvitado } from "../online/invitado";
import { enlaceDeSala, type Asiento } from "../online/protocolo";
import { Portada } from "./Inicio";
import { Mesa } from "./Mesa";

function Enlace({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const enlace = enlaceDeSala(codigo);
  return (
    <div className="enlace-sala">
      <span>
        Código <strong className="codigo">{codigo}</strong>
      </span>
      <input readOnly value={enlace} onFocus={(e) => e.target.select()} aria-label="Enlace de la sala" />
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
        {copiado ? "¡Copiado!" : "Copiar enlace"}
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
                {i === yo && <span className="etiqueta-tu">tú</span>}
                {i === 0 && <span className="etiqueta-primero">anfitrión</span>}
                {!a.conectado && <span className="desconectado">desconectado</span>}
                {onQuitar && i !== 0 && (
                  <button className="boton-carta" onClick={() => onQuitar(i)}>
                    Quitar
                  </button>
                )}
              </>
            ) : (
              <span className="vacia">Esperando a alguien…</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Sala vista por quien la creó: invita, espera, empieza y juega. */
export function SalaAnfitrion({ inicial, datos, onSalir }: { inicial: SalaGuardada; datos: Datos; onSalir: () => void }) {
  const s = useAnfitrion(inicial, datos);
  const conectados = s.asientos.filter((a) => a.conectado).length;
  const estadoConexion = (
    <span className={`estado-conexion ${s.abierta ? "bien" : "mal"}`}>
      Sala {s.sala.codigo} · {s.abierta ? `${conectados} conectado${conectados === 1 ? "" : "s"}` : (s.error ?? "abriendo…")}
    </span>
  );

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
      <h1>Sala online</h1>
      {estadoConexion}
      {s.error && !s.abierta && <p className="error">{s.error}</p>}
      <p>Pasa este enlace a tus amigos. Cuando estén dentro, empieza la partida.</p>
      <Enlace codigo={s.sala.codigo} />
      <label className="campo">
        <span>Tu nombre</span>
        <input value={nombre} maxLength={24} onChange={(e) => s.cambiarNombre(e.target.value)} />
      </label>
      <h2>
        Jugadores ({s.asientos.length} de {s.sala.ajustes.jugadores})
      </h2>
      <ListaAsientos asientos={s.asientos} plazas={s.sala.ajustes.jugadores} yo={0} onQuitar={s.quitar} />
      <div className="acciones-barra">
        <button onClick={onSalir}>Cerrar sala</button>
        <button className="principal" disabled={s.asientos.length < 2 || !nombre.trim()} onClick={s.empezar}>
          Empezar con {s.asientos.length} jugador{s.asientos.length === 1 ? "" : "es"}
        </button>
      </div>
      {s.asientos.length < 2 && <p className="nota">Hacen falta al menos 2 jugadores.</p>}
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
export function SalaInvitado({ codigo, onSalir }: { codigo: string; onSalir: () => void }) {
  const [borrador, setBorrador] = useState(leerNombre);
  const [nombre, setNombre] = useState<string | null>(() => nombreDentro(codigo));
  const s = useInvitado(codigo, nombre);
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
        <h1>Unirse a la sala {codigo}</h1>
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
          <input autoFocus value={borrador} maxLength={24} onChange={(e) => setBorrador(e.target.value)} placeholder="Tu nombre" aria-label="Tu nombre" />
          <button className="principal" disabled={!borrador.trim()}>
            Entrar
          </button>
        </form>
        <button onClick={onSalir}>Volver</button>
      </main>
    );
  }

  const estadoConexion = (
    <span className={`estado-conexion ${s.fase === "dentro" ? "bien" : "mal"}`}>
      Sala {codigo} · {s.fase === "dentro" ? "conectado" : s.fase === "rechazado" ? "fuera" : "reconectando…"}
    </span>
  );

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
      <h1>Sala {codigo}</h1>
      {estadoConexion}
      {s.fase === "rechazado" && <p className="error">{s.error}</p>}
      {s.fase === "conectando" && <p>Conectando con la sala…</p>}
      {s.fase === "reconectando" && <p className="aviso">{s.error ?? "Se ha cortado la conexión."} Reintentando…</p>}
      {s.sala && s.fase === "dentro" && (
        <>
          <p>Estás dentro. La partida empieza cuando el anfitrión lo diga.</p>
          <ListaAsientos asientos={s.asientos} plazas={s.sala.plazas} yo={s.sala.tuAsiento} />
        </>
      )}
      <button onClick={salir}>Salir</button>
    </main>
  );
}
