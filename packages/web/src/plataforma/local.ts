import { noDisponible, type InvitacionRecibida, type Plataforma } from "./tipos";

// Sin Steam (navegador, o la aplicación de escritorio sin App ID o con Steam cerrado): todo sigue como siempre.
// Los amigos se guardan en este equipo (prototipos/perfil/amigos.ts) y se juega online con el código de sala.
// Lo que solo existe en Steam responde «no disponible» y la pantalla lo dice.

/** Evento con el que se puede simular una invitación (solo para probar la pantalla sin Steam). */
export const EVENTO_INVITACION_PRUEBA = "tendedero-invitacion-prueba";

export const local: Plataforma = {
  nombre: "local",
  desbloquearLogro: () => {
    // Los logros ya se guardan en localStorage (perfil/logros.ts).
  },
  amigos: async () => noDisponible("sin-steam"),
  trayectoriaAmigo: async () => noDisponible("sin-steam"),
  presencia: () => {
    // Sin plataforma no hay a quién contárselo.
  },
  invitarASala: async () => noDisponible("sin-steam"),
  alInvitacion(fn) {
    const oir = (e: Event) => fn((e as CustomEvent<InvitacionRecibida>).detail);
    window.addEventListener(EVENTO_INVITACION_PRUEBA, oir);
    return () => window.removeEventListener(EVENTO_INVITACION_PRUEBA, oir);
  },
  // Una invitación de prueba ya trae el código de la sala: aceptarla es entrar con ese código.
  aceptarInvitacion: async (inv) => ({ disponible: true, valor: inv.codigo }),
  rechazarInvitacion: () => {},
  partidaRapida: async () => noDisponible("sin-steam"),
  miembrosSala: async () => noDisponible("sin-steam"),
  salaEmpezada: () => {},
  salirSala: () => {},
};
