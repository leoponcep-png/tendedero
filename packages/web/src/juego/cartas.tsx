// Cartas de la mesa de juego: los componentes de CartasBosque alimentados con la Partida del motor, más lo que solo
// sabe la partida (cuánto llevas de un objetivo, cuántos días le quedan a la carta del día).

import { diasRestantes, OCULTA, puntuarObjetivo, type Partida } from "@tendedero/motor";
import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { CaraAccionBosque, CartaCuerdaBosque, CartaDiaBosque, CartaObjetivoBosque, DorsoBosque } from "../prototipos/CartasBosque";
import { ACCIONES } from "../prototipos/Prototipos";
import { CartaPrendaHumeda } from "../prototipos/HumedadTaller";
import { cuerdaDibujo, esCuerda, prendaDibujo } from "./vista";

/** Carta de acción (o su dorso si está tapada), con el mismo marcado que la mano de la mesa E. */
export function CartaAccion({ p, carta, tapada, className, ...resto }: { p: Partida; carta: string; tapada?: boolean; ref?: Ref<HTMLDivElement> } & HTMLAttributes<HTMLDivElement>) {
  // Sin definición dibujada (una carta nueva en los datos), se enseña el dorso.
  const id = carta === OCULTA || !ACCIONES[p.cartas[carta]] ? null : p.cartas[carta];
  return (
    <div {...resto} className={`carta-p mb-accion ${tapada || !id ? "tapada" : ""} ${className ?? ""}`}>
      <div className="carta-giro">
        {id ? <CaraAccionBosque id={id} /> : <div className="cb" />}
        <DorsoBosque />
      </div>
    </div>
  );
}

/** Carta de cuerda apaisada (la de la mano y la de la mesa son la misma). */
export function CartaCuerda({ p, carta, className, ...resto }: { p: Partida; carta: string } & HTMLAttributes<HTMLDivElement>) {
  const d = cuerdaDibujo(p, carta);
  return <CartaCuerdaBosque {...resto} efecto={d.efecto} pinzas={d.pinzas} modo="borde" className={className} />;
}

/** Cualquier carta de la mano: de cuerda o de acción. */
export function CartaDeMano({ p, carta, ...resto }: { p: Partida; carta: string; ref?: Ref<HTMLDivElement> } & HTMLAttributes<HTMLDivElement>) {
  if (esCuerda(p, carta)) {
    return (
      <div {...resto} className={`carta-p mb-cuerda-mano mj-cuerda-mano ${resto.className ?? ""}`}>
        <CartaCuerda p={p} carta={carta} className="mj-llena" />
      </div>
    );
  }
  return <CartaAccion p={p} carta={carta} {...resto} />;
}

export function CartaPrenda({ p, prenda, ...resto }: { p: Partida; prenda: string } & HTMLAttributes<HTMLDivElement>) {
  return <CartaPrendaHumeda p={prendaDibujo(p, prenda)} {...resto} />;
}

/** Carta de objetivo; con `jugador`, cuánto lleva y cuántos puntos le daría ahora. */
export function CartaObjetivoJuego({
  p,
  id,
  jugador,
  secreto,
  className,
  ...resto
}: { p: Partida; id: string; jugador?: number; secreto?: boolean } & HTMLAttributes<HTMLDivElement>) {
  if (id === OCULTA) {
    return (
      <div {...resto} className={`mj-objetivo tapado ${className ?? ""}`}>
        <DorsoBosque />
      </div>
    );
  }
  const o = p.catalogo.objetivos[id];
  if (!o) return null;
  const progreso = jugador === undefined ? null : puntuarObjetivo(p, jugador, o);
  return (
    <div {...resto} className={`mj-objetivo ${secreto ? "secreto" : ""} ${className ?? ""}`} data-lupa={`objetivo:${id}${secreto ? ":secreto" : ""}`}>
      <CartaObjetivoBosque id={id} secreto={secreto} />
      {progreso && (
        <div className="mj-objetivo-progreso" title="Lo que llevas y lo que te daría ahora">
          llevas {progreso.cantidad} · {progreso.puntos} pts
        </div>
      )}
    </div>
  );
}

/** Carta del día en juego (tiempo o suceso), con los días que le quedan. */
export function CartaDiaJuego({ p, carta: id, className, ...resto }: { p: Partida; carta: string | null } & HTMLAttributes<HTMLDivElement>) {
  if (!id) {
    return (
      <div {...resto} className={`mj-dia vacia ${className ?? ""}`}>
        <b>Día tranquilo</b>
        <span>Sin tiempo ni suceso en juego.</span>
      </div>
    );
  }
  const quedan = id === p.dia ? diasRestantes(p) : null;
  return (
    <div {...resto} className={`mj-dia ${className ?? ""}`} data-lupa={`dia:${id}`}>
      <CartaDiaBosque id={p.cartas[id]} />
      {quedan !== null && <div className="mj-dia-quedan">{quedan <= 1 ? "último día" : `quedan ${quedan} días`}</div>}
    </div>
  );
}

/** Para la lupa: la carta que corresponde a una clave «tipo:id». */
export function CartaPorClave({ p, clave, style }: { p: Partida; clave: string; style?: CSSProperties }) {
  const [tipo, ...resto] = clave.split(":");
  const id = resto.join(":");
  if (tipo === "carta" && p.cartas[id]) {
    return esCuerda(p, id) ? <CartaCuerda p={p} carta={id} className="mj-lupa-cuerda" style={style} /> : <CartaAccion p={p} carta={id} className="mj-lupa-accion" style={style} />;
  }
  if (tipo === "prenda" && p.prendas[id]) return <CartaPrenda p={p} prenda={id} className="mj-lupa-prenda" style={style} />;
  if (tipo === "objetivo") return <CartaObjetivoJuego p={p} id={id.replace(/:secreto$/, "")} secreto={id.endsWith(":secreto")} className="mj-lupa-objetivo" style={style} />;
  if (tipo === "dia" && p.cartas[id]) return <CartaDiaJuego p={p} carta={id} className="mj-lupa-dia" style={style} />;
  return null;
}
