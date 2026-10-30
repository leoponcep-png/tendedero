import { DIFICULTADES, type Datos, type Dificultad } from "@tendedero/motor";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { nombreVisible, t, useT } from "../i18n";
import { textoMotivo } from "../i18n/juego";
import { MesaJuego } from "../juego/MesaJuego";
import { perfilesDe } from "../juego/vista";
import { COLORES_JUGADOR, leerConfig, type Perfil } from "../prototipos/MenuPartida";
import { ANIMALES } from "../prototipos/Animales";
import { MuestraTapete } from "../prototipos/perfil/Comunes";
import { CabeceraMenu, FondoTendedero } from "../prototipos/PortadaJuego";
import { useAnfitrion, type SalaGuardada } from "../online/anfitrion";
import { useInvitado } from "../online/invitado";
import type { Asiento, PerfilOnline } from "../online/protocolo";
import { Mesa } from "./Mesa";
import { plataforma } from "../plataforma";
import { BuscandoJugadores } from "../plataforma/PartidaRapida";

// Sala de espera online, con el aspecto del menú nuevo: el código grande para dictarlo o copiarlo, una ficha por
// plaza (animal, color y tapete de cada uno, quién está listo) y, para el anfitrión, rivales de la IA en las
// plazas libres. Al empezar se juega en la mesa nueva (o en la antigua si la sala se abrió desde ella).

/**
 * Sala jugada desde la mesa nueva (#/prototipos/e): `perfil` es tu animal y color. `onAjustes` abre la ventana de
 * ajustes y `onInvitarAmigos` (opcional, lo pone la capa de plataforma) enseña «Invitar amigos» en la sala.
 */
export interface SalaNueva {
  perfil: Perfil;
  onAjustes?: () => void;
  onInvitarAmigos?: (codigo: string) => void;
}

const NOMBRES_IA = ["Lu", "Bruno", "Marta", "Nico", "Olga", "Pepa"];

/** Animal, color y nombre para un rival de la IA nuevo, sin repetir con los que ya hay en la sala. */
function perfilIA(asientos: Asiento[]): { nombre: string; perfil: PerfilOnline } {
  const animales = new Set(asientos.map((a) => a.perfil?.animal));
  const colores = new Set(asientos.map((a) => a.perfil?.color));
  const nombres = new Set(asientos.map((a) => a.nombre));
  return {
    nombre: NOMBRES_IA.find((n) => !nombres.has(n)) ?? `IA ${asientos.length + 1}`,
    perfil: {
      animal: ANIMALES.map((a) => a.id).find((a) => !animales.has(a)) ?? ANIMALES[0].id,
      color: COLORES_JUGADOR.find((c) => !colores.has(c)) ?? COLORES_JUGADOR[0],
      tapete: "basico",
    },
  };
}

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

/** El código de la sala en grande, para dictarlo, y el botón de copiarlo. */
function CodigoSala({ codigo, estado, children }: { codigo: string; estado: ReactNode; children?: ReactNode }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <section className="menu-tarjeta sl-codigo">
      <h2>{t("sala.codigoTitulo")}</h2>
      <div className="sl-codigo-letras" aria-label={codigo}>
        {codigo
          .toUpperCase()
          .split("")
          .map((c, i) => (
            <span key={i}>{c}</span>
          ))}
      </div>
      <button
        className={`sl-copiar ${copiado ? "hecho" : ""}`}
        onClick={async () => {
          if (await copiar(codigo.toUpperCase())) {
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 1800);
          }
        }}
      >
        {copiado ? t("sala.copiado") : t("sala.copiarCodigo")}
      </button>
      {estado}
      {children}
    </section>
  );
}

