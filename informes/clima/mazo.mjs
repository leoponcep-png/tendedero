// Modelo del mazo del día: baraja, roba y descarta igual que el motor (estado/ronda.ts), sin jugar la partida.
// Como el mazo del día no depende de cómo se juega, basta con saber cuántas rondas dura la partida.
// Uso (desde la raíz): node informes/clima/mazo.mjs [rondas=5] [partidas=200000] [variantes.json]
//   variantes.json: { "nombre": { "id-carta": { "copias": n, "dias": d }, ... }, ... } (cambios sobre data/dia.json)
import { readFileSync } from "node:fs";

const [rondasTxt = "5", partidasTxt = "200000", archivoVariantes] = process.argv.slice(2);
const listaRondas = rondasTxt.split(",").map(Number);
const partidas = Number(partidasTxt);
const cartas = JSON.parse(readFileSync("data/dia.json", "utf8")).cartas;
const variantes = { actual: {}, ...(archivoVariantes ? JSON.parse(readFileSync(archivoVariantes, "utf8")) : {}) };

// Familias que se perciben igual en la mesa (una carta puede estar en varias: «tira ropa» se solapa con las demás).
const GRUPOS = {
  sol: ["soleado", "racha-de-sol", "ola-de-calor"],
  lluvia: ["chaparron", "lluvia", "tormenta-repentina"],
  viento: ["viento", "viento-traicionero"],
  otros: ["vecina-sacude-alfombra", "pinzas-viejas", "ropa-se-engancha"],
  "tira ropa": ["viento", "viento-traicionero", "pinzas-viejas"],
};
const gruposDe = (id) => Object.keys(GRUPOS).filter((g) => GRUPOS[g].includes(id));

function barajar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function simular(defs, rondas) {
  const dias = Object.fromEntries(defs.map((c) => [c.id, c.dias]));
  const sale = {}, rondasCon = {}, alMenosUna = {}, famRondas = {}, famAlMenos = {}, famDos = {};
  let robos = 0;
  for (let g = 0; g < partidas; g++) {
    let mazo = defs.flatMap((c) => Array(c.copias).fill(c.id));
    barajar(mazo);
    let descarte = [];
    let actual = null, desde = 0;
    const vistas = new Set();
    const famVeces = {};
    for (let r = 1; r <= rondas; r++) {
      if (actual && dias[actual] - (r - desde) <= 0) {
        descarte.push(actual);
        actual = null;
      }
      if (!actual) {
        if (mazo.length === 0) {
          mazo = descarte;
          descarte = [];
          barajar(mazo);
        }
        actual = mazo.pop();
        desde = r;
        sale[actual] = (sale[actual] ?? 0) + 1;
        for (const f of gruposDe(actual)) famVeces[f] = (famVeces[f] ?? 0) + 1;
        robos++;
        vistas.add(actual);
      }
      rondasCon[actual] = (rondasCon[actual] ?? 0) + 1;
      for (const f of gruposDe(actual)) famRondas[f] = (famRondas[f] ?? 0) + 1;
    }
    for (const id of vistas) alMenosUna[id] = (alMenosUna[id] ?? 0) + 1;
    for (const f of new Set([...vistas].flatMap(gruposDe))) famAlMenos[f] = (famAlMenos[f] ?? 0) + 1;
    for (const [f, v] of Object.entries(famVeces)) if (v >= 2) famDos[f] = (famDos[f] ?? 0) + 1;
  }
  const pct = (x) => ((100 * (x ?? 0)) / partidas).toFixed(1);
  const totalRondas = partidas * rondas;
  return {
    cartas: defs.map((c) => ({
      id: c.id, copias: c.copias, dias: c.dias,
      robos: ((100 * (sale[c.id] ?? 0)) / robos).toFixed(1),
      rondas: ((100 * (rondasCon[c.id] ?? 0)) / totalRondas).toFixed(1),
      alMenosUna: pct(alMenosUna[c.id]),
    })),
    familias: Object.keys(GRUPOS).map((f) => ({
      familia: f,
      rondas: ((100 * (famRondas[f] ?? 0)) / totalRondas).toFixed(1),
      alMenosUna: pct(famAlMenos[f]),
      dosOMas: pct(famDos[f]),
    })),
    robosPorPartida: (robos / partidas).toFixed(2),
  };
}

for (const [nombre, cambios] of Object.entries(variantes)) {
  const defs = cartas
    .filter((c) => c.estado === "definida")
    .map((c) => ({ id: c.id, copias: cambios[c.id]?.copias ?? c.copias, dias: cambios[c.id]?.dias ?? c.parametros?.dias ?? 1 }))
    .filter((c) => c.copias > 0);
  for (const rondas of listaRondas) {
    const r = simular(defs, rondas);
    console.log(`\n## ${nombre} · ${rondas} rondas · ${partidas} partidas · ${r.robosPorPartida} cartas robadas por partida`);
    console.log("| Carta | Copias | Días | % de cartas robadas | % de rondas | Sale al menos una vez |");
    console.log("|---|---|---|---|---|---|");
    for (const c of r.cartas) console.log(`| ${c.id} | ${c.copias} | ${c.dias} | ${c.robos} % | ${c.rondas} % | ${c.alMenosUna} % |`);
    console.log("\n| Familia | % de rondas | Sale al menos una vez | Sale 2 o más veces |");
    console.log("|---|---|---|---|");
    for (const f of r.familias) console.log(`| ${f.familia} | ${f.rondas} % | ${f.alMenosUna} % | ${f.dosOMas} % |`);
  }
}
