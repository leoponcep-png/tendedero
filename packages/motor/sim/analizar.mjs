// Lee los resultados de las partidas de bots (líneas JSON) y escribe un informe en Markdown.
// Uso: node analizar.mjs <carpeta con salida-*.jsonl> <informe.md> [conclusiones.md, que va delante de las tablas]

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , carpeta, destino = "informe-bots.md", conclusiones] = process.argv;
const partidas = readdirSync(carpeta)
  .filter((f) => f.startsWith("salida-") && f.endsWith(".jsonl"))
  .flatMap((f) => readFileSync(join(carpeta, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));

// ---------- Tiempo de personas ----------
// Supuestos (segundos): lo que tarda una mesa de personas que ya conoce las reglas.
const T = {
  preparar: 6 * 60, // repartir, barajar, elegir objetivo secreto
  draft: 15, // coger un color o un tipo de una cesta o del centro
  turno: 20, // empezar y terminar el turno, robar y elegir el reparto del robo
  jugada: 10, // colgar una prenda o colocar/mejorar una cuerda
  accion: 15, // de más por leer y resolver una carta de acción
  ronda: 45, // carta del día, rellenar cestas, devolver el centro a la bolsa
  prendaAlSecar: 3, // bajar la humedad de cada prenda colgada al acabar la ronda
  recuento: 3 * 60, // contar objetivos al final
};
function minutos(s) {
  const t = s.tiempo;
  const seg =
    T.preparar + t.drafts * T.draft + t.turnos * T.turno + t.jugadas * T.jugada + t.accionesJugadas * T.accion + s.rondas * T.ronda + t.prendasAlSecar * T.prendaAlSecar + T.recuento;
  return seg / 60;
}

// ---------- Utilidades ----------
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (x) => `${(100 * x).toFixed(0)} %`;
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "—");
const cuantil = (xs, q) => {
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(q * o.length))];
};
const agrupar = (xs, clave) => xs.reduce((m, x) => ((m[clave(x)] ??= []).push(x), m), {});
/** Victorias por asiento; un empate en el primer puesto reparte la victoria. */
function victoriasPorAsiento(g, n) {
  const v = Array(n).fill(0);
  for (const s of g) {
    const ganadores = s.puestos.map((p, i) => (p === 1 ? i : -1)).filter((i) => i >= 0);
    for (const i of ganadores) v[i] += 1 / ganadores.length;
  }
  return v.map((x) => x / g.length);
}
function resumen(g) {
  const n = g[0].jugadores;
  const totales = g.flatMap((s) => s.totales);
  const obj = g.flatMap((s) => s.objetivos);
  const margen = g.map((s) => {
    const o = [...s.totales].sort((a, b) => b - a);
    return o[0] - o[1];
  });
  const llegaYGana = g.filter((s) => s.primeroEnLlegar !== null).map((s) => s.puestos[s.primeroEnLlegar] === 1);
  return {
    n,
    partidas: g.length,
    abortadas: g.filter((s) => s.abortada).length,
    rondas: media(g.map((s) => s.rondas)),
    rondasMin: Math.min(...g.map((s) => s.rondas)),
    rondasMax: Math.max(...g.map((s) => s.rondas)),
    minutos: media(g.map(minutos)),
    minutosP10: cuantil(g.map(minutos), 0.1),
    minutosP90: cuantil(g.map(minutos), 0.9),
    asientos: victoriasPorAsiento(g, n),
    total: media(totales),
    partePorObjetivos: media(obj) / media(totales),
    margen: media(margen),
    empates: g.filter((s) => s.puestos.filter((p) => p === 1).length > 1).length / g.length,
    llegaYGana: media(llegaYGana.map(Number)),
    remontadas: media(g.map((s) => {
      // Ganó alguien que iba por detrás en puntos de partida (antes de contar objetivos).
      const lider = s.partida.indexOf(Math.max(...s.partida));
      return s.puestos[lider] !== 1 ? 1 : 0;
    })),
  };
}

const sinAbortar = partidas.filter((s) => !s.abortada && s.puestos.length);
const porConfig = agrupar(sinAbortar, (s) => s.config);
const lineas = [];
const L = (x = "") => lineas.push(x);

