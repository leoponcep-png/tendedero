import { useSyncExternalStore } from "react";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { cargarFuentes } from "./fuentes";
import { datosIdioma, esIdioma, IDIOMA_RESERVA, idiomaDelNavegador, type Idioma } from "./idiomas";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pl } from "./pl";
import { ptBR } from "./pt-BR";
import { ru } from "./ru";
import type { Categoria, Clave, Textos, Variables } from "./tipos";
import { tr } from "./tr";
import { zhHans } from "./zh-Hans";

// Traducción del juego, sin dependencias: diccionarios por idioma (es.ts es el original), una función t() con
// {variables} y plurales (Intl.PluralRules), el idioma guardado en localStorage y, la primera vez, el del navegador.
// Lo que falte en un idioma sale en español; lo que falte también en español, la propia clave (y nunca se rompe).
//
//   const t = useT();                    // en un componente: se vuelve a pintar al cambiar de idioma
//   t("menu.empezar")                    // «Empezar partida»
//   t("perfil.partidas", { n: 3 })       // elige «#one» u «#other» (o las que tenga el idioma) según n

export type { Idioma } from "./idiomas";
export { IDIOMAS, datosIdioma, idiomaDeSteam, idiomaASteam } from "./idiomas";
export type { Clave, Variables } from "./tipos";

const DICCIONARIOS: Record<Idioma, Textos> = {
  es: { ui: es, cartas: {}, objetivos: {} },
  en,
  fr,
  de,
  it,
  "pt-BR": ptBR,
  ru,
  pl,
  tr,
  "zh-Hans": zhHans,
  ja,
  ko,
};

const CLAVE_GUARDADA = "tendedero-idioma";

function leerGuardado(): Idioma | null {
  try {
    const v = localStorage.getItem(CLAVE_GUARDADA);
    return esIdioma(v) ? v : null;
  } catch {
    return null;
  }
}

/** Si el jugador ya eligió idioma alguna vez (en Steam, si no lo eligió, manda el idioma de Steam). */
export const hayIdiomaGuardado = () => leerGuardado() !== null;

let actual: Idioma = leerGuardado() ?? idiomaDelNavegador();
const avisar = new Set<() => void>();
const reglas = new Map<string, Intl.PluralRules>();

function aplicarAlDocumento(id: Idioma) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = id;
  cargarFuentes(datosIdioma(id).escritura);
}
aplicarAlDocumento(actual);

export const idiomaActual = (): Idioma => actual;

/** Cambia el idioma de todo el juego y lo recuerda para la próxima vez. */
export function cambiarIdioma(id: Idioma): void {
  if (id === actual) return;
  actual = id;
  try {
    localStorage.setItem(CLAVE_GUARDADA, id);
  } catch {
    // Sin almacenamiento solo se pierde la elección al recargar.
  }
  aplicarAlDocumento(id);
  avisar.forEach((f) => f());
}

function suscribir(f: () => void) {
  avisar.add(f);
  return () => avisar.delete(f);
}

/** El idioma actual; el componente se vuelve a pintar cuando cambia. */
export function useIdioma(): Idioma {
  return useSyncExternalStore(suscribir, idiomaActual, idiomaActual);
}

function categoria(id: Idioma, n: number): Categoria {
  const locale = datosIdioma(id).locale;
  let r = reglas.get(locale);
  if (!r) {
    r = new Intl.PluralRules(locale);
    reglas.set(locale, r);
  }
  return r.select(n) as Categoria;
}

/** El texto crudo (con sus {huecos}) de una clave en un idioma, mirando los plurales; undefined si no está. */
function buscar(id: Idioma, clave: string, n: number | undefined): string | undefined {
  const ui = DICCIONARIOS[id].ui as Record<string, string | undefined>;
  if (n !== undefined) {
    const v = ui[`${clave}#${categoria(id, n)}`] ?? ui[`${clave}#other`];
    if (v !== undefined) return v;
  }
  return ui[clave] ?? (n === undefined ? ui[`${clave}#other`] : undefined);
}

/** Mete las variables en los {huecos}; los números van con el formato del idioma solo si son grandes. */
export function rellenar(texto: string, vars?: Variables): string {
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (todo, nombre: string) => (nombre in vars ? String(vars[nombre]) : todo));
}

/** Traduce una clave al idioma actual (o al que se diga). */
export function t(clave: Clave, vars?: Variables, id: Idioma = actual): string {
  return tLibre(clave, vars, id);
}

/** Como t(), con claves que se arman en el momento (p. ej. `registro.${clave}`). Si no existe, devuelve la clave. */
export function tLibre(clave: string, vars?: Variables, id: Idioma = actual): string {
  const n = typeof vars?.n === "number" ? vars.n : undefined;
  const texto = buscar(id, clave, n) ?? buscar(IDIOMA_RESERVA, clave, n);
  return texto === undefined ? clave : rellenar(texto, vars);
}

/** Si una clave existe (en el idioma actual o en español). */
export function hayTexto(clave: string): boolean {
  return buscar(actual, clave, undefined) !== undefined || buscar(IDIOMA_RESERVA, clave, undefined) !== undefined;
}

/** Nombre o texto de una carta traducido; si no hay traducción, el español de /data que se pasa. */
export function textoCarta(id: string, campo: "nombre" | "texto", espanol: string): string {
  return DICCIONARIOS[actual].cartas[id]?.[campo] ?? espanol;
}

/** Nombre o texto de un objetivo traducido; si no hay traducción, el español de /data. */
export function textoObjetivo(id: string, campo: "nombre" | "texto", espanol: string): string {
  return DICCIONARIOS[actual].objetivos[id]?.[campo] ?? espanol;
}

/** Si las cartas del idioma actual tienen su propia traducción (si no, se usa el texto en español tal cual). */
export const cartaTraducida = (id: string, campo: "nombre" | "texto") => DICCIONARIOS[actual].cartas[id]?.[campo] !== undefined;

/** Para fechas y números: el locale de Intl del idioma actual. */
export const localeActual = () => datosIdioma(actual).locale;

/** Fecha en el idioma actual. */
export function fecha(iso: string, opciones: Intl.DateTimeFormatOptions): string {
  try {
    return new Date(iso).toLocaleDateString(localeActual(), opciones);
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * La función de traducción para un componente: con ella el componente se vuelve a pintar al cambiar de idioma.
 * Es la misma t() de siempre (también vale fuera de React, p. ej. en las animaciones).
 */
export function useT(): typeof t {
  useIdioma();
  return t;
}
