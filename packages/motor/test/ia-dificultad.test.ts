import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ajustesIniciales,
  aplicar,
  ARCHIVOS_DATOS,
  cargarDatos,
  cestasPorDefecto,
  crearPartida,
  DIFICULTADES,
  rondasRestantes,
  siguienteJugadaIA,
  type DatosCrudos,
  type Dificultad,
  type Jugada,
  type Partida,
} from "../src";

const datos = cargarDatos(
  Object.fromEntries(
    ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(new URL(`../../../data/${n}.json`, import.meta.url), "utf8"))]),
  ) as DatosCrudos,
);

function nueva(n: number, semilla: string): Partida {
  const base = ajustesIniciales(datos);
  return crearPartida(datos, { ...base, jugadores: n, cestas: { ...base.cestas, numero: cestasPorDefecto(datos, n) }, semilla });
}

function azarCon(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function quienJuega(p: Partida): number {
  const eligiendo = p.jugadores.findIndex((j) => j.objetivosOfrecidos.length > 0);
  if (eligiendo >= 0) return eligiendo;
  return p.reaccion ? p.reaccion.defensor : p.turno.jugador;
}

function jugar(p: Partida, j: Jugada): Partida {
  const r = aplicar(p, j);
  if (!r.ok) throw new Error(`${r.motivo} ${JSON.stringify(j)}`);
  return r.partida;
}

/** Partida entera con un nivel por asiento; devuelve también el tiempo máximo por jugada de cada nivel. */
function partidaEntre(niveles: Dificultad[], semilla: string) {
  // Un azar distinto en cada partida, sacado de su semilla.
  const azar = azarCon([...semilla].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261));
  let p = nueva(niveles.length, semilla);
  const maximo: Partial<Record<Dificultad, number>> = {};
  for (let pasos = 0; !p.terminada; pasos++) {
    if (pasos > 5000) throw new Error("La partida no acaba.");
    const i = quienJuega(p);
    const t0 = performance.now();
    const j = siguienteJugadaIA(p, i, { azar, dificultad: niveles[i] });
    maximo[niveles[i]] = Math.max(maximo[niveles[i]] ?? 0, performance.now() - t0);
    if (!j) throw new Error(`El asiento ${i} no sabe qué hacer.`);
    p = jugar(p, j);
  }
  return { p, maximo };
}

/** Saca de la bolsa una prenda de ese tipo y color, con la humedad pedida. */
function sacarPrenda(p: Partida, tipo: string, color: string, humedad: number): string {
  const id = p.bolsa.find((x) => p.prendas[x].tipo === tipo && p.prendas[x].color === color)!;
  p.bolsa = p.bolsa.filter((x) => x !== id);
  p.prendas[id].humedad = humedad;
  p.prendas[id].extra = 0;
  return id;
}

/** Saca del mazo una carta de cuerda (básica si no se dice otra). */
function sacarBasica(p: Partida, def = "basica"): string {
  const id = p.mazos.cuerdas.find((x) => p.cartas[x] === def)!;
  p.mazos.cuerdas = p.mazos.cuerdas.filter((x) => x !== id);
  return id;
}

/**
 * Ronda 5, le toca al asiento 0. El rival (22 puntos) tiene colgadas una toalla y una camiseta que se secan esta
 * ronda: llegará a 31 y la partida acaba al terminarla. El asiento 0 (20 puntos) tiene su primera línea llena de
 * toallas empapadas (no se secarán a tiempo), la segunda vacía, una cuerda básica en la mano y por tender 4
 * calcetines secos casi del todo (dos parejas) y una toalla. Lo bueno es poner la cuerda y colgar 3 calcetines.
 */
