import { useEffect, useState } from "react";

// Lo que solo existe en la aplicación de escritorio (Electron): salir del juego y la pantalla completa de la
// ventana. El preload (packages/escritorio/src/preload.cjs) deja `window.tendederoEscritorio`; en el navegador no
// está y se usa la API de pantalla completa del propio navegador.

interface PuenteEscritorio {
  salir(): void;
  /** Pone o quita la pantalla completa (sin argumento, solo pregunta) y devuelve cómo ha quedado. */
  pantallaCompleta(si?: boolean): Promise<boolean>;
  /** Avisa cuando cambia (también con F11); devuelve cómo dejar de escuchar. */
  alCambiarPantallaCompleta(fn: (si: boolean) => void): () => void;
}

declare global {
  interface Window {
    tendederoEscritorio?: PuenteEscritorio;
  }
}

const puente = (): PuenteEscritorio | undefined => (typeof window === "undefined" ? undefined : window.tendederoEscritorio);

/** Si el juego corre en la aplicación de escritorio. */
export const esEscritorio = (): boolean => !!puente() || (typeof location !== "undefined" && location.protocol === "tendedero:");

/** Cierra la aplicación (solo en escritorio). */
export function salirDelJuego(): void {
  const p = puente();
  if (p) p.salir();
  else window.close();
}

const navegadorCompleta = () => typeof document !== "undefined" && !!document.fullscreenElement;

export async function ponerPantallaCompleta(si: boolean): Promise<void> {
  const p = puente();
  if (p) {
    await p.pantallaCompleta(si);
    return;
  }
  try {
    if (si && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    else if (!si && document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // El navegador puede negarse (p. ej. dentro de un marco): no pasa nada.
  }
}

/** Si la ventana está a pantalla completa, al día con F11 y con Esc. */
export function usePantallaCompleta(): boolean {
  const [si, setSi] = useState(navegadorCompleta);
  useEffect(() => {
    const p = puente();
    if (p) {
      p.pantallaCompleta().then(setSi, () => {});
      return p.alCambiarPantallaCompleta(setSi);
    }
    const cambio = () => setSi(navegadorCompleta());
    document.addEventListener("fullscreenchange", cambio);
    return () => document.removeEventListener("fullscreenchange", cambio);
  }, []);
  return si;
}
