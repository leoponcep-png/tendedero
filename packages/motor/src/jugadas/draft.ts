import { avanzarReparto } from "../estado/reparto";
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
    if (fase !== "cesta" && fase !== "centro") return "Las prendas se cogen en el reparto, al empezar la ronda.";
    if (fase === "cesta" && j.origen === "centro") return "Ahora se coge de una cesta; del centro se coge después.";
    if (fase === "centro" && j.origen !== "centro") return "Ahora toca coger del centro.";
    const prendas = prendasDe(p, j.origen);
    if (!prendas) return "Esa cesta no existe.";
    if (!prendas.some((id) => cumple(p.prendas[id], j.patron))) return "Ahí no hay prendas de ese color o tipo.";
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
    p.registro.push(`${p.jugadores[j.jugador].nombre} coge ${desde}: ${cogidas.map((id) => nombrePrenda(p, id)).join(", ")}.`);
    avanzarReparto(p);
  },
};
