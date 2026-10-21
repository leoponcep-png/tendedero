// Generador aleatorio con semilla. Su estado vive dentro de la partida,
// así que la misma semilla y las mismas jugadas dan siempre el mismo resultado.

export function sembrar(semilla: string): number {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Número entre 0 y 1 (mulberry32). Avanza el estado guardado en `p.azar`. */
export function aleatorio(p: { azar: number }): number {
  p.azar = (p.azar + 0x6d2b79f5) >>> 0;
  let t = p.azar;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function barajar<T>(p: { azar: number }, lista: T[]): void {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio(p) * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
}

/** Semilla corta y fácil de copiar, para cuando no se fija una a mano. */
export function semillaNueva(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}
