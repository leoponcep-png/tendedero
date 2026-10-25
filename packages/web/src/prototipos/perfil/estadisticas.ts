import type { ResumenPartida } from "./registro";

// Récords y estadísticas calculados siempre a partir de las partidas guardadas (no se guarda nada aparte,
// así nunca se desajustan).

export interface Balance {
  partidas: number;
  ganadas: number;
}

export interface Estadisticas {
  partidas: number;
  ganadas: number;
  /** 0–100. */
  porcentaje: number;
  mejorPuntuacion: number;
  puntosMedios: number;
  prendasSecas: number;
  mejorPrendas: number;
  rachaActual: number;
  mejorRacha: number;
  /** Mayor diferencia con el segundo en una partida ganada. */
  mayorVentaja: number;
  objetivosCumplidos: number;
  fastidiosJugados: number;
  fastidiosRecibidos: number;
  /** Ganada recibiendo 3 o más fastidios. */
  ganadasConFastidios: number;
  /** Días distintos en los que has jugado alguna partida. */
  diasJugados: number;
  porJugadores: Record<2 | 3 | 4, Balance>;
  contraIA: Balance;
  online: Balance;
  local: Balance;
  /** De la más reciente a la más antigua. */
  ultimas: ResumenPartida[];
}

const balance = (lista: ResumenPartida[]): Balance => ({ partidas: lista.length, ganadas: lista.filter(ganada).length });

export const ganada = (p: ResumenPartida) => p.puesto === 1;

export function calcularEstadisticas(partidas: ResumenPartida[]): Estadisticas {
  const orden = [...partidas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  let racha = 0;
  let mejorRacha = 0;
  for (const p of orden) {
    racha = ganada(p) ? racha + 1 : 0;
    mejorRacha = Math.max(mejorRacha, racha);
  }
  const ganadas = orden.filter(ganada);
  const suma = (f: (p: ResumenPartida) => number) => orden.reduce((s, p) => s + (f(p) || 0), 0);
  const maximo = (lista: ResumenPartida[], f: (p: ResumenPartida) => number) => lista.reduce((m, p) => Math.max(m, f(p) || 0), 0);
  return {
    partidas: orden.length,
    ganadas: ganadas.length,
    porcentaje: orden.length ? Math.round((ganadas.length / orden.length) * 100) : 0,
    mejorPuntuacion: maximo(orden, (p) => p.puntos),
    puntosMedios: orden.length ? Math.round((suma((p) => p.puntos) / orden.length) * 10) / 10 : 0,
    prendasSecas: suma((p) => p.prendasSecas),
    mejorPrendas: maximo(orden, (p) => p.prendasSecas),
    rachaActual: racha,
    mejorRacha,
    mayorVentaja: maximo(ganadas, (p) => p.puntos - Math.max(0, ...(p.puntosRivales ?? []))),
    objetivosCumplidos: orden.filter((p) => p.objetivoSecretoCumplido).length,
    fastidiosJugados: suma((p) => p.fastidiosJugados),
    fastidiosRecibidos: suma((p) => p.fastidiosRecibidos),
    ganadasConFastidios: ganadas.filter((p) => p.fastidiosRecibidos >= 3).length,
    diasJugados: new Set(orden.map((p) => p.fecha.slice(0, 10))).size,
    porJugadores: {
      2: balance(orden.filter((p) => p.jugadores === 2)),
      3: balance(orden.filter((p) => p.jugadores === 3)),
      4: balance(orden.filter((p) => p.jugadores >= 4)),
    },
    contraIA: balance(orden.filter((p) => p.contraIA)),
    online: balance(orden.filter((p) => p.online)),
    local: balance(orden.filter((p) => !p.online && !p.contraIA)),
    ultimas: orden.slice(-12).reverse(),
  };
}
