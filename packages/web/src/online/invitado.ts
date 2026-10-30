import type { Entrada, Jugada, Partida } from "@tendedero/motor";
import Peer, { type DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { miToken, PREFIJO, textoError, type Asiento, type MensajeAnfitrion, type MensajeInvitado, type PerfilOnline } from "./protocolo";

export type FaseInvitado = "conectando" | "dentro" | "reconectando" | "rechazado";

/**
 * La sala vista desde un invitado: se conecta al anfitrión, se presenta con su nombre y recibe la partida
 * tal como puede verla. Si se corta la conexión (o el anfitrión recarga), vuelve a intentarlo solo.
 */
/** `perfil`: animal, color y tapete con los que te ven los demás en la mesa nueva. */
export function useInvitado(codigo: string, nombre: string | null, perfil?: PerfilOnline) {
  const [fase, setFase] = useState<FaseInvitado>("conectando");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; n: number; detalle?: Entrada } | null>(null);
  const [sala, setSala] = useState<Extract<MensajeAnfitrion, { t: "sala" }> | null>(null);
  const [partida, setPartida] = useState<Partida | null>(null);
  const [ultima, setUltima] = useState<{ jugada: Jugada; n: number } | null>(null);
  const perfilRef = useRef(perfil);
  perfilRef.current = perfil;
  const conexion = useRef<DataConnection | null>(null);

  useEffect(() => {
    if (!nombre) return;
    let cancelado = false;
    let rechazado = false;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let peer: Peer;

    const reintentar = () => {
      if (cancelado || rechazado) return;
      setFase("reconectando");
      clearTimeout(espera);
      espera = setTimeout(conectar, 3000);
    };

    const conectar = () => {
      if (cancelado || rechazado) return;
      // Sin servidor de salas: si la conexión con él se rompió del todo se abre otra; si solo se cortó, se
      // recupera, y al volver («open») se llama otra vez a conectar.
      if (peer.destroyed) return crearPeer();
      if (peer.disconnected) {
        peer.reconnect();
        return;
      }
      const conn = peer.connect(PREFIJO + codigo, { reliable: true });
      conexion.current = conn;
      conn.on("open", () => {
        setError(null);
        conn.send({ t: "hola", nombre, token: miToken(), perfil: perfilRef.current } satisfies MensajeInvitado);
      });
      conn.on("data", (d) => {
        const m = d as MensajeAnfitrion;
        if (m.t === "sala") {
          setSala(m);
          setFase("dentro");
          if (!m.empezada) setPartida(null);
        } else if (m.t === "estado") {
          setPartida(m.partida);
          setUltima(m.ultima ?? null);
        } else if (m.t === "error") {
          setAviso((a) => ({ texto: m.motivo, n: (a?.n ?? 0) + 1, detalle: m.detalle }));
        } else if (m.t === "rechazo") {
          rechazado = true;
          setError(m.motivo);
          setFase("rechazado");
        }
      });
      conn.on("close", () => {
        if (conexion.current === conn) reintentar();
      });
    };

    function crearPeer() {
      peer = new Peer();
      peer.on("open", conectar);
      peer.on("error", (e) => {
        if (cancelado) return;
        setError(textoError(e.type));
        // Si no se encuentra la sala puede ser que el anfitrión esté recargando: se sigue intentando.
        reintentar();
      });
    }
    crearPeer();

    return () => {
      cancelado = true;
      clearTimeout(espera);
      conexion.current = null;
      peer.destroy();
    };
  }, [codigo, nombre]);

  return {
    fase,
    error,
    aviso,
    sala,
    asientos: (sala?.asientos ?? []) as Asiento[],
    partida,
    ultima,
    jugar: (jugada: Jugada) => {
      const conn = conexion.current;
      if (!conn?.open) return "Sin conexión con la sala: espera a que se recupere.";
      conn.send({ t: "jugada", jugada } satisfies MensajeInvitado);
      return null;
    },
    /** En la sala de espera: avisa al anfitrión de que estás listo (o de que ya no). */
    marcarListo: (listo: boolean) => {
      const conn = conexion.current;
      if (conn?.open) conn.send({ t: "listo", listo } satisfies MensajeInvitado);
    },
  };
}
