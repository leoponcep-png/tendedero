import { BLANCOS_CON_DESTINO, efectos, type Blanco, type EfectoAccion } from "../efectos";
import { quienProtege } from "../estado/secado";
import { anotar, no, type Motivo } from "../estado/registro";
import type { CartaTendida, Colgada, Partida } from "../estado/tipos";
import { defCarta, localizar, motivoNoCabe, prendaEn, tipoDe } from "../estado/utilidades";
import type { JugadaDe, Manejador, ObjetivoAccion } from "./tipos";

/** Motivo cuando a una acción de dos pasos solo le falta el destino (la interfaz lo pide en un segundo paso). */
export const FALTA_DESTINO = "Elige adónde.";

export function efectoAccion(p: Partida, carta: string): EfectoAccion | null {
  const def = defCarta(p, carta);
  const e = def.efecto ? efectos[def.efecto] : undefined;
  return e?.tipo === "accion" ? e : null;
}

export function pideDestino(blanco: Blanco): boolean {
  return BLANCOS_CON_DESTINO.includes(blanco);
}

/** La carta de reacción que tiene en la mano este jugador, si tiene alguna. */
export function cartaDeReaccion(p: Partida, jugador: number): string | undefined {
  return p.jugadores[jugador].mano.find((c) => efectoAccion(p, c)?.blanco === "reaccion");
}

/** Si el fastidio de `atacante` sobre `defensor` tiene que esperar a que este decida si lo anula. */
export function esperaReaccion(p: Partida, atacante: number, defensor: number): boolean {
  return atacante !== defensor && cartaDeReaccion(p, defensor) !== undefined;
}

const SOBRE_PRENDA: Blanco[] = ["prendaPropia", "prendaRival", "moverPropia", "moverRival", "cambiarPrendas"];

// Comprobaciones comunes a todas las acciones según sobre qué se juegan.
function motivoBlanco(p: Partida, j: JugadaDe<"jugarAccion">, efecto: EfectoAccion): Motivo | null {
  const { blanco } = efecto;
  if (blanco === "ninguno") return null;
  if (blanco === "reaccion") return no("esReaccion", "Esta carta se juega cuando un rival te lanza un fastidio.");
  const o = j.objetivo;
  if (!o) return no("sinObjetivo", "Arrastra la carta sobre su objetivo.");
  const rival = blanco.endsWith("Rival");
  if (rival && o.jugador === j.jugador) return no("deRival", "Esta carta se juega sobre el tendedero de un rival.");
  if (!rival && o.jugador !== j.jugador) return no("dePropio", "Esta carta se juega sobre tu propio tendedero.");

  const tendida = p.jugadores[o.jugador]?.lineas[o.linea]?.cartas[o.posicion];
  if (!tendida) return no("sinCuerdaAhi", "Ahí no hay ninguna carta de cuerda.");
  if (SOBRE_PRENDA.includes(blanco) && !tendida.colgadas.some((c) => c.prenda === o.prenda)) {
    return no("sobrePrenda", "Suelta la carta encima de una prenda colgada.");
  }

  if (efecto.etiquetas.includes("fastidio") && tendida.protegida) return no("protegida", "Esa cuerda está protegida hasta el próximo turno de su dueño.");
  for (const etiqueta of efecto.etiquetas) {
    const protege = quienProtege(p, tendida, etiqueta);
    if (protege) return no("protege", `${defCarta(p, protege.carta).nombre} protege de esta carta.`, { carta: defCarta(p, protege.carta).id });
  }
  if (p.rondaProtegeDe.some((e) => efecto.etiquetas.includes(e))) {
    return no("loImpideHoy", `${defCarta(p, p.dia!).nombre} lo impide hoy.`, { carta: defCarta(p, p.dia!).id });
  }

  if (!pideDestino(blanco)) return null;
  if (!o.destino) return no("faltaDestino", FALTA_DESTINO);
  return motivoDestino(p, o, blanco, tendida);
}

