import { useState } from "react";
import { añadirAmigo, enlaceSala, guardarAmigos, leerAmigos, miCodigoAmigo, nuevaInvitacion, partidasCon, type Amigo } from "./amigos";
import { IconoPerfil } from "./Iconos";
import { plataforma } from "./plataforma";
import type { ResumenPartida } from "./registro";

// Pestaña «Amigos»: lista guardada en este navegador, tu código de amigo e invitaciones a una sala online
// con un enlace (#/sala/código) que se copia y se comparte.

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Sin permiso de portapapeles: se copia a la antigua con un campo oculto.
    try {
      const campo = document.createElement("textarea");
      campo.value = texto;
      campo.style.position = "fixed";
      campo.style.opacity = "0";
      document.body.appendChild(campo);
      campo.select();
      const ok = document.execCommand("copy");
      campo.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function BotonCopiar({ texto, etiqueta = "Copiar" }: { texto: string; etiqueta?: string }) {
  const [hecho, setHecho] = useState(false);
  return (
    <button
      className={`mp-copiar ${hecho ? "hecho" : ""}`}
      onClick={async () => {
        if (await copiar(texto)) {
          setHecho(true);
          window.setTimeout(() => setHecho(false), 1600);
        }
      }}
    >
      <IconoPerfil icono="copiar" />
      {hecho ? "¡Copiado!" : etiqueta}
    </button>
  );
}

function Invitacion({ codigo, para, onAbrirSala }: { codigo: string; para?: string; onAbrirSala?: (codigo: string) => void }) {
  const enlace = enlaceSala(codigo);
  const mensaje = `¡Vamos a tender la colada! Únete a mi partida de Tendedero: ${enlace} (código ${codigo})`;
  const compartir = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <div className="mp-invitacion">
      <p>
        {para ? (
          <>
            Pásale este enlace a <strong>{para}</strong>:
          </>
        ) : (
          "Pasa este enlace (o el código) a quien quieras invitar:"
        )}
      </p>
      <div className="mp-invitacion-fila">
        <code className="mp-enlace">{enlace}</code>
        <BotonCopiar texto={enlace} etiqueta="Copiar enlace" />
      </div>
      <div className="mp-invitacion-fila">
        <span className="mp-codigo-sala">{codigo}</span>
        <BotonCopiar texto={codigo} etiqueta="Copiar código" />
        <BotonCopiar texto={mensaje} etiqueta="Copiar mensaje" />
        {compartir && (
          <button
            onClick={() => {
              navigator.share({ title: "Tendedero", text: mensaje, url: enlace }).catch(() => {
                // Si se cancela no pasa nada.
              });
            }}
          >
            <IconoPerfil icono="enlace" />
            Compartir…
          </button>
        )}
        {onAbrirSala && (
          <button className="principal" onClick={() => onAbrirSala(codigo)}>
            Abrir la sala
          </button>
        )}
      </div>
    </div>
  );
}

