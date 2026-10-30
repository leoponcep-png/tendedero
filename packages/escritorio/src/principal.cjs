// Proceso principal de la aplicación de escritorio de Tendedero.
// Abre una ventana con la web del juego ya construida (packages/web/dist) y busca actualizaciones.
const { app, BrowserWindow, Menu, dialog, ipcMain, net, protocol, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { argumentosSegundaCopia, conectarVentana, iniciarSteam, steamActivo } = require("./steam.cjs");

// La web se sirve con un protocolo propio (tendedero://juego/...) en vez de file://:
// así tiene un origen fijo y seguro, que necesitan PeerJS (WebRTC y su servidor) y el localStorage.
// ¡No cambies el esquema ni el host! El perfil, los logros y las partidas guardadas viven en el
// localStorage de este origen; si cambia, el juego empezaría de cero.
const ESQUEMA = "tendedero";
const HOST = "juego";
const INICIO = `${ESQUEMA}://${HOST}/index.html`;

// En desarrollo se usa packages/web/dist; empaquetada, la copia que va en resources/web.
const CARPETA_WEB = app.isPackaged ? path.join(process.resourcesPath, "web") : path.join(__dirname, "..", "..", "web", "dist");

protocol.registerSchemesAsPrivileged([
  { scheme: ESQUEMA, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// Una sola copia abierta: si se abre otra vez, se trae al frente la que ya hay.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Steam (solo si hay App ID y Steam está abierto; si no, no hace nada). Va antes de que la app esté lista.
  iniciarSteam();
  app.on("second-instance", (_evento, argv) => {
    argumentosSegundaCopia(argv);
    const ventana = BrowserWindow.getAllWindows()[0];
    if (!ventana) return;
    if (ventana.isMinimized()) ventana.restore();
    ventana.focus();
  });
  app.whenReady().then(arrancar);
}

function arrancar() {
  protocol.handle(ESQUEMA, (peticion) => {
    const { host, pathname } = new URL(peticion.url);
    const relativa = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
    const archivo = path.normalize(path.join(CARPETA_WEB, relativa));
    if (host !== HOST || !archivo.startsWith(CARPETA_WEB + path.sep)) return new Response("No encontrado", { status: 404 });
    return net.fetch(pathToFileURL(archivo).toString());
  });

  Menu.setApplicationMenu(null);

  // Lo que pide la web por el preload: salir del juego y poner o quitar la pantalla completa.
  ipcMain.on("tendedero:salir", () => app.quit());
  ipcMain.handle("tendedero:pantalla-completa", (evento, si) => {
    const ventana = BrowserWindow.fromWebContents(evento.sender);
    if (!ventana) return false;
    if (typeof si === "boolean") ventana.setFullScreen(si);
    return typeof si === "boolean" ? si : ventana.isFullScreen();
  });

  conectarVentana(crearVentana());
  // En Steam las actualizaciones las pone Steam; fuera de Steam, las de GitHub Releases.
  if (!steamActivo()) buscarActualizaciones();

  app.on("window-all-closed", () => app.quit());
}

function crearVentana() {
  const ventana = new BrowserWindow({
    title: "Tendedero",
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    center: true,
    maximizable: true,
    autoHideMenuBar: true,
    backgroundColor: "#f2e6cc",
    icon: path.join(__dirname, "..", "build", "icono.ico"),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // El título de la ventana es siempre «Tendedero», aunque la página cambie el suyo.
  ventana.on("page-title-updated", (evento) => evento.preventDefault());
  ventana.once("ready-to-show", () => ventana.show());
  // La web se entera de cuándo entra o sale de pantalla completa (también con F11), para su ajuste.
  ventana.on("enter-full-screen", () => ventana.webContents.send("tendedero:pantalla-completa", true));
  ventana.on("leave-full-screen", () => ventana.webContents.send("tendedero:pantalla-completa", false));

  // F11: pantalla completa. Ctrl+Mayús+I abre las herramientas de desarrollo solo fuera del instalador.
  ventana.webContents.on("before-input-event", (evento, tecla) => {
    if (tecla.type !== "keyDown") return;
    if (tecla.key === "F11") {
      ventana.setFullScreen(!ventana.isFullScreen());
      evento.preventDefault();
    } else if (!app.isPackaged && tecla.control && tecla.shift && tecla.key.toLowerCase() === "i") {
      ventana.webContents.toggleDevTools();
    }
  });

  // Los enlaces externos se abren en el navegador del sistema, nunca dentro del juego.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    abrirFuera(url);
    return { action: "deny" };
  });
  ventana.webContents.on("will-navigate", (evento, url) => {
    if (url.startsWith(`${ESQUEMA}://${HOST}/`)) return;
    evento.preventDefault();
    abrirFuera(url);
  });

  ventana.loadURL(INICIO);
  return ventana;
}

function abrirFuera(url) {
  if (/^(https?|mailto):/i.test(url)) shell.openExternal(url);
}

// Busca una versión nueva en GitHub Releases y la descarga en segundo plano.
// Sin conexión (o si algo falla) no dice nada: ya lo intentará la próxima vez.
function buscarActualizaciones() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch (e) {
    console.error("No se pudo cargar el actualizador:", e);
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // si elige «Más tarde», se instala al cerrar
  autoUpdater.logger = null;

  autoUpdater.on("error", (e) => console.error("Actualizador:", e?.message ?? e));
  autoUpdater.once("update-downloaded", async () => {
    const ventana = BrowserWindow.getAllWindows()[0];
    const opciones = {
      type: "info",
      title: "Tendedero",
      message: "Hay una versión nueva de Tendedero. ¿Reiniciar para actualizar?",
      buttons: ["Reiniciar ahora", "Más tarde"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    };
    const { response } = ventana ? await dialog.showMessageBox(ventana, opciones) : await dialog.showMessageBox(opciones);
    if (response === 0) setImmediate(() => autoUpdater.quitAndInstall(true, true));
  });

  autoUpdater.checkForUpdates().catch((e) => console.error("Actualizador:", e?.message ?? e));
}
