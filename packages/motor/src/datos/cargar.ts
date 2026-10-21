import { z } from "zod";
import { efectos } from "../efectos";
import {
  esquemaAjustesPorDefecto,
  esquemaCuerdas,
  esquemaMazo,
  esquemaObjetivos,
  esquemaPrendas,
  type Datos,
  type DefCarta,
  type Mazo,
} from "./esquemas";

export const ARCHIVOS_DATOS = [
  "prendas",
  "cuerdas",
  "acciones",
  "climas",
  "eventos",
  "objetivos",
  "ajustes-por-defecto",
] as const;

export type NombreArchivo = (typeof ARCHIVOS_DATOS)[number];
export type DatosCrudos = Record<NombreArchivo, unknown>;

export class ErrorDatos extends Error {
  constructor(public errores: string[]) {
    super(errores.join("\n"));
    this.name = "ErrorDatos";
  }
}

/** Valida el contenido de los JSON de /data y lo convierte en Datos. Lanza ErrorDatos con todos los fallos. */
export function cargarDatos(crudos: DatosCrudos): Datos {
  const errores: string[] = [];
  const leer = <S extends z.ZodType>(esquema: S, archivo: NombreArchivo): z.infer<S> | null => {
    const r = esquema.safeParse(crudos[archivo]);
    if (r.success) return r.data;
    for (const fallo of r.error.issues) {
      errores.push(`${archivo}.json → ${ruta(fallo.path, crudos[archivo])}: ${fallo.message}`);
    }
    return null;
  };

  const prendas = leer(esquemaPrendas, "prendas");
  const cuerdas = leer(esquemaCuerdas, "cuerdas");
  const acciones = leer(esquemaMazo, "acciones");
  const climas = leer(esquemaMazo, "climas");
  const eventos = leer(esquemaMazo, "eventos");
  const objetivos = leer(esquemaObjetivos, "objetivos");
  const porDefecto = leer(esquemaAjustesPorDefecto, "ajustes-por-defecto");
  if (!prendas || !cuerdas || !acciones || !climas || !eventos || !objetivos || !porDefecto) {
    throw new ErrorDatos(errores);
  }

  const conMazo = (mazo: Mazo, lista: Omit<DefCarta, "mazo" | "espacios">[]): DefCarta[] =>
    lista.map((c) => ({ espacios: 0, ...c, mazo }));
  const cartas = [
    ...conMazo("cuerdas", cuerdas.cartas),
    ...conMazo("acciones", acciones.cartas),
    ...conMazo("climas", climas.cartas),
    ...conMazo("eventos", eventos.cartas),
  ];

  repetidos("prendas.json → colores", prendas.colores, errores);
  repetidos("prendas.json → tipos", prendas.tipos, errores);
  repetidos("cartas (entre cuerdas, acciones, climas y eventos)", cartas, errores);
  repetidos("objetivos.json", objetivos.objetivos, errores);

  for (const c of [...cartas, ...objetivos.objetivos]) {
    if (c.estado !== "definida") continue;
    const archivo = "mazo" in c ? `${c.mazo}.json` : "objetivos.json";
    if (c.efecto === null) {
      // Una cuerda sin efecto es una cuerda básica; el resto necesita su efecto.
      if (!("mazo" in c && c.mazo === "cuerdas")) {
        errores.push(`${archivo} → [${c.id}]: está "definida" pero no tiene efecto`);
      }
    } else if (!efectos[c.efecto]) {
      errores.push(
        `${archivo} → [${c.id}]: está "definida" pero su efecto "${c.efecto}" todavía no está programado; déjala "pendiente"`,
      );
    } else {
      const esperado = !("mazo" in c)
        ? "objetivo"
        : ({ cuerdas: "cuerda", acciones: "accion", climas: "clima", eventos: "evento" } as const)[c.mazo];
      if (efectos[c.efecto].tipo !== esperado) {
        errores.push(`${archivo} → [${c.id}]: el efecto "${c.efecto}" no es de ${esperado}`);
      }
    }
  }

  if (errores.length) throw new ErrorDatos(errores);
  return { colores: prendas.colores, tipos: prendas.tipos, cartas, objetivos: objetivos.objetivos, porDefecto };
}

function repetidos(donde: string, lista: { id: string }[], errores: string[]) {
  const vistos = new Set<string>();
  for (const { id } of lista) {
    if (vistos.has(id)) errores.push(`${donde}: el id "${id}" está repetido`);
    vistos.add(id);
  }
}

// Convierte ["cartas", 3, "copias"] en "cartas[tejadillo].copias" para que se encuentre rápido en el JSON.
function ruta(camino: PropertyKey[], raiz: unknown): string {
  let actual: unknown = raiz;
  let texto = "";
  for (const paso of camino) {
    actual = actual && typeof actual === "object" ? (actual as Record<PropertyKey, unknown>)[paso] : undefined;
    if (typeof paso === "number") {
      const id = actual && typeof actual === "object" ? (actual as { id?: unknown }).id : undefined;
      texto += typeof id === "string" ? `[${id}]` : `[${paso}]`;
    } else {
      texto += texto ? `.${String(paso)}` : String(paso);
    }
  }
  return texto || "(todo el archivo)";
}