L("# Informe de partidas con bots");
L();
L(`Partidas jugadas: **${partidas.length}** (${partidas.filter((s) => s.abortada).length} abortadas por pasar de 60 rondas).`);
for (const n of [2, 3, 4]) L(`- ${n} jugadores: ${partidas.filter((s) => s.jugadores === n).length}`);
L();
L("Los bots juegan con una valoración sencilla: en cada paso prueban todas las jugadas válidas y se quedan con la que mejor deja la mesa para ellos frente al mejor rival. No planifican a varios turnos ni ven la mano del rival. Juegan razonablemente, pero peor que una persona con experiencia: las conclusiones sobre equilibrio valen más que las cifras exactas.");
L();
L("**Cómo se calcula el tiempo de personas.** A partir de lo que pasa en cada partida (repartos, turnos, prendas colgadas, cartas jugadas y prendas a las que bajar la humedad) con estos tiempos, para una mesa que ya conoce las reglas:");
L(`preparar ${T.preparar / 60} min · cada cogida en el reparto ${T.draft} s · cada turno ${T.turno} s · cada prenda o cuerda ${T.jugada} s · cada acción ${T.accion} s más · cada ronda ${T.ronda} s (carta del día, cestas) · cada prenda al secar ${T.prendaAlSecar} s · recuento final ${T.recuento / 60} min.`);
L("La primera partida, explicando reglas, dura bastante más.");
L();

// ---------- Configuración actual ----------
L("## Las reglas actuales (calcetín 1, camiseta 3, toalla 6 · objetivos como están · final a 30)");
L();
L("| Jugadores | Partidas | Rondas (mín–máx) | Minutos (rango habitual) | Puntos medios | % por objetivos | Diferencia 1.º–2.º | Empates |");
L("|---|---|---|---|---|---|---|---|");
const actuales = [2, 3, 4].map((n) => sinAbortar.filter((s) => s.jugadores === n && s.config === `n${n}-A-x1-u30`)).filter((g) => g.length);
for (const g of actuales) {
  const r = resumen(g);
  L(`| ${r.n} | ${r.partidas} | ${f1(r.rondas)} (${r.rondasMin}–${r.rondasMax}) | ${Math.round(r.minutos)} (${Math.round(r.minutosP10)}–${Math.round(r.minutosP90)}) | ${f1(r.total)} | ${pct(r.partePorObjetivos)} | ${f1(r.margen)} | ${pct(r.empates)} |`);
}
L();
L("### ¿Tiene ventaja el que empieza?");
L();
L("Porcentaje de victorias según el asiento (asiento 1 = quien abre la primera ronda). Si no hubiera ventaja, cada asiento ganaría 1 de cada n partidas.");
L();
L("| Jugadores | Esperado | " + [1, 2, 3, 4].map((k) => `Asiento ${k}`).join(" | ") + " |");
L("|---|---|---|---|---|---|");
for (const g of actuales) {
  const r = resumen(g);
  const celdas = [0, 1, 2, 3].map((k) => (k < r.n ? pct(r.asientos[k]) : "—"));
  L(`| ${r.n} | ${pct(1 / r.n)} | ${celdas.join(" | ")} |`);
}
L();
L("Con pocas partidas, diferencias de unos 5 puntos porcentuales pueden ser azar. Con 200 partidas por número de jugadores, el margen de error es de unos ±7 puntos a 2 jugadores y ±6 a 4.");
L();
L("| Jugadores | El primero en llegar al umbral gana | Gana quien no iba primero antes de contar objetivos |");
L("|---|---|---|");
for (const g of actuales) {
  const r = resumen(g);
  L(`| ${r.n} | ${pct(r.llegaYGana)} | ${pct(r.remontadas)} |`);
}
L();

