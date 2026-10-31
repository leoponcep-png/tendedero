// Resume los resultados de la tanda «juego base». Uso: node resumen-jb.mjs prefijo [--objetivos]
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "informes/modos/resultados");
const args = process.argv.slice(2);
const prefijos = args.filter((a) => !a.startsWith("--"));
const partidas = [];
for (const f of readdirSync(dir)) {
  if (!prefijos.some((p) => f.startsWith(p + "-"))) continue;
  for (const l of readFileSync(join(dir, f), "utf8").split("\n")) if (l.trim()) partidas.push(JSON.parse(l));
}
const validas = partidas.filter((p) => !p.abortada && p.asientos.every((a) => a.total !== null));
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "–");
const pc = (x) => (Number.isFinite(x) ? `${Math.round(100 * x)} %` : "–");
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const victorias = (p) => {
  const primeros = p.asientos.map((a, i) => [a, i]).filter(([a]) => a.puesto === 1).map(([, i]) => i);
  return p.asientos.map((_, i) => (primeros.includes(i) ? 1 / primeros.length : 0));
};

// Duración estimada (minutos): 1,5 min por ronda (carta del día, secado, cestas), 10 s por prenda cogida en el
// reparto, 20 s por turno (pensar, robar) y 15 s por cada jugada dentro del turno (colgar, cuerda, acción…).
function minutos(p) {
  const t = p.tiposJugada;
  const jugadas = (t.colgarPrenda ?? 0) + (t.colocarCuerda ?? 0) + (t.mejorarCuerda ?? 0) + (t.jugarAccion ?? 0) + (t.responder ?? 0) + (t.descartar ?? 0);
  const turnos = t.terminarTurno ?? 0;
  return (1.5 * 60 * p.rondas + 10 * (t.draft ?? 0) + 20 * turnos + 15 * jugadas) / 60;
}

const porConfig = {};
for (const p of validas) (porConfig[p.config] ??= []).push(p);
const filas = [];
for (const [id, lista] of Object.entries(porConfig)) {
  const n = lista[0].jugadores;
  const A = lista.flatMap((p) => p.asientos);
  const tot = media(A.map((a) => a.total));
  const llenos = A.filter((a) => a.rondaLleno !== null);
  const fraccion = media(lista.flatMap((p) => p.asientos.filter((a) => a.rondaLleno !== null).map((a) => a.rondaLleno / p.rondas)));
  const vic = { normal: [], dificil: [], facil: [] };
  for (const p of lista) {
    const v = victorias(p);
    p.asientos.forEach((a, i) => vic[a.nivel].push(v[i]));
  }
  const turnos = A.reduce((s, a) => s + a.turnos, 0);
  filas.push({
    id,
    n,
    partidas: lista.length,
    rondas: media(lista.map((p) => p.rondas)),
    finRopa: media(lista.map((p) => (p.finPorRopa ? 1 : 0))),
    llenan: llenos.length / A.length,
    rondaLleno: media(llenos.map((a) => a.rondaLleno)),
    fraccion,
    cartas: media(A.map((a) => a.cartas)),
    mejoras: media(A.map((a) => a.mejoras)),
    cambios: media(A.map((a) => a.cambios)),
    conMejora: media(lista.map((p) => (p.asientos.some((a) => a.mejoras + a.cambios > 0) ? 1 : 0))),
    mover: media(A.map((a) => a.moverCuerda + a.cambiarCuerdas)),
    conMover: media(lista.map((p) => (p.asientos.some((a) => a.moverCuerda + a.cambiarCuerdas > 0) ? 1 : 0))),
    pendFinal: media(A.map((a) => a.pendientesFinal)),
    pendTurno: A.reduce((s, a) => s + a.pendFinTurno, 0) / turnos,
    sinPrendas: A.reduce((s, a) => s + a.turnosSinPrendasConHueco, 0) / turnos,
    bolsaVacia: media(lista.map((p) => (p.rondaBolsaVacia !== null ? 1 : 0))),
    rondaBolsa: media(lista.filter((p) => p.rondaBolsaVacia !== null).map((p) => p.rondaBolsaVacia)),
    total: tot,
    obj: media(A.map((a) => a.total - a.partida)) / tot,
    secas: ["calcetin", "camiseta", "toalla"].map((t) => media(A.map((a) => a.secas[t] ?? 0))),
    vicN: media(vic.normal),
    vicD: media(vic.dificil),
    vicF: media(vic.facil),
    min: media(lista.map(minutos)),
  });
}

