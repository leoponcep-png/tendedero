import { CLAVES, guardarJSON, leerJSON } from "./almacen";
import { calcularEstadisticas, type Estadisticas } from "./estadisticas";
import type { Icono } from "./Iconos";
import { plataforma } from "./plataforma";
import type { ResumenPartida } from "./registro";

// Logros: cada uno mira un número de las estadísticas y se consigue al llegar a su meta. Algunos regalan un
// personaje, un tapete o un color: todo lo que es recompensa de un logro empieza bloqueado.

export type TipoRecompensa = "animal" | "tapete" | "color";
export interface Recompensa {
  tipo: TipoRecompensa;
  /** id del animal o del tapete; para colores, el valor (#rrggbb) como en Perfil.color. */
  id: string;
}

export interface Logro {
  id: string;
  /** Nombre de la API del logro en Steamworks. */
  steam: string;
  nombre: string;
  descripcion: string;
  icono: Icono;
  meta: number;
  valor: (e: Estadisticas) => number;
  recompensa?: Recompensa;
}

export const LOGROS: Logro[] = [
  { id: "primera-colada", steam: "ACH_PRIMERA_COLADA", nombre: "Primera colada", descripcion: "Juega tu primera partida.", icono: "cesta", meta: 1, valor: (e) => e.partidas, recompensa: { tipo: "tapete", id: "rayas" } },
  { id: "todo-seco", steam: "ACH_PRIMERA_VICTORIA", nombre: "¡Todo seco!", descripcion: "Gana tu primera partida.", icono: "copa", meta: 1, valor: (e) => e.ganadas, recompensa: { tipo: "animal", id: "buho" } },
  { id: "vecina", steam: "ACH_10_PARTIDAS", nombre: "Vecina del tendedero", descripcion: "Juega 10 partidas.", icono: "pinza", meta: 10, valor: (e) => e.partidas, recompensa: { tipo: "animal", id: "oso" } },
  { id: "sol-mediodia", steam: "ACH_50_PRENDAS", nombre: "Sol de mediodía", descripcion: "Seca 50 prendas en total.", icono: "sol", meta: 50, valor: (e) => e.prendasSecas, recompensa: { tipo: "tapete", id: "hojas" } },
  { id: "pensado", steam: "ACH_OBJETIVO_SECRETO", nombre: "Lo tenía todo pensado", descripcion: "Cumple tu objetivo secreto.", icono: "secreto", meta: 1, valor: (e) => e.objetivosCumplidos, recompensa: { tipo: "animal", id: "gato" } },
  { id: "en-racha", steam: "ACH_RACHA_3", nombre: "En racha", descripcion: "Gana 3 partidas seguidas.", icono: "llama", meta: 3, valor: (e) => e.mejorRacha, recompensa: { tipo: "tapete", id: "lunares" } },
  { id: "casa-llena", steam: "ACH_GANAR_A_4", nombre: "Casa llena", descripcion: "Gana una partida de 4 jugadores.", icono: "casa", meta: 1, valor: (e) => e.porJugadores[4].ganadas, recompensa: { tipo: "animal", id: "tejon" } },
  { id: "vecinos-internet", steam: "ACH_GANAR_ONLINE", nombre: "Vecinos de internet", descripcion: "Gana una partida online.", icono: "mundo", meta: 1, valor: (e) => e.online.ganadas, recompensa: { tipo: "animal", id: "nutria" } },
  { id: "mala-vecina", steam: "ACH_25_FASTIDIOS", nombre: "Mala vecina", descripcion: "Juega 25 cartas de fastidio.", icono: "rayo", meta: 25, valor: (e) => e.fastidiosJugados, recompensa: { tipo: "animal", id: "pato" } },
  { id: "viento-marea", steam: "ACH_GANAR_CON_FASTIDIOS", nombre: "Contra viento y marea", descripcion: "Gana una partida en la que te hayan jugado 3 fastidios o más.", icono: "paraguas", meta: 1, valor: (e) => e.ganadasConFastidios, recompensa: { tipo: "tapete", id: "pinzas" } },
  { id: "paliza", steam: "ACH_GANAR_POR_10", nombre: "Paliza de colada", descripcion: "Gana con 10 puntos o más de ventaja.", icono: "estrella", meta: 10, valor: (e) => e.mayorVentaja, recompensa: { tipo: "tapete", id: "flores" } },
  { id: "campeona", steam: "ACH_10_VICTORIAS", nombre: "Campeona del patio", descripcion: "Gana 10 partidas.", icono: "medalla", meta: 10, valor: (e) => e.ganadas, recompensa: { tipo: "tapete", id: "estrellas" } },
  { id: "maquina", steam: "ACH_5_VICTORIAS_IA", nombre: "Más lista que la máquina", descripcion: "Gana 5 partidas contra la IA.", icono: "robot", meta: 5, valor: (e) => e.contraIA.ganadas, recompensa: { tipo: "color", id: "#9b8de0" } },
  { id: "imparable", steam: "ACH_RACHA_5", nombre: "Imparable", descripcion: "Gana 5 partidas seguidas.", icono: "llama", meta: 5, valor: (e) => e.mejorRacha, recompensa: { tipo: "animal", id: "castor" } },
  { id: "agente-secreto", steam: "ACH_10_OBJETIVOS", nombre: "Agente secreto", descripcion: "Cumple el objetivo secreto en 10 partidas.", icono: "secreto", meta: 10, valor: (e) => e.objetivosCumplidos, recompensa: { tipo: "tapete", id: "ondas" } },
  { id: "todos-los-tamanos", steam: "ACH_GANAR_2_3_4", nombre: "Para todos los gustos", descripcion: "Gana partidas de 2, de 3 y de 4 jugadores.", icono: "amigos", meta: 3, valor: (e) => [2, 3, 4].filter((n) => e.porJugadores[n as 2 | 3 | 4].ganadas > 0).length },
  { id: "record", steam: "ACH_40_PUNTOS", nombre: "Récord de tendedero", descripcion: "Consigue 40 puntos en una partida.", icono: "diana", meta: 40, valor: (e) => e.mejorPuntuacion },
  { id: "colada-sin-fin", steam: "ACH_50_PARTIDAS", nombre: "Colada sin fin", descripcion: "Juega 50 partidas.", icono: "cesta", meta: 50, valor: (e) => e.partidas, recompensa: { tipo: "tapete", id: "rombos" } },
  { id: "leyenda", steam: "ACH_25_VICTORIAS", nombre: "Leyenda del tendal", descripcion: "Gana 25 partidas.", icono: "corona", meta: 25, valor: (e) => e.ganadas, recompensa: { tipo: "animal", id: "ciervo" } },
  { id: "secadero", steam: "ACH_250_PRENDAS", nombre: "Secadero mayor", descripcion: "Seca 250 prendas en total.", icono: "camiseta", meta: 250, valor: (e) => e.prendasSecas, recompensa: { tipo: "color", id: "#12a35c" } },
];

