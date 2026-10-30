import { hayTexto, tLibre } from "../../i18n";
import { CLAVES, guardarJSON, leerJSON } from "./almacen";
import { calcularEstadisticas, type Estadisticas } from "./estadisticas";
import type { Icono } from "./Iconos";
import { plataforma } from "./plataforma";
import type { ResumenPartida } from "./registro";

// Logros: cada uno mira un número de las estadísticas y se consigue al llegar a su meta. Casi todos regalan algo
// (personaje, color, tapete, marco del avatar, título o fondo de mesa): todo lo que es recompensa de un logro
// empieza bloqueado. Libres desde el principio: 4 personajes, 4 colores, 2 tapetes, el marco sencillo, el título
// de aprendiz y el fondo de roble.

export type TipoRecompensa = "animal" | "tapete" | "color" | "marco" | "titulo" | "fondo";
export interface Recompensa {
  tipo: TipoRecompensa;
  /** id del animal, tapete, marco, título o fondo; para colores, el valor (#rrggbb) como en Perfil.color. */
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
  /** Lo que regala al conseguirlo (puede ser más de una cosa). */
  recompensas?: Recompensa[];
}

// Atajos para escribir las recompensas de la lista.
const animal = (id: string): Recompensa => ({ tipo: "animal", id });
const tapete = (id: string): Recompensa => ({ tipo: "tapete", id });
const color = (id: string): Recompensa => ({ tipo: "color", id });
const marco = (id: string): Recompensa => ({ tipo: "marco", id });
const titulo = (id: string): Recompensa => ({ tipo: "titulo", id });
const fondo = (id: string): Recompensa => ({ tipo: "fondo", id });
const multi = (e: Estadisticas) => e.porJugadores[3].partidas + e.porJugadores[4].partidas;

