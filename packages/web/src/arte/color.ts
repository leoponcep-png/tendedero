/** Aclara (cantidad > 0) u oscurece (cantidad < 0) un color #rrggbb. */
export function tono(hex: string, cantidad: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const canal = (desplazamiento: number) => {
    const c = (n >> desplazamiento) & 255;
    const destino = cantidad > 0 ? 255 : 0;
    return Math.round(c + (destino - c) * Math.abs(cantidad));
  };
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, "0")).join("")}`;
}

/** Si sobre este color se lee mejor tinta oscura que clara. */
export function esClaro(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
