// Resume las tandas de sim-40 para objetivos-40.md.
// Uso (desde la raíz): node informes/juego-base/simulacion/resumen-40.mjs carpeta/resultados prefijoNatural prefijoForzado [ritmos.json]
//   prefijoNatural: partidas con reparto normal (p. ej. a40) → rondas, tendedero lleno, mejoras, ropa, peso de objetivos.
//   prefijoForzado: partidas con un objetivo secreto forzado (f40-<objetivo>-<n>j) → puntos y victorias de quien lo lleva.
//   ritmos.json (opcional): { id: [cada, puntos] } para volver a puntuar al que lleva el secreto con otro ritmo
//   (contrafactual: misma partida, misma cantidad al final; no cuenta que la IA juegue distinto con otro ritmo).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const [dir, pn, pf, archivoRitmos] = process.argv.slice(2);
const ritmos = archivoRitmos ? JSON.parse(readFileSync(archivoRitmos, "utf8")) : {};
const leer = (pref) =>
  readdirSync(dir)
    .filter((f) => f.startsWith(pref + "-"))
    .flatMap((f) => readFileSync(join(dir, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)))
    .filter((p) => !p.abortada && p.asientos.every((a) => a.total !== null));
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "–");
const pc = (x) => (Number.isFinite(x) ? `${Math.round(100 * x)} %` : "–");
const victorias = (totales) => {
  const max = Math.max(...totales);
  const g = totales.filter((t) => t === max).length;
  return totales.map((t) => (t === max ? 1 / g : 0));
};
const objetivos = JSON.parse(readFileSync(join(process.cwd(), "data/objetivos.json"), "utf8")).objetivos;

if (pn) {
  const N = leer(pn);
  console.log("| Jugadores | Partidas | Rondas | Acaba sin ropa | Bolsa vacía | Llenan tendedero | Ronda en que se llena | Mejoras / j | Partidas con mejora | Puntos / j | De objetivos | Gana Difícil / Normal |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const n of [2, 3, 4]) {
    const L = N.filter((p) => p.jugadores === n);
    if (!L.length) continue;
    const A = L.flatMap((p) => p.asientos);
    const llenos = A.filter((a) => a.rondaLleno !== null);
    const tot = media(A.map((a) => a.total));
    const vic = { normal: [], dificil: [] };
    for (const p of L) {
      const v = victorias(p.asientos.map((a) => a.total));
      p.asientos.forEach((a, i) => vic[a.nivel]?.push(v[i]));
    }
    console.log(
      `| ${n} | ${L.length} | ${f1(media(L.map((p) => p.rondas)))} | ${pc(media(L.map((p) => +p.finPorRopa)))} | ${pc(media(L.map((p) => +(p.rondaBolsaVacia !== null))))} | ${pc(llenos.length / A.length)} | ${f1(media(llenos.map((a) => a.rondaLleno)))} | ${f1(media(A.map((a) => a.mejoras + a.cambios)))} | ${pc(media(L.map((p) => +p.asientos.some((a) => a.mejoras + a.cambios > 0))))} | ${f1(tot)} | ${pc(media(A.map((a) => a.total - a.partida)) / tot)} | ${pc(media(vic.dificil))} / ${pc(media(vic.normal))} |`,
    );
  }
  // Puntos de cada objetivo en el reparto normal (todos los que lo tienen, común o secreto).
  console.log("\n| Objetivo | Pts medios (común o secreto) 2 · 3 · 4 j |");
  console.log("|---|---|");
  for (const o of objetivos) {
    const xs = [2, 3, 4].map((n) => media(N.filter((p) => p.jugadores === n).flatMap((p) => p.asientos.filter((a) => o.id in a.objetivos).map((a) => a.objetivos[o.id]))));
    console.log(`| ${o.nombre} | ${xs.map(f1).join(" · ")} |`);
  }
}

