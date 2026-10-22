import { efectos } from "../efectos";
import type { DefObjetivo } from "../datos/esquemas";
import type { Partida, PuntosObjetivo, ResultadoJugador } from "./tipos";
import { empezarReparto, empezarTurnoDeJuego, renovarCestas } from "./reparto";
import { inicioDeRonda, jugadorInicial, ordenDeRonda } from "./ronda";
import { romperCuerdas } from "./rotura";
import { faseDeSecado } from "./secado";

/**
 * Si alguien ha llegado al umbral, la partida acaba al terminar la ronda.
 * Si llegan varios a la vez (en el secado de la ronda), cuenta como primero el que más puntos tiene.
 */
export function comprobarUmbral(p: Partida): void {
  if (p.ultimaRonda) return;
  const llegan = ordenDeRonda(p).filter((i) => p.jugadores[i].puntos >= p.ajustes.umbralFinal);
  if (llegan.length === 0) return;
  const primero = llegan.reduce((a, b) => (p.jugadores[b].puntos > p.jugadores[a].puntos ? b : a));
  p.ultimaRonda = true;
  p.primeroEnLlegar = primero;
  const j = p.jugadores[primero];
  p.registro.push(`${j.nombre} llega a ${j.puntos} puntos: la partida acaba al terminar esta ronda y después se cuentan los objetivos.`);
}

/** Pasa al siguiente jugador; si ya han jugado todos, se acaba la ronda. */
export function pasarTurno(p: Partida): void {
  const siguiente = (p.turno.jugador + 1) % p.jugadores.length;
  if (siguiente === jugadorInicial(p)) finDeRonda(p);
  else empezarTurnoDeJuego(p, siguiente);
}

/**
 * Cuando todos han jugado: se seca y se puntúa a la vez, y empieza la ronda siguiente con otro jugador:
 * carta de clima o evento, cestas nuevas y reparto de prendas.
 */
function finDeRonda(p: Partida): void {
  p.registro.push(`— Fin de la ronda ${p.ronda}: secado y puntos de todos —`);
  for (const jugador of ordenDeRonda(p)) faseDeSecado(p, jugador);
  romperCuerdas(p);
  comprobarUmbral(p);
  if (p.ultimaRonda) {
    terminarPartida(p);
    return;
  }
  p.ronda++;
  p.registro.push(`Empieza la ronda ${p.ronda}; abre ${p.jugadores[jugadorInicial(p)].nombre}.`);
  inicioDeRonda(p);
  renovarCestas(p);
  p.registro.push("Lo que sobraba en las cestas y el centro vuelve a la bolsa y se llenan cestas nuevas.");
  empezarReparto(p);
}

/** Puntos que da un objetivo: sin límite, `puntos` por cada `cada` de lo que cuenta. */
export function puntuarObjetivo(p: Partida, jugador: number, def: DefObjetivo): PuntosObjetivo {
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  const cantidad = efecto?.tipo === "objetivo" ? efecto.contar(p, jugador, def.parametros) : 0;
  const puntos = Math.floor(cantidad / def.cada) * def.puntos;
  return { objetivo: def.id, nombre: def.nombre, cantidad, puntos };
}

// Desempate provisional (pendiente en el diseño): más puntos de partida; si siguen empatados, comparten puesto.
function terminarPartida(p: Partida): void {
  p.terminada = true;
  const resultados: ResultadoJugador[] = p.jugadores.map((j, i) => {
    const ids = [...p.objetivosComunes, ...(j.objetivoSecreto ? [j.objetivoSecreto] : [])];
    const objetivos = ids.map((id) => puntuarObjetivo(p, i, p.catalogo.objetivos[id]));
    const total = j.puntos + objetivos.reduce((s, o) => s + o.puntos, 0);
    return { jugador: i, puntosPartida: j.puntos, objetivos, total, puesto: 0 };
  });
  resultados.sort((a, b) => b.total - a.total || b.puntosPartida - a.puntosPartida);
  resultados.forEach((r, i) => {
    const anterior = resultados[i - 1];
    r.puesto = anterior && anterior.total === r.total && anterior.puntosPartida === r.puntosPartida ? anterior.puesto : i + 1;
  });
  p.final = resultados;

  p.registro.push("— Fin de la partida: recuento de objetivos —");
  for (const r of resultados) {
    const extra = r.objetivos.map((o) => `${o.nombre} +${o.puntos}`).join(", ");
    p.registro.push(`${r.puesto}.º ${p.jugadores[r.jugador].nombre}: ${r.puntosPartida} + objetivos = ${r.total}${extra ? ` (${extra})` : ""}.`);
  }
}
