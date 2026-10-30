import { useEffect, useSyncExternalStore } from "react";
import { EVENTO_INVITACION_PRUEBA, local } from "./local";
import { crearSteam } from "./steam";
import type { InvitacionRecibida, Plataforma } from "./tipos";

// La plataforma activa. Al arrancar es la local; si el juego corre en la aplicación de escritorio con Steam abierto
// y App ID, iniciarPlataforma() pasa a Steam. Las pantallas usan usePlataforma() para repintarse cuando cambia.
//
//   const p = usePlataforma();
//   const r = await p.amigos();
//   if (!r.disponible) → enseñar el hueco con textoNoDisponible(r.motivo)

export * from "./tipos";

/** Rutas de la mesa nueva (las mismas que usa prototipos/MesaFinal.tsx). */
export const RUTA_JUEGO = "/prototipos/e";
export const rutaSalaInvitado = (codigo: string) => `${RUTA_JUEGO}/sala/${codigo}`;
export const rutaSalaAnfitrion = (codigo: string) => `${RUTA_JUEGO}/anfitrion/${codigo}`;

let actual: Plataforma = local;
const avisar = new Set<() => void>();
const cambio = () => avisar.forEach((f) => f());

export function plataforma(): Plataforma {
  return actual;
}

export function usarPlataforma(p: Plataforma): void {
  actual = p;
  escucharInvitaciones();
  cambio();
}

export function usePlataforma(): Plataforma {
  return useSyncExternalStore(
    (f) => {
      avisar.add(f);
      return () => avisar.delete(f);
    },
    () => actual,
  );
}

// ---------- Invitaciones recibidas (el aviso las enseña de una en una, en cualquier pantalla) ----------

let invitaciones: InvitacionRecibida[] = [];
let dejarDeEscuchar: (() => void) | null = null;

function escucharInvitaciones() {
  dejarDeEscuchar?.();
  dejarDeEscuchar = actual.alInvitacion((inv) => {
    if (invitaciones.some((i) => i.sala === inv.sala)) return;
    invitaciones = [...invitaciones, inv];
    cambio();
  });
}

export function useInvitaciones(): InvitacionRecibida[] {
  return useSyncExternalStore(
    (f) => {
      avisar.add(f);
      return () => avisar.delete(f);
    },
    () => invitaciones,
  );
}

export function quitarInvitacion(inv: InvitacionRecibida): void {
  invitaciones = invitaciones.filter((i) => i.sala !== inv.sala);
  cambio();
}

// ---------- Presencia («En el menú», «Jugando, ronda 3») ----------

/** Mientras hay una partida en pantalla, tus amigos de Steam ven «Jugando, ronda N»; al salir, «En el menú». */
export function usePresenciaPartida(ronda: number, online: boolean, terminada: boolean): void {
  const p = usePlataforma();
  useEffect(() => {
    p.presencia(terminada ? { donde: "menu" } : { donde: "jugando", ronda, online });
  }, [p, ronda, online, terminada]);
  useEffect(() => () => p.presencia({ donde: "menu" }), [p]);
}

// ---------- Arranque ----------

let iniciada = false;

/** Mira si hay Steam (solo en la aplicación de escritorio). Sin Steam no hace nada ni avisa de nada. */
export async function iniciarPlataforma(): Promise<void> {
  if (iniciada) return;
  iniciada = true;
  escucharInvitaciones();
  const puente = typeof window === "undefined" ? undefined : window.tendederoSteam;
  if (!puente) return;
  try {
    const estado = await puente.estado();
    if (!estado.activo) return;
    usarPlataforma(crearSteam(puente, estado));
    actual.presencia({ donde: "menu" });
    // Si Steam abrió el juego con una invitación (+connect_lobby), llega ahora por alInvitacion.
    await puente.invitacionAlArrancar();
  } catch {
    // Si algo falla se sigue sin Steam.
  }
}

/** Solo para probar el aviso sin Steam: `tendederoProbarInvitacion("Lu", "abcd12")` en la consola (modo desarrollo). */
export function probarInvitacion(de = "Lu", codigo = "prueba"): void {
  const inv: InvitacionRecibida = { sala: `prueba-${Date.now()}`, de, deId: null, codigo, plazas: 4, miembros: 1 };
  window.dispatchEvent(new CustomEvent(EVENTO_INVITACION_PRUEBA, { detail: inv }));
}
