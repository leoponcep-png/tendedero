// Registro de efectos programados. Cada carta de los JSON apunta a uno por su campo "efecto".
// Una carta solo puede marcarse "definida" cuando su efecto está aquí.
//
// Para añadir uno: crea un archivo en esta carpeta que exporte un Efecto y regístralo abajo
// con el mismo id que usa el JSON. Los ganchos (al secar, al colgar, al cambiar el clima…)
// se irán añadiendo a esta interfaz en el paso 4, según los necesiten las cartas.

export interface Efecto {
  descripcion: string;
}

export const efectos: Record<string, Efecto> = {};
