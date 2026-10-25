// Genera build/icono.ico (varios tamaños) y build/icono.png a partir de build/icono.svg.
// Usa Electron para dibujar el SVG en un canvas, así no hace falta ninguna librería de imágenes.
// Uso: npm run icono -w @tendedero/escritorio
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const CARPETA = path.join(__dirname, "..", "build");
const TAMANOS = [16, 20, 24, 32, 40, 48, 64, 128, 256];

async function dibujar(ventana, svg, lado) {
  const codigo = `(async () => {
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + ${JSON.stringify(Buffer.from(svg).toString("base64"))};
    await img.decode();
    const c = document.createElement("canvas");
    c.width = c.height = ${lado};
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, ${lado}, ${lado});
    return c.toDataURL("image/png");
  })()`;
  const url = await ventana.webContents.executeJavaScript(codigo);
  return Buffer.from(url.split(",")[1], "base64");
}

// ICO con imágenes PNG dentro (válido desde Windows Vista).
function crearIco(pngs) {
  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0);
  cabecera.writeUInt16LE(1, 2);
  cabecera.writeUInt16LE(pngs.length, 4);
  const entradas = [];
  let desplazamiento = 6 + 16 * pngs.length;
  for (const { lado, datos } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(lado >= 256 ? 0 : lado, 0);
    e.writeUInt8(lado >= 256 ? 0 : lado, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(datos.length, 8);
    e.writeUInt32LE(desplazamiento, 12);
    desplazamiento += datos.length;
    entradas.push(e);
  }
  return Buffer.concat([cabecera, ...entradas, ...pngs.map((p) => p.datos)]);
}

app.whenReady().then(async () => {
  try {
    const svg = fs.readFileSync(path.join(CARPETA, "icono.svg"), "utf8");
    const ventana = new BrowserWindow({ show: false });
    await ventana.loadURL("data:text/html,<html><body></body></html>");
    const pngs = [];
    for (const lado of TAMANOS) pngs.push({ lado, datos: await dibujar(ventana, svg, lado) });
    fs.writeFileSync(path.join(CARPETA, "icono.ico"), crearIco(pngs));
    fs.writeFileSync(path.join(CARPETA, "icono.png"), await dibujar(ventana, svg, 512));
    console.log("Icono generado en", CARPETA);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
  app.quit();
});
