import { useCallback, useEffect, useRef, type RefObject } from "react";

// Cámara de la mesa: la mesa entera se mueve y se escala dentro del escenario para enfocar una zona (la mesa
// entera, tu tendedero, el de un rival). Con la rueda se acerca hacia el ratón y arrastrando se desplaza.

type Vista = { s: number; tx: number; ty: number; objetivo: string };
const TODO = "todo";

export function useCamara(escenario: RefObject<HTMLElement | null>, mesa: RefObject<HTMLElement | null>) {
  const vista = useRef<Vista>({ s: 1, tx: 0, ty: 0, objetivo: TODO });

  const aplicar = useCallback(
    (animado: boolean) => {
      const m = mesa.current;
      if (!m) return;
      const { s, tx, ty } = vista.current;
      m.style.transition = animado ? "transform .85s cubic-bezier(.45,.05,.25,1)" : "none";
      m.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    },
    [mesa],
  );

  /** Hueco libre del escenario (sin el relleno de abajo, que es para la mano). */
  const libre = useCallback(() => {
    const c = escenario.current!;
    const e = getComputedStyle(c);
    const x = parseFloat(e.paddingLeft);
    const y = parseFloat(e.paddingTop);
    return { x, y, w: c.clientWidth - x - parseFloat(e.paddingRight), h: c.clientHeight - y - parseFloat(e.paddingBottom) };
  }, [escenario]);

  /** Posición de un elemento dentro de la mesa, sin contar la escala de la cámara. */
  const caja = useCallback(
    (selector: string) => {
      const m = mesa.current!;
      const todo = { x: 0, y: 0, w: m.offsetWidth, h: m.offsetHeight };
      if (selector === TODO) return todo;
      // Si el selector abarca varias zonas (p. ej. «las cestas y el tendedero de quien coge»), se encuadran todas.
      const cajas = [...m.querySelectorAll<HTMLElement>(selector)].map((el) => {
        let x = 0;
        let y = 0;
        for (let n: HTMLElement | null = el; n && n !== m; n = n.offsetParent as HTMLElement | null) {
          x += n.offsetLeft;
          y += n.offsetTop;
        }
        return { x, y, x2: x + el.offsetWidth, y2: y + el.offsetHeight };
      });
      if (!cajas.length) return todo;
      const x = Math.min(...cajas.map((c) => c.x));
      const y = Math.min(...cajas.map((c) => c.y));
      return { x, y, w: Math.max(...cajas.map((c) => c.x2)) - x, h: Math.max(...cajas.map((c) => c.y2)) - y };
    },
    [mesa],
  );

  const enfocar = useCallback(
    (objetivo: string = TODO, animado = true) => {
      if (!mesa.current || !escenario.current) return;
      const l = libre();
      const r = caja(objetivo);
      const s = Math.min(objetivo === TODO ? 1 : 2.2, (l.w / r.w) * 0.97, (l.h / r.h) * 0.97);
      vista.current = { s, tx: l.x + l.w / 2 - s * (r.x + r.w / 2), ty: l.y + l.h / 2 - s * (r.y + r.h / 2), objetivo };
      aplicar(animado);
    },
    [aplicar, caja, libre, mesa, escenario],
  );

  /** Acerca o aleja manteniendo fijo el punto (x, y) del escenario. */
  const zoom = useCallback(
    (factor: number, punto?: { x: number; y: number }) => {
      const v = vista.current;
      const l = libre();
      const p = punto ?? { x: l.x + l.w / 2, y: l.y + l.h / 2 };
      const s = Math.min(3, Math.max(0.2, v.s * factor));
      vista.current = { s, tx: p.x - ((p.x - v.tx) * s) / v.s, ty: p.y - ((p.y - v.ty) * s) / v.s, objetivo: v.objetivo };
      aplicar(!punto);
    },
    [aplicar, libre],
  );

  useEffect(() => {
    const c = escenario.current;
    const m = mesa.current;
    if (!c || !m) return;
    m.style.position = "absolute";
    m.style.left = "0";
    m.style.top = "0";
    m.style.transformOrigin = "0 0";
    // Al cambiar el tamaño de la ventana se vuelve a enfocar lo mismo.
    const observador = new ResizeObserver(() => enfocar(vista.current.objetivo, false));
    observador.observe(c);

    const rueda = (ev: WheelEvent) => {
      ev.preventDefault();
      const r = c.getBoundingClientRect();
      zoom(ev.deltaY < 0 ? 1.12 : 1 / 1.12, { x: ev.clientX - r.left, y: ev.clientY - r.top });
    };
    // Arrastrar mueve la mesa; si se ha arrastrado, el clic de después no cuenta como jugada.
    let inicio: { x: number; y: number; tx: number; ty: number } | null = null;
    let arrastrando = false;
    const bajar = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      inicio = { x: ev.clientX, y: ev.clientY, tx: vista.current.tx, ty: vista.current.ty };
      arrastrando = false;
    };
    const mover = (ev: PointerEvent) => {
      if (!inicio) return;
      const dx = ev.clientX - inicio.x;
      const dy = ev.clientY - inicio.y;
      if (!arrastrando && Math.hypot(dx, dy) < 6) return;
      arrastrando = true;
      c.classList.add("arrastrando");
      vista.current = { ...vista.current, tx: inicio.tx + dx, ty: inicio.ty + dy };
      aplicar(false);
    };
    const subir = () => {
      inicio = null;
      c.classList.remove("arrastrando");
    };
    const clic = (ev: MouseEvent) => {
      if (!arrastrando) return;
      arrastrando = false;
      ev.stopPropagation();
      ev.preventDefault();
    };
    c.addEventListener("wheel", rueda, { passive: false });
    c.addEventListener("pointerdown", bajar);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", subir);
    c.addEventListener("click", clic, true);
    return () => {
      observador.disconnect();
      c.removeEventListener("wheel", rueda);
      c.removeEventListener("pointerdown", bajar);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", subir);
      c.removeEventListener("click", clic, true);
    };
  }, [aplicar, enfocar, zoom, escenario, mesa]);

  return { enfocar, zoom, objetivo: () => vista.current.objetivo };
}