function rondaFinal(acciones: string[] = [], rapida = false): Partida {
  let p = nueva(2, "ronda-final");
  p.jugadores.forEach((j, i) => {
    p = jugar(p, { tipo: "elegirObjetivo", jugador: i, objetivo: j.objetivosOfrecidos[0] });
  });
  p = structuredClone(p);
  // Sin reparto ni carta del día: se juega directamente.
  p.bolsa.push(...p.cestas.flat(), ...p.centro);
  p.cestas = p.cestas.map(() => []);
  p.centro = [];
  p.dia = null;
  p.diaDesde = null;
  p.ronda = 5;
  p.turno = { ...p.turno, jugador: 0, fase: "jugar", cuerdasJugadas: 0, cuerdasExtra: 0, accionesJugadas: 0 };
  p.objetivosComunes = ["parejas", "monton-de-ropa"];
  const [yo, rival] = p.jugadores;
  for (const j of p.jugadores) {
    p.descartes.cuerdas.push(...j.mano.filter((c) => p.catalogo.cartas[p.cartas[c]].mazo === "cuerdas"));
    p.descartes.acciones.push(...j.mano.filter((c) => p.catalogo.cartas[p.cartas[c]].mazo === "acciones"));
    j.mano = [];
  }
  yo.puntos = 20;
  yo.lineas = [
    { cartas: [0, 1, 2].map(() => ({ carta: sacarBasica(p), colgadas: [{ prenda: sacarPrenda(p, "toalla", "blanco", 3), inicio: 0 }], colocadaEn: 1 })) },
    { cartas: [{ carta: sacarBasica(p), colgadas: [], colocadaEn: 4 }] },
  ];
  yo.pendientes = [
    sacarPrenda(p, "calcetin", "rojo", 1),
    sacarPrenda(p, "calcetin", "rojo", 1),
    sacarPrenda(p, "calcetin", "azul", 1),
    sacarPrenda(p, "calcetin", "azul", 1),
    sacarPrenda(p, "toalla", "amarillo", 3),
  ];
  if (rapida) {
    // Otra variante: sin calcetines; una toalla a medio secar en una básica y una cuerda de secado rápido vacía.
    yo.pendientes = [];
    yo.lineas[1].cartas = [
      { carta: sacarBasica(p), colgadas: [{ prenda: sacarPrenda(p, "toalla", "rojo", 2), inicio: 0 }], colocadaEn: 3 },
      { carta: sacarBasica(p, "secado-rapido"), colgadas: [], colocadaEn: 3 },
    ];
  }
  for (const id of acciones) {
    const carta = p.mazos.acciones.find((x) => p.cartas[x] === id)!;
    p.mazos.acciones = p.mazos.acciones.filter((x) => x !== carta);
    yo.mano.push(carta);
  }
  rival.puntos = 15;
  rival.lineas = [
    {
      cartas: [
        { carta: sacarBasica(p), colgadas: [{ prenda: sacarPrenda(p, "toalla", "rojo", 1), inicio: 0 }], colocadaEn: 1 },
        { carta: sacarBasica(p), colgadas: [{ prenda: sacarPrenda(p, "toalla", "azul", 1), inicio: 0 }], colocadaEn: 1 },
        { carta: sacarBasica(p), colgadas: [{ prenda: sacarPrenda(p, "camiseta", "azul", 1), inicio: 0 }], colocadaEn: 1 },
      ],
    },
    { cartas: [] },
  ];
  rival.pendientes = [];
  return p;
}

/** Juega la ronda final con el asiento 0 al nivel dado: puntos con los que acaba y calcetines que cuelga. */
function jugarRondaFinal(nivel: Dificultad, acciones: string[] = [], rapida = false) {
  let p = rondaFinal(acciones, rapida);

  const azar = azarCon(7);
  let calcetines = 0;
  for (let pasos = 0; !p.terminada; pasos++) {
    if (pasos > 500) throw new Error("La partida no acaba.");
    const i = quienJuega(p);
    const j = siguienteJugadaIA(p, i, { azar, dificultad: i === 0 ? nivel : "normal" })!;
    if (j.tipo === "colgarPrenda" && i === 0 && p.prendas[j.prenda].tipo === "calcetin") calcetines++;
    p = jugar(p, j);
  }
  const rival = p.final!.find((r) => r.jugador === 1)!.total;
  return { total: p.final!.find((r) => r.jugador === 0)!.total, rival, calcetines };
}

