// Capa fina entre el perfil y la plataforma donde corre el juego. Ahora es el navegador (todo en localStorage);
// en Steam bastará con llamar a usarPlataforma() con una implementación que use Steamworks, por ejemplo con
// steamworks.js o greenworks desde Electron:
//   · desbloquearLogro(steam)  → SteamUserStats.SetAchievement(steam) + StoreStats()
//   · progresoLogro(...)       → SteamUserStats.IndicateAchievementProgress(steam, actual, meta)
//   · amigos()                 → ISteamFriends.GetFriendCount / GetFriendByIndex / GetFriendPersonaName
//   · invitar(amigo, código)   → ISteamFriends.InviteUserToGame(amigo, "+sala <código>")
// Los ids de Steam de cada logro están en logros.ts (campo `steam`) y deben coincidir con los del panel de
// Steamworks. Los amigos locales guardan `steamId` opcional para unirlos con los de Steam.

export interface AmigoPlataforma {
  /** Id en la plataforma (SteamID64 en Steam). */
  id: string;
  nombre: string;
  /** Si está conectado ahora mismo (Steam lo sabe; el navegador no). */
  conectado?: boolean;
}

export interface Plataforma {
  nombre: "navegador" | "steam";
  desbloquearLogro(idSteam: string): void;
  progresoLogro?(idSteam: string, actual: number, meta: number): void;
  amigos(): Promise<AmigoPlataforma[]>;
  /** Devuelve true si la plataforma envió la invitación ella misma (si no, se comparte el enlace). */
  invitar?(idAmigo: string, codigoSala: string): boolean;
}

const navegador: Plataforma = {
  nombre: "navegador",
  desbloquearLogro: () => {
    // En el navegador los logros solo se guardan en localStorage (logros.ts ya lo hace).
  },
  amigos: async () => [],
};

let actual: Plataforma = navegador;

export function usarPlataforma(p: Plataforma): void {
  actual = p;
}

export function plataforma(): Plataforma {
  return actual;
}