if (pf) {
  const F = leer(pf);
  console.log(`\n| Objetivo | Ritmo | Pts de quien lo lleva de secreto 2 · 3 · 4 j | Gana con él 2 · 3 · 4 j (justo 50 · 33 · 25) | Desvío medio |${archivoRitmos ? " Ritmo nuevo | Pts nuevo | Gana nuevo | Desvío nuevo |" : ""}`);
  console.log(`|---|---|---|---|---|${archivoRitmos ? "---|---|---|---|" : ""}`);
  for (const o of objetivos) {
    const fila = (cada, puntos) => {
      const pts = [], gana = [], desv = [];
      for (const n of [2, 3, 4]) {
        const L = F.filter((p) => p.jugadores === n && p.forzado?.objetivo === o.id);
        const ps = [], vs = [];
        for (const p of L) {
          const s = p.forzado.asiento;
          const a = p.asientos[s];
          const nuevo = Math.floor(a.cantidades[o.id] / cada) * puntos;
          const totales = p.asientos.map((b, i) => (i === s ? b.total - (b.objetivos[o.id] ?? 0) + nuevo : b.total));
          ps.push(nuevo);
          vs.push(victorias(totales)[s]);
        }
        pts.push(media(ps));
        gana.push(media(vs));
        desv.push(media(vs) - 1 / n);
      }
      return [`${cada} → ${puntos}`, pts.map(f1).join(" · "), gana.map(pc).join(" · "), `${media(desv) >= 0 ? "+" : ""}${Math.round(100 * media(desv))} pp`];
    };
    const antes = fila(o.cada, o.puntos);
    const r = ritmos[o.id];
    const despues = archivoRitmos ? (r ? fila(r[0], r[1]) : ["igual", "", "", ""]) : [];
    console.log(`| ${o.nombre} | ${[...antes, ...despues].join(" | ")} |`);
  }
}

// Uso de cada carta de acción en las partidas con reparto normal (veces por jugador y partida, y partidas en que sale).
if (pn) {
  const N = leer(pn);
  if (N.length && N[0].asientos[0].usoAcciones) {
    // «:cambio» solo tiene sentido en las de mover prendas (intercambio de dos prendas).
    const ids = [...new Set(N.flatMap((p) => p.asientos.flatMap((a) => Object.keys(a.usoAcciones))))].filter((id) => !/^(cambiar-cuerdas|mover-cuerda):cambio$/.test(id)).sort();
    // «Gana si la juega / si no»: victorias, frente a lo justo (1/n), de quien la jugó alguna vez y de quien no.
    // Orientativo: quien juega más turnos o va por delante también juega más cartas.
    console.log("\n| Carta | Por jugador 2 · 3 · 4 j | Partidas en que se juega 2 · 3 · 4 j | Gana si la juega / si no (pp frente a lo justo) |");
    console.log("|---|---|---|---|");
    const pp = (x) => `${x >= 0 ? "+" : ""}${Math.round(100 * x)}`;
    for (const id of ids) {
      const por = [2, 3, 4].map((n) => media(N.filter((p) => p.jugadores === n).flatMap((p) => p.asientos.map((a) => a.usoAcciones[id] ?? 0))));
      const en = [2, 3, 4].map((n) => media(N.filter((p) => p.jugadores === n).map((p) => +p.asientos.some((a) => (a.usoAcciones[id] ?? 0) > 0))));
      const gana = (juega) =>
        media(N.flatMap((p) => {
          const v = victorias(p.asientos.map((a) => a.total));
          return p.asientos.flatMap((a, i) => (((a.usoAcciones[id] ?? 0) > 0) === juega ? [v[i] - 1 / p.jugadores] : []));
        }));
      console.log(`| ${id} | ${por.map((x) => x.toFixed(2).replace(".", ",")).join(" · ")} | ${en.map(pc).join(" · ")} | ${pp(gana(true))} / ${pp(gana(false))} |`);
    }
  }
}
