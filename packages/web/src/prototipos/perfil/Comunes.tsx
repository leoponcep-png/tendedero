import type { CSSProperties, ReactNode } from "react";
import { Animal, ANIMALES } from "../Animales";
import { COLORES, nombreTapete } from "./catalogo";
import { IconoPerfil } from "./Iconos";
import type { Logro, Recompensa } from "./logros";

// Piezas que se repiten en las pestañas del menú y en el aviso de logros.

/** Un tapete como el de la mesa (mismas clases), con la placa del jugador encima. */
export function MuestraTapete({ animal, color, tapete, nombre, className, children }: { animal?: string; color: string; tapete?: string; nombre?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`mb-tapete mp-tapete ${className ?? ""}`} data-tapete-estilo={tapete ?? "basico"} style={{ "--jugador": color } as CSSProperties}>
      {animal && (
        <div className="mb-placa mp-placa">
          <div className="mb-animal">
            <Animal id={animal} />
          </div>
          {nombre !== undefined && <span className="mb-placa-nombre">{nombre}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/** Candado pequeño para lo que aún no se ha ganado. */
export function Candado() {
  return (
    <span className="mp-candado" aria-label="Bloqueado">
      <IconoPerfil icono="candado" />
    </span>
  );
}

export function nombreRecompensa(r: Recompensa): string {
  if (r.tipo === "animal") return `personaje ${ANIMALES.find((a) => a.id === r.id)?.nombre ?? r.id}`;
  if (r.tipo === "tapete") return `tapete ${nombreTapete(r.id)}`;
  return `color ${COLORES.find((c) => c.valor === r.id)?.nombre ?? r.id}`;
}

/** Dibujo de la recompensa: el animal, una muestra del tapete o una gota del color. */
export function DibujoRecompensa({ r, color }: { r: Recompensa; color: string }) {
  if (r.tipo === "animal")
    return (
      <span className="mp-recompensa-animal" style={{ "--jugador": color } as CSSProperties}>
        <Animal id={r.id} />
      </span>
    );
  if (r.tipo === "tapete") return <MuestraTapete className="mp-tapete-mini" color={color} tapete={r.id} />;
  return <span className="mp-recompensa-color" style={{ background: r.id }} />;
}

/** «Se gana con el logro X» para los bloqueados. */
export function textoBloqueo(l: Logro): string {
  return `Se desbloquea con el logro «${l.nombre}»: ${l.descripcion.charAt(0).toLowerCase()}${l.descripcion.slice(1)}`;
}

export function Barra({ actual, meta }: { actual: number; meta: number }) {
  const parte = meta ? Math.min(1, actual / meta) : 0;
  return (
    <div className="mp-barra" role="progressbar" aria-valuenow={actual} aria-valuemax={meta}>
      <span style={{ width: `${parte * 100}%` }} />
    </div>
  );
}
