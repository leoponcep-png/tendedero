import type { Jugada, Partida } from "@tendedero/motor";
import Peer, { type DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { miToken, PREFIJO, textoError, type Asiento, type MensajeAnfitrion, type MensajeInvitado } from "./protocolo";

export type FaseInvitado = "conectando" | "dentro" | "reconectando" | "rechazado";

/**
 * La sala vista desde un invitado: se conecta al anfitrión, se presenta con su nombre y recibe la partida
 * tal como puede verla. Si se corta la conexión (o el anfitrión recarga), vuelve a intentarlo solo.
 */
export function useInvitado(codigo: string, nombre: string | null) {
  const [fase, setFase] = useState<FaseInvitado>("conectando");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  const [sala, setSala] = useState<Extract<MensajeAnfitrion, { t: "sala" }> | null>(null);
  const [partida, setPartida] = useState<Partida | null>(null);
  const conexion = useRef<DataConnection | null>(null);

  useEffect(() => {
    if (!nombre) return;
    let cancelado = false;
    let rechazado = false;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const peer = new Peer();

    const reintentar = () => {
      if (cancelado || rechazado) return;
      setFase("reconectando");
      clearTimeout(espera);
      espera = setTimeout(conectar, 3000);
    };

    const conectar = () => {
      if (cancelado || rechazado || peer.destroyed) return;
      if (peer.disconnected) peer.reconnect();
      const conn = peer.connect(PREFIJO + codigo, { reliable: true });
      conexion.current = conn;
      conn.on("open", () => {
        setError(null);
        conn.send({ t: "hola", nombre, token: miToken() } satisfies MensajeInvitado);
      });
      conn.on("data", (d) => {
        const m = d as MensajeAnfitrion;
        if (m.t === "sala") {
          setSala(m);
          setFase("dentro");
          if (!m.empezada) setPartida(null);
        } else if (m.t === "estado") {
          setPartida(m.partida);
        } else if (m.t === "error") {
          setAviso((a) => ({ texto: m.motivo, n: (a?.n ?? 0) + 1 }));
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

    peer.on("open", conectar);
    peer.on("error", (e) => {
      if (cancelado) return;
      setError(textoError(e.type));
      // Si no se encuentra la sala puede ser que el anfitrión esté recargando: se sigue intentando.
      reintentar();
    });

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
    jugar: (jugada: Jugada) => {
      const conn = conexion.current;
      if (!conn?.open) return "Sin conexión con la sala: espera a que se recupere.";
      conn.send({ t: "jugada", jugada } satisfies MensajeInvitado);
      return null;
    },
  };
}
