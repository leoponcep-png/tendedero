import { enJuego, type Ajustes } from "../ajustes";
import { barajar, semillaNueva, sembrar } from "../azar";
import type { Datos } from "../datos/esquemas";
import { anotar } from "./registro";
import { empezarReparto, renovarCestas } from "./reparto";
import { inicioDeRonda } from "./ronda";
import type { Partida } from "./tipos";
import { humedadMaxima, pilaDe, robar } from "./utilidades";

export function crearPartida(datos: Datos, ajustesElegidos: Ajustes): Partida {
  const semilla = ajustesElegidos.semilla.trim() || semillaNueva();
  const ajustes = structuredClone({ ...ajustesElegidos, semilla });
  // Las partidas guardadas con el antiguo modo «larga» ya no lo llevan: se juegan con las reglas de siempre.
  delete (ajustes as { modo?: unknown }).modo;

  const p: Partida = {
    version: 1,
    ajustes,
    semilla,
    azar: sembrar(semilla),
    catalogo: {
      colores: Object.fromEntries(datos.colores.map((c) => [c.id, c])),
      tipos: Object.fromEntries(datos.tipos.map((t) => [t.id, { ...t, ...ajustes.prendas[t.id] }])),
      cartas: {},
      objetivos: {},
    },
    prendas: {},
    cartas: {},
    bolsa: [],
    cestas: Array.from({ length: ajustes.cestas.numero }, () => []),
    centro: [],
    perdidas: [],
    dia: null,
    diaDesde: null,
    mazos: { cuerdas: [], acciones: [], dia: [] },
    descartes: { cuerdas: [], acciones: [], dia: [] },
    objetivosComunes: [],
    jugadores: [],
    turno: { numero: 0, jugador: 0, fase: "cesta", cuerdasJugadas: 0, cuerdasExtra: 0, accionesJugadas: 0 },
    ronda: 1,
    rondaProtegeDe: [],
    reaccion: null,
    ultimaRonda: false,
    primeroEnLlegar: null,
    registro: [],
    entradas: [],
    terminada: false,
    final: null,
  };

  for (const tipo of datos.tipos) {
    for (const color of datos.colores) {
      for (let i = 1; i <= tipo.porColor; i++) {
        const id = `${tipo.id}-${color.id}-${i}`;
        p.prendas[id] = { id, tipo: tipo.id, color: color.id, humedad: Math.min(humedadMaxima(p), p.catalogo.tipos[tipo.id].humedad) };
        p.bolsa.push(id);
      }
    }
  }
  barajar(p, p.bolsa);

  for (const def of datos.cartas) {
    if (!enJuego(def, ajustes)) continue;
    p.catalogo.cartas[def.id] = def;
    for (let i = 1; i <= def.copias; i++) {
      const id = `${def.id}#${i}`;
      p.cartas[id] = def.id;
      p.mazos[pilaDe(def.mazo)].push(id);
    }
  }
  barajar(p, p.mazos.cuerdas);
  barajar(p, p.mazos.acciones);
  barajar(p, p.mazos.dia);

  const objetivos = datos.objetivos.filter((o) => enJuego(o, ajustes));
  for (const o of objetivos) p.catalogo.objetivos[o.id] = o;
  // Un solo montón: los primeros son los comunes y del resto se reparten los secretos.
  const secretos = objetivos.map((o) => o.id);
  barajar(p, secretos);
  p.objetivosComunes = secretos.splice(0, ajustes.objetivos.comunes);

  for (let i = 0; i < ajustes.jugadores; i++) {
    p.jugadores.push({
      nombre: `Jugador ${i + 1}`,
      lineas: Array.from({ length: ajustes.tendedero.lineas }, () => ({ cartas: [] })),
      mano: [],
      pendientes: [],
      seca: [],
      secadoEn: {},
      trofeos: [],
      objetivosOfrecidos: secretos.splice(0, ajustes.objetivos.secretosRepartidos),
      objetivoSecreto: null,
      puntos: 0,
    });
    robar(p, i, "cuerdas", ajustes.manoInicial.cuerdas);
    robar(p, i, "acciones", ajustes.manoInicial.acciones);
  }

  anotar(p, "partidaCreada", { n: ajustes.jugadores }, `Partida creada con la semilla "${semilla}" para ${ajustes.jugadores} jugadores.`);
  inicioDeRonda(p);
  renovarCestas(p);
  empezarReparto(p);
  return p;
}

/**
 * Pone al día una partida guardada con una versión anterior. Hoy solo hace una cosa: las que se empezaron con el
 * antiguo modo «Partida larga» (`ajustes.modo`, ya no existe) siguen como partidas normales, con la meta, las cuerdas
 * por turno, los puntos de las prendas y los ritmos de los objetivos de siempre. Lo demás no se toca. Devuelve una
 * copia si cambia algo; si no, la misma partida.
 */
export function partidaAlDia(p: Partida, datos: Datos): Partida {
  const viejo = p.ajustes as Partida["ajustes"] & { modo?: unknown };
  if (viejo.modo === undefined) return p;
  const q = structuredClone(p);
  const a = q.ajustes as Partida["ajustes"] & { modo?: unknown };
  const eraLarga = a.modo === "larga";
  delete a.modo;
  if (!eraLarga) return q;
  a.umbralFinal = datos.porDefecto.umbralFinal;
  a.jugablesPorTurno = structuredClone(datos.porDefecto.jugablesPorTurno);
  for (const t of datos.tipos) {
    if (a.prendas[t.id]) a.prendas[t.id].puntos = t.puntos;
    if (q.catalogo.tipos[t.id]) q.catalogo.tipos[t.id].puntos = t.puntos;
  }
  for (const o of datos.objetivos) {
    const enPartida = q.catalogo.objetivos[o.id];
    if (enPartida) q.catalogo.objetivos[o.id] = { ...enPartida, cada: o.cada, puntos: o.puntos };
  }
  return q;
}