function motivoDestino(p: Partida, o: ObjetivoAccion, blanco: Blanco, tendida: CartaTendida): Motivo | null {
  const d = o.destino!;
  const sitio = { jugador: o.jugador, ...d };
  const lineas = p.jugadores[o.jugador].lineas;

  if (blanco === "moverPropia" || blanco === "moverRival") {
    const actual = tendida.colgadas.find((c) => c.prenda === o.prenda)!;
    if (d.linea === o.linea && d.posicion === o.posicion && d.inicio === actual.inicio) return no("prendaYaAhi", "La prenda ya está ahí.");
    return motivoNoCabe(p, sitio, o.prenda!, o.prenda);
  }

  if (blanco === "cambiarPrendas") {
    const otra = prendaEn(p, sitio);
    if (!otra) return no("pulsaOtraPrenda", "Pulsa otra prenda tuya para intercambiarlas.");
    if (otra === o.prenda) return no("prendaDistinta", "Elige una prenda distinta.");
    return motivoIntercambio(p, o.prenda!, otra);
  }

  if (blanco === "cambiarCuerdas") {
    const otra = lineas[d.linea]?.cartas[d.posicion];
    if (!otra) return no("pulsaOtraCuerda", "Pulsa otra carta de cuerda tuya.");
    if (otra === tendida) return no("cuerdaDistinta", "Elige una carta de cuerda distinta.");
    if (tendida.colgadas.length === 0 && otra.colgadas.length === 0) return no("cuerdasVacias", "Las dos cuerdas están vacías.");
    if (!caben(p, tendida.colgadas, otra) || !caben(p, otra.colgadas, tendida)) return no("noCabeLoColgado", "Lo colgado no cabe en la otra carta.");
    return null;
  }

  if (blanco === "moverCuerda") {
    const linea = lineas[d.linea];
    if (!linea) return no("sinLinea", "Esa línea no existe.");
    if (d.linea === o.linea && d.posicion === o.posicion) return no("cuerdaYaAhi", "La cuerda ya está ahí.");
    if (d.posicion < linea.cartas.length) return null; // se intercambian de sitio
    if (d.posicion > linea.cartas.length) return no("huecoSiguiente", "Las cuerdas van en el hueco siguiente de la línea.");
    if (d.linea === o.linea) return o.posicion === linea.cartas.length - 1 ? no("yaAlFinal", "La cuerda ya está al final de esa línea.") : null;
    if (linea.cartas.length >= p.ajustes.tendedero.cartasPorLinea) return no("lineaCompleta", "Esa línea ya está completa.");
    return null;
  }
  return null;
}

function caben(p: Partida, colgadas: Colgada[], en: CartaTendida): boolean {
  const huecos = defCarta(p, en.carta).espacios;
  return colgadas.every((c) => c.inicio + tipoDe(p, c.prenda).espacios <= huecos);
}

/** Cada prenda pasa al sitio (carta y espacio de inicio) de la otra. */
function motivoIntercambio(p: Partida, a: string, b: string): Motivo | null {
  const ua = localizar(p, a)!;
  const ub = localizar(p, b)!;
  const noCabe =
    motivoNoCabe(p, { jugador: ub.jugador, linea: ub.linea, posicion: ub.posicion, inicio: ub.colgada.inicio }, a, [a, b]) ??
    motivoNoCabe(p, { jugador: ua.jugador, linea: ua.linea, posicion: ua.posicion, inicio: ua.colgada.inicio }, b, [a, b]);
  if (noCabe) return no("noCabenAlCambiar", "No caben al intercambiarlas.");
  if (ua.tendida === ub.tendida) {
    // En la misma carta, tampoco pueden pisarse entre ellas en sus sitios nuevos.
    const [ia, la] = [ub.colgada.inicio, tipoDe(p, a).espacios];
    const [ib, lb] = [ua.colgada.inicio, tipoDe(p, b).espacios];
    if (ia < ib + lb && ib < ia + la) return no("noCabenAlCambiar", "No caben al intercambiarlas.");
  }
  return null;
}

/** Aplica el efecto de una acción ya pagada (la carta ya salió de la mano). */
export function resolverAccion(p: Partida, j: JugadaDe<"jugarAccion">): void {
  efectoAccion(p, j.carta)!.aplicar(p, j, defCarta(p, j.carta).parametros);
}

export const jugarAccion: Manejador<JugadaDe<"jugarAccion">> = {
  soloEnSuTurno: true,
  validar(p, j) {
    if (!p.jugadores[j.jugador].mano.includes(j.carta)) return no("noEnMano", "Esa carta no está en tu mano.");
    const def = defCarta(p, j.carta);
    if (def.mazo !== "acciones") return no("noEsAccion", "Esa carta no es de acción.");
    const efecto = efectoAccion(p, j.carta);
    if (!efecto) return no("sinEfecto", "Esta carta no tiene efecto programado.");
    if (efecto.blanco === "reaccion") return motivoBlanco(p, j, efecto);
    const maximo = p.ajustes.jugablesPorTurno.acciones;
    if (p.turno.accionesJugadas >= maximo) {
      return no("yaAcciones", maximo === 1 ? "Ya has jugado una acción este turno." : `Ya has jugado ${maximo} acciones este turno.`, { n: maximo });
    }
    return motivoBlanco(p, j, efecto) ?? efecto.validar?.(p, j, def.parametros) ?? null;
  },
  aplicar(p, j) {
    const jugador = p.jugadores[j.jugador];
    const def = defCarta(p, j.carta);
    jugador.mano = jugador.mano.filter((c) => c !== j.carta);
    p.descartes.acciones.push(j.carta);
    p.turno.accionesJugadas++;
    anotar(p, "juega", { jugador: j.jugador, carta: def.id }, `${jugador.nombre} juega ${def.nombre}.`);

    const defensor = j.objetivo?.jugador;
    if (defensor !== undefined && efectoAccion(p, j.carta)!.etiquetas.includes("fastidio") && esperaReaccion(p, j.jugador, defensor)) {
      p.reaccion = { jugada: j, defensor };
      anotar(p, "puedeResponder", { jugador: defensor }, `${p.jugadores[defensor].nombre} puede responder con una carta de reacción.`);
      return;
    }
    resolverAccion(p, j);
  },
};
