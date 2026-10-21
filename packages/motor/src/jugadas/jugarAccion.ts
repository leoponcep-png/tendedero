import { efectos, type EfectoAccion } from "../efectos";
import { efectoCuerda } from "../estado/secado";
import type { Partida } from "../estado/tipos";
import { defCarta, motivoNoCabe } from "../estado/utilidades";
import type { JugadaDe, Manejador } from "./tipos";

/** Motivo cuando a una acción de mover solo le falta el destino (la interfaz lo pide en un segundo paso). */
export const FALTA_DESTINO = "Elige adónde moverla.";

export function efectoAccion(p: Partida, carta: string): EfectoAccion | null {
  const def = defCarta(p, carta);
  const e = def.efecto ? efectos[def.efecto] : undefined;
  return e?.tipo === "accion" ? e : null;
}

// Comprobaciones comunes a todas las acciones según sobre qué se juegan.
function motivoBlanco(p: Partida, j: JugadaDe<"jugarAccion">, efecto: EfectoAccion): string | null {
  const { blanco } = efecto;
  if (blanco === "ninguno") return null;
  const o = j.objetivo;
  if (!o) return "Arrastra la carta sobre su objetivo.";
  const rival = blanco.endsWith("Rival");
  if (rival && o.jugador === j.jugador) return "Esta carta se juega sobre el tendedero de un rival.";
  if (!rival && o.jugador !== j.jugador) return "Esta carta se juega sobre tu propio tendedero.";

  const tendida = p.jugadores[o.jugador]?.lineas[o.linea]?.cartas[o.posicion];
  if (!tendida) return "Ahí no hay ninguna carta de cuerda.";
  const sobrePrenda = blanco.startsWith("prenda") || blanco.startsWith("mover");
  if (sobrePrenda && !tendida.colgadas.some((c) => c.prenda === o.prenda)) return "Suelta la carta encima de una prenda colgada.";

  if (efecto.etiquetas.includes("fastidio") && tendida.protegida) return "Esa cuerda está protegida hasta el próximo turno de su dueño.";
  const cuerda = efectoCuerda(p, tendida);
  if (cuerda?.efecto.protegeDe?.some((e) => efecto.etiquetas.includes(e))) {
    return `${defCarta(p, tendida.carta).nombre} protege de esta carta.`;
  }
  if (p.rondaProtegeDe.some((e) => efecto.etiquetas.includes(e))) {
    return "Un evento lo impide durante esta ronda.";
  }

  if (blanco.startsWith("mover")) {
    if (!o.destino) return FALTA_DESTINO;
    const actual = tendida.colgadas.find((c) => c.prenda === o.prenda)!;
    if (o.destino.linea === o.linea && o.destino.posicion === o.posicion && o.destino.inicio === actual.inicio) {
      return "La prenda ya está ahí.";
    }
    return motivoNoCabe(p, { jugador: o.jugador, ...o.destino }, o.prenda!, o.prenda);
  }
  return null;
}

export const jugarAccion: Manejador<JugadaDe<"jugarAccion">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    if (!p.jugadores[j.jugador].mano.includes(j.carta)) return "Esa carta no está en tu mano.";
    const def = defCarta(p, j.carta);
    if (def.mazo !== "acciones") return "Esa carta no es de acción.";
    const maximo = p.ajustes.jugablesPorTurno.acciones;
    if (p.turno.accionesJugadas >= maximo) {
      return maximo === 1 ? "Ya has jugado una acción este turno." : `Ya has jugado ${maximo} acciones este turno.`;
    }
    const efecto = efectoAccion(p, j.carta);
    if (!efecto) return "Esta carta no tiene efecto programado.";
    return motivoBlanco(p, j, efecto) ?? efecto.validar?.(p, j, def.parametros) ?? null;
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    const def = defCarta(p, j.carta);
    jugador.mano = jugador.mano.filter((c) => c !== j.carta);
    p.descartes.acciones.push(j.carta);
    p.turno.accionesJugadas++;
    p.registro.push(`${jugador.nombre} juega ${def.nombre}.`);
    efectoAccion(p, j.carta)!.aplicar(p, j, def.parametros);
  },
};
