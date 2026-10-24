// Analiza los resultados de sim-objetivos.mjs.
// Uso: node analizar.mjs <prefijo de archivos en resultados/> [--estatico ritmos.json]
//   Sin --estatico: tabla por objetivo con lo que pasó de verdad.
//   Con --estatico: para cada variante {id, objetivo, cada, puntos}, recalcula los puntos con lo que
//   cada jugador tenía al final (sin que los bots cambien su forma de jugar).
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const prefijos = args.filter((a) => !a.startsWith("--") && !a.endsWith(".json"));
const iEst = args.indexOf("--estatico");
const variantes = iEst >= 0 ? JSON.parse(readFileSync(args[iEst + 1], "utf8")) : null;
const formato = args.includes("--json") ? "json" : "md";

const objetivos = JSON.parse(readFileSync(join(dir, "../../data/objetivos.json"), "utf8")).objetivos;
const ritmoActual = Object.fromEntries(objetivos.map((o) => [o.id, [o.cada, o.puntos]]));

const partidas = [];
for (const f of readdirSync(join(dir, "resultados"))) {
  if (!prefijos.some((p) => f.startsWith(p + "-"))) continue;
  for (const l of readFileSync(join(dir, "resultados", f), "utf8").split("\n")) if (l.trim()) partidas.push(JSON.parse(l));
}
const validas = partidas.filter((p) => !p.abortada && p.asientos.every((a) => a.total !== null));

/** Ganador(es) con totales dados; desempate por puntos de partida. Devuelve reparto de la victoria por asiento. */
function victorias(totales, partida) {
  const n = totales.length;
  let mejor = [];
  for (let i = 0; i < n; i++) {
    if (!mejor.length) mejor = [i];
    else {
      const j = mejor[0];
      if (totales[i] > totales[j] || (totales[i] === totales[j] && partida[i] > partida[j])) mejor = [i];
      else if (totales[i] === totales[j] && partida[i] === partida[j]) mejor.push(i);
    }
  }
  const v = Array(n).fill(0);
  for (const i of mejor) v[i] = 1 / mejor.length;
  return v;
}

const pts = (cant, [cada, puntos]) => Math.floor(cant / cada) * puntos;

function analizar(lista, ritmos = {}) {
  const r = (id) => ritmos[id] ?? ritmoActual[id];
  const porObj = {};
  const get = (id) =>
    (porObj[id] ??= { comun: { n: 0, pts: 0, total: 0, spread: 0, decide: 0 }, secreto: { n: 0, pts: 0, gana: 0, esperado: 0, total: 0, ofrecido: 0, elegido: 0 } });
  let sumTot = 0, sumObj = 0, nJug = 0, remontadas = 0;
  for (const p of lista) {
    const N = p.jugadores;
    const A = p.asientos;
    // Puntos de cada objetivo con el ritmo pedido.
    const objPts = A.map((a) => {
      const ids = [...p.comunes, a.secreto];
      return Object.fromEntries(ids.map((id) => [id, pts(a.cantidades[id], r(id))]));
    });
    const totales = A.map((a, i) => a.partida + Object.values(objPts[i]).reduce((s, x) => s + x, 0));
    const partida = A.map((a) => a.partida);
    const v = victorias(totales, partida);
    totales.forEach((t, i) => {
      sumTot += t;
      sumObj += t - partida[i];
      nJug++;
    });
    const vSin = victorias(partida, partida);
    if (vSin.findIndex((x) => x > 0) !== v.findIndex((x) => x > 0)) remontadas++;
    for (const id of p.comunes) {
      const c = get(id).comun;
      const vals = objPts.map((o) => o[id]);
      c.n++;
      c.pts += vals.reduce((s, x) => s + x, 0) / N;
      c.total += totales.reduce((s, x) => s + x, 0) / N;
      c.spread += Math.max(...vals) - Math.min(...vals);
      // ¿Cambia el ganador si este objetivo no contara?
      const sinEste = totales.map((t, i) => t - objPts[i][id]);
      const v2 = victorias(sinEste, partida);
      if (v2.findIndex((x) => x > 0) !== v.findIndex((x) => x > 0)) c.decide++;
    }
    A.forEach((a, i) => {
      for (const id of a.ofrecidos) get(id).secreto.ofrecido++;
      const s = get(a.secreto).secreto;
      if (a.ofrecidos.length > 1) s.elegido++;
      // Las partidas con secreto forzado no cuentan para la frecuencia de elección.
      if (p.forzado && p.forzado.asiento === i) {
        s.ofrecido--;
        s.elegido -= a.ofrecidos.length > 1 ? 1 : 0;
      }
      s.n++;
      s.pts += objPts[i][a.secreto];
      s.total += totales[i];
      s.gana += v[i];
      s.esperado += 1 / N;
    });
  }
  return { porObj, mediaTotal: sumTot / nJug, pesoObj: sumObj / sumTot, partidas: lista.length, remontadas: remontadas / lista.length };
}

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "—");
const pc = (x) => (Number.isFinite(x) ? Math.round(100 * x) + " %" : "—");

