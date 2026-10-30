// Resume los resultados de sim.mjs por configuración.
// Uso (desde la raíz): node informes/modos/resumen.mjs prefijo [prefijo…] [--objetivos] [--dias]
//   --objetivos: tabla por objetivo (puntos medios como común y como secreto, y cuántas veces gana quien lo lleva de secreto).
//   --dias: cuántas veces sale cada carta del día por ronda.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const prefijos = args.filter((a) => !a.startsWith("--"));
const partidas = [];
for (const f of readdirSync(join(dir, "resultados"))) {
  if (!prefijos.some((p) => f.startsWith(p + "-"))) continue;
  for (const l of readFileSync(join(dir, "resultados", f), "utf8").split("\n")) if (l.trim()) partidas.push(JSON.parse(l));
}
const validas = partidas.filter((p) => !p.abortada && p.asientos.every((a) => a.total !== null));
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "–");
const pc = (x) => (Number.isFinite(x) ? `${Math.round(100 * x)} %` : "–");
const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Reparto de la victoria por asiento (empate en el primer puesto: a partes iguales). */
const victorias = (p) => {
  const primeros = p.asientos.map((a, i) => [a, i]).filter(([a]) => a.puesto === 1).map(([, i]) => i);
  return p.asientos.map((_, i) => (primeros.includes(i) ? 1 / primeros.length : 0));
};

const porConfig = {};
for (const p of validas) (porConfig[p.config] ??= []).push(p);

console.log(`${validas.length} partidas válidas de ${partidas.length}.\n`);
console.log("| Config | J | Partidas | Rondas | Puntos (total) | De objetivos | Cuerdas colocadas | Cartas al final | Tendedero lleno | Mejoras de básica / jugador | Partidas con alguna mejora | Secas (calc · cam · toalla) | Secreto forzado: puntos | Gana con él | Justo | ± |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const [id, lista] of Object.entries(porConfig).sort()) {
  const n = lista[0].jugadores;
  const A = lista.flatMap((p) => p.asientos);
  const tot = media(A.map((a) => a.total));
  const obj = media(A.map((a) => a.total - a.partida));
  const fila = [
    id,
    n,
    lista.length,
    f1(media(lista.map((p) => p.rondas))),
    f1(tot),
    pc(obj / tot),
    f1(media(A.map((a) => a.colocadas))),
    f1(media(A.map((a) => a.cartas))),
    pc(media(A.map((a) => (a.rondaLleno !== null ? 1 : 0)))),
    f1(media(A.map((a) => a.mejoras))),
    pc(media(lista.map((p) => (p.asientos.some((a) => a.mejoras > 0) ? 1 : 0)))),
    ["calcetin", "camiseta", "toalla"].map((t) => f1(media(A.map((a) => a.secas[t] ?? 0)))).join(" · "),
  ];
  const forzadas = lista.filter((p) => p.forzado);
  if (forzadas.length) {
    const o = forzadas[0].forzado.objetivo;
    const pts = media(forzadas.map((p) => p.asientos[p.forzado.asiento].objetivos[o] ?? 0));
    const gana = media(forzadas.map((p) => victorias(p)[p.forzado.asiento]));
    const err = 2 * Math.sqrt((gana * (1 - gana)) / forzadas.length);
    fila.push(f1(pts), pc(gana), pc(1 / n), `${Math.round(100 * err)}`);
  } else fila.push("", "", "", "");
  console.log(`| ${fila.join(" | ")} |`);
}

if (args.includes("--objetivos")) {
  for (const n of [2, 3, 4]) {
    const lista = validas.filter((p) => p.jugadores === n && !p.forzado);
    if (!lista.length) continue;
    const ids = Object.keys(lista[0].asientos[0].cantidades);
    console.log(`\n### Objetivos a ${n} jugadores (${lista.length} partidas; lo justo para el secreto: ${pc(1 / n)})\n`);
    console.log("| Objetivo | Puntos (común) | Puntos (secreto) | Veces de secreto | Gana con él de secreto |");
    console.log("|---|---|---|---|---|");
    for (const id of ids) {
      const comun = lista.filter((p) => p.comunes.includes(id)).flatMap((p) => p.asientos.map((a) => a.objetivos[id] ?? 0));
      const sec = lista.flatMap((p) => p.asientos.map((a, i) => [p, a, i]).filter(([, a]) => a.secreto === id));
      const ptsSec = sec.map(([, a]) => a.objetivos[id] ?? 0);
      const gana = sec.map(([p, , i]) => victorias(p)[i]);
      console.log(`| ${id} | ${f1(media(comun))} | ${f1(media(ptsSec))} | ${sec.length} | ${pc(media(gana))} |`);
    }
  }
}

if (args.includes("--dias")) {
  const veces = {};
  const enPartida = {};
  let rondas = 0;
  for (const p of validas) {
    rondas += p.dias.length;
    for (const d of p.dias) veces[d] = (veces[d] ?? 0) + 1;
    for (const d of new Set(p.dias)) enPartida[d] = (enPartida[d] ?? 0) + 1;
  }
  console.log(`\n### Carta del día en ${validas.length} partidas (${rondas} rondas, ${f1(rondas / validas.length)} por partida)\n`);
  console.log("| Carta | % de rondas | Partidas en las que sale |");
  console.log("|---|---|---|");
  for (const [d, v] of Object.entries(veces).sort((a, b) => b[1] - a[1])) console.log(`| ${d} | ${pc(v / rondas)} (${((100 * v) / rondas).toFixed(1).replace(".", ",")}) | ${pc(enPartida[d] / validas.length)} |`);
}

if (args.includes("--potencial")) {
  // Lo que habría dado cada objetivo a cada jugador con lo que tenía al final (lo lleve o no), con los ritmos de
  // data/objetivos.json; con --ritmos archivo.json, con esos otros ({ id: [cada, puntos] }).
  const iR = args.indexOf("--ritmos");
  const otros = iR >= 0 ? JSON.parse(readFileSync(args[iR + 1], "utf8")) : {};
  const objetivos = JSON.parse(readFileSync(join(dir, "../../data/objetivos.json"), "utf8")).objetivos;
  const ritmo = Object.fromEntries(objetivos.map((o) => [o.id, otros[o.id] ?? [o.cada, o.puntos]]));
  for (const [id, lista] of Object.entries(porConfig).sort()) {
    const A = lista.flatMap((p) => p.asientos);
    const ropa = media(A.map((a) => a.partida));
    console.log(`\n### ${id}: lo que daría cada objetivo (puntos de ropa por jugador: ${f1(ropa)})\n`);
    console.log("| Objetivo | Ritmo | Cantidad | Puntos | Frente a la ropa |");
    console.log("|---|---|---|---|---|");
    for (const o of objetivos) {
      const [cada, puntos] = ritmo[o.id];
      const cant = media(A.map((a) => a.cantidades[o.id] ?? 0));
      const pts = media(A.map((a) => Math.floor((a.cantidades[o.id] ?? 0) / cada) * puntos));
      console.log(`| ${o.id} | ${cada} → ${puntos} | ${f1(cant)} | ${f1(pts)} | ${pc(pts / ropa)} |`);
    }
  }
}
