import type { Dificultad, Entrada, Jugada, Partida } from "@tendedero/motor";

// Modo online: el navegador de quien crea la sala (el anfitrión) guarda la partida de verdad y aplica las
// jugadas; los demás se conectan directamente a él (WebRTC, con PeerJS) y reciben solo lo que pueden ver.

/** Prefijo de los ids de PeerJS, para no chocar con otras aplicaciones que usen el mismo servidor. */
export const PREFIJO = "tendedero-v1-";

/** Código corto de sala: 6 letras y números fáciles de dictar (sin 0/o ni 1/l). */
export function nuevoCodigo(): string {
  const letras = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => letras[n % letras.length]).join("");
}

/** Un código tal como lo escribe o lo pega alguien («AB3 K9Q», « ab3k9q ») en la forma de la sala. */
export function limpiarCodigo(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
}

/** Cómo se ve cada jugador en la mesa nueva (animal, color y tapete); la mesa antigua no lo usa. */
export interface PerfilOnline {
  animal: string;
  color: string;
  tapete?: string;
}

export interface Asiento {
  asiento: number;
  nombre: string;
  conectado: boolean;
  perfil?: PerfilOnline;
  /** Si ya está listo para empezar (el anfitrión y la IA siempre lo están). */
  listo?: boolean;
  /** Si es un rival de la IA que juega el anfitrión, con su nivel. */
  ia?: Dificultad;
}

export type MensajeInvitado =
  /** Al conectarse. `token` identifica al invitado para que pueda volver a su asiento si se le corta. */
  | { t: "hola"; nombre: string; token: string; perfil?: PerfilOnline }
  | { t: "jugada"; jugada: Jugada }
  /** En la sala de espera: «estoy listo» (o ya no). */
  | { t: "listo"; listo: boolean };

export type MensajeAnfitrion =
  | { t: "sala"; asientos: Asiento[]; plazas: number; tuAsiento: number; empezada: boolean }
  /** `ultima`: la jugada que llevó a esta partida y su número, para que la mesa nueva la anime antes de enseñarla. */
  | { t: "estado"; partida: Partida; ultima?: { jugada: Jugada; n: number } | null }
  /** `detalle`: el mismo motivo estructurado, para enseñarlo traducido. */
  | { t: "error"; motivo: string; detalle?: Entrada }
  | { t: "rechazo"; motivo: string };

/** Para no mandar el registro entero en cada jugada. */
export const LINEAS_DE_REGISTRO = 150;

/**
 * Token de esta pestaña, para volver al mismo asiento al recargar. Es por pestaña (no por navegador) para que
 * dos pestañas sean dos jugadores; si se pierde, se recupera el asiento entrando con el mismo nombre.
 */
export function miToken(): string {
  try {
    let t = sessionStorage.getItem("tendedero-token");
    if (!t) {
      t = crypto.randomUUID();
      sessionStorage.setItem("tendedero-token", t);
    }
    return t;
  } catch {
    return crypto.randomUUID();
  }
}

/** Errores de PeerJS en castellano. */
export function textoError(tipo: string | undefined): string {
  switch (tipo) {
    case "peer-unavailable":
      return "No se encuentra la sala. Puede que el código esté mal o que quien la creó la haya cerrado.";
    case "unavailable-id":
      return "Ese código de sala ya está en uso. Espera unos segundos y vuelve a intentarlo.";
    case "network":
    case "server-error":
    case "socket-error":
    case "socket-closed":
      return "No hay conexión con el servidor de salas. Comprueba internet y vuelve a intentarlo.";
    case "browser-incompatible":
      return "Este navegador no admite partidas online.";
    case "disconnected":
      return "Se ha perdido la conexión con el servidor de salas.";
    default:
      return "Ha fallado la conexión.";
  }
}
