import { useEffect, useState } from "react";
import { fecha, t, useT } from "../../i18n";
import { tNodos } from "../../i18n/react";
import { leerConfig } from "../MenuPartida";
import { usePlataforma, type AmigoPlataforma, type EstadoAmigo, type Resultado, type TrayectoriaAmigo } from "../../plataforma";
import { nombreAnimal } from "./catalogo";
import { añadirAmigo, guardarAmigos, juntosCon, leerAmigos, miCodigoAmigo, nuevaInvitacion, type Amigo } from "./amigos";
import { IconoPerfil } from "./Iconos";
import type { ResumenPartida } from "./registro";

// Pestaña «Amigos»: tus amigos con su avatar y su estado (en Steam), su trayectoria al pulsarlos e «Invitar a mi
// sala». Sin Steam, la lista se guarda en este equipo, el estado y las estadísticas de los amigos enseñan su hueco
// («Disponible en la versión de Steam») y se invita pasando el código de la sala (no hay enlaces: es una aplicación).

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

export function BotonCopiar({ texto, etiqueta = t("amigos.copiar") }: { texto: string; etiqueta?: string }) {
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
      {hecho ? t("amigos.copiado") : etiqueta}
    </button>
  );
}

/** El código de una sala para dictarlo o copiarlo (sin Steam es la única forma de invitar: no hay enlaces). */
export function Invitacion({ codigo, para, onAbrirSala }: { codigo: string; para?: string; onAbrirSala?: (codigo: string) => void }) {
  return (
    <div className="mp-invitacion">
      <p>{para ? tNodos("amigos.pasaCodigoA", { nombre: <strong>{para}</strong> }) : t("amigos.pasaCodigo")}</p>
      <div className="mp-invitacion-fila">
        <span className="mp-codigo-sala">{codigo}</span>
        <BotonCopiar texto={codigo} etiqueta={t("amigos.copiarCodigo")} />
        {onAbrirSala && (
          <button className="principal" onClick={() => onAbrirSala(codigo)}>
            {t("amigos.abrirSala")}
          </button>
        )}
      </div>
    </div>
  );
}

export const iniciales = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

/** Un amigo tal como sale en la lista: guardado en este equipo, de Steam, o los dos (unidos por `steamId`). */
interface Fila {
  clave: string;
  nombre: string;
  avatar?: string;
  /** Sin estado si no viene de la plataforma. */
  estado?: EstadoAmigo;
  presencia?: string;
  local?: Amigo;
  steam?: AmigoPlataforma;
}

function juntarFilas(locales: Amigo[], deSteam: AmigoPlataforma[]): Fila[] {
  const filas: Fila[] = deSteam.map((s) => {
    const local = locales.find((a) => a.steamId === s.id);
    return { clave: `s:${s.id}`, nombre: s.nombre, avatar: s.avatar, estado: s.estado, presencia: s.presencia, local, steam: s };
  });
  for (const a of locales) if (!a.steamId || !deSteam.some((s) => s.id === a.steamId)) filas.push({ clave: `l:${a.id}`, nombre: a.nombre, local: a });
  // Primero quien está jugando, luego los conectados.
  const peso = (f: Fila) => (f.estado === "jugando" ? 0 : f.estado === "conectado" ? 1 : f.estado === "ausente" ? 2 : 3);
  return filas.sort((a, b) => peso(a) - peso(b));
}

export function EstadoChip({ estado }: { estado?: EstadoAmigo }) {
  const t = useT();
  return (
    <span className={`mp-estado mp-estado-${estado ?? "desconocido"}`} title={estado ? undefined : t("amigos.estadoSoloSteam")}>
      <span className="mp-estado-punto" aria-hidden />
      {t(`amigos.estado.${estado ?? "desconocido"}`)}
    </span>
  );
}

export function AvatarAmigo({ nombre, avatar }: { nombre: string; avatar?: string }) {
  return <span className="mp-amigo-avatar">{avatar ? <img src={avatar} alt="" /> : iniciales(nombre)}</span>;
}

