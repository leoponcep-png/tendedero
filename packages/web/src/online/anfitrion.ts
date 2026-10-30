import { aplicar, cestasPorDefecto, crearPartida, porQueNoVale, siguienteJugadaIA, vistaPara, type Ajustes, type Datos, type Dificultad, type Jugada, type Partida } from "@tendedero/motor";
import Peer, { type DataConnection } from "peerjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LINEAS_DE_REGISTRO, PREFIJO, textoError, type Asiento, type MensajeAnfitrion, type MensajeInvitado, type PerfilOnline } from "./protocolo";

interface Participante {
  asiento: number;
  nombre: string;
  token: string;
  perfil?: PerfilOnline;
  /** Invitado que ha dicho que está listo para empezar. */
  listo?: boolean;
  /** Rival de la IA: lo juega el navegador del anfitrión, con este nivel. */
  ia?: Dificultad;
}

/** El asiento de la IA que tiene que hacer algo ahora, si hay alguno. */
function turnoDeIA(p: Partida, esIA: (asiento: number) => boolean): number | null {
  if (p.terminada) return null;
  const sinObjetivo = p.jugadores.findIndex((j, i) => esIA(i) && j.objetivosOfrecidos.length > 0);
  if (sinObjetivo >= 0) return sinObjetivo;
  // Hasta que las personas no eligen su objetivo no empieza nadie.
  if (p.jugadores.some((j, i) => !esIA(i) && j.objetivosOfrecidos.length > 0)) return null;
  if (p.reaccion) return esIA(p.reaccion.defensor) ? p.reaccion.defensor : null;
  return esIA(p.turno.jugador) ? p.turno.jugador : null;
}

/** Pausa antes de cada jugada de la IA, para que se pueda seguir lo que hace (como contra la IA). */
function pausaIA(p: Partida): number {
  if (p.reaccion) return 900;
  if (p.turno.fase === "cesta" || p.turno.fase === "centro") return 650;
  return 800;
}

/** Lo que el anfitrión guarda en su navegador: si recarga la página, la sala sigue donde estaba. */
export interface SalaGuardada {
  codigo: string;
  ajustes: Ajustes;
  participantes: Participante[];
  partida: Partida | null;
  /** La última jugada aplicada y su número (la mesa nueva la anima). */
  ultima?: { jugada: Jugada; n: number } | null;
}

const TOKEN_ANFITRION = "anfitrion";
const clave = (codigo: string) => `tendedero-sala-${codigo}`;

export function guardarSala(s: SalaGuardada) {
  try {
    localStorage.setItem(clave(s.codigo), JSON.stringify(s));
  } catch {
    // Sin almacenamiento la sala funciona igual; solo se pierde al recargar.
  }
}

export function leerSala(codigo: string): SalaGuardada | null {
  try {
    const t = localStorage.getItem(clave(codigo));
    return t ? (JSON.parse(t) as SalaGuardada) : null;
  } catch {
    return null;
  }
}

export function nuevaSala(codigo: string, ajustes: Ajustes, nombre: string, perfil?: PerfilOnline): SalaGuardada {
  return { codigo, ajustes, participantes: [{ asiento: 0, nombre, token: TOKEN_ANFITRION, perfil }], partida: null };
}

function vistaRecortada(p: Partida, asiento: number): Partida {
  const v = vistaPara(p, asiento);
  v.registro = v.registro.slice(-LINEAS_DE_REGISTRO);
  // El registro estructurado (para traducirlo) se recorta igual: van a la par contando desde el final.
  if (v.entradas) v.entradas = v.entradas.slice(-LINEAS_DE_REGISTRO);
  return v;
}

/** Los asientos tal como los ven todos: el anfitrión y la IA siempre están conectados y listos. */
function asientosDe(sala: SalaGuardada, conectados: string[]): Asiento[] {
  return sala.participantes.map((p) => {
    const fijo = p.token === TOKEN_ANFITRION || !!p.ia;
    return {
      asiento: p.asiento,
      nombre: p.nombre,
      conectado: fijo || conectados.includes(p.token),
      perfil: p.perfil,
      listo: fijo || !!p.listo,
      ia: p.ia,
    };
  });
}