// Cartas y mecánicas
L("### Qué se juega");
L();
L("| Jugadores | Acciones por partida | Turnos con una vieja en la mano | Viejas puestas al rival | Mejoras | Trofeos | Anulaciones | Prendas perdidas | Descartes | Robo 2/1/0 cuerdas |");
L("|---|---|---|---|---|---|---|---|---|---|");
for (const g of actuales) {
  const sum = (f) => media(g.map(f));
  const robo = [2, 1, 0].map((c) => g.reduce((t, s) => t + (s.robo[c] ?? 0), 0));
  const tot = robo.reduce((a, b) => a + b, 0);
  L(`| ${g[0].jugadores} | ${f1(sum((s) => Object.values(s.acciones).reduce((a, b) => a + b, 0)))} | ${f1(sum((s) => s.turnosConVieja ?? 0))} | ${f1(sum((s) => s.viejasAlRival))} | ${f1(sum((s) => s.mejoras))} | ${f1(sum((s) => s.trofeos))} | ${f1(sum((s) => s.anuladas))} | ${f1(sum((s) => s.perdidas))} | ${f1(sum((s) => s.descartes))} | ${robo.map((x) => pct(x / tot)).join(" / ")} |`);
}
L();
const acciones = {};
for (const g of actuales) for (const s of g) for (const [k, c] of Object.entries(s.acciones)) acciones[k] = (acciones[k] ?? 0) + c;
L("Cartas de acción jugadas (todas las partidas con las reglas actuales): " + Object.entries(acciones).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k} ${c}`).join(", ") + ".");
L();

// Objetivos
L("### Objetivos");
L();
L("Puntos medios que da cada objetivo cuando está en juego (común o secreto), y cuánto gana quien lo tiene de secreto frente a lo esperado.");
L();
function tablaObjetivos(grupo) {
  L("| Objetivo | Veces en juego | Puntos medios | Veces de secreto | Gana con él de secreto |");
  L("|---|---|---|---|---|");
  const ids = [...new Set(grupo.flatMap((s) => Object.keys(s.puntosPorObjetivo)))];
  const filas = ids.map((id) => {
    const pts = grupo.flatMap((s) => s.puntosPorObjetivo[id] ?? []);
    let veces = 0;
    let gana = 0;
    let esperado = 0;
    for (const s of grupo) {
      s.secretos.forEach((sec, i) => {
        if (sec !== id) return;
        veces++;
        esperado += 1 / s.jugadores;
        if (s.puestos[i] === 1) gana++;
      });
    }
    return { id, n: pts.length, media: media(pts), veces, gana: veces ? gana / veces : NaN, esperado: veces ? esperado / veces : NaN };
  });
  for (const r of filas.sort((a, b) => b.media - a.media)) {
    L(`| ${r.id} | ${r.n} | ${f1(r.media)} | ${r.veces} | ${r.veces ? `${pct(r.gana)} (esperado ${pct(r.esperado)})` : "—"} |`);
  }
  L();
}
tablaObjetivos(actuales.flat());

// ---------- Objetivos equilibrados ----------
const equilibrados = [2, 3, 4].map((n) => porConfig[`n${n}-O-equilibrados`]).filter(Boolean);
if (equilibrados.length) {
  L("## Objetivos equilibrados");
  L();
  L("Mismas reglas, pero con el ritmo de los objetivos reajustado para que cada uno dé de media unos 4–5 puntos (ver la propuesta en las conclusiones).");
  L();
  L("| Jugadores | Reglas | Partidas | Rondas | Minutos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas |");
  L("|---|---|---|---|---|---|---|---|---|");
  for (const n of [2, 3, 4]) {
    for (const [id, txt] of [[`n${n}-A-x1-u30`, "Actuales"], [`n${n}-O-equilibrados`, "Objetivos equilibrados"], [`n${n}-O-equilibrados-inverso`, "Equilibrados + reparto inverso"]]) {
      const g = porConfig[id];
      if (!g) continue;
      const r = resumen(g);
      L(`| ${n} | ${txt} | ${r.partidas} | ${f1(r.rondas)} | ${Math.round(r.minutos)} | ${pct(r.partePorObjetivos)} | ${f1(r.margen)} | ${r.asientos.map((x) => (100 * x).toFixed(0)).join(" / ")} | ${pct(r.remontadas)} |`);
    }
  }
  L();
  tablaObjetivos(equilibrados.flat());
}

// ---------- Barrido ----------
const PRENDAS = { A: "1 / 3 / 6", B: "1 / 2 / 4", C: "1 / 3 / 5", D: "2 / 3 / 5", E: "1 / 2 / 3" };
L("## Variantes de puntuación");
L();
L("Puntos de calcetín / camiseta / toalla, multiplicador de los puntos de los objetivos (×0,5, ×1, ×1,5) y umbral de final. «Ventaja asiento 1» es cuánto gana de más (o de menos) quien abre la primera ronda frente a lo esperado.");
L();
for (const n of [2, 3, 4]) {
  L(`### ${n} jugadores`);
  L();
  L("| Prendas | Objetivos | Final a | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Ventaja asiento 1 | Remontadas |");
  L("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const [k, txt] of Object.entries(PRENDAS)) {
    for (const m of [0.5, 1, 1.5]) {
      for (const u of [30, 40, 50]) {
        const g = porConfig[`n${n}-${k}-x${m}-u${u}`];
        if (!g) continue;
        const r = resumen(g);
        const ventaja = r.asientos[0] - 1 / n;
        L(`| ${txt} | ×${String(m).replace(".", ",")} | ${u} | ${r.partidas} | ${f1(r.rondas)} | ${Math.round(r.minutos)} | ${f1(r.total)} | ${pct(r.partePorObjetivos)} | ${f1(r.margen)} | ${ventaja >= 0 ? "+" : ""}${(100 * ventaja).toFixed(0)} | ${pct(r.remontadas)} |`);
      }
    }
  }
  L();
}

