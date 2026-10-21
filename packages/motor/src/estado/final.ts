import { efectos } from "../efectos";
import type { DefObjetivo } from "../datos/esquemas";
import type { Partida, PuntosObjetivo, ResultadoJugador } from "./tipos";
import { cestasVacias, rellenarCestas } from "./utilidades";

/** Si el jugador ha llegado al umbral, empieza la última ronda. */
export function comprobarUmbral(p: Partida, jugador: number): void {
  const j = p.jugadores[jugador];
  if (p.ultimaRonda || j.puntos < p.ajustes.umbralFinal) return;
  p.ultimaRonda = true;
  p.primeroEnLlegar = jugador;
  p.registro.push(`${j.nombre} llega a ${j.puntos} puntos: se acaba esta ronda y después se cuentan los objetivos.`);
}

/** Pasa al siguiente jugador o, si se acaba la última ronda, termina la partida. */
export function pasarTurno(p: Partida): void {
  if (cestasVacias(p) && p.bolsa.length > 0) {
    rellenarCestas(p);
    p.registro.push("Las cestas y el centro se han vaciado: se rellenan las cestas desde la bolsa.");
  }

  const siguiente = (p.turno.jugador + 1) % p.jugadores.length;
  if (p.ultimaRonda && siguiente === 0) {
    terminarPartida(p);
    return;
  }

  // «Proteger cuerda» dura hasta el siguiente turno de su dueño.
  for (const l of p.jugadores[siguiente].lineas) for (const t of l.cartas) delete t.protegida;

  p.turno = { numero: p.turno.numero + 1, jugador: siguiente, fase: "jugar", cuerdasJugadas: 0, cuerdasExtra: 0, accionesJugadas: 0, drafts: 0 };
  p.registro.push(`— Turno ${p.turno.numero}: ${p.jugadores[siguiente].nombre} —`);
}

/** Puntos que da un objetivo: solo el nivel más alto alcanzado, sin acumular. */
export function puntuarObjetivo(p: Partida, jugador: number, def: DefObjetivo): PuntosObjetivo {
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  const cantidad = efecto?.tipo === "objetivo" ? efecto.contar(p, jugador, def.parametros) : 0;
  const puntos = def.niveles.filter((n) => cantidad >= n.requisito).reduce((max, n) => Math.max(max, n.puntos), 0);
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
