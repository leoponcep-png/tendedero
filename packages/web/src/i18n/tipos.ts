import type { es } from "./es";

// Tipos de los diccionarios. El español (es.ts) es el original y marca qué claves existen; los demás idiomas
// pueden dejarse claves sin traducir: lo que falta se enseña en español.
//
// Plurales: una clave con plural se escribe varias veces con «#categoría» detrás, con las categorías de
// Intl.PluralRules de cada idioma (zero, one, two, few, many, other). En español basta con #one y #other; en
// ruso o polaco hacen falta #one, #few, #many y #other; en japonés, chino y coreano, solo #other.

export type Categoria = "zero" | "one" | "two" | "few" | "many" | "other";

type ClaveEs = keyof typeof es & string;

/** Claves que tienen plural, sin el «#categoría». */
export type ClavePlural = ClaveEs extends `${infer B}#${string}` ? B : never;

/** Las claves que se piden con t(): las simples y las de plural sin su «#categoría». */
export type Clave = Exclude<ClaveEs, `${string}#${string}`> | ClavePlural;

/** Lo que puede traer un diccionario de otro idioma. */
export type TextosUi = Partial<Record<Exclude<ClaveEs, `${string}#${string}`> | `${ClavePlural}#${Categoria}`, string>>;

/** Nombre y texto de una carta en otro idioma (en español salen de /data/*.json). */
export interface TextoCarta {
  nombre?: string;
  texto?: string;
}

export interface Textos {
  ui: TextosUi;
  /**
   * Cartas por su id de /data: acciones.json, cuerdas.json y dia.json. En las del día, `texto` va sin la duración
   * del principio («1 día:»): la duración ya sale en el sello de la carta.
   */
  cartas: Record<string, TextoCarta>;
  /** Objetivos por su id de /data/objetivos.json. */
  objetivos: Record<string, TextoCarta>;
}

/** Valores que se meten en los {huecos} de un texto. `n` decide además el plural. */
export type Variables = Record<string, string | number>;