// ---------- Sistemas de robo, mano y cestas ----------
const SISTEMAS = {
  "": "Reglas actuales (robo 3 a elegir, máx. 2 cuerdas · mano 6 · 4 cestas, se rellenan las usadas)",
  robo2: "Robo 2 a elegir (máx. 2 cuerdas)",
  robo4: "Robo 4 a elegir (máx. 2 cuerdas)",
  "robo4-c3": "Robo 4 a elegir (máx. 3 cuerdas)",
  "robo3-c3": "Robo 3 a elegir (máx. 3 cuerdas)",
  "robo-fijo": "Robo fijo 1 cuerda + 2 acciones (antes)",
  mano5: "Mano de 5",
  mano7: "Mano de 7",
  "cestas-antiguas": "Cestas de antes (5/7/9 según jugadores, se renuevan todas)",
  "cestas4-todas": "4 cestas que se renuevan todas",
  "cestas-antiguas-usadas": "5/7/9 cestas, se rellenan solo las usadas",
  "todo-antiguo": "Todo como antes (robo fijo, mano 5, cestas 5/7/9 renovando todas)",
  "reparto-inverso": "Reparto inverso: en el reparto coge primero quien juega el último",
};
if (Object.keys(porConfig).some((id) => id.includes("-S-"))) {
  L("## Sistemas de robo, mano y cestas");
  L();
  L("Todas con la puntuación actual (1 / 3 / 6, objetivos ×1, final a 30). Solo cambia lo que dice cada fila.");
  L();
  for (const n of [2, 3, 4]) {
    L(`### ${n} jugadores`);
    L();
    L("| Sistema | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas | Acciones por partida | Descartes |");
    L("|---|---|---|---|---|---|---|---|---|---|---|");
    for (const [k, txt] of Object.entries(SISTEMAS)) {
      const g = porConfig[k ? `n${n}-S-${k}` : `n${n}-A-x1-u30`];
      if (!g) continue;
      const r = resumen(g);
      const acc = media(g.map((s) => Object.values(s.acciones).reduce((a, b) => a + b, 0)));
      L(`| ${txt} | ${r.partidas} | ${f1(r.rondas)} | ${Math.round(r.minutos)} | ${f1(r.total)} | ${pct(r.partePorObjetivos)} | ${f1(r.margen)} | ${r.asientos.map((x) => (100 * x).toFixed(0)).join(" / ")} | ${pct(r.remontadas)} | ${f1(acc)} | ${f1(media(g.map((s) => s.descartes)))} |`);
    }
    L();
  }
}