/** Ficha de una plaza: el tapete del jugador con su animal y su nombre, y en qué estado está. */
function FichaPlaza({
  a,
  yo,
  esAnfitrion,
  onQuitar,
  onNivel,
}: {
  a: Asiento;
  yo: number;
  esAnfitrion: boolean;
  onQuitar?: () => void;
  onNivel?: (d: Dificultad) => void;
}) {
  const perfil = a.perfil ?? { animal: ANIMALES[a.asiento % ANIMALES.length].id, color: COLORES_JUGADOR[a.asiento % COLORES_JUGADOR.length] };
  const estado = !a.conectado ? "desconectado" : a.listo ? "listo" : "esperando";
  return (
    <li className={`sl-ficha es-${estado} ${a.asiento === yo ? "mia" : ""}`} style={{ "--jugador": perfil.color } as CSSProperties}>
      <MuestraTapete className="sl-tapete" animal={perfil.animal} color={perfil.color} tapete={perfil.tapete} nombre={nombreVisible(a.nombre)} />
      <div className="sl-etiquetas">
        {a.asiento === yo && <span className="sl-etiqueta tu">{t("sala.tu")}</span>}
        {a.asiento === 0 && <span className="sl-etiqueta anfitrion">{t("sala.anfitrion")}</span>}
        {a.ia && <span className="sl-etiqueta ia">{t("sala.ia")}</span>}
      </div>
      {a.ia && esAnfitrion && onNivel ? (
        <div className="sl-nivel" role="group" aria-label={t("menu.dificultad")}>
          {DIFICULTADES.map((d) => (
            <button key={d} className={a.ia === d ? "activa" : ""} aria-pressed={a.ia === d} onClick={() => onNivel(d)}>
              {t(`menu.dificultad.${d}`)}
            </button>
          ))}
        </div>
      ) : a.ia ? (
        <span className="sl-estado es-listo">{t(`menu.dificultad.${a.ia}`)}</span>
      ) : (
        <span className={`sl-estado es-${estado}`}>{estado === "desconectado" ? t("sala.desconectado") : estado === "listo" ? t("sala.listo") : t("sala.noListo")}</span>
      )}
      {onQuitar && (
        <button className="sl-quitar" onClick={onQuitar} aria-label={t("sala.quitar")} title={t("sala.quitar")}>
          ×
        </button>
      )}
    </li>
  );
}

function PlazaLibre({ onIA }: { onIA?: () => void }) {
  return (
    <li className="sl-ficha libre">
      <div className="sl-hueco">
        <span className="sl-hueco-pinza" aria-hidden />
        <span>{t("sala.plazaLibre")}</span>
      </div>
      {onIA ? (
        <button className="sl-anadir-ia" onClick={onIA}>
          + {t("sala.anadirIA")}
        </button>
      ) : (
        <span className="sl-estado es-esperando">{t("sala.esperando")}</span>
      )}
    </li>
  );
}

function Fichas({ asientos, plazas, yo, anfitrion }: { asientos: Asiento[]; plazas: number; yo: number; anfitrion?: ReturnType<typeof useAnfitrion> }) {
  const nivel = leerConfig().dificultad ?? "normal";
  return (
    <ol className="sl-fichas">
      {Array.from({ length: plazas }, (_, i) => {
        const a = asientos.find((x) => x.asiento === i);
        if (!a) {
          const primeraLibre = i === asientos.length;
          return (
            <PlazaLibre
              key={i}
              onIA={
                anfitrion && primeraLibre
                  ? () => {
                      const { nombre, perfil } = perfilIA(asientos);
                      anfitrion.anadirIA(nombre, perfil, nivel);
                    }
                  : undefined
              }
            />
          );
        }
        return (
          <FichaPlaza
            key={i}
            a={a}
            yo={yo}
            esAnfitrion={!!anfitrion}
            onQuitar={anfitrion && i !== 0 ? () => anfitrion.quitar(i) : undefined}
            onNivel={anfitrion ? (d) => anfitrion.cambiarNivelIA(i, d) : undefined}
          />
        );
      })}
    </ol>
  );
}

