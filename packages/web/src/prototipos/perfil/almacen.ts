// Todo lo del perfil se guarda en este navegador (localStorage). Cuando el juego pase a Steam, las partidas
// pueden seguir aquí (o en Steam Cloud, que sincroniza archivos) y los logros y amigos se reflejan en Steamworks
// a través de plataforma.ts.

/** Nombres de las claves, en un solo sitio para poder migrarlas. */
export const CLAVES = {
  partidas: "tendedero-partidas",
  logros: "tendedero-logros",
  logrosPendientes: "tendedero-logros-pendientes",
  amigos: "tendedero-amigos",
  codigoAmigo: "tendedero-mi-codigo-amigo",
  heredados: "tendedero-desbloqueos-heredados",
  /** Fecha (ISO) en que se acabó el tutorial «Aprender a jugar». */
  tutorial: "tendedero-tutorial-hecho",
} as const;

export function leerJSON<T>(clave: string, siNo: T): T {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? siNo : (JSON.parse(texto) as T);
  } catch {
    // Sin almacenamiento (o con datos rotos) se empieza de cero.
    return siNo;
  }
}

export function guardarJSON(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento solo se pierde el recuerdo.
  }
}
