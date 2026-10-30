// Reparte una tanda de sim.mjs en trozos y los juega en paralelo (un proceso de node por trozo).
// Uso (desde la raíz): node informes/modos/lanzar.mjs nombre configs.json partidas [procesos]
//   configs.json: lista de configuraciones de sim.ts. Cada configuración se parte en trozos de partidas.
// Deja los resultados en informes/modos/resultados/nombre-*.jsonl.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const [nombre, archivo, partidasTxt, procesosTxt] = process.argv.slice(2);
const configs = JSON.parse(readFileSync(archivo, "utf8"));
const partidas = Number(partidasTxt);
const procesos = Number(procesosTxt ?? Math.max(1, cpus().length - 2));
mkdirSync(join(dir, "tandas"), { recursive: true });
mkdirSync(join(dir, "resultados"), { recursive: true });

// Trozos de unas 25 partidas por configuración.
const porTrozo = Math.max(5, Math.ceil(partidas / Math.max(1, Math.ceil(partidas / 25))));
const trabajos = [];
for (const c of configs) {
  for (let desde = 0; desde < partidas; desde += porTrozo) {
    trabajos.push({ c, desde, n: Math.min(porTrozo, partidas - desde) });
  }
}
const inicio = Date.now();
let siguiente = 0;
let hechos = 0;
function lanzar() {
  if (siguiente >= trabajos.length) return Promise.resolve();
  const t = trabajos[siguiente];
  const k = siguiente++;
  const tanda = join(dir, "tandas", `${nombre}-${k}.json`);
  const salida = join(dir, "resultados", `${nombre}-${k}.jsonl`);
  writeFileSync(tanda, JSON.stringify({ partidas: t.n, desde: t.desde, configs: [t.c] }));
  rmSync(salida, { force: true });
  return new Promise((ok) => {
    const hijo = spawn(process.execPath, [join(dir, process.env.SIM ?? "sim.mjs"), tanda, salida], { stdio: ["ignore", "ignore", "inherit"] });
    hijo.on("exit", () => {
      hechos++;
      if (hechos % 10 === 0 || hechos === trabajos.length) console.log(`${nombre}: ${hechos}/${trabajos.length} trozos (${((Date.now() - inicio) / 1000).toFixed(0)} s)`);
      ok(lanzar());
    });
  });
}
await Promise.all(Array.from({ length: procesos }, lanzar));
console.log(`${nombre} terminado en ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
