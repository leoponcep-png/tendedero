import { efectos } from "../efectos";
import type { DefObjetivo } from "../datos/esquemas";
import type { Partida, PuntosObjetivo, ResultadoJugador } from "./tipos";
import { empezarReparto, empezarTurnoDeJuego, renovarCestas } from "./reparto";
import { inicioDeRonda, jugadorInicial, ordenDeRonda } from "./ronda";
import { romperCuerdas } from "./rotura";
import { anotar } from "./registro";
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
  anotar(p, "llegaAlFinal", { jugador: primero, puntos: j.puntos }, `${j.nombre} llega a ${j.puntos} puntos: la partida acaba al terminar esta ronda y después se cuentan los objetivos.`);
}

/** Pasa al siguiente jugador; si ya han jugado todos, se acaba la ronda. */
export function pasarTurno(p: Partida): void {
  const siguiente = (p.turno.jugador + 1) % p.jugadores.length;
  if (siguiente === jugadorInicial(p)) finDeRonda(p);
  else empezarTurnoDeJuego(p, siguiente);
}

/**
 * Cuando todos han jugado: se seca y se puntúa a la vez, y empieza la ronda siguiente con otro jugador:
 * carta del día, cestas nuevas y reparto de prendas. Si ya no queda ropa que repartir, la partida acaba.
 */
function finDeRonda(p: Partida): void {
  anotar(p, "finRonda", { ronda: p.ronda }, `— Fin de la ronda ${p.ronda}: secado y puntos de todos —`);
  for (const jugador of ordenDeRonda(p)) faseDeSecado(p, jugador);
  romperCuerdas(p);
  comprobarUmbral(p);
  if (!p.ultimaRonda && p.bolsa.length + p.centro.length + p.cestas.flat().length === 0) {
    p.ultimaRonda = true;
    anotar(p, "sinRopa", {}, "Se ha acabado la ropa (no queda en la bolsa, ni en las cestas, ni en el centro): la partida termina.");
  }
  if (p.ultimaRonda) {
    terminarPartida(p);
    return;
  }
  p.ronda++;
  anotar(p, "empiezaRonda", { ronda: p.ronda, jugador: jugadorInicial(p) }, `Empieza la ronda ${p.ronda}; abre ${p.jugadores[jugadorInicial(p)].nombre}.`);
  inicioDeRonda(p);
  renovarCestas(p);
  anotar(p, "cestasNuevas", {}, "Lo que sobraba en las cestas y el centro vuelve a la bolsa y se llenan cestas nuevas.");
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

  anotar(p, "finPartida", {}, "— Fin de la partida: recuento de objetivos —");
  for (const r of resultados) {
    const extra = r.objetivos.map((o) => `${o.nombre} +${o.puntos}`).join(", ");
    anotar(
      p,
      "puesto",
      { puesto: r.puesto, jugador: r.jugador, puntos: r.puntosPartida, total: r.total, objetivos: r.objetivos.map((o) => `${o.objetivo}:${o.puntos}`) },
      `${r.puesto}.º ${p.jugadores[r.jugador].nombre}: ${r.puntosPartida} + objetivos = ${r.total}${extra ? ` (${extra})` : ""}.`,
    );
  }
}
