import { efectoCuerda } from "./secado";
import { anotar, refPrenda } from "./registro";
import type { CartaTendida, Partida } from "./tipos";
import { defCarta, nombrePrenda } from "./utilidades";

/** Rondas que le quedan a una cuerda que se rompe, contando la actual; null si no se rompe. */
export function rondasHastaRomperse(p: Partida, tendida: CartaTendida): number | null {
  const cuerda = efectoCuerda(p, tendida);
  const rondas = cuerda?.efecto.seRompeTras?.(cuerda.params);
  if (rondas === undefined) return null;
  return rondas - (p.ronda - (tendida.colocadaEn ?? p.ronda));
}

/**
 * Al acabar la ronda, tras el secado: cada cuerda que ha cumplido sus rondas se rompe, y con ella todas
 * las cartas a su derecha en la misma línea. Las cartas van al descarte (o a los trofeos de quien la puso,
 * si fue un rival) y sus prendas salen de la partida.
 */
export function romperCuerdas(p: Partida): void {
  for (const jugador of p.jugadores) {
    for (const [l, linea] of jugador.lineas.entries()) {
      const i = linea.cartas.findIndex((t) => {
        const quedan = rondasHastaRomperse(p, t);
        return quedan !== null && quedan <= 1;
      });
      if (i < 0) continue;

      const rotas = linea.cartas.splice(i);
      const prendas = rotas.flatMap((t) => t.colgadas.map((c) => c.prenda));
      p.perdidas.push(...prendas);

      const conElla = rotas.length > 1 ? ` y con ella ${rotas.length - 1} carta(s) a su derecha` : "";
      const perdidas = prendas.length ? `; se pierden ${prendas.map((id) => nombrePrenda(p, id)).join(", ")}` : "";
      anotar(
        p,
        "seRompe",
        { carta: defCarta(p, rotas[0].carta).id, jugador: p.jugadores.indexOf(jugador), linea: l + 1, n: rotas.length - 1, prendas: prendas.map((id) => refPrenda(p, id)) },
        `Se rompe ${defCarta(p, rotas[0].carta).nombre} de ${jugador.nombre} en la línea ${l + 1}${conElla}${perdidas}.`,
      );

      // La que puso un rival se la queda él como trofeo; el resto va al descarte.
      for (const t of rotas) {
        if (t.colocadaPor === undefined) {
          p.descartes.cuerdas.push(t.carta);
          continue;
        }
        p.jugadores[t.colocadaPor].trofeos.push(t.carta);
        anotar(p, "trofeo", { jugador: t.colocadaPor, carta: defCarta(p, t.carta).id }, `${p.jugadores[t.colocadaPor].nombre} se queda ${defCarta(p, t.carta).nombre} como trofeo.`);
      }
    }
  }
}