// Ordenados por cuándo suelen caer: unos cuantos en las primeras partidas y otros para mucho más adelante.
export const LOGROS: Logro[] = [
  // --- Primeras partidas ---
  { id: "aprendiz", steam: "ACH_TUTORIAL", nombre: "Aprendiz de la colada", descripcion: "Termina la partida tutorial «Aprender a jugar».", icono: "pinza", meta: 1, valor: () => (leerJSON<string | null>(CLAVES.tutorial, null) ? 1 : 0) },
  { id: "primera-colada", steam: "ACH_PRIMERA_COLADA", nombre: "Primera colada", descripcion: "Juega tu primera partida.", icono: "cesta", meta: 1, valor: (e) => e.partidas, recompensas: [tapete("rayas"), color("#5cbf9b")] },
  { id: "todo-seco", steam: "ACH_PRIMERA_VICTORIA", nombre: "¡Todo seco!", descripcion: "Gana tu primera partida.", icono: "copa", meta: 1, valor: (e) => e.ganadas, recompensas: [animal("buho"), marco("madera")] },
  { id: "pinza-a-pinza", steam: "ACH_10_PRENDAS", nombre: "Pinza a pinza", descripcion: "Seca 10 prendas en total.", icono: "pinza", meta: 10, valor: (e) => e.prendasSecas, recompensas: [animal("rana"), color("#c2457a")] },
  { id: "tres-coladas", steam: "ACH_3_PARTIDAS", nombre: "Le vas cogiendo el tranquillo", descripcion: "Juega 3 partidas.", icono: "cesta", meta: 3, valor: (e) => e.partidas, recompensas: [animal("mapache"), color("#74892c")] },
  { id: "pensado", steam: "ACH_OBJETIVO_SECRETO", nombre: "Lo tenía todo pensado", descripcion: "Cumple tu objetivo secreto.", icono: "secreto", meta: 1, valor: (e) => e.objetivosCumplidos, recompensas: [animal("gato"), color("#8e5bb5")] },
  { id: "casa-con-jaleo", steam: "ACH_PARTIDA_3_JUGADORES", nombre: "Casa con jaleo", descripcion: "Juega una partida de 3 o 4 jugadores.", icono: "amigos", meta: 1, valor: multi, recompensas: [animal("ardilla"), fondo("pino")] },
  { id: "vecina-traviesa", steam: "ACH_5_FASTIDIOS", nombre: "Vecina traviesa", descripcion: "Juega 5 cartas de fastidio.", icono: "rayo", meta: 5, valor: (e) => e.fastidiosJugados, recompensas: [tapete("lunares"), color("#e86f5a")] },
  { id: "hola-vecinos", steam: "ACH_JUGAR_ONLINE", nombre: "Hola, vecinos", descripcion: "Juega una partida online.", icono: "mundo", meta: 1, valor: (e) => e.online.partidas, recompensas: [animal("tortuga"), color("#6aa6dc")] },
  // --- A medio plazo ---
  { id: "vecina", steam: "ACH_10_PARTIDAS", nombre: "Vecina del tendedero", descripcion: "Juega 10 partidas.", icono: "casa", meta: 10, valor: (e) => e.partidas, recompensas: [animal("oso"), fondo("nogal"), color("#75482a")] },
  { id: "entrenamiento", steam: "ACH_10_PARTIDAS_IA", nombre: "Entrenamiento de patio", descripcion: "Juega 10 partidas contra la IA.", icono: "robot", meta: 10, valor: (e) => e.contraIA.partidas, recompensas: [animal("gallina"), color("#d987b0")] },
  { id: "sol-mediodia", steam: "ACH_50_PRENDAS", nombre: "Sol de mediodía", descripcion: "Seca 50 prendas en total.", icono: "sol", meta: 50, valor: (e) => e.prendasSecas, recompensas: [tapete("hojas"), color("#1f9aa8")] },
  { id: "en-racha", steam: "ACH_RACHA_3", nombre: "En racha", descripcion: "Gana 3 partidas seguidas.", icono: "llama", meta: 3, valor: (e) => e.mejorRacha, recompensas: [marco("cuerda"), color("#8f2f3c")] },
  { id: "casa-llena", steam: "ACH_GANAR_A_4", nombre: "Casa llena", descripcion: "Gana una partida de 4 jugadores.", icono: "casa", meta: 1, valor: (e) => e.porJugadores[4].ganadas, recompensas: [animal("tejon"), fondo("baldosas")] },
  { id: "vecinos-internet", steam: "ACH_GANAR_ONLINE", nombre: "Vecinos de internet", descripcion: "Gana una partida online.", icono: "mundo", meta: 1, valor: (e) => e.online.ganadas, recompensas: [animal("nutria"), titulo("vecina-red")] },
  { id: "costumbre", steam: "ACH_7_DIAS", nombre: "Costumbre de barrio", descripcion: "Juega en 7 días distintos.", icono: "sol", meta: 7, valor: (e) => e.diasJugados, recompensas: [animal("oveja"), tapete("nubes")] },
  { id: "mala-vecina", steam: "ACH_25_FASTIDIOS", nombre: "Mala vecina", descripcion: "Juega 25 cartas de fastidio.", icono: "rayo", meta: 25, valor: (e) => e.fastidiosJugados, recompensas: [animal("pato"), titulo("terror")] },
  { id: "viento-marea", steam: "ACH_GANAR_CON_FASTIDIOS", nombre: "Contra viento y marea", descripcion: "Gana una partida en la que te hayan jugado 3 fastidios o más.", icono: "paraguas", meta: 1, valor: (e) => e.ganadasConFastidios, recompensas: [tapete("pinzas"), titulo("impermeable")] },
  { id: "paliza", steam: "ACH_GANAR_POR_10", nombre: "Paliza de colada", descripcion: "Gana con 10 puntos o más de ventaja.", icono: "estrella", meta: 10, valor: (e) => e.mayorVentaja, recompensas: [tapete("flores"), color("#33302e")] },
  { id: "maquina", steam: "ACH_5_VICTORIAS_IA", nombre: "Más lista que la máquina", descripcion: "Gana 5 partidas contra la IA.", icono: "robot", meta: 5, valor: (e) => e.contraIA.ganadas, recompensas: [color("#9b8de0"), titulo("cerebro")] },
  { id: "tendedero-lleno", steam: "ACH_14_PRENDAS_PARTIDA", nombre: "Tendedero a rebosar", descripcion: "Seca 14 prendas en una sola partida.", icono: "camiseta", meta: 14, valor: (e) => e.mejorPrendas, recompensas: [tapete("calcetines"), color("#f08a24")] },
  { id: "record", steam: "ACH_40_PUNTOS", nombre: "Récord de tendedero", descripcion: "Consigue 40 puntos en una partida.", icono: "diana", meta: 40, valor: (e) => e.mejorPuntuacion, recompensas: [color("#283f73"), titulo("plusmarquista")] },
  { id: "todos-los-tamanos", steam: "ACH_GANAR_2_3_4", nombre: "Para todos los gustos", descripcion: "Gana partidas de 2, de 3 y de 4 jugadores.", icono: "amigos", meta: 3, valor: (e) => [2, 3, 4].filter((n) => e.porJugadores[n as 2 | 3 | 4].ganadas > 0).length, recompensas: [tapete("escoces"), color("#56606d")] },
  // --- A largo plazo ---
  { id: "campeona", steam: "ACH_10_VICTORIAS", nombre: "Campeona del patio", descripcion: "Gana 10 partidas.", icono: "medalla", meta: 10, valor: (e) => e.ganadas, recompensas: [tapete("estrellas"), marco("plata"), titulo("campeona")] },
  { id: "imparable", steam: "ACH_RACHA_5", nombre: "Imparable", descripcion: "Gana 5 partidas seguidas.", icono: "llama", meta: 5, valor: (e) => e.mejorRacha, recompensas: [animal("castor"), marco("laurel")] },
  { id: "agente-secreto", steam: "ACH_10_OBJETIVOS", nombre: "Agente secreto", descripcion: "Cumple el objetivo secreto en 10 partidas.", icono: "secreto", meta: 10, valor: (e) => e.objetivosCumplidos, recompensas: [tapete("ondas"), titulo("agente")] },
  { id: "secadero", steam: "ACH_250_PRENDAS", nombre: "Secadero mayor", descripcion: "Seca 250 prendas en total.", icono: "camiseta", meta: 250, valor: (e) => e.prendasSecas, recompensas: [color("#12a35c"), titulo("rey-calcetin")] },
  { id: "colada-sin-fin", steam: "ACH_50_PARTIDAS", nombre: "Colada sin fin", descripcion: "Juega 50 partidas.", icono: "cesta", meta: 50, valor: (e) => e.partidas, recompensas: [tapete("rombos"), fondo("mantel")] },
  { id: "leyenda", steam: "ACH_25_VICTORIAS", nombre: "Leyenda del tendal", descripcion: "Gana 25 partidas.", icono: "corona", meta: 25, valor: (e) => e.ganadas, recompensas: [animal("ciervo"), marco("oro"), titulo("leyenda")] },
  { id: "temporada", steam: "ACH_30_DIAS", nombre: "Toda una temporada", descripcion: "Juega en 30 días distintos.", icono: "sol", meta: 30, valor: (e) => e.diasJugados, recompensas: [fondo("cesped"), marco("arcoiris")] },
  { id: "lavanderia", steam: "ACH_1000_PRENDAS", nombre: "Lavandería industrial", descripcion: "Seca 1000 prendas en total.", icono: "camiseta", meta: 1000, valor: (e) => e.prendasSecas, recompensas: [tapete("espiga"), color("#5b2a6e")] },
  { id: "gran-maestra", steam: "ACH_50_VICTORIAS", nombre: "Gran maestra del tendal", descripcion: "Gana 50 partidas.", icono: "corona", meta: 50, valor: (e) => e.ganadas, recompensas: [titulo("gran-maestra")] },
];

