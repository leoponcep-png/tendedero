// Resume los .jsonl del torneo: % de victorias de cada nivel en cada duelo (los empates en 1.º reparten).
// Uso: node informes/ia-dificultad/resumen.mjs resultados/*.jsonl
import { readFileSync } from "node:fs";

const duelos = {};
/** Por nivel, sumando todos los duelos: prendas secas por tipo, colgadas al final por tipo y por tender al final. */
const niveles = {};
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
      if (!r.secas) return;
      const t = (niveles[n] ??= { asientos: 0, secas: {}, colgadas: {}, pendientes: 0, antes: 0 });
      t.asientos++;
      for (const [tipo, k] of Object.entries(r.secas[s])) t.secas[tipo] = (t.secas[tipo] ?? 0) + k;
      for (const [tipo, k] of Object.entries(r.colgadas[s])) t.colgadas[tipo] = (t.colgadas[tipo] ?? 0) + k;
      t.pendientes += r.pendientes[s];
      t.antes += r.pendientesAntesDelUltimoReparto?.[s] ?? 0;
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

const TIPOS = ["calcetin", "camiseta", "toalla"];
for (const [n, t] of Object.entries(niveles)) {
  const media = (x) => (x / t.asientos).toFixed(1);
  const total = TIPOS.reduce((a, k) => a + (t.secas[k] ?? 0), 0);
  const secas = TIPOS.map((k) => `${k} ${media(t.secas[k] ?? 0)} (${((100 * (t.secas[k] ?? 0)) / total).toFixed(0)} %)`).join(", ");
  const colgadas = TIPOS.map((k) => `${k} ${media(t.colgadas[k] ?? 0)}`).join(", ");
  console.log(`${n}: secas por partida ${media(total)} → ${secas} · colgadas al final: ${colgadas} · por tender al final ${media(t.pendientes)} (antes del último reparto ${media(t.antes)})`);
}
