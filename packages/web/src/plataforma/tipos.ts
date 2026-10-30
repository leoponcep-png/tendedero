// La plataforma donde corre el juego: el navegador o la aplicación de escritorio sin Steam («local»), o Steam.
// La interfaz es la misma; lo que solo existe en Steam responde { disponible: false } y la pantalla enseña el hueco
// con un mensaje («Disponible en la versión de Steam»). Ver informes/steam/como-funciona.md.

/**
 * Por qué algo no está:
 * - «sin-steam»: el juego no corre en Steam (navegador, o escritorio sin App ID o con Steam cerrado).
 * - «sin-api»: corre en Steam, pero steamworks.js todavía no da esa función (p. ej. la lista de amigos).
 */
export type MotivoNoDisponible = "sin-steam" | "sin-api";

export type Resultado<T> = { disponible: true; valor: T } | { disponible: false; motivo: MotivoNoDisponible };

export const noDisponible = <T = never>(motivo: MotivoNoDisponible): Resultado<T> => ({ disponible: false, motivo });
export const disponible = <T>(valor: T): Resultado<T> => ({ disponible: true, valor });

export type EstadoAmigo = "conectado" | "jugando" | "ausente" | "desconectado";

export interface AmigoPlataforma {
  /** Id en la plataforma (SteamID64 en Steam). */
  id: string;
  nombre: string;
  /** URL o data: de la imagen de su avatar. */
  avatar?: string;
  estado: EstadoAmigo;
  /** Lo que enseña su presencia: «En el menú», «Jugando, ronda 3». */
  presencia?: string;
  /** Si está jugando a Tendedero (y no a otro juego). */
  enTendedero?: boolean;
}

/** Lo que la plataforma sabe de la trayectoria de un amigo (en Steam, sus estadísticas). */
export interface TrayectoriaAmigo {
  partidas?: number;
  ganadas?: number;
  logros?: number;
  animalFavorito?: string;
}

/** Una invitación a una sala que ha llegado a este jugador. */
export interface InvitacionRecibida {
  /** Id de la sala en la plataforma (lobby de Steam). */
  sala: string;
  /** Nombre de quien invita, si se sabe. */
  de: string | null;
  deId: string | null;
  /** Código de la sala online (la partida en sí va por PeerJS con este código). */
  codigo: string;
  plazas: number | null;
  miembros: number;
}

/** Dónde está el jugador, para que lo vean sus amigos («En el menú», «Jugando, ronda 3»). */
export type Presencia = { donde: "menu" } | { donde: "sala"; codigo: string } | { donde: "jugando"; ronda: number; online: boolean };

export interface OpcionesSala {
  /** Código de la sala online (PeerJS) que se apunta en la sala de la plataforma. */
  codigo: string;
  plazas: number;
  /** Tu nombre, para que el invitado vea «Lu te invita a jugar». */
  nombre: string;
}

/** Resultado de la partida rápida: entrar en una sala ajena o abrir la tuya (pública) y esperar. */
export type SalaRapida = { tipo: "unirse"; codigo: string } | { tipo: "crear"; codigo: string };

export interface Plataforma {
  nombre: "local" | "steam";
  /** Nombre de tu cuenta en la plataforma (Steam), si hay. */
  usuario?: string;

  desbloquearLogro(idSteam: string): void;
  /** Steam no tiene IndicateAchievementProgress en steamworks.js: solo lo usaría otra plataforma. */
  progresoLogro?(idSteam: string, actual: number, meta: number): void;
  /** Tus estadísticas, para que se vean en tu perfil de Steam (los nombres deben existir en Steamworks). */
  publicarEstadisticas?(valores: Record<string, number>): void;

  /** Amigos de la plataforma con su estado. */
  amigos(): Promise<Resultado<AmigoPlataforma[]>>;
  /** Estadísticas de un amigo en la plataforma. */
  trayectoriaAmigo(id: string): Promise<Resultado<TrayectoriaAmigo>>;
  /** Abre la lista de amigos de la plataforma (overlay de Steam). */
  abrirAmigos?(): void;
  /** Abre el perfil o las estadísticas de un amigo en la plataforma. */
  abrirPerfilAmigo?(id: string): void;

  presencia(p: Presencia): void;

  /** Apunta la sala en la plataforma (si hace falta) y abre el diálogo de invitar amigos. */
  invitarASala(sala: OpcionesSala): Promise<Resultado<void>>;
  /** Avisa de cada invitación que llega. Devuelve cómo dejar de escuchar. */
  alInvitacion(fn: (inv: InvitacionRecibida) => void): () => void;
  /** Entra en la sala de la invitación y devuelve su código online. */
  aceptarInvitacion(inv: InvitacionRecibida): Promise<Resultado<string>>;
  rechazarInvitacion(inv: InvitacionRecibida): void;

  /** Busca una sala pública con hueco; si no hay, abre una pública con `sala.codigo`. */
  partidaRapida(sala: OpcionesSala): Promise<Resultado<SalaRapida>>;
  /** Cuántos hay en tu sala de la plataforma (para «Buscando jugadores… 2 de 4»). */
  miembrosSala(): Promise<Resultado<{ miembros: number; limite: number | null }>>;
  /** La partida ha empezado: la sala deja de aceptar gente y desaparece de la partida rápida. */
  salaEmpezada(): void;
  /** Sale de la sala de la plataforma (al salir de la sala online). */
  salirSala(): void;
}