// `nombre` y `descripcion` de arriba son los de español (y los de Steamworks); en pantalla salen traducidos.
export const nombreLogro = (l: Logro) => (hayTexto(`logro.${l.id}.nombre`) ? tLibre(`logro.${l.id}.nombre`) : l.nombre);
export const descripcionLogro = (l: Logro) => (hayTexto(`logro.${l.id}.desc`) ? tLibre(`logro.${l.id}.desc`) : l.descripcion);

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
  // En Steam, tus números se ven en tu perfil (los nombres tienen que existir como estadísticas en Steamworks).
  p.publicarEstadisticas?.({ partidas: e.partidas, ganadas: e.ganadas, prendas_secas: e.prendasSecas, mejor_racha: e.mejorRacha, mejor_puntuacion: e.mejorPuntuacion });
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

/** Logro que regala esto, o undefined si es libre desde el principio. */
export function logroQueDa(tipo: TipoRecompensa, id: string): Logro | undefined {
  return LOGROS.find((l) => l.recompensas?.some((r) => r.tipo === tipo && r.id === id));
}

// Lo que un perfil guardado ya usaba antes de que pasara a ser recompensa se le respeta: queda desbloqueado
// para siempre en este navegador («tipo:id»).
const clave = (tipo: TipoRecompensa, id: string) => `${tipo}:${id}`;

export function heredados(): string[] {
  const lista = leerJSON<string[]>(CLAVES.heredados, []);
  return Array.isArray(lista) ? lista : [];
}

/** Marca como ya tuyas las cosas que usa un perfil y que ahora estarían bloqueadas. */
export function respetarElegidas(cosas: Recompensa[], hechos: Record<string, string> = logrosConseguidos()): void {
  const ya = heredados();
  const nuevas = cosas.filter((r) => r.id && bloqueo(r.tipo, r.id, hechos, ya)).map((r) => clave(r.tipo, r.id));
  if (nuevas.length) guardarJSON(CLAVES.heredados, [...ya, ...nuevas]);
}

/** Si sigue bloqueado, el logro que hay que conseguir; si ya está disponible, undefined. */
export function bloqueo(tipo: TipoRecompensa, id: string, hechos: Record<string, string> = logrosConseguidos(), ya: string[] = heredados()): Logro | undefined {
  const logro = logroQueDa(tipo, id);
  return logro && !hechos[logro.id] && !ya.includes(clave(tipo, id)) ? logro : undefined;
}