// ---------- Combinaciones candidatas ----------
const CANDIDATAS = {
  "A-x1-u30": "Reglas actuales",
  "O-equilibrados-inverso": "Objetivos equilibrados + reparto inverso (la base de las candidatas)",
  "C-robo2": "Base + robo de 2",
  "C-u40": "Base + final a 40",
  "C-124-u30": "Base + prendas 1/2/4",
  "C-135-u40": "Base + prendas 1/3/5 + final a 40",
  "C-124-u40": "Base + prendas 1/2/4 + final a 40",
  "C-vieja1": "Base + la cuerda vieja se rompe al acabar la ronda en que se pone",
  "C-r2-u40": "Base + robo de 2 + final a 40",
  "C-r2-135-u40": "Base + robo de 2 + prendas 1/3/5 + final a 40",
  "C-r2-vieja1": "Base + robo de 2 + vieja de 1 ronda",
  "C-r2-vieja1-u40": "Base + robo de 2 + vieja de 1 ronda + final a 40",
  "R-recomendada": "Recomendada: base + robo de 2 + A toda prisa cada 2 → 3",
  "R-afinada": "Afinada: la recomendada + Cuerdas llenas 1 → 2, Parejas 1 → 7, Variedad 2 → 3",
};
if (Object.keys(porConfig).some((id) => id.includes("-C-"))) {
  L("## Combinaciones candidatas");
  L();
  L("Todas llevan los objetivos equilibrados y el reparto inverso, salvo la primera fila (las reglas actuales, para comparar).");
  L();
  L("| Jugadores | Reglas | Partidas | Rondas (mín–máx) | Minutos (rango habitual) | Puntos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas | Acciones | Descartes | Viejas al rival | Trofeos |");
  L("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const n of [2, 3, 4]) {
    for (const [k, txt] of Object.entries(CANDIDATAS)) {
      const g = porConfig[`n${n}-${k}`];
      if (!g) continue;
      const r = resumen(g);
      const acc = media(g.map((s) => Object.values(s.acciones).reduce((a, b) => a + b, 0)));
      L(`| ${n} | ${txt} | ${r.partidas} | ${f1(r.rondas)} (${r.rondasMin}–${r.rondasMax}) | ${Math.round(r.minutos)} (${Math.round(r.minutosP10)}–${Math.round(r.minutosP90)}) | ${f1(r.total)} | ${pct(r.partePorObjetivos)} | ${f1(r.margen)} | ${r.asientos.map((x) => (100 * x).toFixed(0)).join(" / ")} | ${pct(r.remontadas)} | ${f1(acc)} | ${f1(media(g.map((s) => s.descartes)))} | ${f1(media(g.map((s) => s.viejasAlRival)))} | ${f1(media(g.map((s) => s.trofeos)))} |`);
    }
  }
  L();
}

const afinada = [2, 3, 4].map((n) => porConfig[`n${n}-R-afinada`]).filter(Boolean);
if (afinada.length) {
  L("## Objetivos con las reglas afinadas");
  L();
  tablaObjetivos(afinada.flat());
}
const recomendada = [2, 3, 4].map((n) => porConfig[`n${n}-R-recomendada`]).filter(Boolean);
if (recomendada.length) {
  L("## Objetivos con las reglas recomendadas");
  L();
  tablaObjetivos(recomendada.flat());
}

// ---------- Orden del reparto según cómo atacan los bots ----------
if (Object.keys(porConfig).some((id) => id.includes("-X-"))) {
  L("## Orden del reparto según a quién atacan los bots");
  L();
  L("Con las reglas actuales del juego (vieja gratis, objetivos compensados, robo de 3). «Atacan al que va mejor»: cada bot se compara con el rival que va mejor y le lanza a él los fastidios. «Reparten los ataques»: se compara con la media de los rivales, así que le da igual a quién atacar.");
  L();
  L("| Jugadores | Reparto | Bots | Partidas | Victorias por asiento | Minutos | Viejas al rival | Regalo: puntos | Cuerdas llenas: puntos |");
  L("|---|---|---|---|---|---|---|---|---|");
  for (const n of [2, 3, 4]) {
    for (const rep of ["normal", "inverso", "final"]) {
      for (const riv of ["mejor", "media"]) {
        const g = porConfig[`n${n}-X-${rep}-${riv}`];
        if (!g) continue;
        const r = resumen(g);
        const pts = (id) => f1(media(g.flatMap((s) => s.puntosPorObjetivo[id] ?? [])));
        L(`| ${n} | ${{ normal: "Orden de los turnos", inverso: "Al revés", final: "Reglas finales (orden de los turnos)" }[rep]} | ${riv === "mejor" ? "Atacan al que va mejor" : "Reparten los ataques"} | ${r.partidas} | ${r.asientos.map((x) => (100 * x).toFixed(0)).join(" / ")} | ${Math.round(r.minutos)} | ${f1(media(g.map((s) => s.viejasAlRival)))} | ${pts("regalo-envenenado")} | ${pts("cuerdas-llenas")} |`);
      }
    }
  }
  L();
  const actuales = Object.entries(porConfig).filter(([id]) => id.includes("-X-final-mejor")).flatMap(([, g]) => g);
  if (actuales.length) {
    L("### Objetivos con las reglas finales");
    L();
    tablaObjetivos(actuales);
  }
}

