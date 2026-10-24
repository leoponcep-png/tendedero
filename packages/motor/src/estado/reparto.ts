import { barajar } from "../azar";
import { ordenDeRonda } from "./ronda";
import { anotar } from "./registro";
import type { Partida } from "./tipos";

type FaseReparto = "cesta" | "centro";

/**
 * Lo que sobra en el centro vuelve a la bolsa y solo se rellenan las cestas que se cogieron (las vacías;
 * si la bolsa no da para todas, salen incompletas):
 * las que nadie tocó se quedan como están para la ronda siguiente.
 * Con `renovarTodas` (el sistema anterior), todo lo que sobra vuelve a la bolsa y se llenan todas.
 */
export function renovarCestas(p: Partida): void {
  p.bolsa.push(...p.centro);
  p.centro = [];
  if (p.ajustes.cestas.renovarTodas) {
    p.bolsa.push(...p.cestas.flat());
    p.cestas = p.cestas.map(() => []);
  }
  barajar(p, p.bolsa);
  const { prendasPorCesta } = p.ajustes.cestas;
  p.cestas = p.cestas.map((c) => (c.length > 0 ? c : p.bolsa.splice(-prendasPorCesta)));
}

/**
 * Reparto por fases al empezar la ronda, en el orden de la ronda: primero cada jugador coge un color o un tipo
 * de una cesta (el resto va al centro); después cada uno coge un color o un tipo del centro.
 * A quien ya no le queda nada que coger se lo salta.
 */
export function empezarReparto(p: Partida): void {
  anotar(p, "reparto", { ronda: p.ronda }, `— Reparto de prendas de la ronda ${p.ronda} —`);
  ponerEnReparto(p, "cesta", 0);
}

/** Tras coger un jugador: el siguiente de su fase, la fase del centro o los turnos de juego. */
export function avanzarReparto(p: Partida): void {
  ponerEnReparto(p, p.turno.fase as FaseReparto, ordenDeReparto(p).indexOf(p.turno.jugador) + 1);
}

function puedeCoger(p: Partida, fase: FaseReparto): boolean {
  return fase === "cesta" ? p.cestas.some((c) => c.length > 0) : p.centro.length > 0;
}

/** Quién coge antes en el reparto: el orden de la ronda o, con `repartoInverso`, al revés (el último en jugar coge primero). */
function ordenDeReparto(p: Partida): number[] {
  const orden = ordenDeRonda(p);
  return p.ajustes.repartoInverso ? [...orden].reverse() : orden;
}

function ponerEnReparto(p: Partida, fase: FaseReparto, indice: number): void {
  const orden = ordenDeReparto(p);
  if (indice < orden.length && puedeCoger(p, fase)) {
    p.turno = { ...p.turno, jugador: orden[indice], fase };
    return;
  }
  if (fase === "cesta") ponerEnReparto(p, "centro", 0);
  else empezarTurnoDeJuego(p, ordenDeRonda(p)[0]);
}

export function empezarTurnoDeJuego(p: Partida, jugador: number): void {
  // «Proteger cuerda» dura hasta el siguiente turno de su dueño.
  for (const l of p.jugadores[jugador].lineas) for (const t of l.cartas) delete t.protegida;

  p.turno = { numero: p.turno.numero + 1, jugador, fase: "jugar", cuerdasJugadas: 0, cuerdasExtra: 0, accionesJugadas: 0 };
  anotar(p, "turno", { n: p.turno.numero, jugador }, `— Turno ${p.turno.numero}: ${p.jugadores[jugador].nombre} —`);
}