const iniciales = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export function PanelAmigos({ partidas, onAbrirSala }: { partidas: ResumenPartida[]; onAbrirSala?: (codigo: string) => void }) {
  const [amigos, setAmigosEstado] = useState(leerAmigos);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [invitacion, setInvitacion] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<string | null>(null);
  const miCodigo = miCodigoAmigo();

  const setAmigos = (lista: Amigo[]) => {
    setAmigosEstado(lista);
    guardarAmigos(lista);
  };
  const añadir = () => {
    const r = añadirAmigo(amigos, texto);
    if (typeof r === "string") return setError(r);
    setError("");
    setTexto("");
    setAmigos(r);
  };
  const invitar = (a: Amigo) => {
    const codigo = nuevaInvitacion();
    // En Steam la propia plataforma manda la invitación; en el navegador se comparte el enlace.
    if (a.steamId) plataforma().invitar?.(a.steamId, codigo);
    setAmigos(amigos.map((x) => (x.id === a.id ? { ...x, invitacion: { codigo, fecha: new Date().toISOString() } } : x)));
  };
  const cambiar = (id: string, cambio: Partial<Amigo>) => setAmigos(amigos.map((x) => (x.id === id ? { ...x, ...cambio } : x)));

  return (
    <div className="mp-amigos">
      <div className="mp-dos-columnas">
        <section className="mp-bloque mp-mi-codigo">
          <h2>Tu código de amigo</h2>
          <p>Dáselo a tus amigos para que te añadan.</p>
          <div className="mp-invitacion-fila">
            <span className="mp-codigo-sala">{miCodigo}</span>
            <BotonCopiar texto={miCodigo} />
          </div>
        </section>
        <section className="mp-bloque">
          <h2>Invitar a una partida online</h2>
          {invitacion ? (
            <>
              <Invitacion codigo={invitacion} onAbrirSala={onAbrirSala} />
              <button className="mp-enlace-boton" onClick={() => setInvitacion(nuevaInvitacion())}>
                Crear otra sala
              </button>
            </>
          ) : (
            <>
              <p>Crea una sala y comparte el enlace por donde quieras.</p>
              <button className="principal" onClick={() => setInvitacion(nuevaInvitacion())}>
                <IconoPerfil icono="enlace" />
                Crear invitación
              </button>
            </>
          )}
        </section>
      </div>

      <section className="mp-bloque">
        <div className="mp-seccion-titulo">
          <h2>Amigos</h2>
          <span>{amigos.length}</span>
        </div>
        <form
          className="mp-añadir"
          onSubmit={(ev) => {
            ev.preventDefault();
            añadir();
          }}
        >
          <input value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="Nombre o código (TND-XXXX-XXXX)" maxLength={20} />
          <button type="submit" className="principal">
            Añadir
          </button>
        </form>
        {error && <p className="mp-error">{error}</p>}

        {!amigos.length ? (
          <div className="mp-vacio pequeno">
            <IconoPerfil icono="amigos" />
            <p>Aún no tienes amigos guardados. Añádelos por su nombre en el juego o por su código.</p>
          </div>
        ) : (
          <ul className="mp-lista-amigos">
            {amigos.map((a) => {
              const juntas = partidasCon(a, partidas);
              const ultima = juntas.at(-1);
              return (
                <li key={a.id} className="mp-amigo">
                  <div className="mp-amigo-fila">
                    <span className="mp-amigo-avatar">{iniciales(a.nombre)}</span>
                    <div className="mp-amigo-datos">
                      {editando === a.id ? (
                        <input
                          autoFocus
                          defaultValue={a.nombre}
                          maxLength={16}
                          onBlur={(ev) => {
                            cambiar(a.id, { nombre: ev.target.value.trim() || a.nombre });
                            setEditando(null);
                          }}
                          onKeyDown={(ev) => ev.key === "Enter" && (ev.target as HTMLInputElement).blur()}
                        />
                      ) : (
                        <strong onDoubleClick={() => setEditando(a.id)} title="Doble clic para cambiar el nombre">
                          {a.nombre}
                        </strong>
                      )}
                      <small>
                        {a.codigo ? `${a.codigo} · ` : ""}
                        {juntas.length
                          ? `${juntas.length} ${juntas.length === 1 ? "partida" : "partidas"} juntos · ganaste ${juntas.filter((p) => p.puesto === 1).length}${ultima ? ` · la última el ${new Date(ultima.fecha).toLocaleDateString("es-ES")}` : ""}`
                          : "Aún no habéis jugado juntos"}
                      </small>
                    </div>
                    <div className="mp-amigo-acciones">
                      <button className="principal" onClick={() => invitar(a)}>
                        Invitar
                      </button>
                      <button onClick={() => setEditando(a.id)} title="Cambiar el nombre">
                        Renombrar
                      </button>
                      {quitando === a.id ? (
                        <button
                          className="mp-peligro"
                          onClick={() => {
                            setAmigos(amigos.filter((x) => x.id !== a.id));
                            setQuitando(null);
                          }}
                        >
                          ¿Seguro?
                        </button>
                      ) : (
                        <button onClick={() => setQuitando(a.id)}>Quitar</button>
                      )}
                    </div>
                  </div>
                  {a.invitacion && <Invitacion codigo={a.invitacion.codigo} para={a.nombre} onAbrirSala={onAbrirSala} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
