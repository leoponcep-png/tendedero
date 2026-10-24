import { useState, type CSSProperties } from "react";
import { Animal, ANIMALES } from "../Animales";
import type { Perfil } from "../MenuPartida";
import { COLORES, TAPETES } from "./catalogo";
import { Candado, MuestraTapete, textoBloqueo } from "./Comunes";
import { bloqueo, type Logro } from "./logros";

// Pestaña «Perfil»: nombre, personaje, color y tapete. Lo bloqueado se ve con candado y dice qué logro lo da.

export function PanelPerfil({ yo, hechos, onCambio }: { yo: Perfil; hechos: Record<string, string>; onCambio: (c: Partial<Perfil>) => void }) {
  const [aviso, setAviso] = useState<Logro | null>(null);
  const elegir = (l: Logro | undefined, cambio: Partial<Perfil>) => {
    setAviso(l ?? null);
    if (!l) onCambio(cambio);
  };
  const libres = (tipo: "animal" | "tapete" | "color", ids: string[]) => ids.filter((id) => !bloqueo(tipo, id, hechos)).length;

  return (
    <div className="mp-perfil" style={{ "--jugador": yo.color } as CSSProperties}>
      <label className="mp-campo">
        <span>Tu nombre en el juego</span>
        <input value={yo.nombre} maxLength={16} onChange={(e) => onCambio({ nombre: e.target.value })} placeholder="Tu nombre" />
      </label>

      <div className="mp-seccion-titulo">
        <h2>Personaje</h2>
        <span>
          {libres("animal", ANIMALES.map((a) => a.id))}/{ANIMALES.length}
        </span>
      </div>
      <div className="mp-rejilla mp-rejilla-animales">
        {ANIMALES.map((a) => {
          const l = bloqueo("animal", a.id, hechos);
          return (
            <button key={a.id} className={`mp-ficha-animal ${a.id === yo.animal ? "activa" : ""} ${l ? "bloqueada" : ""}`} onClick={() => elegir(l, { animal: a.id })} title={l ? textoBloqueo(l) : a.nombre}>
              <span className="mp-ficha-dibujo">
                <Animal id={a.id} />
              </span>
              <span>{a.nombre}</span>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      <div className="mp-seccion-titulo">
        <h2>Color</h2>
        <span>{COLORES.find((c) => c.valor === yo.color)?.nombre}</span>
      </div>
      <div className="mp-colores">
        {COLORES.map((c) => {
          const l = bloqueo("color", c.valor, hechos);
          return (
            <button key={c.id} className={`mp-color ${c.valor === yo.color ? "activa" : ""} ${l ? "bloqueada" : ""}`} style={{ "--c": c.valor } as CSSProperties} onClick={() => elegir(l, { color: c.valor })} title={l ? textoBloqueo(l) : c.nombre} aria-label={c.nombre}>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      <div className="mp-seccion-titulo">
        <h2>Tapete</h2>
        <span>
          {libres("tapete", TAPETES.map((t) => t.id))}/{TAPETES.length}
        </span>
      </div>
      <div className="mp-rejilla mp-rejilla-tapetes">
        {TAPETES.map((t) => {
          const l = bloqueo("tapete", t.id, hechos);
          return (
            <button key={t.id} className={`mp-ficha-tapete ${t.id === (yo.tapete ?? "basico") ? "activa" : ""} ${l ? "bloqueada" : ""}`} onClick={() => elegir(l, { tapete: t.id })} title={l ? textoBloqueo(l) : t.nombre}>
              <MuestraTapete className="mp-tapete-mini" color={yo.color} tapete={t.id} />
              <span>{t.nombre}</span>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      {aviso && (
        <p className="mp-nota-bloqueo">
          <Candado />
          {textoBloqueo(aviso)} Míralo en la pestaña Logros.
        </p>
      )}
    </div>
  );
}
