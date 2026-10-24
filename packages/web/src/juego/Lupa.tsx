import type { Partida } from "@tendedero/motor";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CartaPorClave } from "./cartas";

/**
 * Lupa de carta: al dejar el ratón ~0,35 s sobre cualquier carta (las que llevan data-lupa), sale en grande y
 * nítida en un lateral, con su texto entero. Es el mismo componente dibujado a más tamaño, no una imagen
 * ampliada. Mientras se arrastra enseña la carta arrastrada.
 */
export function Lupa({ raiz, p, arrastrada, activa }: { raiz: RefObject<HTMLElement | null>; p: Partida; arrastrada: string | null; activa: boolean }) {
  const [clave, setClave] = useState<string | null>(null);
  const [lado, setLado] = useState<"izquierda" | "derecha">("derecha");
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const r = raiz.current;
    if (!r || !activa) return;
    let actual: string | null = null;
    const sobre = (ev: PointerEvent) => {
      const el = (ev.target as Element).closest?.("[data-lupa]");
      const nueva = el?.getAttribute("data-lupa") ?? null;
      // La lupa sale en el lado contrario al ratón, para no tapar lo que se mira.
      setLado(ev.clientX > innerWidth / 2 ? "izquierda" : "derecha");
      if (nueva === actual) return;
      actual = nueva;
      clearTimeout(espera.current);
      if (!nueva) {
        espera.current = setTimeout(() => setClave(null), 120);
        return;
      }
      espera.current = setTimeout(() => setClave(nueva), 350);
    };
    const fuera = () => {
      actual = null;
      clearTimeout(espera.current);
      setClave(null);
    };
    r.addEventListener("pointerover", sobre);
    r.addEventListener("pointerleave", fuera);
    return () => {
      clearTimeout(espera.current);
      r.removeEventListener("pointerover", sobre);
      r.removeEventListener("pointerleave", fuera);
    };
  }, [raiz, activa]);

  const mostrar = activa ? (arrastrada ?? clave) : null;
  if (!mostrar) return null;
  const carta = <CartaPorClave p={p} clave={mostrar} />;
  return (
    <div className={`mj-lupa ${lado}`} aria-hidden>
      {carta}
    </div>
  );
}
