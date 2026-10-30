import { disponible, noDisponible, type AmigoPlataforma, type InvitacionRecibida, type OpcionesSala, type Plataforma, type Presencia, type Resultado, type TrayectoriaAmigo } from "./tipos";

// Steam, a través del puente que deja el preload de Electron (packages/escritorio/src/preload.cjs →
// window.tendederoSteam), que a su vez llama a steamworks.js en el proceso principal (src/steam.cjs).
//
// La partida en sí sigue yendo por PeerJS: la sala de Steam (lobby) solo guarda el código de la sala online, y así
// invitaciones y partida rápida funcionan ya. Más adelante el transporte puede pasar a Steam Networking (ver el
// informe): bastaría con cambiar online/* para mandar los mensajes por el puente en vez de por PeerJS.

export interface EstadoSteam {
  activo: boolean;
  motivo?: string;
  appId?: number;
  nombre?: string;
  steamId?: string;
  idioma?: string;
}

interface SalaSteam {
  id: string;
  datos: Record<string, string>;
  miembros: number;
  limite: number | null;
}

/** Lo que expone el preload. */
export interface PuenteSteam {
  estado(): Promise<EstadoSteam>;
  invitacionAlArrancar(): Promise<null>;
  logro(nombre: string): void;
  estadisticas(valores: Record<string, number>): void;
  presencia(claves: Record<string, string | null>): void;
  amigos(): Promise<Resultado<AmigoPlataforma[]>>;
  abrirAmigos(): void;
  abrirPerfil(id: string): void;
  crearSala(o: { tipo: "amigos" | "publica"; plazas: number; codigo: string; nombre: string }): Promise<SalaSteam | null>;
  datosSala(datos: Record<string, string>): Promise<boolean>;
  salaActual(): Promise<SalaSteam | null>;
  invitar(): void;
  buscarSalas(): Promise<SalaSteam[]>;
  unirseSala(id: string): Promise<SalaSteam | null>;
  rechazar(id: string): void;
  salirSala(): void;
  alInvitacion(fn: (inv: InvitacionRecibida) => void): () => void;
}

declare global {
  interface Window {
    tendederoSteam?: PuenteSteam;
  }
}

/**
 * Presencia: Steam enseña a tus amigos el texto de `steam_display` («#Jugando» → «Jugando, ronda %ronda%»), que sale
 * del archivo de textos de presencia subido a Steamworks (packages/escritorio/steam/presencia.vdf). `status` es el
 * texto libre que se ve al mirar la información de la partida.
 */
function clavesPresencia(p: Presencia): Record<string, string | null> {
  if (p.donde === "jugando") return { steam_display: "#Jugando", ronda: String(p.ronda), status: `Jugando, ronda ${p.ronda}` };
  if (p.donde === "sala") return { steam_display: "#EnSala", ronda: null, status: "En una sala, esperando jugadores" };
  return { steam_display: "#EnMenu", ronda: null, status: "En el menú" };
}

export function crearSteam(puente: PuenteSteam, estado: EstadoSteam): Plataforma {
  const conCodigo = (s: SalaSteam | null) => (s && s.datos.codigo ? s.datos.codigo : null);
  return {
    nombre: "steam",
    usuario: estado.nombre,
    desbloquearLogro: (id) => puente.logro(id),
    publicarEstadisticas: (valores) => puente.estadisticas(valores),
    amigos: () => puente.amigos().catch(() => noDisponible("sin-api")),
    // steamworks.js no tiene RequestUserStats / GetUserStat: las estadísticas de otro jugador no se pueden leer.
    // Sí se pueden enseñar en el overlay de Steam (abrirPerfilAmigo).
    trayectoriaAmigo: async (_id): Promise<Resultado<TrayectoriaAmigo>> => noDisponible("sin-api"),
    abrirAmigos: () => puente.abrirAmigos(),
    abrirPerfilAmigo: (id) => puente.abrirPerfil(id),
    presencia: (p) => puente.presencia(clavesPresencia(p)),
    async invitarASala(sala: OpcionesSala) {
      // Una sala solo para amigos (o la pública de la partida rápida, si ya es esa) y el diálogo de invitar de Steam.
      const s = await puente.crearSala({ tipo: "amigos", ...sala }).catch(() => null);
      if (!s) return noDisponible("sin-api");
      puente.invitar();
      return disponible(undefined);
    },
    alInvitacion: (fn) => puente.alInvitacion(fn),
    async aceptarInvitacion(inv) {
      const s = await puente.unirseSala(inv.sala).catch(() => null);
      const codigo = conCodigo(s) ?? inv.codigo;
      return codigo ? disponible(codigo) : noDisponible("sin-api");
    },
    rechazarInvitacion: (inv) => puente.rechazar(inv.sala),
    async partidaRapida(sala) {
      const lista = await puente.buscarSalas().catch(() => [] as SalaSteam[]);
      // Primero las que están casi llenas: así las partidas empiezan antes.
      lista.sort((a, b) => b.miembros - a.miembros);
      for (const candidata of lista) {
        const dentro = await puente.unirseSala(candidata.id).catch(() => null);
        const codigo = conCodigo(dentro);
        if (codigo) return disponible({ tipo: "unirse" as const, codigo });
      }
      const nueva = await puente.crearSala({ tipo: "publica", ...sala }).catch(() => null);
      return nueva ? disponible({ tipo: "crear" as const, codigo: sala.codigo }) : noDisponible("sin-api");
    },
    async miembrosSala() {
      const s = await puente.salaActual().catch(() => null);
      return s ? disponible({ miembros: s.miembros, limite: s.limite }) : noDisponible("sin-api");
    },
    salaEmpezada: () => void puente.datosSala({ estado: "jugando" }).catch(() => false),
    salirSala: () => puente.salirSala(),
  };
}
