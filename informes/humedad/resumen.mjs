// Resume las tandas de sim.mjs: por duelo, rondas, % de victorias y puntos por nivel, y toques del tope.
// Uso: node informes/humedad/resumen.mjs antes.jsonl... -- despues.jsonl...
import fs from "node:fs";
const args = process.argv.slice(2);
const corte = args.indexOf("--");
const grupos = corte < 0 ? { despues: args } : { antes: args.slice(0, corte), despues: args.slice(corte + 1) };
const leer = (fs_) => fs_.flatMap((f) => fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)));
const NOMBRE = { facil: "Fácil", normal: "Normal", dificil: "Difícil" };
const r = (x, d = 1) => x.toFixed(d).replace(".", ",");
const tablas = {};
for (const [g, archivos] of Object.entries(grupos)) {
  for (const p of leer(archivos)) {
    const t = ((tablas[p.duelo] ??= {})[g] ??= { n: 0, rondas: 0, abortadas: 0, gana: {}, puntos: {}, cuenta: {}, toques: 0, perdida: 0, conToque: 0, maxima: 0, enBalde: 0, causas: {} });
    t.n++;
    t.rondas += p.rondas;
    t.abortadas += p.abortada ? 1 : 0;
    const primeros = p.puestos.filter((x) => x === 1).length;
    p.niveles.forEach((nv, s) => {
      t.gana[nv] = (t.gana[nv] ?? 0) + (p.puestos[s] === 1 ? 1 / primeros : 0);
      t.puntos[nv] = (t.puntos[nv] ?? 0) + p.totales[s];
      t.cuenta[nv] = (t.cuenta[nv] ?? 0) + 1;
    });
    t.toques += p.toques;
    t.perdida += p.perdida;
    t.conToque += p.toques > 0 ? 1 : 0;
    t.maxima = Math.max(t.maxima, p.maxima);
    t.enBalde += p.mojasEnBalde ?? 0;
    for (const [c, n] of Object.entries(p.porCausa)) t.causas[c] = (t.causas[c] ?? 0) + n;
  }
}
for (const [duelo, gs] of Object.entries(tablas)) {
  console.log(`\n### ${duelo}`);
  for (const [g, t] of Object.entries(gs)) {
    const niveles = Object.keys(t.cuenta);
    const vic = niveles.map((nv) => `${NOMBRE[nv]} ${r((100 * t.gana[nv]) / (t.n * t.cuenta[nv] / t.n), 0)} %`).join(" · ");
    const pts = niveles.map((nv) => r(t.puntos[nv] / t.cuenta[nv], 0)).join(" · ");
    console.log(`${g}: ${t.n} partidas · rondas ${r(t.rondas / t.n, 2)} · victorias ${vic} · puntos ${pts} · toques/partida ${r(t.toques / t.n, 2)} · partidas con toque ${r((100 * t.conToque) / t.n, 0)} % · humedad perdida/partida ${r(t.perdida / t.n, 2)} · máx ${t.maxima} · mojas en balde ${t.enBalde} · causas ${JSON.stringify(t.causas)}${t.abortadas ? ` · abortadas ${t.abortadas}` : ""}`);
  }
}
