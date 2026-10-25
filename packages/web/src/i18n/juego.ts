import { defCarta, type Entrada, type Partida } from "@tendedero/motor";
import { hayTexto, t, textoCarta, textoObjetivo, tLibre, type Variables } from ".";

// Lo que la mesa necesita traducir de una partida del motor: nombres de cartas, de prendas y de objetivos, las
// líneas del registro estructurado (p.entradas) y los motivos por los que una jugada no vale.

/** Nombre de una carta por su definición (id + nombre en español de /data). */
export const nombreDef = (def: { id: string; nombre: string }) => textoCarta(def.id, "nombre", def.nombre);

/** Nombre de una copia de carta de la partida («basica#3» → «Cuerda básica» en el idioma actual). */
export const nombreCarta = (p: Partida, copia: string) => nombreDef(defCarta(p, copia));

/** Nombre de una carta por el id de su definición (como vienen en el registro estructurado). */
export function nombreCartaId(p: Partida, id: string): string {
  const def = p.catalogo.cartas[id];
  return def ? nombreDef(def) : id;
}

export function nombreObjetivoId(p: Partida, id: string): string {
  const def = p.catalogo.objetivos[id];
  return textoObjetivo(id, "nombre", def?.nombre ?? id);
}

/** «camiseta roja», con su concordancia en cada idioma. */
export function nombrePrendaDe(tipo: string, color: string): string {
  const clave = `prendaNombre.${tipo}.${color}`;
  return hayTexto(clave) ? tLibre(clave) : `${tLibre(`prenda.${tipo}`)} ${tLibre(`colorPrenda.${color}`)}`;
}

/** Nombre de una prenda de la partida por su id. */
export function nombrePrendaT(p: Partida, prenda: string): string {
  const pr = p.prendas[prenda];
  return pr ? nombrePrendaDe(pr.tipo, pr.color) : prenda;
}

/** Une una lista con el separador del idioma («a, b, c»). */
export function lista(cosas: string[]): string {
  return cosas.reduce((acc, x, i) => (i === 0 ? x : t("comun.lista", { a: acc, b: x })), "");
}

export interface ContextoTexto {
  p: Partida;
  /** Tu asiento: las líneas que protagonizas salen en segunda persona («.yo»). */
  yo: number;
  /** Nombre con el que se enseña cada jugador. */
  nombre: (jugador: number) => string;
}

/** Los datos de una entrada, ya convertidos en texto para los {huecos}. */
function variables(e: Entrada, c: ContextoTexto): Variables {
  const v: Variables = {};
  for (const [k, dato] of Object.entries(e.datos)) {
    if ((k === "jugador" || k === "otro") && typeof dato === "number") v[k] = c.nombre(dato);
    else if ((k === "carta" || k === "otra") && typeof dato === "string") v[k] = nombreCartaId(c.p, dato);
    else if ((k === "prenda" || k === "otraPrenda") && typeof dato === "string") v[k] = nombrePrendaDe(...(dato.split(":") as [string, string]));
    else if (k === "prendas" && Array.isArray(dato)) v[k] = lista(dato.map((x) => nombrePrendaDe(...(x.split(":") as [string, string]))));
    else if (k === "objetivos" && Array.isArray(dato))
      v[k] = lista(
        dato.map((x) => {
          const [id, pts] = x.split(":");
          return `${nombreObjetivoId(c.p, id)} +${pts}`;
        }),
      );
    else if (k === "color" && typeof dato === "string") v[k] = tLibre(`colorPrenda.${dato}`);
    else if (k === "pila" && typeof dato === "string") v[k] = tLibre(`registro.pila.${dato}`);
    else if (k === "puesto" && typeof dato === "number") v[k] = t("comun.ordinal", { n: dato });
    else if (typeof dato === "number" || typeof dato === "string") v[k] = dato;
  }
  return v;
}

/** Elige la variante «.yo» (la protagonizas tú) o «.ati» (te afecta a ti) si el idioma la tiene. */
function variante(base: string, e: Entrada, c: ContextoTexto): string {
  if (e.datos.jugador === c.yo && hayTexto(`${base}.yo`)) return `${base}.yo`;
  if (e.datos.otro === c.yo && hayTexto(`${base}.ati`)) return `${base}.ati`;
  return base;
}

/** Una línea del registro estructurado en el idioma actual. */
export function textoEntrada(e: Entrada, c: ContextoTexto): string {
  const v = variables(e, c);
  let clave = e.clave;
  if (clave === "seca" && typeof e.datos.puntos === "number" && typeof e.datos.base === "number" && e.datos.puntos !== e.datos.base) {
    clave = "secaConCuerda";
    const dif = e.datos.puntos - e.datos.base;
    v.extra = `${dif > 0 ? "+" : "−"} ${Math.abs(dif)}`;
  }
  if (clave === "puesto" && Array.isArray(e.datos.objetivos) && e.datos.objetivos.length) clave = "puestoDesglose";
  const base = `registro.${clave}`;
  if (!hayTexto(base)) return "";
  let texto = tLibre(variante(base, e, c), v);
  if (clave === "seRompe") {
    const n = typeof e.datos.n === "number" ? e.datos.n : 0;
    if (n > 0) texto += ` ${t("registro.seRompeConElla", { n })}`;
    if (Array.isArray(e.datos.prendas) && e.datos.prendas.length) texto += ` ${t("registro.sePierden", { prendas: v.prendas })}`;
  }
  return texto;
}

/**
 * Las líneas del registro para enseñar, de la más antigua a la más reciente: traducidas las que tienen su entrada
 * estructurada (van a la par contando desde el final) y en castellano las demás (partidas de antes).
 */
export function lineasRegistro(c: ContextoTexto): { texto: string; separador: boolean; jugador: number | null }[] {
  const { p } = c;
  const entradas = p.entradas ?? [];
  const desfase = p.registro.length - entradas.length;
  return p.registro.map((espanol, i) => {
    const e = i >= desfase ? entradas[i - desfase] : undefined;
    const texto = (e && textoEntrada(e, c)) || espanol;
    const separador = espanol.startsWith("—");
    const jugador = e && typeof e.datos.jugador === "number" && !separador ? e.datos.jugador : null;
    return { texto, separador, jugador };
  });
}

/** Un motivo de jugada no válida en el idioma actual (si no hay traducción, el texto en castellano). */
export function textoMotivo(m: Entrada & { texto?: string }, c: ContextoTexto): string {
  const base = `motivo.${m.clave}`;
  if (!hayTexto(base)) return m.texto ?? m.clave;
  return tLibre(variante(base, m, c), variables(m, c));
}
