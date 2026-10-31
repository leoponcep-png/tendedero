// Vuelve a generar las texturas de ruido de packages/web/src/arte/texturas (PNG) a partir de los SVG con
// feTurbulence que antes iban en los CSS como data-URI. Los pinta Chrome en un canvas, así que salen igual que
// el SVG vivo. Uso (desde la raíz del repo): node informes/rendimiento/texturas.mjs
// Si cambias un SVG de aquí, ejecútalo otra vez y listo: los CSS ya apuntan a los PNG.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SALIDA = "packages/web/src/arte/texturas";
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
/** Nombre del PNG -> SVG original. */
const SVG = {
  "grano-papel": "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .42  0 0 0 0 .3  0 0 0 0 .16  0 0 0 .55 -.18'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>",
  "acuarela": "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='a' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='4' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .3  0 0 0 0 .15  0 0 0 .9 -.32'/></filter><rect width='100%' height='100%' filter='url(#a)'/></svg>",
  "grano-mesa": "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n' filterUnits='userSpaceOnUse' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .25 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
  "veta-mesa": "<svg xmlns='http://www.w3.org/2000/svg' width='900' height='300'><filter id='v' filterUnits='userSpaceOnUse' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.0025 .06' numOctaves='4' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .18  0 0 0 0 .09  0 0 0 0 .03  0 0 0 1.4 -.35'/></filter><rect width='100%' height='100%' filter='url(#v)'/></svg>",
  "fieltro-mesa": "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='f' filterUnits='userSpaceOnUse' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .08 0'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>"
};
/** Las de grano fino llevan también versión @2x para pantallas de alta densidad (las de mancha grande no la necesitan). */
const DOBLES = ["grano-papel", "grano-mesa", "fieltro-mesa"];

const puerto = 9900 + Math.floor(Math.random() * 90);
const perfil = mkdtempSync(join(tmpdir(), "tend-tex-"));
const ch = spawn(CHROME, [`--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, "--headless=new", "--force-device-scale-factor=1", "about:blank"], { stdio: "ignore" });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const p = (await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()).find((t) => t.type === "page");
    if (p) {
      ws = new WebSocket(p.webSocketDebuggerUrl);
      await new Promise((r) => ws.addEventListener("open", r));
      break;
    }
  } catch {}
  await espera(200);
}
let id = 0;
const pend = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (pend.has(m.id)) (pend.get(m.id)(m), pend.delete(m.id));
});
const cdp = (method, params) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

for (const [nombre, svg] of Object.entries(SVG)) {
  for (const esc of DOBLES.includes(nombre) ? [1, 2] : [1]) {
    const codigo = `(async () => {
      const svg = ${JSON.stringify(svg)};
      const w = +svg.match(/width='(\\d+)'/)[1], h = +svg.match(/height='(\\d+)'/)[1];
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = w * ${esc};
      c.height = h * ${esc};
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/png");
    })()`;
    const r = await cdp("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: codigo });
    const archivo = join(SALIDA, `${nombre}${esc === 2 ? "@2x" : ""}.png`);
    writeFileSync(archivo, Buffer.from(r.result.result.value.split(",")[1], "base64"));
    console.log(archivo);
  }
}
ch.kill();
process.exit(0);
