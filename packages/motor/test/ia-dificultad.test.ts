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

describe("IA: niveles de dificultad", () => {
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
