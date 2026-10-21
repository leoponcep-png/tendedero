import { z } from "zod";

// Forma que deben tener los archivos de /data. Si un JSON no la cumple,
// la carga falla con un mensaje que dice qué archivo y qué campo.

const id = z.string().regex(/^[a-z0-9-]+$/, "usa solo minúsculas sin tildes, números y guiones");
const entero = (min = 0) =>
  z.number({ error: "debe ser un número" }).int("debe ser un número entero").min(min, `debe ser como mínimo ${min}`);

export const esquemaEstado = z.enum(["definida", "pendiente"], { error: 'debe ser "definida" o "pendiente"' });

export const esquemaColor = z.object({ id, nombre: z.string(), hex: z.string() });

export const esquemaTipoPrenda = z.object({
  id,
  nombre: z.string(),
  porColor: entero(),
  espacios: entero(1),
  humedad: entero(),
  puntos: z.number().int(),
});

export const esquemaPrendas = z.object({
  colores: z.array(esquemaColor).min(1),
  tipos: z.array(esquemaTipoPrenda).min(1),
});

const camposCarta = {
  id,
  nombre: z.string(),
  copias: entero(),
  estado: esquemaEstado,
  grupo: z.string(),
  efecto: z.string().nullable().default(null),
  texto: z.string().default(""),
};

export const esquemaCuerdas = z.object({
  cartas: z.array(z.object({ ...camposCarta, espacios: entero(1).default(3) })),
});

export const esquemaMazo = z.object({ cartas: z.array(z.object(camposCarta)) });

export const esquemaObjetivo = z.object({
  id,
  nombre: z.string(),
  uso: z.enum(["comun", "secreto", "ambos"], { error: 'debe ser "comun", "secreto" o "ambos"' }),
  estado: esquemaEstado,
  efecto: z.string().nullable().default(null),
  texto: z.string().default(""),
  niveles: z.array(z.object({ requisito: entero(), puntos: z.number().int() })).default([]),
});

export const esquemaObjetivos = z.object({ objetivos: z.array(esquemaObjetivo) });

const parCartas = z.object({ cuerdas: entero(), acciones: entero() });

export const esquemaAjustesPorDefecto = z.object({
  jugadores: entero(2).max(4, "como máximo 4"),
  manoInicial: parCartas,
  roboPorTurno: parCartas,
  jugablesPorTurno: parCartas,
  draftsPorTurno: entero(),
  limiteMano: entero(1),
  umbralFinal: entero(1),
  cestas: z.object({
    porJugadores: z.object({ "2": entero(1), "3": entero(1), "4": entero(1) }),
    prendasPorCesta: entero(1),
  }),
  tendedero: z.object({ lineas: entero(1), cartasPorLinea: entero(1) }),
  objetivos: z.object({ comunes: entero(), secretosRepartidos: entero() }),
});

export type EstadoCarta = z.infer<typeof esquemaEstado>;
export type Color = z.infer<typeof esquemaColor>;
export type TipoPrenda = z.infer<typeof esquemaTipoPrenda>;
export type DefObjetivo = z.infer<typeof esquemaObjetivo>;
export type AjustesPorDefecto = z.infer<typeof esquemaAjustesPorDefecto>;

export type Mazo = "cuerdas" | "acciones" | "climas" | "eventos";

export interface DefCarta {
  id: string;
  nombre: string;
  copias: number;
  estado: EstadoCarta;
  grupo: string;
  efecto: string | null;
  texto: string;
  mazo: Mazo;
  /** Solo cuenta en las cartas de cuerda. */
  espacios: number;
}

export interface Datos {
  colores: Color[];
  tipos: TipoPrenda[];
  cartas: DefCarta[];
  objetivos: DefObjetivo[];
  porDefecto: AjustesPorDefecto;
}
