import { barajar } from "../azar";
import { efectos } from "../efectos";
import type { Partida } from "./tipos";
import { defCarta } from "./utilidades";

/**
 * Al empezar cada ronda se roba una carta de clima o evento.
 * Un clima sustituye al activo; un evento se resuelve en el acto, va al descarte y no quita el clima.
 */
export function inicioDeRonda(p: Partida): void {
  p.rondaProtegeDe = [];
  p.ultimoEvento = null;

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
    p.registro.push(`Ronda ${p.ronda}: cambia el tiempo a ${def.nombre}.`);
  } else {
    p.ultimoEvento = carta;
    p.descartes.clima.push(carta);
    p.registro.push(`Ronda ${p.ronda}: evento ${def.nombre}.`);
    if (efecto?.tipo === "evento") efecto.resolver(p, def.parametros);
  }
}