function Cifra({ valor, nombre }: { valor: string | number | undefined; nombre: string }) {
  return (
    <div className="mp-cifra-amigo">
      <strong>{valor ?? t("amigos.sinDato")}</strong>
      <span>{nombre}</span>
    </div>
  );
}

/** Ficha que se abre al pulsar un amigo: lo jugado juntos (de este equipo) y sus números (de la plataforma). */
function Trayectoria({ fila, partidas, onCerrar }: { fila: Fila; partidas: ResumenPartida[]; onCerrar: () => void }) {
  const t = useT();
  const p = usePlataforma();
  const [suya, setSuya] = useState<Resultado<TrayectoriaAmigo> | null>(null);
  useEffect(() => {
    let vivo = true;
    setSuya(null);
    const id = fila.steam?.id ?? fila.local?.steamId;
    (id ? p.trayectoriaAmigo(id) : Promise.resolve({ disponible: false, motivo: p.nombre === "steam" ? "sin-api" : "sin-steam" } as const)).then((r) => vivo && setSuya(r));
    return () => {
      vivo = false;
    };
  }, [fila.clave, p]);
  const juntos = fila.local ? juntosCon(fila.local, partidas) : null;
  const datos = suya?.disponible ? suya.valor : null;
  const idSteam = fila.steam?.id ?? fila.local?.steamId;
  return (
    <div className="mp-trayectoria">
      <div className="mp-trayectoria-cabeza">
        <AvatarAmigo nombre={fila.nombre} avatar={fila.avatar} />
        <div>
          <h3>{t("amigos.trayectoria", { nombre: fila.nombre })}</h3>
          <EstadoChip estado={fila.estado} />
          {fila.presencia && <small className="mp-presencia">{fila.presencia}</small>}
        </div>
        <button className="mp-enlace-boton" onClick={onCerrar}>
          {t("amigos.cerrarFicha")}
        </button>
      </div>

      <h4>{t("amigos.juntosTitulo")}</h4>
      {juntos && juntos.partidas ? (
        <>
          <div className="mp-cifras-amigo">
            <Cifra valor={juntos.partidas} nombre={t("amigos.cifraJuntas")} />
            <Cifra valor={juntos.tuyas} nombre={t("amigos.cifraTuyas")} />
            <Cifra valor={juntos.suyas} nombre={t("amigos.cifraSuyas", { nombre: fila.nombre })} />
          </div>
          {juntos.ultima && <small className="mp-presencia">{t("amigos.ultima", { fecha: fecha(juntos.ultima, { day: "numeric", month: "numeric", year: "numeric" }) })}</small>}
        </>
      ) : (
        <p className="mp-nota">{t("amigos.nunca")}</p>
      )}

      <h4>{t("amigos.suyaTitulo")}</h4>
      <div className={`mp-cifras-amigo ${datos ? "" : "mp-hueco-steam"}`}>
        <Cifra valor={datos?.partidas} nombre={t("amigos.cifraPartidas")} />
        <Cifra valor={datos?.ganadas} nombre={t("amigos.cifraVictorias")} />
        <Cifra valor={datos?.logros} nombre={t("amigos.cifraLogros")} />
        <Cifra valor={datos?.animalFavorito ? nombreAnimal(datos.animalFavorito) : undefined} nombre={t("amigos.cifraAnimal")} />
      </div>
      {suya && !suya.disponible && (
        <p className="mp-nota mp-nota-steam">
          <span className="mp-sello-steam">{t("steam.soloSteam")}</span>
          {suya.motivo === "sin-steam" ? t("amigos.trayectoriaLocal") : t("amigos.trayectoriaSinApi")}
        </p>
      )}
      {idSteam && p.abrirPerfilAmigo && (
        <button onClick={() => p.abrirPerfilAmigo?.(idSteam)}>
          <IconoPerfil icono="grafica" />
          {t("amigos.verEnSteam")}
        </button>
      )}
    </div>
  );
}

