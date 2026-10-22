import { barajar } from "../azar";
import { efectos } from "../efectos";
import type { Partida } from "./tipos";
import { defCarta, numero } from "./utilidades";

/** Quien abre la ronda: el primer jugador va rotando, una ronda cada uno. */
export function jugadorInicial(p: Partida, ronda = p.ronda): number {
  return (ronda - 1) % p.jugadores.length;
}

/** Orden de juego de la ronda actual, empezando por quien la abre. */
export function ordenDeRonda(p: Partida): number[] {
  const n = p.jugadores.length;
  return Array.from({ length: n }, (_, i) => (jugadorInicial(p) + i) % n);
}

/** ¿Es este jugador el último en jugar la ronda? */
export function cierraLaRonda(p: Partida, jugador: number): boolean {
  return (jugador + 1) % p.jugadores.length === jugadorInicial(p);
}

/** Días que dura una carta del día si no dice otra cosa (parametros.dias). Cada día es una ronda. */
const DIAS_POR_DEFECTO = 1;

/** Días (rondas) que le quedan a la carta del día en juego contando el actual, o null si no hay ninguna. */
export function diasRestantes(p: Partida): number | null {
  if (!p.dia) return null;
  const duracion = numero(defCarta(p, p.dia).parametros, "dias", DIAS_POR_DEFECTO);
  return duracion - (p.ronda - (p.diaDesde ?? p.ronda));
}

/**
 * Al empezar cada ronda: si la carta del día ya ha cumplido sus días, se descarta; si no queda ninguna
 * en juego, se roba una (así nunca hay dos a la vez). Un suceso se resuelve al empezar cada uno de sus días;
 * el tiempo actúa al secar (ver secado.ts).
 */
export function inicioDeRonda(p: Partida): void {
  p.rondaProtegeDe = [];

  const restantes = diasRestantes(p);
  if (p.dia && restantes !== null && restantes <= 0) {
    p.registro.push(`Se acaba ${defCarta(p, p.dia).nombre}.`);
    p.descartes.dia.push(p.dia);
    p.dia = null;
    p.diaDesde = null;
  }

  if (!p.dia) {
    if (p.mazos.dia.length === 0 && p.descartes.dia.length > 0) {
      p.mazos.dia = p.descartes.dia;
      p.descartes.dia = [];
      barajar(p, p.mazos.dia);
      p.registro.push("Se baraja el descarte del mazo del día para formar un mazo nuevo.");
    }
    const carta = p.mazos.dia.pop();
    if (!carta) return;
    p.dia = carta;
    p.diaDesde = p.ronda;
    const dias = diasRestantes(p)!;
    p.registro.push(`Ronda ${p.ronda}: sale ${defCarta(p, carta).nombre} (${dias === 1 ? "1 día" : `${dias} días`}).`);
  }

  const def = defCarta(p, p.dia);
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  if (efecto?.tipo === "evento") efecto.resolver(p, def.parametros);
}