/** Pantalla de sala de espera con el fondo de la portada y la barra de volver y ajustes. */
function PantallaSala({ titulo, onVolver, onAjustes, children }: { titulo: string; onVolver: () => void; onAjustes?: () => void; children: ReactNode }) {
  return (
    <div className="pt-pantalla pt-sub sl-sala">
      <FondoTendedero />
      <CabeceraMenu titulo={titulo} onVolver={onVolver} onAjustes={onAjustes} />
      <div className="sl-contenido">{children}</div>
    </div>
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
  // Steam: al empezar, la sala deja de admitir gente y de salir en la partida rápida (sin Steam no hace nada).
  const empezada = !!s.vista;
  useEffect(() => {
    if (empezada) plataforma().salaEmpezada();
  }, [empezada]);
  /** «Rellenar con IA» de la partida rápida: un rival de la IA en cada plaza libre. */
  const rellenarConIA = () => {
    const nivel = leerConfig().dificultad ?? "normal";
    const lista = [...s.asientos];
    for (let i = lista.length; i < s.sala.ajustes.jugadores; i++) {
      const { nombre, perfil } = perfilIA(lista);
      s.anadirIA(nombre, perfil, nivel);
      lista.push({ asiento: i, nombre, perfil, conectado: true, listo: true, ia: nivel } as Asiento);
    }
  };
  const conectados = s.asientos.filter((a) => a.conectado && !a.ia).length;
  const estadoConexion = (
    <span className={`estado-conexion ${s.abierta ? "bien" : "mal"}`}>
      {t("sala.estado", { codigo: s.sala.codigo.toUpperCase(), estado: s.abierta ? t("sala.conectados", { n: conectados }) : (s.error ?? t("sala.abriendo")) })}
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
        onOcupado={s.setOcupado}
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
          if (confirm(t("sala.confirmarSalirAnfitrion"))) onSalir();
        }}
        onNueva={s.volverASala}
      />
    );
  }

  const plazas = s.sala.ajustes.jugadores;
  const faltanListos = s.asientos.some((a) => !a.listo || !a.conectado);
  const puede = s.asientos.length >= 2 && !faltanListos;
  return (
    <PantallaSala titulo={t("sala.titulo")} onVolver={onSalir} onAjustes={nueva?.onAjustes}>
      <aside className="sl-lado">
        <CodigoSala codigo={s.sala.codigo} estado={estadoConexion}>
          <p className="sl-ayuda">{t("sala.pasaCodigo")}</p>
          {s.error && !s.abierta && <p className="sl-error">{s.error}</p>}
          {nueva?.onInvitarAmigos && (
            <div className="sl-invitar" data-hueco="invitar-amigos">
              <button onClick={() => nueva.onInvitarAmigos?.(s.sala.codigo)}>{t("sala.invitarAmigos")}</button>
            </div>
          )}
        </CodigoSala>
        <BuscandoJugadores codigo={s.sala.codigo} jugadores={s.asientos.length} plazas={s.sala.ajustes.jugadores} empezada={empezada} onRellenarIA={rellenarConIA} />
      </aside>
      <section className="menu-tarjeta sl-plazas">
        <div className="sl-plazas-cabeza">
          <h2>{t("sala.jugadores", { n: s.asientos.length, max: plazas })}</h2>
          <div className="sl-num-plazas" role="group" aria-label={t("online.plazas")}>
            <span>{t("online.plazas")}</span>
            {[2, 3, 4].map((n) => (
              <button key={n} className={plazas === n ? "activa" : ""} aria-pressed={plazas === n} disabled={n < s.asientos.length} onClick={() => s.cambiarPlazas(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <Fichas asientos={s.asientos} plazas={plazas} yo={0} anfitrion={s} />
        <footer className="sl-pie">
          <button onClick={onSalir}>{t("sala.cerrar")}</button>
          <span className="sl-nota">{s.asientos.length < 2 ? t("sala.faltan") : faltanListos ? t("sala.esperandoListos") : t("sala.todosListos")}</span>
          <button className="principal sl-empezar" disabled={!puede} onClick={s.empezar}>
            {t("sala.empezarCon", { n: s.asientos.length })}
          </button>
        </footer>
      </section>
    </PantallaSala>
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

/** Entra en la sala con este nombre (se recuerda para la próxima vez y para volver al recargar). */
export function entrarConNombre(codigo: string, nombre: string) {
  try {
    localStorage.setItem("tendedero-nombre", nombre);
    sessionStorage.setItem(claveDentro(codigo), nombre);
  } catch {
    // Solo es para recordarlo la próxima vez.
  }
}

/** Sala vista por un invitado: pone su nombre, entra, dice que está listo y juega. */
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
      <PantallaSala titulo={t("sala.unirseA", { codigo: codigo.toUpperCase() })} onVolver={onSalir} onAjustes={nueva?.onAjustes}>
        <section className="menu-tarjeta sl-entrar">
          <form
            className="ol-unirse"
            onSubmit={(e) => {
              e.preventDefault();
              const n = borrador.trim();
              if (!n) return;
              entrarConNombre(codigo, n);
              setNombre(n);
            }}
          >
            <input autoFocus value={borrador} maxLength={24} onChange={(e) => setBorrador(e.target.value)} placeholder={t("sala.tuNombre")} aria-label={t("sala.tuNombre")} />
            <button className="principal ol-accion" disabled={!borrador.trim()}>
              {t("sala.entrar")}
            </button>
          </form>
        </section>
      </PantallaSala>
    );
  }

  const estadoConexion = (
    <span className={`estado-conexion ${s.fase === "dentro" ? "bien" : "mal"}`}>
      {t("sala.estado", { codigo: codigo.toUpperCase(), estado: s.fase === "dentro" ? t("sala.conectado") : s.fase === "rechazado" ? t("sala.fuera") : t("sala.reconectando") })}
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
          if (confirm(t("sala.confirmarSalirInvitado"))) salir();
        }}
        onNueva={salir}
      />
    );
  }

  const yo = s.sala?.tuAsiento ?? -1;
  const estoyListo = !!s.asientos.find((a) => a.asiento === yo)?.listo;
  return (
    <PantallaSala titulo={t("sala.salaN", { codigo: codigo.toUpperCase() })} onVolver={salir} onAjustes={nueva?.onAjustes}>
      <aside className="sl-lado">
        <CodigoSala codigo={codigo} estado={estadoConexion}>
          {s.fase === "rechazado" && <p className="sl-error">{s.error}</p>}
          {s.fase === "conectando" && <p className="sl-ayuda">{t("sala.conectando")}</p>}
          {s.fase === "reconectando" && (
            <p className="sl-error">
              {s.error ?? t("sala.cortada")} {t("sala.reintentando")}
            </p>
          )}
          {s.fase === "dentro" && <p className="sl-ayuda">{t("sala.dentro")}</p>}
        </CodigoSala>
      </aside>
      <section className="menu-tarjeta sl-plazas">
        {s.sala && s.fase === "dentro" ? (
          <>
            <div className="sl-plazas-cabeza">
              <h2>{t("sala.jugadores", { n: s.asientos.length, max: s.sala.plazas })}</h2>
            </div>
            <Fichas asientos={s.asientos} plazas={s.sala.plazas} yo={yo} />
          </>
        ) : (
          <div className="sl-esperando">
            <span className="sl-hueco-pinza" aria-hidden />
            <p>{s.fase === "rechazado" ? s.error : t("sala.conectando")}</p>
          </div>
        )}
        <footer className="sl-pie">
          <button onClick={salir}>{t("sala.salir")}</button>
          <span className="sl-nota">{s.fase === "dentro" ? (estoyListo ? t("sala.esperandoAnfitrion") : t("sala.diListo")) : ""}</span>
          {s.fase === "dentro" && (
            <button className={`sl-empezar ${estoyListo ? "" : "principal"}`} onClick={() => s.marcarListo(!estoyListo)}>
              {estoyListo ? t("sala.yaNoListo") : t("sala.estoyListo")}
            </button>
          )}
        </footer>
      </section>
    </PantallaSala>
  );
}
