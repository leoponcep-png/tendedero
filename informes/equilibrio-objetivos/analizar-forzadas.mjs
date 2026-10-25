// Partidas con un secreto forzado: cómo le va a quien lo tiene, según el ritmo probado.
// Uso: node analizar-forzadas.mjs <prefijo> [<prefijo>...]
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const prefijos = process.argv.slice(2);
const grupos = {};
for (const f of readdirSync(join(dir, "resultados"))) {
  if (!prefijos.some((p) => f.startsWith(p + "-"))) continue;
  for (const l of readFileSync(join(dir, "resultados", f), "utf8").split("\n")) {
    if (!l.trim()) continue;
    const p = JSON.parse(l);
    if (p.abortada) continue;
    (grupos[p.config] ??= []).push(p);
  }
}
const f1 = (x) => x.toFixed(1).replace(".", ",");
const pc = (x) => Math.round(100 * x) + " %";
console.log("| Prueba | Jugadores | Partidas | Puntos del objetivo | Cantidad contada | Total de quien lo tiene | Total de los demás | Gana con él | Justo | ± |\n|---|---|---|---|---|---|---|---|---|---|");
for (const [id, l] of Object.entries(grupos).sort()) {
  const N = l[0].jugadores;
  let pts = 0, cant = 0, tot = 0, otros = 0, gana = 0;
  for (const p of l) {
    const x = p.forzado.objetivo;
    const a = p.asientos[p.forzado.asiento];
    pts += a.objetivos[x];
    cant += a.cantidades[x];
    tot += a.total;
    otros += p.asientos.filter((_, i) => i !== p.forzado.asiento).reduce((s, b) => s + b.total, 0) / (N - 1);
    const primeros = p.asientos.filter((b) => b.puesto === 1).length;
    if (a.puesto === 1) gana += 1 / primeros;
  }
  const n = l.length;
  const g = gana / n;
  const se = Math.sqrt((g * (1 - g)) / n);
  console.log(`| ${id} | ${N} | ${n} | ${f1(pts / n)} | ${f1(cant / n)} | ${f1(tot / n)} | ${f1(otros / n)} | ${pc(g)} | ${pc(1 / N)} | ${Math.round(200 * se)} |`);
}
