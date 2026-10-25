// Resume los .jsonl del torneo: % de victorias de cada nivel en cada duelo (los empates en 1.º reparten).
// Uso: node informes/ia-dificultad/resumen.mjs resultados/*.jsonl
import { readFileSync } from "node:fs";

const duelos = {};
for (const archivo of process.argv.slice(2)) {
  for (const linea of readFileSync(archivo, "utf8").split("\n")) {
    if (!linea.trim()) continue;
    const r = JSON.parse(linea);
    const d = (duelos[r.duelo] ??= { partidas: 0, abortadas: 0, rondas: 0, victorias: {}, puntos: {}, asientos: {} });
    d.partidas++;
    d.rondas += r.rondas;
    if (r.abortada) d.abortadas++;
    const ganadores = r.puestos.map((p, s) => (p === 1 ? s : -1)).filter((s) => s >= 0);
    for (const s of ganadores) d.victorias[r.niveles[s]] = (d.victorias[r.niveles[s]] ?? 0) + 1 / ganadores.length;
    r.niveles.forEach((n, s) => {
      d.puntos[n] = (d.puntos[n] ?? 0) + r.totales[s];
      d.asientos[n] = (d.asientos[n] ?? 0) + 1;
    });
  }
}
for (const [id, d] of Object.entries(duelos)) {
  const partes = Object.keys(d.asientos).map((n) => {
    const v = d.victorias[n] ?? 0;
    return `${n} ${((100 * v) / d.partidas).toFixed(1)} % (media ${(d.puntos[n] / d.asientos[n]).toFixed(1)} pts)`;
  });
  console.log(`${id}: ${d.partidas} partidas, ${(d.rondas / d.partidas).toFixed(1)} rondas${d.abortadas ? `, ${d.abortadas} abortadas` : ""} · ${partes.join(" · ")}`);
}
