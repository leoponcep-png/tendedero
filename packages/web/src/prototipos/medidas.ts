// Medidas físicas de los componentes de Tendedero, en milímetros, y las proporciones que salen de ellas.
// Los componentes de pantalla dibujan con estas proporciones para que lo que se ve sea lo que se imprimirá.
//
// Tamaño de cada componente impreso:
//  · Carta de acción (fastidio y táctica) ... 63 × 88 mm, vertical. Tamaño estándar de carta (póker).
//  · Carta de objetivo (común y secreto) .... 63 × 88 mm, vertical. Tamaño estándar.
//  · Carta de cuerda ........................ 88 × 63 mm, apaisada: es una carta estándar tumbada. La cuerda
//                                             cruza de borde a borde para empalmar con la carta de al lado.
//  · Carta del día (tiempo y sucesos) ....... 88 × 63 mm, apaisada, como la de cuerda: se deja a la vista
//                                             junto a los mazos y su ilustración es un paisaje.
//  · Carta de prenda ........................ 41 × 63 mm, vertical. Tamaño mini (como las de «mini euro»).
//                                             Se roban de un mazo boca abajo (dorso «Prendas» en DorsoBosque).
//  · Loseta de cartón (poste y leyenda) ..... 100 × 132 mm, cartón de 2 mm. Mide de alto lo mismo que dos
//                                             líneas de cartas de cuerda (2 × 63 mm) más el hueco entre ellas.
//
// En pantalla, la carta de cuerda usa 180 × 128 unidades (≈ 88 × 63) y las verticales, 63 × 88 unidades
// (milímetros tal cual), para que los adornos del marco tengan siempre el mismo grosor relativo.

/** Tamaño de cada componente en milímetros: ancho × alto, tal como se ve en la mesa. */
export const MM = {
  accion: { ancho: 63, alto: 88 },
  objetivo: { ancho: 63, alto: 88 },
  cuerda: { ancho: 88, alto: 63 },
  dia: { ancho: 88, alto: 63 },
  prenda: { ancho: 41, alto: 63 },
  loseta: { ancho: 100, alto: 132 },
} as const;

/** Grosor del cartón de la loseta, en mm. */
export const GROSOR_LOSETA = 2;

/** Hueco entre dos líneas del tendedero, en mm (lo que sobra de la loseta al poner dos líneas de cuerdas). */
export const HUECO_LINEAS = MM.loseta.alto - 2 * MM.cuerda.alto;

/** Proporción alto / ancho de cada componente (para `aspect-ratio` o para calcular un alto a partir del ancho). */
export const PROPORCION = {
  accion: MM.accion.alto / MM.accion.ancho, // ≈ 1,397
  objetivo: MM.objetivo.alto / MM.objetivo.ancho, // ≈ 1,397
  cuerda: MM.cuerda.alto / MM.cuerda.ancho, // ≈ 0,716
  dia: MM.dia.alto / MM.dia.ancho, // ≈ 0,716
  prenda: MM.prenda.alto / MM.prenda.ancho, // ≈ 1,537
  loseta: MM.loseta.alto / MM.loseta.ancho, // 1,32
} as const;

/** Tamaño relativo a una carta estándar (ancho de la carta vertical = 1). */
export const RELATIVO = {
  prenda: MM.prenda.ancho / MM.accion.ancho, // ≈ 0,65: una prenda es dos tercios de ancha que una acción
  loseta: MM.loseta.ancho / MM.accion.ancho, // ≈ 1,59
} as const;

/** Sistema de coordenadas de los dibujos de cada carta (viewBox). */
export const LIENZO = {
  /** Cartas verticales (acción y objetivo): un milímetro por unidad. */
  vertical: { ancho: MM.accion.ancho, alto: MM.accion.alto },
  /** Carta del día: un milímetro por unidad. */
  dia: { ancho: MM.dia.ancho, alto: MM.dia.alto },
  /** Carta de cuerda: 180 × 128 unidades, la proporción de 88 × 63 con números cómodos para los tres huecos de 60. */
  cuerda: { ancho: 180, alto: 128 },
} as const;
