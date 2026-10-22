import { defCarta } from "../estado/utilidades";
import { tenderCuerda } from "./colocarCuerda";
import { cartaDeReaccion, resolverAccion } from "./jugarAccion";
import type { JugadaDe, Manejador } from "./tipos";

// El atacado decide: anula el fastidio con su carta de reacción (las dos cartas van al descarte)
// o lo deja pasar y se aplica.
export const responder: Manejador<JugadaDe<"responder">> = {
  soloEnSuTurno: false,
  validar(p, j) {
    if (!p.reaccion) return "No hay nada a lo que responder.";
    if (p.reaccion.defensor !== j.jugador) return `Le toca responder a ${p.jugadores[p.reaccion.defensor].nombre}.`;
    if (j.anular && !cartaDeReaccion(p, j.jugador)) return "No tienes ninguna carta de reacción.";
    return null;
  },
  aplicar(p, j) {
    const { jugada, defensor } = p.reaccion!;
    p.reaccion = null;
    const jugador = p.jugadores[defensor];
    if (!j.anular) {
      p.registro.push(`${jugador.nombre} no responde.`);
      if (jugada.tipo === "jugarAccion") resolverAccion(p, jugada);
      else tenderCuerda(p, jugada);
      return;
    }
    const carta = cartaDeReaccion(p, defensor)!;
    jugador.mano = jugador.mano.filter((c) => c !== carta);
    p.descartes.acciones.push(carta);
    // La carta de acción del atacante ya está en el descarte; la de cuerda aún no estaba en ningún sitio.
    if (jugada.tipo === "colocarCuerda") p.descartes.cuerdas.push(jugada.carta);
    p.registro.push(`${jugador.nombre} juega ${defCarta(p, carta).nombre}: ${defCarta(p, jugada.carta).nombre} no tiene efecto.`);
  },
};
