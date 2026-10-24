// Los 12 idiomas del juego. `nombre` va en su propio idioma (así se reconoce en el selector aunque no entiendas
// el idioma que está puesto), `locale` es el que se pasa a Intl (plurales, fechas, números) y `steam` es el
// código de idioma de la API de Steam (SteamApps()->GetCurrentGameLanguage()), para cuando el juego se publique allí.

export type Idioma = "es" | "en" | "fr" | "de" | "it" | "pt-BR" | "ru" | "pl" | "tr" | "zh-Hans" | "ja" | "ko";

export interface DatosIdioma {
  id: Idioma;
  nombre: string;
  locale: string;
  steam: string;
  /** Alfabeto que necesita la letra: el latino lo traen las tipografías del juego; el resto, las de respaldo. */
  escritura: "latina" | "cirilica" | "china" | "japonesa" | "coreana";
}

export const IDIOMAS: DatosIdioma[] = [
  { id: "es", nombre: "Español", locale: "es-ES", steam: "spanish", escritura: "latina" },
  { id: "en", nombre: "English", locale: "en-US", steam: "english", escritura: "latina" },
  { id: "fr", nombre: "Français", locale: "fr-FR", steam: "french", escritura: "latina" },
  { id: "de", nombre: "Deutsch", locale: "de-DE", steam: "german", escritura: "latina" },
  { id: "it", nombre: "Italiano", locale: "it-IT", steam: "italian", escritura: "latina" },
  { id: "pt-BR", nombre: "Português (Brasil)", locale: "pt-BR", steam: "brazilian", escritura: "latina" },
  { id: "ru", nombre: "Русский", locale: "ru-RU", steam: "russian", escritura: "cirilica" },
  { id: "pl", nombre: "Polski", locale: "pl-PL", steam: "polish", escritura: "latina" },
  { id: "tr", nombre: "Türkçe", locale: "tr-TR", steam: "turkish", escritura: "latina" },
  { id: "zh-Hans", nombre: "简体中文", locale: "zh-CN", steam: "schinese", escritura: "china" },
  { id: "ja", nombre: "日本語", locale: "ja-JP", steam: "japanese", escritura: "japonesa" },
  { id: "ko", nombre: "한국어", locale: "ko-KR", steam: "koreana", escritura: "coreana" },
];

export const IDIOMA_RESERVA: Idioma = "es";

export const datosIdioma = (id: Idioma): DatosIdioma => IDIOMAS.find((i) => i.id === id) ?? IDIOMAS[0];

export const esIdioma = (x: unknown): x is Idioma => IDIOMAS.some((i) => i.id === x);

/**
 * El idioma del juego que mejor encaja con un código BCP 47 del navegador («de-AT» → alemán, «pt-PT» → portugués
 * de Brasil, «zh-TW» → chino simplificado, a falta de tradicional). null si no tenemos ese idioma.
 */
export function idiomaDeCodigo(codigo: string): Idioma | null {
  const c = codigo.toLowerCase();
  const base = c.split("-")[0];
  if (base === "pt") return "pt-BR";
  if (base === "zh") return "zh-Hans";
  return IDIOMAS.find((i) => i.id.toLowerCase() === base)?.id ?? null;
}

/** El primero de los idiomas preferidos del navegador que tengamos; si ninguno, español. */
export function idiomaDelNavegador(preferidos: readonly string[] = typeof navigator === "undefined" ? [] : (navigator.languages ?? [navigator.language])): Idioma {
  for (const codigo of preferidos) {
    const id = idiomaDeCodigo(codigo);
    if (id) return id;
  }
  return IDIOMA_RESERVA;
}

/**
 * Steam: el idioma que el jugador eligió para el juego en su biblioteca. Cuando el juego corra en Steam (Electron +
 * steamworks.js o greenworks), al arrancar bastará con algo así:
 *   const id = idiomaDeSteam(steamworks.apps.getCurrentGameLanguage());
 *   if (id && !hayIdiomaGuardado()) cambiarIdioma(id);
 * «latam» (español de Latinoamérica) cae en el español; «tchinese» (chino tradicional), en el simplificado.
 */
export function idiomaDeSteam(steam: string): Idioma | null {
  if (steam === "latam") return "es";
  if (steam === "tchinese") return "zh-Hans";
  if (steam === "portuguese") return "pt-BR";
  return IDIOMAS.find((i) => i.steam === steam)?.id ?? null;
}

/** El código de Steam de uno de nuestros idiomas (para la página de la tienda o las pruebas). */
export const idiomaASteam = (id: Idioma): string => datosIdioma(id).steam;