// ---------- Opciones para la cuerda vieja ----------
const VIEJA = {
  "R-afinada": "Reglas afinadas (sin cambios en la vieja)",
  "V-gratis": "La vieja al rival no gasta tu cuerda del turno",
  "V-cuenta": "Regalo envenenado cuenta viejas colocadas (no solo rotas)",
  "V-gratis-cuenta": "Las dos cosas a la vez",
  "V-gratis-1ronda": "Gratis y se rompe al acabar la ronda en que se pone",
};
if (Object.keys(porConfig).some((id) => id.includes("-V-"))) {
  L("## Opciones para la cuerda vieja");
  L();
  L("Sobre las reglas afinadas. «Regalo: puntos» es lo que da de media Regalo envenenado cuando está en juego; «gana de secreto», cuánto gana quien lo tiene de secreto (lo justo es 1 entre el número de jugadores).");
  L();
  L("| Jugadores | Opción | Partidas | Minutos | Viejas al rival | Mejoradas por el rival | Trofeos | Prendas perdidas | Regalo: puntos | Regalo: gana de secreto | Victorias por asiento |");
  L("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const n of [2, 3, 4]) {
    for (const [k, txt] of Object.entries(VIEJA)) {
      const g = porConfig[`n${n}-${k}`];
      if (!g) continue;
      const r = resumen(g);
      const pts = g.flatMap((s) => s.puntosPorObjetivo["regalo-envenenado"] ?? []);
      let veces = 0;
      let gana = 0;
      for (const s of g) s.secretos.forEach((x, i) => { if (x === "regalo-envenenado") { veces++; if (s.puestos[i] === 1) gana++; } });
      L(`| ${n} | ${txt} | ${r.partidas} | ${Math.round(r.minutos)} | ${f1(media(g.map((s) => s.viejasAlRival)))} | ${f1(media(g.map((s) => s.viejasMejoradas ?? 0)))} | ${f1(media(g.map((s) => s.trofeos)))} | ${f1(media(g.map((s) => s.perdidas)))} | ${f1(media(pts))} | ${veces ? `${pct(gana / veces)} de ${veces}` : "—"} | ${r.asientos.map((x) => (100 * x).toFixed(0)).join(" / ")} |`);
    }
  }
  L();
}

// ---------- Duración con las reglas recomendadas ----------
if (Object.keys(porConfig).some((id) => id.includes("-D-"))) {
  L("## Duración según el final y los puntos de las prendas (reglas recomendadas)");
  L();
  L("Reglas recomendadas (objetivos reajustados, reparto inverso, robo de 2). Cada casilla: minutos de personas (rondas). 200 partidas por casilla.");
  L();
  for (const [k, txt] of [["136", "1 / 3 / 6"], ["135", "1 / 3 / 5"], ["124", "1 / 2 / 4"]]) {
    L(`### Prendas ${txt}`);
    L();
    L("| Jugadores | Final a 30 | 35 | 40 | 45 | 50 |");
    L("|---|---|---|---|---|---|");
    for (const n of [2, 3, 4]) {
      const celdas = [30, 35, 40, 45, 50].map((u) => {
        const g = porConfig[`n${n}-D-${k}-u${u}`];
        if (!g) return "—";
        const r = resumen(g);
        return `${Math.round(r.minutos)} min (${f1(r.rondas)}) · objetivos ${pct(r.partePorObjetivos)}`;
      });
      L(`| ${n} | ${celdas.join(" | ")} |`);
    }
    L();
  }
}

const delante = conclusiones ? readFileSync(conclusiones, "utf8").trimEnd() + "\n\n---\n\n" : "";
writeFileSync(destino, delante + lineas.join("\n") + "\n");
console.log(`Informe con ${partidas.length} partidas en ${destino}`);
