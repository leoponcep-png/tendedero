import { cargarDatos, ErrorDatos, type Datos } from "@tendedero/motor";
import acciones from "../../../data/acciones.json";
import ajustesPorDefecto from "../../../data/ajustes-por-defecto.json";
import climas from "../../../data/climas.json";
import cuerdas from "../../../data/cuerdas.json";
import eventos from "../../../data/eventos.json";
import objetivos from "../../../data/objetivos.json";
import prendas from "../../../data/prendas.json";

// Al editar un JSON de /data con el simulador abierto, la página se recarga sola con los cambios.

export type ResultadoDatos = { ok: true; datos: Datos } | { ok: false; errores: string[] };

function cargar(): ResultadoDatos {
  try {
    return {
      ok: true,
      datos: cargarDatos({
        prendas,
        cuerdas,
        acciones,
        climas,
        eventos,
        objetivos,
        "ajustes-por-defecto": ajustesPorDefecto,
      }),
    };
  } catch (e) {
    return { ok: false, errores: e instanceof ErrorDatos ? e.errores : [String(e)] };
  }
}

export const resultadoDatos = cargar();
