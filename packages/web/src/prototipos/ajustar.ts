import { useLayoutEffect, type RefObject } from "react";

/**
 * Encoge la mesa para que quepa entera en su escenario (nunca la agranda). Se recalcula al cambiar el tamaño
 * de la ventana o de la propia mesa, por ejemplo al tender una cuerda nueva.
 */
export function useAjustarMesa(escenario: RefObject<HTMLElement | null>, mesa: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const caja = escenario.current;
    const contenido = mesa.current;
    if (!caja || !contenido) return;
    const ajustar = () => {
      const estilo = getComputedStyle(caja);
      const anchoLibre = caja.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      const altoLibre = caja.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
      const escala = Math.min(1, anchoLibre / contenido.offsetWidth, altoLibre / contenido.offsetHeight);
      contenido.style.scale = String(Math.max(0.3, escala));
      // Centrada en el hueco libre (la escala parte del centro, así que basta con colocar su caja sin escalar).
      contenido.style.position = "absolute";
      contenido.style.left = `${parseFloat(estilo.paddingLeft) + (anchoLibre - contenido.offsetWidth) / 2}px`;
      contenido.style.top = `${parseFloat(estilo.paddingTop) + (altoLibre - contenido.offsetHeight) / 2}px`;
    };
    const observador = new ResizeObserver(ajustar);
    observador.observe(caja);
    observador.observe(contenido);
    ajustar();
    return () => observador.disconnect();
  }, [escenario, mesa]);
}
