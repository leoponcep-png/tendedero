import { nuevoCodigo } from "../../online/protocolo";
import { CLAVES, guardarJSON, leerJSON } from "./almacen";
import type { ResumenPartida } from "./registro";

// Amigos guardados en este navegador. Cada jugador tiene un código de amigo propio para pasárselo a otros;
// al pasar a Steam, `steamId` une cada amigo local con el de la plataforma (ver plataforma.ts).

export interface Amigo {
  id: string;
  nombre: string;
  /** Código de amigo, si se añadió así. */
  codigo?: string;
  steamId?: string;
  /** ISO. */
  añadido: string;
  /** Última invitación que le hiciste (código de sala). */
  invitacion?: { codigo: string; fecha: string };
}

const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
/** Código de amigo: TND-XXXX-XXXX (sin letras que se confunden). */
export const PATRON_CODIGO = /^TND-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function codigoAleatorio(): string {
  const n = crypto.getRandomValues(new Uint8Array(8));
  const l = Array.from(n, (x) => LETRAS[x % LETRAS.length]).join("");
  return `TND-${l.slice(0, 4)}-${l.slice(4)}`;
}

/** Tu código de amigo (se crea la primera vez y se queda guardado). */
export function miCodigoAmigo(): string {
  const guardado = leerJSON<string | null>(CLAVES.codigoAmigo, null);
  if (guardado && PATRON_CODIGO.test(guardado)) return guardado;
  const nuevo = codigoAleatorio();
  guardarJSON(CLAVES.codigoAmigo, nuevo);
  return nuevo;
}

/** Normaliza lo que escribe la gente («tnd abcd efgh» → «TND-ABCD-EFGH»); null si no parece un código. */
export function leerCodigoAmigo(texto: string): string | null {
  const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const sin = limpio.startsWith("TND") ? limpio.slice(3) : limpio;
  if (sin.length !== 8 || !limpio.startsWith("TND")) return null;
  return `TND-${sin.slice(0, 4)}-${sin.slice(4)}`;
}

export function leerAmigos(): Amigo[] {
  const lista = leerJSON<Amigo[]>(CLAVES.amigos, []);
  return Array.isArray(lista) ? lista : [];
}

export function guardarAmigos(lista: Amigo[]): void {
  guardarJSON(CLAVES.amigos, lista);
}

/** Añade por nombre o por código. Devuelve la lista nueva o un texto de error. */
export function añadirAmigo(lista: Amigo[], texto: string): Amigo[] | string {
  const t = texto.trim();
  if (!t) return "Escribe un nombre o un código de amigo.";
  const codigo = leerCodigoAmigo(t);
  if (codigo && codigo === miCodigoAmigo()) return "Ese es tu propio código.";
  if (codigo && lista.some((a) => a.codigo === codigo)) return "Ya tienes a ese amigo.";
  if (!codigo && lista.some((a) => a.nombre.toLowerCase() === t.toLowerCase())) return "Ya tienes un amigo con ese nombre.";
  const amigo: Amigo = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    nombre: codigo ? `Amigo ${codigo.slice(4, 8)}` : t.slice(0, 16),
    codigo: codigo ?? undefined,
    añadido: new Date().toISOString(),
  };
  return [amigo, ...lista];
}

/** Partidas en las que estaba alguien con ese nombre. */
export function partidasCon(amigo: Amigo, partidas: ResumenPartida[]): ResumenPartida[] {
  const nombre = amigo.nombre.trim().toLowerCase();
  return partidas.filter((p) => p.rivales?.some((r) => r.trim().toLowerCase() === nombre));
}

/** Enlace de invitado a una sala online (#/sala/código, el mismo formato que usa App.tsx). */
export function enlaceSala(codigo: string): string {
  return `${location.origin}${location.pathname}#/sala/${codigo}`;
}

export function nuevaInvitacion(): string {
  return nuevoCodigo();
}
