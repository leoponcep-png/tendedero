import type { Partida } from "./estado/tipos";

export const OCULTA = "?";

/**
 * Lo que puede ver un jugador concreto: sin las manos ni los objetivos secretos de los demás,
 * sin el orden de los mazos y sin la semilla. Lo usará el servidor del modo online.
 */
export function vistaPara(p: Partida, jugador: number): Partida {
  const v = structuredClone(p);
  v.jugadores.forEach((j, i) => {
    if (i === jugador) return;
    j.mano = j.mano.map(() => OCULTA);
    j.objetivosOfrecidos = j.objetivosOfrecidos.map(() => OCULTA);
    if (j.objetivoSecreto) j.objetivoSecreto = OCULTA;
  });
  v.bolsa = v.bolsa.map(() => OCULTA);
  v.mazos = { cuerdas: v.mazos.cuerdas.map(() => OCULTA), acciones: v.mazos.acciones.map(() => OCULTA), dia: v.mazos.dia.map(() => OCULTA) };
  v.semilla = "";
  v.ajustes.semilla = "";
  v.azar = 0;
  return v;
}
