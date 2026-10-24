// Colores de jugador y diseños de tapete. Qué se gana con logros se decide en logros.ts (sus recompensas):
// lo que no es recompensa de ningún logro está libre desde el principio.

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
];

export const nombreColor = (valor: string) => COLORES.find((c) => c.valor === valor)?.nombre ?? "Color";
export const nombreTapete = (id: string | undefined) => TAPETES.find((t) => t.id === (id ?? "basico"))?.nombre ?? "Liso";
