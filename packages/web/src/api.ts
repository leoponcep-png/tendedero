import type { Ajustes } from "@tendedero/motor";

export interface ConfiguracionGuardada {
  archivo: string;
  nombre: string;
  ajustes: unknown;
}

const RUTA = "/api/configuraciones";

async function pedir<T>(url: string, opciones?: RequestInit): Promise<T> {
  const r = await fetch(url, opciones);
  const cuerpo = await r.json();
  if (!r.ok) throw new Error(cuerpo.error ?? `Error ${r.status}`);
  return cuerpo as T;
}

export const listarConfiguraciones = () => pedir<ConfiguracionGuardada[]>(RUTA);

export const guardarConfiguracion = (nombre: string, ajustes: Ajustes) =>
  pedir<{ archivo: string }>(RUTA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, ajustes }),
  });

export const borrarConfiguracion = (archivo: string) =>
  pedir<object>(`${RUTA}/${encodeURIComponent(archivo)}`, { method: "DELETE" });