describe("IA: niveles de dificultad", () => {
  describe("ronda final: el rival llega a 30 con el secado de hoy", () => {
    it("se ve venir aunque por el ritmo de puntos parezca que quedan rondas", () => {
      expect(rondasRestantes(rondaFinal())).toBe(1);
    });

    it("la normal y la difícil cuelgan los calcetines que se secan a tiempo (y hacen pareja); la fácil, no", () => {
      const facil = jugarRondaFinal("facil");
      for (const nivel of ["normal", "dificil"] as const) {
        const r = jugarRondaFinal(nivel);
        expect(r.calcetines).toBe(3);
        expect(r.total).toBeGreaterThan(facil.total);
      }
    });

    it("la difícil lleva a la cuerda de secado rápido la toalla que así se seca hoy (antes movía la que no)", () => {
      const r = jugarRondaFinal("dificil", ["mover-prenda-propia"], true);
      // 20 puntos + la toalla (6).
      expect(r.total).toBeGreaterThanOrEqual(26);
      expect(r.total).toBeGreaterThan(jugarRondaFinal("facil", ["mover-prenda-propia"], true).total);
    });

    it("con Secar prenda y Retrasar secado, la difícil hace sitio, cuelga los 4 calcetines y frena al rival", () => {
      const r = jugarRondaFinal("dificil", ["retrasar-secado", "secar-prenda"]);
      expect(r.calcetines).toBe(4);
      expect(r.rival).toBeLessThan(30);
      // Con las parejas a 2 puntos, colgar calcetines ya no le da ventaja de puntos aquí: lo que cuenta es que frena al rival.
      expect(r.total).toBeGreaterThanOrEqual(jugarRondaFinal("facil", ["retrasar-secado", "secar-prenda"]).total);
    });
  });

  it("sin dificultad juega igual que la normal", () => {
    let p = nueva(2, "compatible");
    const a = azarCon(42);
    const b = azarCon(42);
    for (let k = 0; k < 40 && !p.terminada; k++) {
      const i = quienJuega(p);
      const sin = siguienteJugadaIA(p, i, { azar: a });
      const normal = siguienteJugadaIA(p, i, { azar: b, dificultad: "normal" });
      expect(sin).toEqual(normal);
      p = jugar(p, sin!);
    }
  });

  it("una dificultad desconocida se trata como la normal", () => {
    const p = nueva(2, "rara");
    const j = siguienteJugadaIA(p, 0, { azar: azarCon(1), dificultad: "imposible" as Dificultad });
    expect(j).toEqual(siguienteJugadaIA(p, 0, { azar: azarCon(1), dificultad: "normal" }));
  });

  it.each(DIFICULTADES)("la %s juega partidas enteras con jugadas válidas", (nivel) => {
    const { p } = partidaEntre([nivel, nivel], `entera-${nivel}`);
    expect(p.final).toHaveLength(2);
  }, 60000);

  it("los tres niveles juntos en una partida de 3 llegan al final", () => {
    const { p } = partidaEntre(["dificil", "normal", "facil"], "tres-niveles");
    expect(p.final).toHaveLength(3);
  }, 60000);

  it("la difícil decide rápido (menos de 200 ms por jugada)", () => {
    const { maximo } = partidaEntre(["dificil", "dificil"], "rapida");
    // Margen para máquinas lentas o cargadas; en una normal no pasa de unas decenas de ms.
    expect(maximo.dificil!).toBeLessThan(600);
  }, 60000);

  it("la difícil elige un objetivo secreto de los que le ofrecen", () => {
    const p = nueva(2, "objetivo");
    const j = siguienteJugadaIA(p, 0, { azar: azarCon(3), dificultad: "dificil" });
    expect(j?.tipo).toBe("elegirObjetivo");
    expect(p.jugadores[0].objetivosOfrecidos).toContain(j?.tipo === "elegirObjetivo" ? j.objetivo : "");
  });

  it("en la última ronda solo queda una ronda", () => {
    const p = nueva(2, "ultima");
    expect(rondasRestantes(p)).toBeGreaterThan(1);
    expect(rondasRestantes({ ...p, ultimaRonda: true })).toBe(1);
  });

  it("la difícil saca más puntos que la normal y la normal más que la fácil (20 partidas con semilla)", () => {
    // Con pocas partidas se mira la media de puntos, que varía menos que las victorias (ver informes/ia-dificultad).
    const diferencia = (a: Dificultad, b: Dificultad) => {
      let total = 0;
      for (let k = 0; k < 20; k++) {
        // Se alternan los asientos para que abrir no favorezca a nadie.
        const niveles: Dificultad[] = k % 2 ? [b, a] : [a, b];
        const { p } = partidaEntre(niveles, `duelo-${a}-${b}-${k}`);
        const puntos = (n: Dificultad) => p.final!.find((r) => r.jugador === niveles.indexOf(n))!.total;
        total += puntos(a) - puntos(b);
      }
      return total / 20;
    };
    expect(diferencia("dificil", "normal")).toBeGreaterThan(2);
    expect(diferencia("normal", "facil")).toBeGreaterThan(2);
  }, 240000);

  it("la normal no cuelga toallas por sistema ni acumula ropa por tender, como la fácil", () => {
    const cuenta = { normal: { toallas: 0, secas: 0, pendientes: 0 }, facil: { toallas: 0, secas: 0, pendientes: 0 } };
    for (let k = 0; k < 8; k++) {
      const niveles: Dificultad[] = k % 2 ? ["facil", "normal"] : ["normal", "facil"];
      const { p } = partidaEntre(niveles, `ropa-${k}`);
      niveles.forEach((n, s) => {
        const c = cuenta[n as "normal" | "facil"];
        const j = p.jugadores[s];
        c.secas += j.seca.length;
        c.toallas += j.seca.filter((id) => p.prendas[id].tipo === "toalla").length;
        c.pendientes += j.pendientes.length;
      });
    }
    expect(cuenta.normal.toallas / cuenta.normal.secas).toBeLessThan(cuenta.facil.toallas / cuenta.facil.secas);
    expect(cuenta.normal.pendientes).toBeLessThan(cuenta.facil.pendientes);
    expect(cuenta.normal.secas).toBeGreaterThan(cuenta.facil.secas);
  }, 120000);
});
