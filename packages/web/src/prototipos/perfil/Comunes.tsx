import type { CSSProperties, ReactNode } from "react";
import { t } from "../../i18n";
import { Animal } from "../Animales";
import { nombreAnimal, nombreColor, nombreFondo, nombreMarco, nombreTapete, nombreTitulo } from "./catalogo";
import { IconoPerfil } from "./Iconos";
import { descripcionLogro, nombreLogro, type Logro, type Recompensa } from "./logros";

// Piezas que se repiten en las pestañas del menú y en el aviso de logros.

/** Un tapete como el de la mesa (mismas clases), con la placa del jugador encima. */
export function MuestraTapete({ animal, color, tapete, nombre, marco, titulo, className, children }: { animal?: string; color: string; tapete?: string; nombre?: string; marco?: string; titulo?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`mb-tapete mp-tapete ${className ?? ""}`} data-tapete-estilo={tapete ?? "basico"} style={{ "--jugador": color } as CSSProperties}>
      {animal && (
        <div className="mb-placa mp-placa" data-marco={marco ?? "sencillo"}>
          <div className="mb-animal">
            <Animal id={animal} />
          </div>
          {nombre !== undefined && <span className="mb-placa-nombre">{nombre}</span>}
          {titulo && titulo !== "ninguno" && <CintaTitulo titulo={titulo} />}
        </div>
      )}
      {children}
    </div>
  );
}

/** Candado pequeño para lo que aún no se ha ganado. */
export function Candado() {
  return (
    <span className="mp-candado" aria-label={t("comun.bloqueado")}>
      <IconoPerfil icono="candado" />
    </span>
  );
}

export function nombreRecompensa(r: Recompensa): string {
  if (r.tipo === "animal") return t("recompensa.animal", { nombre: nombreAnimal(r.id) });
  if (r.tipo === "tapete") return t("recompensa.tapete", { nombre: nombreTapete(r.id) });
  if (r.tipo === "marco") return t("recompensa.marco", { nombre: nombreMarco(r.id) });
  if (r.tipo === "titulo") return t("recompensa.titulo", { nombre: nombreTitulo(r.id) });
  if (r.tipo === "fondo") return t("recompensa.fondo", { nombre: nombreFondo(r.id) });
  return t("recompensa.color", { nombre: nombreColor(r.id) });
}

/** Tu animal en su círculo con el marco elegido (los marcos están en tapetes.css). */
export function AvatarConMarco({ animal, color, marco, className }: { animal: string; color: string; marco?: string; className?: string }) {
  return (
    <span className={`mp-avatar ${className ?? ""}`} data-marco={marco ?? "sencillo"} style={{ "--jugador": color } as CSSProperties}>
      <Animal id={animal} />
    </span>
  );
}

/** El título como una cinta de tela. */
export function CintaTitulo({ titulo, className }: { titulo: string; className?: string }) {
  return <span className={`mp-cinta ${className ?? ""}`}>{nombreTitulo(titulo)}</span>;
}

/** Un trozo del fondo de mesa. */
export function MuestraFondo({ fondo, className }: { fondo: string; className?: string }) {
  return <span className={`mp-fondo-muestra ${className ?? ""}`} data-fondo={fondo} />;
}

/** Dibujo de la recompensa: el animal, una muestra del tapete, una gota del color, el marco, la cinta o el fondo. */
export function DibujoRecompensa({ r, color }: { r: Recompensa; color: string }) {
  if (r.tipo === "animal")
    return (
      <span className="mp-recompensa-animal" style={{ "--jugador": color } as CSSProperties}>
        <Animal id={r.id} />
      </span>
    );
  if (r.tipo === "tapete") return <MuestraTapete className="mp-tapete-mini" color={color} tapete={r.id} />;
  if (r.tipo === "marco") return <AvatarConMarco className="mp-recompensa-marco" animal="raton" color={color} marco={r.id} />;
  if (r.tipo === "titulo") return <span className="mp-recompensa-titulo"><IconoPerfil icono="medalla" /></span>;
  if (r.tipo === "fondo") return <MuestraFondo className="mp-recompensa-fondo" fondo={r.id} />;
  return <span className="mp-recompensa-color" style={{ background: r.id }} />;
}

/** «Se gana con el logro X» para los bloqueados. */
export function textoBloqueo(l: Logro): string {
  return t("perfil.seDesbloquea", { logro: nombreLogro(l), descripcion: descripcionLogro(l) });
}

export function Barra({ actual, meta }: { actual: number; meta: number }) {
  const parte = meta ? Math.min(1, actual / meta) : 0;
  return (
    <div className="mp-barra" role="progressbar" aria-valuenow={actual} aria-valuemax={meta}>
      <span style={{ width: `${parte * 100}%` }} />
    </div>
  );
}
