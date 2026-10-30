// Puente entre la web del juego y la ventana de Electron: salir del juego y la pantalla completa.
// La web lo usa desde packages/web/src/escritorio.ts (window.tendederoEscritorio).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tendederoEscritorio", {
  salir: () => ipcRenderer.send("tendedero:salir"),
  pantallaCompleta: (si) => ipcRenderer.invoke("tendedero:pantalla-completa", typeof si === "boolean" ? si : null),
  alCambiarPantallaCompleta: (fn) => {
    const oir = (_evento, si) => fn(!!si);
    ipcRenderer.on("tendedero:pantalla-completa", oir);
    return () => ipcRenderer.removeListener("tendedero:pantalla-completa", oir);
  },
});

// Steam (src/steam.cjs). La web lo usa desde packages/web/src/plataforma/steam.ts (window.tendederoSteam).
// Si Steam no está, estado() responde { activo: false } y la web sigue con el código de sala.
const texto = (v) => (typeof v === "string" ? v : String(v ?? ""));
contextBridge.exposeInMainWorld("tendederoSteam", {
  estado: () => ipcRenderer.invoke("steam:estado"),
  invitacionAlArrancar: () => ipcRenderer.invoke("steam:invitacion-al-arrancar"),
  logro: (nombre) => ipcRenderer.send("steam:logro", texto(nombre)),
  estadisticas: (valores) => ipcRenderer.send("steam:estadisticas", valores),
  presencia: (claves) => ipcRenderer.send("steam:presencia", claves),
  amigos: () => ipcRenderer.invoke("steam:amigos"),
  abrirAmigos: () => ipcRenderer.send("steam:abrir-amigos"),
  abrirPerfil: (id) => ipcRenderer.send("steam:abrir-perfil", texto(id)),
  crearSala: (opciones) => ipcRenderer.invoke("steam:crear-sala", opciones),
  datosSala: (datos) => ipcRenderer.invoke("steam:datos-sala", datos),
  salaActual: () => ipcRenderer.invoke("steam:sala-actual"),
  invitar: () => ipcRenderer.send("steam:invitar"),
  buscarSalas: () => ipcRenderer.invoke("steam:buscar-salas"),
  unirseSala: (id) => ipcRenderer.invoke("steam:unirse-sala", texto(id)),
  rechazar: (id) => ipcRenderer.send("steam:rechazar", texto(id)),
  salirSala: () => ipcRenderer.send("steam:salir-sala"),
  alInvitacion: (fn) => {
    const oir = (_evento, inv) => fn(inv);
    ipcRenderer.on("steam:invitacion", oir);
    return () => ipcRenderer.removeListener("steam:invitacion", oir);
  },
});
