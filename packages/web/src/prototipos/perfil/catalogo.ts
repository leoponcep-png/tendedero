// Colores de jugador y diseños de tapete. Qué se gana con logros se decide en logros.ts (sus recompensas):
// lo que no es recompensa de ningún logro está libre desde el principio.

import { t, tO } from "../../i18n";

export interface ColorJugador {
  id: string;
  nombre: string;
  valor: string;
}

export const COLORES: ColorJugador[] = [
  { id: "pino", nombre: "Pino", valor: "#2f7a63" },
  { id: "teja", nombre: "Teja", valor: "#c4643d" },
  { id: "anil", nombre: "Añil", valor: "#3f6fb5" },
  { id: "ciruela", nombre: "Ciruela", valor: "#8e5bb5" },
  { id: "mostaza", nombre: "Mostaza", valor: "#d39a1b" },
  { id: "frambuesa", nombre: "Frambuesa", valor: "#c2457a" },
  { id: "turquesa", nombre: "Turquesa", valor: "#1f9aa8" },
  { id: "granate", nombre: "Granate", valor: "#8f2f3c" },
  { id: "oliva", nombre: "Oliva", valor: "#74892c" },
  { id: "marino", nombre: "Marino", valor: "#283f73" },
  { id: "cacao", nombre: "Cacao", valor: "#75482a" },
  { id: "pizarra", nombre: "Pizarra", valor: "#56606d" },
  { id: "coral", nombre: "Coral", valor: "#e86f5a" },
  { id: "rosa", nombre: "Rosa chicle", valor: "#d987b0" },
  { id: "lavanda", nombre: "Lavanda", valor: "#9b8de0" },
  { id: "esmeralda", nombre: "Esmeralda", valor: "#12a35c" },
  { id: "menta", nombre: "Menta", valor: "#5cbf9b" },
  { id: "cielo", nombre: "Cielo", valor: "#6aa6dc" },
  { id: "mandarina", nombre: "Mandarina", valor: "#f08a24" },
  { id: "carbon", nombre: "Carbón", valor: "#33302e" },
  { id: "uva", nombre: "Uva", valor: "#5b2a6e" },
];

export interface DisenoTapete {
  id: string;
  nombre: string;
}

/** El `id` es el valor de `data-tapete-estilo` en el tapete (ver tapetes.css). */
export const TAPETES: DisenoTapete[] = [
  { id: "basico", nombre: "Liso" },
  { id: "cuadros", nombre: "Vichy" },
  { id: "rayas", nombre: "Rayas" },
  { id: "lunares", nombre: "Lunares" },
  { id: "hojas", nombre: "Hojarasca" },
  { id: "estrellas", nombre: "Noche estrellada" },
  { id: "rombos", nombre: "Rombos" },
  { id: "ondas", nombre: "Ondas" },
  { id: "flores", nombre: "Flores" },
  { id: "pinzas", nombre: "Pinzas" },
  { id: "escoces", nombre: "Escocés" },
  { id: "espiga", nombre: "Espiga" },
  { id: "nubes", nombre: "Nubes" },
  { id: "calcetines", nombre: "Calcetines" },
];

// ---------- Recompensas que se ven en la mesa: marco del avatar, título y fondo de mesa ----------

export interface Opcion {
  id: string;
  /** Nombre en español (en pantalla sale traducido con la clave `${tipo}.${id}`). */
  nombre: string;
}

/** Marco del avatar: `data-marco` en el panel del jugador y en la placa (ver tapetes.css). */
export const MARCOS: Opcion[] = [
  { id: "sencillo", nombre: "Sencillo" },
  { id: "madera", nombre: "Madera" },
  { id: "cuerda", nombre: "Cuerda de tender" },
  { id: "laurel", nombre: "Laurel" },
  { id: "plata", nombre: "Plata" },
  { id: "oro", nombre: "Oro" },
  { id: "arcoiris", nombre: "Arcoíris" },
];

/** Título que sale bajo tu nombre en tu panel de jugador. «ninguno» no enseña nada. */
export const TITULOS: Opcion[] = [
  { id: "ninguno", nombre: "Sin título" },
  { id: "aprendiz", nombre: "Aprendiz de la colada" },
  { id: "vecina-red", nombre: "Estrella de internet" },
  { id: "terror", nombre: "Terror del vecindario" },
  { id: "impermeable", nombre: "A prueba de chaparrones" },
  { id: "cerebro", nombre: "Cerebro de la colada" },
  { id: "plusmarquista", nombre: "Plusmarquista" },
  { id: "campeona", nombre: "Campeona del patio" },
  { id: "agente", nombre: "Agente secreta" },
  { id: "rey-calcetin", nombre: "Rey del calcetín" },
  { id: "leyenda", nombre: "Leyenda del tendal" },
  { id: "gran-maestra", nombre: "Gran maestra del tendal" },
];

/** Fondo de mesa: `data-fondo` en la mesa de quien juega (ver tapetes.css). */
export const FONDOS: Opcion[] = [
  { id: "madera", nombre: "Roble" },
  { id: "pino", nombre: "Pino claro" },
  { id: "nogal", nombre: "Nogal" },
  { id: "baldosas", nombre: "Baldosas del patio" },
  { id: "mantel", nombre: "Mantel de merienda" },
  { id: "cesped", nombre: "Césped" },
];

// Los `nombre` de arriba son los de español; en pantalla se enseñan traducidos (claves color.* y tapete.* de i18n).
export const nombreColor = (valor: string) => {
  const c = COLORES.find((x) => x.valor === valor);
  return c ? tO(`color.${c.id}`, c.nombre) : t("color.otro");
};
export const nombreAnimal = (id: string) => tO(`animal.${id}`, id);
// Si a un id nuevo aún le falta su clave en i18n, se enseña su nombre en español del catálogo.
const nombreDe = (lista: Opcion[], prefijo: string, id: string) => tO(`${prefijo}.${id}`, lista.find((x) => x.id === id)?.nombre ?? id);
export const nombreMarco = (id: string | undefined) => nombreDe(MARCOS, "marco", id ?? "sencillo");
export const nombreTitulo = (id: string | undefined) => nombreDe(TITULOS, "titulo", id ?? "ninguno");
export const nombreFondo = (id: string | undefined) => nombreDe(FONDOS, "fondo", id ?? "madera");
export const nombreTapete = (id: string | undefined) => nombreDe(TAPETES, "tapete", TAPETES.some((x) => x.id === id) ? id! : "basico");
