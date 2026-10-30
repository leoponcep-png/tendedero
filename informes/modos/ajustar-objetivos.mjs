// Busca, para la partida larga, el ritmo (cada, puntos) de cada objetivo que hace que pese frente a la ropa lo mismo
// que en la partida normal. Usa lo que tenía cada jugador al final (cantidades) en las partidas de las dos tandas.
// Uso: node informes/modos/ajustar-objetivos.mjs prefijoLarga prefijoNormal [ritmosNormal.json]
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const [pl, pn, archivo] = process.argv.slice(2);
const otros = archivo ? JSON.parse(readFileSync(archivo, "utf8")) : {};
const leer = (pref) => readdirSync(join(dir, "resultados")).filter((f) => f.startsWith(pref + "-")).flatMap((f) => readFileSync(join(dir, "resultados", f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
const L = leer(pl), N = leer(pn);
const objetivos = JSON.parse(readFileSync(join(dir, "../../data/objetivos.json"), "utf8")).objetivos;
const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pts = (c, [cada, p]) => Math.floor(c / cada) * p;
const asientos = (lista, n) => lista.filter((p) => p.jugadores === n).flatMap((p) => p.asientos);
console.log("| Objetivo | Normal | Pts normal (2/3/4 j) | % ropa normal | Larga sin cambiar: pts | Propuesto | Pts larga (2/3/4 j) | % ropa larga |");
console.log("|---|---|---|---|---|---|---|---|");
for (const o of objetivos) {
  const rn = otros[o.id] ?? [o.cada, o.puntos];
  const fila = { n: [], sin: [], cuota: [] };
  const objetivo = [];
  for (const n of [2, 3, 4]) {
    const an = asientos(N, n), al = asientos(L, n);
    const ropaN = media(an.map((a) => a.partida)), ropaL = media(al.map((a) => a.partida));
    const pn = media(an.map((a) => pts(a.cantidades[o.id] ?? 0, rn)));
    fila.n.push(pn);
    fila.cuota.push(pn / ropaN);
    fila.sin.push(media(al.map((a) => pts(a.cantidades[o.id] ?? 0, [o.cada, o.puntos]))));
    objetivo.push({ al, meta: (pn / ropaN) * ropaL, ropaL });
  }
  let mejor = null;
  for (let cada = 1; cada <= 10; cada++)
    for (let p = 1; p <= 12; p++) {
      const vals = objetivo.map(({ al }) => media(al.map((a) => pts(a.cantidades[o.id] ?? 0, [cada, p]))));
      const err = media(vals.map((v, i) => Math.abs(v - objetivo[i].meta) / Math.max(1, objetivo[i].meta))) + 0.01 * (cada + p);
      if (!mejor || err < mejor.err) mejor = { cada, p, vals, err };
    }
  const f = (xs) => xs.map((x) => x.toFixed(1).replace(".", ",")).join(" / ");
  const cuotaL = mejor.vals.map((v, i) => v / objetivo[i].ropaL);
  console.log(`| ${o.id} | ${rn[0]} → ${rn[1]} | ${f(fila.n)} | ${Math.round(100 * media(fila.cuota))} % | ${f(fila.sin)} | **${mejor.cada} → ${mejor.p}** | ${f(mejor.vals)} | ${Math.round(100 * media(cuotaL))} % |`);
}
