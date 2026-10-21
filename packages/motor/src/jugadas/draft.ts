import type { Partida, Prenda } from "../estado/tipos";
import { nombrePrenda } from "../estado/utilidades";
import type { JugadaDe, Manejador, Origen, Patron } from "./tipos";

export function cumple(prenda: Prenda, patron: Patron): boolean {
  return "color" in patron ? prenda.color === patron.color : prenda.tipo === patron.tipo;
}

export function prendasDe(p: Partida, origen: Origen): string[] | undefined {
  return origen === "centro" ? p.centro : p.cestas[origen.cesta];
}

// Al estilo Azul: de una cesta te llevas todo lo que cumple el patrón y el resto va al centro.
export const draft: Manejador<JugadaDe<"draft">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    if (p.turno.drafts >= p.ajustes.draftsPorTurno) return "Ya has cogido prendas este turno.";
    const prendas = prendasDe(p, j.origen);
    if (!prendas) return "Esa cesta no existe.";
    if (!prendas.some((id) => cumple(p.prendas[id], j.patron))) return "Ahí no hay ninguna prenda que cumpla ese patrón.";
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
    p.turno.drafts++;
    const desde = j.origen === "centro" ? "del centro" : `de la cesta ${j.origen.cesta + 1}`;
    p.registro.push(`${p.jugadores[j.jugador].nombre} coge ${desde}: ${cogidas.map((id) => nombrePrenda(p, id)).join(", ")}.`);
  },
};
