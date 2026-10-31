// Reparte una tanda de sim-40 en trozos y los juega en paralelo (un proceso de node por trozo).
// Uso (desde la raíz): node informes/juego-base/simulacion/lanzar-40.mjs sim.mjs configs.json partidas carpeta [procesos]
//   sim.mjs: sim-40.ts empaquetado con rolldown. Por defecto, 2 procesos a la vez y con prioridad baja. Deja los resultados en carpeta/resultados/<id>-<trozo>.jsonl.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { constants, cpus, setPriority } from "node:os";
import { join, resolve } from "node:path";

const [sim, archivo, partidasTxt, carpeta, procesosTxt] = process.argv.slice(2);
const configs = JSON.parse(readFileSync(archivo, "utf8"));
const partidas = Number(partidasTxt);
const procesos = Number(procesosTxt ?? 2);
mkdirSync(join(carpeta, "tandas"), { recursive: true });
mkdirSync(join(carpeta, "resultados"), { recursive: true });
const porTrozo = 25;
const trabajos = [];
for (const c of configs) for (let desde = 0; desde < partidas; desde += porTrozo) trabajos.push({ c, desde, n: Math.min(porTrozo, partidas - desde) });
// Primero los trozos más lentos (4 jugadores).
trabajos.sort((a, b) => b.c.jugadores - a.c.jugadores);
const inicio = Date.now();
let siguiente = 0;
let hechos = 0;
function lanzar() {
  if (siguiente >= trabajos.length) return Promise.resolve();
  const t = trabajos[siguiente++];
  const nombre = `${t.c.id}-${t.desde}`;
  const tanda = join(carpeta, "tandas", `${nombre}.json`);
  const salida = join(carpeta, "resultados", `${nombre}.jsonl`);
  writeFileSync(tanda, JSON.stringify({ partidas: t.n, desde: t.desde, configs: [t.c] }));
  rmSync(salida, { force: true });
  return new Promise((ok) => {
    const hijo = spawn(process.execPath, [resolve(sim), tanda, salida], { stdio: ["ignore", "ignore", "inherit"] });
    // Prioridad baja, para no estorbar a quien usa el ordenador mientras tanto.
    try {
      setPriority(hijo.pid, constants.priority.PRIORITY_BELOW_NORMAL);
    } catch {}
    hijo.on("exit", () => {
      hechos++;
      if (hechos % 20 === 0 || hechos === trabajos.length) console.log(`${hechos}/${trabajos.length} trozos (${((Date.now() - inicio) / 1000).toFixed(0)} s)`);
      ok(lanzar());
    });
  });
}
await Promise.all(Array.from({ length: procesos }, lanzar));
console.log(`terminado en ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
