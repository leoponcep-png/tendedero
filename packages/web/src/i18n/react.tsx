import { Fragment, type ReactNode } from "react";
import { cambiarIdioma, IDIOMAS, tLibre, useIdioma, useT, type Clave, type Idioma } from ".";
import "./idioma.css";

// Piezas de React para la traducción: un texto con huecos que son elementos (p. ej. un nombre en negrita) y el
// selector de idioma.

/**
 * Como t(), pero los huecos pueden ser elementos de React: «Pásale este enlace a {nombre}:» con
 * { nombre: <strong>Ana</strong> }. Los números y textos se meten tal cual.
 */
export function tNodos(clave: Clave, vars: Record<string, ReactNode>): ReactNode {
  const simples: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(vars)) if (typeof v === "string" || typeof v === "number") simples[k] = v;
  // Se traduce con los huecos de elementos sin rellenar y luego se cortan por ellos.
  const texto = tLibre(clave, simples);
  const piezas = texto.split(/(\{\w+\})/g);
  return piezas.map((pieza, i) => {
    const m = /^\{(\w+)\}$/.exec(pieza);
    return <Fragment key={i}>{m && m[1] in vars ? vars[m[1]] : pieza}</Fragment>;
  });
}

/**
 * Selector de idioma: cada idioma con su nombre en su propio idioma. `compacto` lo deja en un desplegable
 * pequeño (para barras); si no, con su etiqueta delante.
 */
export function SelectorIdioma({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  const t = useT();
  const idioma = useIdioma();
  const lista = (
    <select value={idioma} onChange={(e) => cambiarIdioma(e.target.value as Idioma)} aria-label={t("idioma.elegir")} title={t("idioma.elegir")}>
      {IDIOMAS.map((i) => (
        <option key={i.id} value={i.id} lang={i.id}>
          {i.nombre}
        </option>
      ))}
    </select>
  );
  return (
    <label className={`selector-idioma ${compacto ? "compacto" : ""} ${className ?? ""}`}>
      <svg viewBox="0 0 24 24" aria-hidden width="16" height="16">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      {!compacto && <span>{t("idioma.titulo")}</span>}
      {lista}
    </label>
  );
}