/** Lo de Steam arriba del todo: tu cuenta y, si se puede, tus amigos de Steam; si no, el hueco con su mensaje. */
function BloqueSteam({ amigosSteam }: { amigosSteam: Resultado<AmigoPlataforma[]> | null }) {
  const t = useT();
  const p = usePlataforma();
  return (
    <section className={`mp-bloque mp-bloque-steam ${p.nombre === "steam" ? "" : "mp-hueco-steam"}`}>
      <div className="mp-seccion-titulo">
        <h2>{t("amigos.steamTitulo")}</h2>
        {p.nombre !== "steam" && <span className="mp-sello-steam">{t("steam.soloSteam")}</span>}
      </div>
      {p.nombre !== "steam" ? (
        <p>{t("amigos.steamLocal")}</p>
      ) : (
        <>
          {p.usuario && <p>{t("amigos.steamCuenta", { nombre: p.usuario })}</p>}
          {amigosSteam && !amigosSteam.disponible && <p>{t("amigos.steamSinApi")}</p>}
          {amigosSteam?.disponible && !amigosSteam.valor.length && <p>{t("amigos.steamVacio")}</p>}
          {p.abrirAmigos && (
            <button onClick={() => p.abrirAmigos?.()}>
              <IconoPerfil icono="amigos" />
              {t("amigos.steamAbrir")}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export function PanelAmigos({ partidas, onAbrirSala }: { partidas: ResumenPartida[]; onAbrirSala?: (codigo: string) => void }) {
  const t = useT();
  const p = usePlataforma();
  const [amigos, setAmigosEstado] = useState(leerAmigos);
  const [amigosSteam, setAmigosSteam] = useState<Resultado<AmigoPlataforma[]> | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [invitacion, setInvitacion] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [avisoSteam, setAvisoSteam] = useState("");
  const miCodigo = miCodigoAmigo();

  useEffect(() => {
    let vivo = true;
    const leer = () => p.amigos().then((r) => vivo && setAmigosSteam(r));
    leer();
    // En Steam el estado cambia solo: se vuelve a mirar de vez en cuando.
    const cada = p.nombre === "steam" ? window.setInterval(leer, 15000) : 0;
    return () => {
      vivo = false;
      window.clearInterval(cada);
    };
  }, [p]);

  const filas = juntarFilas(amigos, amigosSteam?.disponible ? amigosSteam.valor : []);
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
  const cambiar = (id: string, cambio: Partial<Amigo>) => setAmigos(amigos.map((x) => (x.id === id ? { ...x, ...cambio } : x)));

  /** «Invitar a mi sala»: en Steam, la sala se apunta en Steam, se abre su ventana de invitar y entras en la sala. */
  const invitarAMiSala = async (para?: Amigo) => {
    const codigo = nuevaInvitacion();
    if (p.nombre === "steam") {
      const yo = leerConfig().jugadores[0];
      const r = await p.invitarASala({ codigo, plazas: leerConfig().jugadores.length, nombre: yo.nombre });
      if (r.disponible) {
        onAbrirSala?.(codigo);
        return;
      }
      setAvisoSteam(t("invitar.steamError"));
    }
    if (para) setAmigos(amigos.map((x) => (x.id === para.id ? { ...x, invitacion: { codigo, fecha: new Date().toISOString() } } : x)));
    else setInvitacion(codigo);
  };

  return (
    <div className="mp-amigos">
      <BloqueSteam amigosSteam={amigosSteam} />

      <div className="mp-dos-columnas">
        <section className="mp-bloque">
          <h2>{t("amigos.invitarMiSala")}</h2>
          {invitacion ? (
            <>
              <Invitacion codigo={invitacion} onAbrirSala={onAbrirSala} />
              <button className="mp-enlace-boton" onClick={() => setInvitacion(nuevaInvitacion())}>
                {t("amigos.otraSala")}
              </button>
            </>
          ) : (
            <>
              <p>{p.nombre === "steam" ? t("amigos.invitarSteamAyuda") : t("amigos.invitarMiSalaAyuda")}</p>
              <button className="principal" onClick={() => invitarAMiSala()}>
                <IconoPerfil icono="amigos" />
                {t("amigos.invitarMiSala")}
              </button>
            </>
          )}
          {avisoSteam && <p className="mp-error">{avisoSteam}</p>}
        </section>
        <section className="mp-bloque mp-mi-codigo">
          <h2>{t("amigos.tuCodigo")}</h2>
          <p>{t("amigos.daselo")}</p>
          <div className="mp-invitacion-fila">
            <span className="mp-codigo-sala">{miCodigo}</span>
            <BotonCopiar texto={miCodigo} />
          </div>
        </section>
      </div>

      <section className="mp-bloque">
        <div className="mp-seccion-titulo">
          <h2>{t("amigos.titulo")}</h2>
          <span>{filas.length}</span>
        </div>
        <form
          className="mp-añadir"
          onSubmit={(ev) => {
            ev.preventDefault();
            añadir();
          }}
        >
          <input value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder={t("amigos.placeholder")} maxLength={20} />
          <button type="submit" className="principal">
            {t("amigos.anadir")}
          </button>
        </form>
        {error && <p className="mp-error">{error}</p>}

        {!filas.length ? (
          <div className="mp-vacio pequeno">
            <IconoPerfil icono="amigos" />
            <p>{t("amigos.vacio")}</p>
          </div>
        ) : (
          <ul className="mp-lista-amigos">
            {filas.map((f) => {
              const a = f.local;
              const juntos = a ? juntosCon(a, partidas) : null;
              const abiertoAqui = abierto === f.clave;
              return (
                <li key={f.clave} className={`mp-amigo ${abiertoAqui ? "abierto" : ""}`}>
                  <div className="mp-amigo-fila">
                    <button className="mp-amigo-pulsar" onClick={() => setAbierto(abiertoAqui ? null : f.clave)} title={t("amigos.verTrayectoria")} aria-expanded={abiertoAqui}>
                      <AvatarAmigo nombre={f.nombre} avatar={f.avatar} />
                    </button>
                    <div className="mp-amigo-datos">
                      {a && editando === a.id ? (
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
                        <strong className="mp-amigo-nombre" onClick={() => setAbierto(abiertoAqui ? null : f.clave)} title={t("amigos.verTrayectoria")}>
                          {f.nombre}
                          {f.steam && <span className="mp-sello-steam pequeno">{t("amigos.deSteam")}</span>}
                        </strong>
                      )}
                      <small>
                        <EstadoChip estado={f.estado} />
                        {f.presencia ? ` ${f.presencia} · ` : " "}
                        {a?.codigo ? `${a.codigo} · ` : ""}
                        {juntos?.partidas ? `${t("amigos.juntas", { n: juntos.partidas })} · ${t("amigos.ganaste", { n: juntos.tuyas })}` : t("amigos.nunca")}
                      </small>
                    </div>
                    <div className="mp-amigo-acciones">
                      <button className="principal" onClick={() => invitarAMiSala(a)}>
                        {t("amigos.invitar")}
                      </button>
                      <button onClick={() => setAbierto(abiertoAqui ? null : f.clave)}>{t("amigos.verTrayectoria")}</button>
                      {a && (
                        <button onClick={() => setEditando(a.id)} title={t("amigos.cambiarNombre")}>
                          {t("amigos.renombrar")}
                        </button>
                      )}
                      {a &&
                        (quitando === a.id ? (
                          <button
                            className="mp-peligro"
                            onClick={() => {
                              setAmigos(amigos.filter((x) => x.id !== a.id));
                              setQuitando(null);
                              setAbierto(null);
                            }}
                          >
                            {t("amigos.seguro")}
                          </button>
                        ) : (
                          <button onClick={() => setQuitando(a.id)}>{t("amigos.quitar")}</button>
                        ))}
                    </div>
                  </div>
                  {abiertoAqui && <Trayectoria fila={f} partidas={partidas} onCerrar={() => setAbierto(null)} />}
                  {a?.invitacion && <Invitacion codigo={a.invitacion.codigo} para={a.nombre} onAbrirSala={onAbrirSala} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
