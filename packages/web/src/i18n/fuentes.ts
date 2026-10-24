import type { DatosIdioma } from "./idiomas";
import "./fuentes.css";

// Tipografías de respaldo por alfabeto. Las del juego (Alegreya SC, Alegreya Sans, Nunito, Fredoka, Baloo 2…) no
// traen chino, japonés ni coreano, y algunas tampoco cirílico. Todas las pilas de letra del juego llevan
// var(--fuente-respaldo) antes de la genérica: para los caracteres que no tiene la letra del estilo se usa la de
// respaldo del idioma. La de Google Fonts se pide solo la primera vez que se elige un idioma que la necesita (y
// Google parte cada letra en trozos por unicode-range, así que solo se descargan los caracteres que salen).

const RESPALDO: Record<DatosIdioma["escritura"], { familias: string; url?: string }> = {
  // Nunito ya se carga en index.html y tiene latino extendido (polaco, turco) y cirílico.
  latina: { familias: '"Nunito"' },
  cirilica: { familias: '"Nunito"' },
  china: { familias: '"Noto Sans SC"', url: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500;700;900&display=swap" },
  // M PLUS Rounded 1c (redondeada, como el juego) ya se carga en index.html y tiene japonés.
  japonesa: {
    familias: '"M PLUS Rounded 1c", "Noto Sans JP"',
    url: "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&family=Noto+Sans+JP:wght@500;700;900&display=swap",
  },
  coreana: { familias: '"Noto Sans KR"', url: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&display=swap" },
};

const pedidas = new Set<string>();

/** Pone la letra de respaldo del alfabeto y, si hace falta, pide su hoja a Google Fonts (una sola vez). */
export function cargarFuentes(escritura: DatosIdioma["escritura"]): void {
  if (typeof document === "undefined") return;
  const r = RESPALDO[escritura];
  document.documentElement.style.setProperty("--fuente-respaldo", r.familias);
  if (!r.url || pedidas.has(r.url)) return;
  pedidas.add(r.url);
  const enlace = document.createElement("link");
  enlace.rel = "stylesheet";
  enlace.href = r.url;
  document.head.appendChild(enlace);
}
