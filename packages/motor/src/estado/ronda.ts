import { barajar } from "../azar";
import { efectos } from "../efectos";
import type { Partida } from "./tipos";
import { defCarta, numero } from "./utilidades";

/** Rondas que dura un clima si su carta no dice otra cosa (parametros.rondas). */
const RONDAS_DE_CLIMA = 2;

/** Rondas que le quedan al clima activo contando la actual, o null si no hay clima. */
export function rondasDeClimaRestantes(p: Partida): number | null {
  if (!p.clima) return null;
  const duracion = numero(defCarta(p, p.clima).parametros, "rondas", RONDAS_DE_CLIMA);
  return duracion - (p.ronda - (p.climaDesde ?? p.ronda));
}

/**
 * Al empezar cada ronda se roba una carta de clima o evento.
 * Un clima sustituye al activo; un evento se resuelve en el acto, va al descarte y no quita el clima.
 * Antes de robar, el clima que ya ha cumplido sus rondas se retira.
 */
export function inicioDeRonda(p: Partida): void {
  p.rondaProtegeDe = [];
  p.ultimoEvento = null;

  const restantes = rondasDeClimaRestantes(p);
  if (p.clima && restantes !== null && restantes <= 0) {
    p.registro.push(`Se acaba ${defCarta(p, p.clima).nombre}: vuelve el tiempo normal.`);
    p.descartes.clima.push(p.clima);
    p.clima = null;
    p.climaDesde = null;
  }

  if (p.mazos.clima.length === 0 && p.descartes.clima.length > 0) {
    p.mazos.clima = p.descartes.clima;
    p.descartes.clima = [];
    barajar(p, p.mazos.clima);
    p.registro.push("Se baraja el descarte de clima y eventos para formar un mazo nuevo.");
  }
  const carta = p.mazos.clima.pop();
  if (!carta) return;

  const def = defCarta(p, carta);
  const efecto = def.efecto ? efectos[def.efecto] : undefined;
  if (def.mazo === "climas") {
    if (p.clima) p.descartes.clima.push(p.clima);
    p.clima = carta;
    p.climaDesde = p.ronda;
    p.registro.push(`Ronda ${p.ronda}: cambia el tiempo a ${def.nombre}.`);
  } else {
    p.ultimoEvento = carta;
    p.descartes.clima.push(carta);
    p.registro.push(`Ronda ${p.ronda}: evento ${def.nombre}.`);
    if (efecto?.tipo === "evento") efecto.resolver(p, def.parametros);
  }
}