/** Evento de ventana que se lanza al conseguir logros (detail: Logro[]). AvisoLogros lo escucha. */
export const EVENTO_LOGRO = "tendedero-logro";

/** id del logro → fecha (ISO) en que se consiguió. */
export function logrosConseguidos(): Record<string, string> {
  const mapa = leerJSON<Record<string, string>>(CLAVES.logros, {});
  return mapa && typeof mapa === "object" ? mapa : {};
}

export interface EstadoLogro {
  logro: Logro;
  actual: number;
  conseguido: boolean;
  fecha?: string;
}

export function estadoLogros(partidas: ResumenPartida[]): EstadoLogro[] {
  const e = calcularEstadisticas(partidas);
  const hechos = logrosConseguidos();
  return LOGROS.map((logro) => {
    const actual = Math.max(0, logro.valor(e));
    return { logro, actual: Math.min(actual, logro.meta), conseguido: Boolean(hechos[logro.id]) || actual >= logro.meta, fecha: hechos[logro.id] };
  });
}

/** Comprueba los logros con las partidas dadas; apunta los nuevos, los deja pendientes de aviso y los devuelve. */
export function actualizarLogros(partidas: ResumenPartida[]): Logro[] {
  const e = calcularEstadisticas(partidas);
  const hechos = logrosConseguidos();
  const nuevos = LOGROS.filter((l) => !hechos[l.id] && l.valor(e) >= l.meta);
  const p = plataforma();
  for (const l of LOGROS) p.progresoLogro?.(l.steam, Math.min(l.valor(e), l.meta), l.meta);
  if (!nuevos.length) return [];
  const ahora = new Date().toISOString();
  for (const l of nuevos) {
    hechos[l.id] = ahora;
    p.desbloquearLogro(l.steam);
  }
  guardarJSON(CLAVES.logros, hechos);
  const pendientes = leerJSON<string[]>(CLAVES.logrosPendientes, []);
  guardarJSON(CLAVES.logrosPendientes, [...pendientes, ...nuevos.map((l) => l.id)]);
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_LOGRO, { detail: nuevos }));
  } catch {
    // Sin ventana (pruebas) no hay aviso; quedan pendientes.
  }
  return nuevos;
}

/** Logros conseguidos que aún no se han enseñado. Los devuelve una sola vez (los marca como vistos). */
export function comprobarLogrosNuevos(): Logro[] {
  const pendientes = leerJSON<string[]>(CLAVES.logrosPendientes, []);
  if (!pendientes.length) return [];
  guardarJSON(CLAVES.logrosPendientes, []);
  return pendientes.map((id) => LOGROS.find((l) => l.id === id)).filter((l): l is Logro => Boolean(l));
}

/** Logro que regala esto (animal, tapete o color), o undefined si es libre desde el principio. */
export function logroQueDa(tipo: TipoRecompensa, id: string): Logro | undefined {
  return LOGROS.find((l) => l.recompensa?.tipo === tipo && l.recompensa.id === id);
}

/** Si sigue bloqueado, el logro que hay que conseguir; si ya está disponible, undefined. */
export function bloqueo(tipo: TipoRecompensa, id: string, hechos: Record<string, string> = logrosConseguidos()): Logro | undefined {
  const logro = logroQueDa(tipo, id);
  return logro && !hechos[logro.id] ? logro : undefined;
}
