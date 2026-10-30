// Steam en el proceso principal, con steamworks.js (habla con el cliente de Steam abierto en el ordenador; no hace
// falta servidor propio). La web lo usa a través del preload (window.tendederoSteam) y de
// packages/web/src/plataforma/steam.ts.
//
// Solo se enciende si hay App ID (variable TENDEDERO_STEAM_APPID, la SteamAppId que pone Steam al lanzar el juego,
// o un archivo steam_appid.txt) y Steam está abierto. Si falta algo, la aplicación arranca igual, sin avisos:
// la web ve { activo: false } y sigue con el código de sala de siempre.
//
// API real de steamworks.js 0.4.0 que se usa (client.d.ts): achievement.activate, localplayer.getName /
// getSteamId / setRichPresence, matchmaking.createLobby / joinLobby / getLobbies y Lobby.*, overlay.activateDialog /
// activateInviteDialog, stats.getInt / setInt / store, callback.register(GameLobbyJoinRequested).
// steamworks.js 0.4.0 NO trae ISteamFriends: no puede leer la lista de amigos, su estado, su avatar ni las
// estadísticas de otro jugador. Esas funciones responden «no disponible» (ver amigos() más abajo).

const { app, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

/** Datos que todas las salas de Tendedero llevan en el lobby de Steam. Si cambia el protocolo online, sube VERSION. */
const JUEGO = "tendedero";
const VERSION_RED = "1";

let cliente = null; // lo que devuelve steamworks.init()
let steamworks = null;
let appId = 0;
let motivo = "sin-app-id";
/** Lobby en el que estamos ahora (uno a la vez), por su id en texto. */
let lobbyActual = null;
/** Lobbies a los que hemos entrado para leer una invitación y aún no se ha aceptado ni rechazado. */
const pendientes = new Map();
/** Invitación con la que se abrió el juego (+connect_lobby), hasta que la web la pida. */
let invitacionAlArrancar = null;
let ventanaWeb = null;

function leerAppId() {
  const desdeVariable = Number(process.env.TENDEDERO_STEAM_APPID || process.env.SteamAppId || 0);
  if (desdeVariable > 0) return desdeVariable;
  const sitios = [
    path.join(path.dirname(process.execPath), "steam_appid.txt"),
    app.isPackaged ? path.join(process.resourcesPath, "steam_appid.txt") : path.join(__dirname, "..", "steam_appid.txt"),
  ];
  for (const sitio of sitios) {
    try {
      const n = Number(fs.readFileSync(sitio, "utf8").trim());
      if (n > 0) return n;
    } catch {
      // No está: se prueba el siguiente.
    }
  }
  return 0;
}

/**
 * Intenta encender Steam. Hay que llamarlo antes de app.whenReady() (el overlay necesita poner opciones de Chromium).
 * Nunca lanza: sin App ID o sin Steam abierto, deja `motivo` y sigue.
 */
function iniciarSteam() {
  appId = leerAppId();
  if (!appId) {
    motivo = "sin-app-id";
    return false;
  }
  try {
    steamworks = require("steamworks.js");
    cliente = steamworks.init(appId);
    motivo = "";
  } catch (e) {
    // Lo normal: Steam no está abierto, o la cuenta no tiene el juego.
    cliente = null;
    motivo = "sin-steam";
    if (!app.isPackaged) console.log("Steam no disponible:", e?.message ?? e);
    return false;
  }
  try {
    steamworks.electronEnableSteamOverlay();
  } catch {
    // Sin overlay se juega igual.
  }
  // Invitación con la que Steam ha abierto el juego: «Tendedero.exe +connect_lobby 1234…».
  invitacionAlArrancar = lobbyDeArgumentos(process.argv);
  return true;
}

const activo = () => !!cliente;

function lobbyDeArgumentos(argv) {
  const i = argv.indexOf("+connect_lobby");
  const id = i >= 0 ? argv[i + 1] : null;
  return id && /^\d+$/.test(id) ? id : null;
}

function datosLobby(lobby) {
  let datos = {};
  try {
    datos = lobby.getFullData();
  } catch {
    // Sin datos: no es una sala nuestra.
  }
  let miembros = 0;
  let limite = null;
  try {
    miembros = Number(lobby.getMemberCount());
    const l = lobby.getMemberLimit();
    limite = l == null ? null : Number(l);
  } catch {
    // Se queda en 0.
  }
  return { id: lobby.id.toString(), datos, miembros, limite };
}

function salirDelLobby() {
  if (!lobbyActual) return;
  try {
    lobbyActual.leave();
  } catch {
    // Ya no estaba.
  }
  lobbyActual = null;
  try {
    cliente.localplayer.setRichPresence("connect", null);
  } catch {
    // Nada.
  }
}

function entrarEnLobby(lobby) {
  if (lobbyActual && lobbyActual.id !== lobby.id) salirDelLobby();
  lobbyActual = lobby;
  // «Unirse a la partida» desde la lista de amigos de Steam.
  try {
    cliente.localplayer.setRichPresence("connect", `+connect_lobby ${lobby.id.toString()}`);
  } catch {
    // Nada.
  }
}

/** Se une al lobby para leer quién invita (el nombre lo guarda el anfitrión en los datos) y avisa a la web. */
async function avisarInvitacion(idLobby, deId) {
  if (!ventanaWeb || ventanaWeb.isDestroyed()) {
    invitacionAlArrancar = idLobby;
    return;
  }
  let lobby;
  try {
    lobby = await cliente.matchmaking.joinLobby(BigInt(idLobby));
  } catch {
    return; // la sala ya no existe o está llena
  }
  const info = datosLobby(lobby);
  if (info.datos.juego !== JUEGO || !info.datos.codigo) {
    try {
      lobby.leave();
    } catch {
      // Nada.
    }
    return;
  }
  pendientes.set(info.id, lobby);
  ventanaWeb.webContents.send("steam:invitacion", {
    sala: info.id,
    deId: deId ?? null,
    de: info.datos.nombre || null,
    codigo: info.datos.codigo,
    plazas: info.limite,
    miembros: info.miembros,
  });
}

/** Lista de amigos: steamworks.js 0.4.0 no tiene ISteamFriends. Aquí se rellenará si la librería lo añade. */
function amigos() {
  return { disponible: false, motivo: "sin-api" };
}

function registrarIpc() {
  ipcMain.handle("steam:estado", () => {
    if (!activo()) return { activo: false, motivo };
    let nombre = "";
    let steamId = "";
    try {
      nombre = cliente.localplayer.getName();
      steamId = cliente.localplayer.getSteamId().steamId64.toString();
    } catch {
      // Se queda vacío.
    }
    return { activo: true, appId, nombre, steamId, idioma: safe(() => cliente.apps.currentGameLanguage(), "") };
  });

  ipcMain.handle("steam:invitacion-al-arrancar", async () => {
    const id = invitacionAlArrancar;
    invitacionAlArrancar = null;
    if (id && activo()) await avisarInvitacion(id, null);
    return null;
  });

  ipcMain.on("steam:logro", (_e, nombre) => {
    if (!activo() || typeof nombre !== "string") return;
    safe(() => cliente.achievement.activate(nombre));
  });

  ipcMain.on("steam:estadisticas", (_e, valores) => {
    if (!activo() || !valores || typeof valores !== "object") return;
    for (const [nombre, valor] of Object.entries(valores)) {
      if (Number.isFinite(valor)) safe(() => cliente.stats.setInt(nombre, Math.round(valor)));
    }
    safe(() => cliente.stats.store());
  });

  ipcMain.on("steam:presencia", (_e, claves) => {
    if (!activo() || !claves || typeof claves !== "object") return;
    for (const [clave, valor] of Object.entries(claves)) {
      safe(() => cliente.localplayer.setRichPresence(String(clave), valor == null ? null : String(valor)));
    }
  });

  ipcMain.handle("steam:amigos", () => (activo() ? amigos() : { disponible: false, motivo }));

  ipcMain.on("steam:abrir-amigos", () => {
    if (activo()) safe(() => cliente.overlay.activateDialog(0)); // overlay.Dialog.Friends
  });

  ipcMain.on("steam:abrir-perfil", (_e, id) => {
    if (!activo() || typeof id !== "string" || !/^\d+$/.test(id)) return;
    safe(() => cliente.overlay.activateDialogToUser(5, BigInt(id))); // overlay.Dialog.Stats: sus estadísticas, en Steam
  });

  /** Crea un lobby para la sala de código `codigo`. tipo: "amigos" (invitaciones) o "publica" (partida rápida). */
  ipcMain.handle("steam:crear-sala", async (_e, { tipo, plazas, codigo, nombre }) => {
    if (!activo()) return null;
    if (lobbyActual && lobbyActual.getData("codigo") === codigo) return datosLobby(lobbyActual);
    const lobby = await cliente.matchmaking.createLobby(tipo === "publica" ? 2 : 1, Math.max(2, Math.min(4, Number(plazas) || 4)));
    lobby.mergeFullData({ juego: JUEGO, version: VERSION_RED, codigo: String(codigo), nombre: String(nombre ?? ""), estado: "esperando", tipo: tipo === "publica" ? "publica" : "amigos" });
    entrarEnLobby(lobby);
    return datosLobby(lobby);
  });

  ipcMain.handle("steam:datos-sala", (_e, datos) => {
    if (!activo() || !lobbyActual || !datos || typeof datos !== "object") return false;
    const texto = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, String(v)]));
    const ok = safe(() => lobbyActual.mergeFullData(texto), false);
    if (texto.estado && texto.estado !== "esperando") safe(() => lobbyActual.setJoinable(false));
    return ok;
  });

  ipcMain.handle("steam:sala-actual", () => (activo() && lobbyActual ? datosLobby(lobbyActual) : null));

  ipcMain.on("steam:invitar", () => {
    if (!activo() || !lobbyActual) return;
    safe(() => lobbyActual.openInviteDialog());
  });

  /** Lobbies públicos de Tendedero con hueco (getLobbies ya filtra por este App ID). */
  ipcMain.handle("steam:buscar-salas", async () => {
    if (!activo()) return [];
    const lista = await cliente.matchmaking.getLobbies();
    return lista
      .map(datosLobby)
      .filter((l) => l.datos.juego === JUEGO && l.datos.version === VERSION_RED && l.datos.tipo === "publica" && l.datos.estado === "esperando" && l.datos.codigo && (l.limite == null || l.miembros < l.limite));
  });

  ipcMain.handle("steam:unirse-sala", async (_e, id) => {
    if (!activo() || typeof id !== "string" || !/^\d+$/.test(id)) return null;
    const lobby = pendientes.get(id) ?? (await cliente.matchmaking.joinLobby(BigInt(id)));
    pendientes.delete(id);
    entrarEnLobby(lobby);
    return datosLobby(lobby);
  });

  ipcMain.on("steam:rechazar", (_e, id) => {
    const lobby = pendientes.get(id);
    pendientes.delete(id);
    if (lobby) safe(() => lobby.leave());
  });

  ipcMain.on("steam:salir-sala", () => {
    if (activo()) salirDelLobby();
  });
}

function safe(f, siNo) {
  try {
    return f();
  } catch {
    return siNo;
  }
}

/** Después de crear la ventana: escucha las invitaciones aceptadas desde Steam con el juego ya abierto. */
function conectarVentana(ventana) {
  ventanaWeb = ventana;
  registrarIpc();
  if (!activo()) return;
  try {
    cliente.callback.register(steamworks.SteamCallback.GameLobbyJoinRequested, (v) => {
      avisarInvitacion(v.lobby_steam_id.toString(), v.friend_steam_id.toString());
    });
  } catch {
    // Sin callbacks no llegan invitaciones con el juego abierto (sí al arrancar).
  }
}

/** Si Steam abre una segunda copia con +connect_lobby, la invitación pasa a la que ya está abierta. */
function argumentosSegundaCopia(argv) {
  const id = lobbyDeArgumentos(argv);
  if (id && activo()) avisarInvitacion(id, null);
}

module.exports = { iniciarSteam, conectarVentana, argumentosSegundaCopia, steamActivo: activo };
