import { barajar } from "../azar";
import { ordenDeRonda } from "./ronda";
import type { Partida } from "./tipos";
import { rellenarCestas } from "./utilidades";

type FaseReparto = "cesta" | "centro";

/** Lo que sobra en las cestas y en el centro vuelve a la bolsa, se baraja y se reparten cestas nuevas. */
export function renovarCestas(p: Partida): void {
  p.bolsa.push(...p.cestas.flat(), ...p.centro);
  p.centro = [];
  barajar(p, p.bolsa);
  rellenarCestas(p);
}

/**
 * Reparto por fases al empezar la ronda, en el orden de la ronda: primero cada jugador coge un tipo
 * de una cesta (el resto va al centro); después cada uno coge un tipo del centro.
 * A quien ya no le queda nada que coger se lo salta.
 */
export function empezarReparto(p: Partida): void {
  p.registro.push(`— Reparto de prendas de la ronda ${p.ronda} —`);
  ponerEnReparto(p, "cesta", 0);
}

/** Tras coger un jugador: el siguiente de su fase, la fase del centro o los turnos de juego. */
export function avanzarReparto(p: Partida): void {
  ponerEnReparto(p, p.turno.fase as FaseReparto, ordenDeRonda(p).indexOf(p.turno.jugador) + 1);
}

function puedeCoger(p: Partida, fase: FaseReparto): boolean {
  return fase === "cesta" ? p.cestas.some((c) => c.length > 0) : p.centro.length > 0;
}

function ponerEnReparto(p: Partida, fase: FaseReparto, indice: number): void {
  const orden = ordenDeRonda(p);
  if (indice < orden.length && puedeCoger(p, fase)) {
    p.turno = { ...p.turno, jugador: orden[indice], fase };
    return;
  }
  if (fase === "cesta") ponerEnReparto(p, "centro", 0);
  else empezarTurnoDeJuego(p, orden[0]);
}

export function empezarTurnoDeJuego(p: Partida, jugador: number): void {
  // «Proteger cuerda» dura hasta el siguiente turno de su dueño.
  for (const l of p.jugadores[jugador].lineas) for (const t of l.cartas) delete t.protegida;

  p.turno = { numero: p.turno.numero + 1, jugador, fase: "jugar", cuerdasJugadas: 0, cuerdasExtra: 0, accionesJugadas: 0 };
  p.registro.push(`— Turno ${p.turno.numero}: ${p.jugadores[jugador].nombre} —`);
}
