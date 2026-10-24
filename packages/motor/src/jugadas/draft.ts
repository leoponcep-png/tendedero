import { avanzarReparto } from "../estado/reparto";
import { anotar, no, refPrenda } from "../estado/registro";
import type { Partida, Prenda } from "../estado/tipos";
import { nombrePrenda } from "../estado/utilidades";
import type { JugadaDe, Manejador, Origen, Patron } from "./tipos";

export function cumple(prenda: Prenda, patron: Patron): boolean {
  return "color" in patron ? prenda.color === patron.color : prenda.tipo === patron.tipo;
}

export function prendasDe(p: Partida, origen: Origen): string[] | undefined {
  return origen === "centro" ? p.centro : p.cestas[origen.cesta];
}

// Reparto por fases (ver estado/reparto.ts): en la fase de cestas te llevas un color o un tipo de una cesta y el resto
// va al centro; en la fase del centro te llevas un color o un tipo del centro.
export const draft: Manejador<JugadaDe<"draft">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    const fase = p.turno.fase;
    if (fase !== "cesta" && fase !== "centro") return no("soloEnReparto", "Las prendas se cogen en el reparto, al empezar la ronda.");
    if (fase === "cesta" && j.origen === "centro") return no("tocaCesta", "Ahora se coge de una cesta; del centro se coge después.");
    if (fase === "centro" && j.origen !== "centro") return no("tocaCentro", "Ahora toca coger del centro.");
    const prendas = prendasDe(p, j.origen);
    if (!prendas) return no("sinCesta", "Esa cesta no existe.");
    if (!prendas.some((id) => cumple(p.prendas[id], j.patron))) return no("sinPrendasAsi", "Ahí no hay prendas de ese color o tipo.");
    return null;
  },
  aplicar(p, j) {
    const prendas = prendasDe(p, j.origen)!;
    const cogidas = prendas.filter((id) => cumple(p.prendas[id], j.patron));
    const resto = prendas.filter((id) => !cumple(p.prendas[id], j.patron));
    if (j.origen === "centro") {
      p.centro = resto;
    } else {
      p.cestas[j.origen.cesta] = [];
      p.centro.push(...resto);
    }
    p.jugadores[j.jugador].pendientes.push(...cogidas);
    const desde = j.origen === "centro" ? "del centro" : `de la cesta ${j.origen.cesta + 1}`;
    anotar(
      p,
      j.origen === "centro" ? "cogeCentro" : "cogeCesta",
      { jugador: j.jugador, cesta: j.origen === "centro" ? 0 : j.origen.cesta + 1, prendas: cogidas.map((id) => refPrenda(p, id)) },
      `${p.jugadores[j.jugador].nombre} coge ${desde}: ${cogidas.map((id) => nombrePrenda(p, id)).join(", ")}.`,
    );
    avanzarReparto(p);
  },
};