function tabla(res, titulo) {
  const filas = [];
  for (const o of objetivos) {
    const d = res.porObj[o.id];
    if (!d) continue;
    const c = d.comun, s = d.secreto;
    const ptsMed = (c.pts + s.pts) / (c.n + s.n);
    filas.push({
      id: o.id,
      nombre: o.nombre,
      ritmo: `${o.cada}→${o.puntos}`,
      nComun: c.n,
      ptsComun: c.pts / c.n,
      pesoComun: c.pts / c.total,
      spread: c.spread / c.n,
      decide: c.decide / c.n,
      nSecreto: s.n,
      ptsSecreto: s.pts / s.n,
      pesoSecreto: s.pts / s.total,
      gana: s.gana / s.n,
      esperado: s.esperado / s.n,
      ventaja: s.gana / s.esperado,
      elegido: s.ofrecido ? s.elegido / s.ofrecido : NaN,
      ptsMed,
    });
  }
  if (formato === "json") return JSON.stringify({ titulo, partidas: res.partidas, mediaTotal: res.mediaTotal, pesoObj: res.pesoObj, remontadas: res.remontadas, filas }, null, 1);
  let t = `### ${titulo}\n\n${res.partidas} partidas · total medio por jugador ${f1(res.mediaTotal)} · objetivos ${pc(res.pesoObj)} de los puntos · remontadas por objetivos ${pc(res.remontadas)}\n\n`;
  t += "| Objetivo | Ritmo | Común: veces | Común: puntos | Común: peso | Común: diferencia máx–mín | Común: cambia ganador | Secreto: veces | Secreto: puntos | Secreto: peso | Gana con él | Justo | Ventaja | Elegido |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n";
  for (const f of filas)
    t += `| ${f.nombre} | ${f.ritmo} | ${f.nComun} | ${f1(f.ptsComun)} | ${pc(f.pesoComun)} | ${f1(f.spread)} | ${pc(f.decide)} | ${f.nSecreto} | ${f1(f.ptsSecreto)} | ${pc(f.pesoSecreto)} | ${pc(f.gana)} | ${pc(f.esperado)} | ${f1(f.ventaja)} | ${pc(f.elegido)} |\n`;
  return t;
}

if (!variantes) {
  console.log(tabla(analizar(validas), `Todas (${prefijos.join(", ")})`));
  for (const N of [2, 3, 4]) {
    const l = validas.filter((p) => p.jugadores === N);
    if (l.length) console.log(tabla(analizar(l), `${N} jugadores`));
  }
  console.log(`Abortadas: ${partidas.length - validas.length}`);
  // ¿Cuánto daría cada objetivo a quien seca mucha ropa? Se calcula para todos los jugadores, lo tengan o no
  // (con lo que cuenta su mesa al final): todos frente al 25 % que más prendas seca y frente al ganador.
  console.log("\n### Si se seca más ropa\n\n| Objetivo | Ritmo | Puntos que daría (todos) | Al 25 % que más seca | Al ganador | Cantidad media (todos) | Cantidad (25 % que más seca) |\n|---|---|---|---|---|---|---|");
  const jug = validas.flatMap((p) => p.asientos.map((a) => ({ ...a, N: p.jugadores })));
  const corte = {};
  for (const N of [2, 3, 4]) {
    const s = jug.filter((a) => a.N === N).map((a) => a.secas).sort((x, y) => x - y);
    corte[N] = s[Math.floor(s.length * 0.75)];
  }
  const top = jug.filter((a) => a.secas >= corte[a.N]);
  const gan = jug.filter((a) => a.puesto === 1);
  const med = (l, f) => l.reduce((s, a) => s + f(a), 0) / l.length;
  for (const o of objetivos) {
    const r = ritmoActual[o.id];
    console.log(`| ${o.nombre} | ${r[0]}→${r[1]} | ${f1(med(jug, (a) => pts(a.cantidades[o.id], r)))} | ${f1(med(top, (a) => pts(a.cantidades[o.id], r)))} | ${f1(med(gan, (a) => pts(a.cantidades[o.id], r)))} | ${f1(med(jug, (a) => a.cantidades[o.id]))} | ${f1(med(top, (a) => a.cantidades[o.id]))} |`);
  }
  console.log(`\nPrendas secas por jugador: media ${f1(med(jug, (a) => a.secas))}; corte del 25 % que más seca: ${JSON.stringify(corte)}; media de ese grupo ${f1(med(top, (a) => a.secas))}`);
} else {
  // Estático: para cada variante, puntos medios y victorias del que lo tiene de secreto.
  console.log("| Variante | Objetivo | Ritmo | Puntos (común) | Puntos (secreto) | Gana con él (2/3/4 j) | Ventaja (todas) |\n|---|---|---|---|---|---|---|");
  for (const v of variantes) {
    const ritmos = v.ritmos;
    for (const id of v.mirar ?? Object.keys(ritmos)) {
      const res = analizar(validas, ritmos);
      const d = res.porObj[id];
      const porN = [2, 3, 4].map((N) => {
        const rr = analizar(validas.filter((p) => p.jugadores === N), ritmos).porObj[id]?.secreto;
        return rr ? pc(rr.gana / rr.n) : "—";
      });
      const r = ritmos[id] ?? ritmoActual[id];
      console.log(`| ${v.id} | ${id} | ${r[0]}→${r[1]} | ${f1(d.comun.pts / d.comun.n)} | ${f1(d.secreto.pts / d.secreto.n)} | ${porN.join(" / ")} | ${f1(d.secreto.gana / d.secreto.esperado)} |`);
    }
  }
}