/**
 * La sala vista desde el anfitrión: abre la conexión con el código de la sala, admite invitados, reparte asientos
 * y aplica todas las jugadas (las suyas y las de los demás) sobre la partida, que solo existe aquí.
 */
export function useAnfitrion(inicial: SalaGuardada, datos: Datos) {
  const [sala, setSala] = useState<SalaGuardada>(inicial);
  const [abierta, setAbierta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conectados, setConectados] = useState<string[]>([]);
  const salaRef = useRef(sala);
  const conexiones = useRef(new Map<string, DataConnection>());
  const tokenDe = useRef(new WeakMap<DataConnection, string>());

  const actualizar = useCallback((fn: (s: SalaGuardada) => SalaGuardada) => {
    const nueva = fn(salaRef.current);
    salaRef.current = nueva;
    setSala(nueva);
    guardarSala(nueva);
  }, []);

  const enviar = (conn: DataConnection, m: MensajeAnfitrion) => {
    if (conn.open) conn.send(m);
  };

  /** Aplica una jugada en nombre del asiento indicado; devuelve el motivo si no vale. */
  const jugarComo = useCallback(
    (asiento: number, j: Jugada): string | null => {
      const p = salaRef.current.partida;
      if (!p) return "La partida todavía no ha empezado.";
      if (j.jugador !== asiento) return "Solo puedes jugar por ti.";
      const r = aplicar(p, j);
      if (!r.ok) return r.motivo;
      actualizar((s) => ({ ...s, partida: r.partida, ultima: { jugada: j, n: (s.ultima?.n ?? 0) + 1 } }));
      return null;
    },
    [actualizar],
  );

  // Conexión con el servidor de salas de PeerJS, con el código de la sala como id.
  useEffect(() => {
    let cancelado = false;
    let peer: Peer | null = null;
    let espera: ReturnType<typeof setTimeout> | undefined;

    const alMensaje = (conn: DataConnection, m: MensajeInvitado) => {
      if (m.t === "hola") {
        const s = salaRef.current;
        let conocido = s.participantes.find((p) => p.token === m.token);
        // Quien perdió su token (cerró la pestaña, cambió de móvil) recupera su asiento con el mismo nombre,
        // siempre que ese asiento esté desconectado.
        if (!conocido) {
          const mismoNombre = (p: Participante) => p.nombre.trim().toLowerCase() === m.nombre.trim().toLowerCase();
          const libre = s.participantes.find((p) => p.token !== TOKEN_ANFITRION && !p.ia && mismoNombre(p) && !conexiones.current.get(p.token)?.open);
          if (libre) {
            conexiones.current.delete(libre.token);
            actualizar((x) => ({ ...x, participantes: x.participantes.map((p) => (p === libre || p.asiento === libre.asiento ? { ...p, token: m.token } : p)) }));
            conocido = { ...libre, token: m.token };
          }
        }
        if (!conocido) {
          const motivo = s.partida
            ? "La partida ya ha empezado."
            : s.participantes.length >= s.ajustes.jugadores
              ? "La sala está llena."
              : null;
          if (motivo) {
            enviar(conn, { t: "rechazo", motivo });
            setTimeout(() => conn.close(), 500);
            return;
          }
        }
        tokenDe.current.set(conn, m.token);
        conexiones.current.get(m.token)?.close();
        conexiones.current.set(m.token, conn);
        actualizar((s) => {
          const nombre = m.nombre.trim().slice(0, 24) || "Invitado";
          if (s.participantes.some((p) => p.token === m.token)) {
            return { ...s, participantes: s.participantes.map((p) => (p.token === m.token ? { ...p, nombre, perfil: m.perfil ?? p.perfil } : p)) };
          }
          return { ...s, participantes: [...s.participantes, { asiento: s.participantes.length, nombre, token: m.token, perfil: m.perfil, listo: false }] };
        });
        setConectados([...conexiones.current.keys()]);
        return;
      }
      if (m.t === "listo") {
        const token = tokenDe.current.get(conn);
        if (!token || salaRef.current.partida) return;
        actualizar((s) => ({ ...s, participantes: s.participantes.map((p) => (p.token === token ? { ...p, listo: !!m.listo } : p)) }));
        return;
      }
      if (m.t === "jugada") {
        const token = tokenDe.current.get(conn);
        const yo = salaRef.current.participantes.find((p) => p.token === token);
        if (!yo) return;
        const motivo = jugarComo(yo.asiento, m.jugada);
        // Con el motivo estructurado, el invitado lo puede leer en su idioma.
        const p = salaRef.current.partida;
        const detalle = p && motivo ? (porQueNoVale(p, m.jugada) ?? undefined) : undefined;
        if (motivo) enviar(conn, { t: "error", motivo, detalle });
      }
    };

    const recibir = (conn: DataConnection) => {
      conn.on("data", (d) => alMensaje(conn, d as MensajeInvitado));
      conn.on("close", () => {
        const token = tokenDe.current.get(conn);
        if (token && conexiones.current.get(token) === conn) conexiones.current.delete(token);
        setConectados([...conexiones.current.keys()]);
      });
    };

    const abrir = () => {
      if (cancelado) return;
      peer = new Peer(PREFIJO + inicial.codigo);
      peer.on("open", () => {
        setAbierta(true);
        setError(null);
      });
      peer.on("connection", recibir);
      peer.on("disconnected", () => {
        if (!cancelado && peer && !peer.destroyed) peer.reconnect();
      });
      peer.on("error", (e) => {
        if (cancelado) return;
        // Al recargar, el servidor tarda unos segundos en soltar el id de la sala: se reintenta.
        if (e.type === "unavailable-id") {
          setError("Recuperando la sala…");
          peer?.destroy();
          espera = setTimeout(abrir, 3000);
          return;
        }
        // «peer-unavailable» en el anfitrión es un invitado que se fue a mitad de conexión: la sala sigue abierta.
        if (e.type === "peer-unavailable") return;
        setAbierta(false);
        setError(textoError(e.type));
      });
    };
    abrir();

    return () => {
      cancelado = true;
      clearTimeout(espera);
      peer?.destroy();
      conexiones.current.clear();
    };
  }, [inicial.codigo, actualizar, jugarComo]);

  // Cada vez que cambia la sala o la partida, cada invitado recibe lo que le toca ver.
  useEffect(() => {
    const asientos = asientosDe(sala, conectados);
    for (const p of sala.participantes) {
      const conn = conexiones.current.get(p.token);
      if (!conn) continue;
      enviar(conn, { t: "sala", asientos, plazas: sala.ajustes.jugadores, tuAsiento: p.asiento, empezada: sala.partida !== null });
      if (sala.partida) enviar(conn, { t: "estado", partida: vistaRecortada(sala.partida, p.asiento), ultima: sala.ultima ?? null });
    }
  }, [sala, conectados]);

  // Los rivales de la IA juegan cuando la mesa del anfitrión está quieta y les toca; sus jugadas se reparten
  // a todos como las de cualquiera.
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    const p = sala.partida;
    if (!p || ocupado) return;
    const niveles = new Map(sala.participantes.filter((x) => x.ia).map((x) => [x.asiento, x.ia as Dificultad]));
    if (!niveles.size) return;
    const quien = turnoDeIA(p, (i) => niveles.has(i));
    if (quien === null) return;
    const espera = setTimeout(() => {
      const actual = salaRef.current.partida;
      if (!actual) return;
      let j: Jugada | null = null;
      try {
        j = siguienteJugadaIA(actual, quien, { dificultad: niveles.get(quien) });
      } catch (e) {
        console.error(e);
      }
      // Si algo falla, que al menos pase el turno para que la partida no se quede parada.
      if (!j || jugarComo(quien, j)) {
        if (actual.turno.jugador === quien && actual.turno.fase === "jugar") jugarComo(quien, { tipo: "terminarTurno", jugador: quien, cuerdas: 0 });
      }
    }, pausaIA(p));
    return () => clearTimeout(espera);
  }, [sala, ocupado, jugarComo]);

  const asientos = asientosDe(sala, conectados);
  // Memorizada: la mesa nueva compara la partida que recibe para saber si ha cambiado.
  const vista = useMemo(() => (sala.partida ? vistaRecortada(sala.partida, 0) : null), [sala.partida]);

  return {
    sala,
    asientos,
    abierta,
    error,
    /** La partida tal como la ve el anfitrión (sin las manos de los demás). */
    vista,
    ultima: sala.ultima ?? null,
    jugar: (j: Jugada) => jugarComo(0, j),
    cambiarNombre: (nombre: string) =>
      actualizar((s) => ({ ...s, participantes: s.participantes.map((p) => (p.asiento === 0 ? { ...p, nombre } : p)) })),
    /** Saca a alguien de la sala antes de empezar; los asientos se vuelven a numerar. */
    quitar: (asiento: number) => {
      const fuera = salaRef.current.participantes.find((p) => p.asiento === asiento);
      if (!fuera || fuera.token === TOKEN_ANFITRION) return;
      const conn = conexiones.current.get(fuera.token);
      if (conn) {
        enviar(conn, { t: "rechazo", motivo: "El anfitrión te ha sacado de la sala." });
        setTimeout(() => conn.close(), 500);
      }
      actualizar((s) => ({
        ...s,
        participantes: s.participantes.filter((p) => p.asiento !== asiento).map((p, i) => ({ ...p, asiento: i })),
      }));
    },
    empezar: () =>
      actualizar((s) => {
        const n = s.participantes.length;
        const ajustes = { ...s.ajustes, jugadores: n, cestas: { ...s.ajustes.cestas, numero: cestasPorDefecto(datos, n) } };
        const partida = crearPartida(datos, ajustes);
        s.participantes.forEach((p) => (partida.jugadores[p.asiento].nombre = p.nombre));
        return { ...s, partida, ultima: null };
      }),
    /** Al acabar, todos vuelven a la sala de espera y tienen que decir otra vez que están listos. */
    volverASala: () => actualizar((s) => ({ ...s, partida: null, ultima: null, participantes: s.participantes.map((p) => ({ ...p, listo: false })) })),
    /** Plazas de la sala (de 2 a 4); nunca menos que los que ya están dentro. */
    cambiarPlazas: (plazas: number) =>
      actualizar((s) => {
        if (s.partida) return s;
        const n = Math.max(2, Math.min(4, plazas), s.participantes.length);
        return { ...s, ajustes: { ...s.ajustes, jugadores: n, cestas: { ...s.ajustes.cestas, numero: cestasPorDefecto(datos, n) } } };
      }),
    /** Sienta a un rival de la IA en la primera plaza libre. */
    anadirIA: (nombre: string, perfil: PerfilOnline, dificultad: Dificultad) =>
      actualizar((s) => {
        if (s.partida || s.participantes.length >= s.ajustes.jugadores) return s;
        const token = `ia-${crypto.randomUUID()}`;
        return { ...s, participantes: [...s.participantes, { asiento: s.participantes.length, nombre, token, perfil, ia: dificultad, listo: true }] };
      }),
    /** Cambia el nivel de un rival de la IA (también a mitad de partida). */
    cambiarNivelIA: (asiento: number, dificultad: Dificultad) =>
      actualizar((s) => ({ ...s, participantes: s.participantes.map((p) => (p.asiento === asiento && p.ia ? { ...p, ia: dificultad } : p)) })),
    /** La mesa del anfitrión avisa de cuándo está animando: la IA espera a que acabe para jugar. */
    setOcupado,
    /** Tu animal, color y tapete para la mesa nueva. */
    cambiarPerfil: (perfil: PerfilOnline) =>
      actualizar((s) => ({ ...s, participantes: s.participantes.map((p) => (p.asiento === 0 ? { ...p, perfil } : p)) })),
  };
}