const orden = [...new Set(filas.map((f) => f.id.replace(/-\dj$/, "")))];
for (const n of [2, 3, 4]) {
  const fs = orden.map((o) => filas.find((f) => f.id === `${o}-${n}j`)).filter(Boolean);
  if (!fs.length) continue;
  console.log(`\n### ${n} jugadores\n`);
  console.log("| Variante | Partidas | Rondas | Min. | Acaba sin ropa | Llenan tendedero | Ronda en que se llena (fracción) | Mejoras básica / j | Cambios hab. / j (e) | Partidas con mejora | Mover+cambiar cuerdas / j | Partidas con mover/cambiar | Prendas sin tender al final / j | Prendas esperando tras el turno | Turnos sin prendas (con hueco) | Bolsa vacía (ronda) | Puntos / j | De objetivos | Secas c·c·t | Gana Difícil / Normal | Gana Fácil |");
  console.log("|" + "---|".repeat(21));
  for (const f of fs) {
    console.log(
      `| ${f.id} | ${f.partidas} | ${f1(f.rondas)} | ${Math.round(f.min)} | ${pc(f.finRopa)} | ${pc(f.llenan)} | ${f1(f.rondaLleno)} (${pc(f.fraccion)}) | ${f1(f.mejoras)} | ${f1(f.cambios)} | ${pc(f.conMejora)} | ${f1(f.mover)} | ${pc(f.conMover)} | ${f1(f.pendFinal)} | ${f1(f.pendTurno)} | ${pc(f.sinPrendas)} | ${pc(f.bolsaVacia)} (${f1(f.rondaBolsa)}) | ${f1(f.total)} | ${pc(f.obj)} | ${f.secas.map(f1).join("·")} | ${pc(f.vicD)} / ${pc(f.vicN)} | ${pc(f.vicF)} |`,
    );
  }
}

if (args.includes("--objetivos")) {
  // Por variante: puntos medios del objetivo (común o secreto, en las partidas en que está) y cómo gana quien lo lleva de secreto
  // frente a lo justo (1/n). Se marcan los que se pasan de ±12 puntos de porcentaje.
  for (const o of orden) {
    const lista = validas.filter((p) => p.config.startsWith(o + "-") && p.config.replace(/-\dj$/, "") === o);
    if (!lista.length) continue;
    const ids = Object.keys(lista[0].asientos[0].cantidades);
    const raros = [];
    let maxPts = { id: "", v: 0 };
    for (const id of ids) {
      const sec = lista.flatMap((p) => p.asientos.map((a, i) => [p, a, i]).filter(([, a]) => a.secreto === id));
      if (sec.length < 30) continue;
      const exceso = media(sec.map(([p, , i]) => victorias(p)[i] - 1 / p.jugadores));
      const pts = media(sec.map(([, a]) => a.objetivos[id] ?? 0));
      const ropa = media(sec.map(([, a]) => a.partida));
      if (pts / ropa > maxPts.v) maxPts = { id, v: pts / ropa, pts };
      if (Math.abs(exceso) > 0.12) raros.push(`${id} ${exceso > 0 ? "+" : ""}${Math.round(100 * exceso)} pp (${f1(pts)} pts)`);
    }
    console.log(`- ${o}: mayor secreto frente a la ropa: ${maxPts.id} ${f1(maxPts.pts)} pts (${pc(maxPts.v)}). Descompensados (gana con él de secreto, frente a lo justo): ${raros.join("; ") || "ninguno"}`);
  }
}
