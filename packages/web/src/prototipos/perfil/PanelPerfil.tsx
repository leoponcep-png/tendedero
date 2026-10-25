import { useState, type CSSProperties } from "react";
import { useT } from "../../i18n";
import { Animal, ANIMALES } from "../Animales";
import type { Perfil } from "../MenuPartida";
import { COLORES, FONDOS, MARCOS, nombreAnimal, nombreColor, nombreFondo, nombreMarco, nombreTapete, nombreTitulo, TAPETES, TITULOS } from "./catalogo";
import { AvatarConMarco, Candado, MuestraFondo, MuestraTapete, textoBloqueo } from "./Comunes";
import { bloqueo, type Logro, type TipoRecompensa } from "./logros";

// Pestaña «Perfil»: nombre, personaje, color, tapete, marco del avatar, título y fondo de mesa. Lo bloqueado se ve
// con candado y dice qué logro lo da.

export function PanelPerfil({ yo, hechos, onCambio }: { yo: Perfil; hechos: Record<string, string>; onCambio: (c: Partial<Perfil>) => void }) {
  const t = useT();
  const [aviso, setAviso] = useState<Logro | null>(null);
  const elegir = (l: Logro | undefined, cambio: Partial<Perfil>) => {
    setAviso(l ?? null);
    if (!l) onCambio(cambio);
  };
  const libres = (tipo: TipoRecompensa, ids: string[]) => ids.filter((id) => !bloqueo(tipo, id, hechos)).length;

  return (
    <div className="mp-perfil" style={{ "--jugador": yo.color } as CSSProperties}>
      <label className="mp-campo">
        <span>{t("perfil.tuNombre")}</span>
        <input value={yo.nombre} maxLength={16} onChange={(e) => onCambio({ nombre: e.target.value })} placeholder={t("perfil.placeholderNombre")} />
      </label>

      <div className="mp-seccion-titulo">
        <h2>{t("perfil.personaje")}</h2>
        <span>
          {libres("animal", ANIMALES.map((a) => a.id))}/{ANIMALES.length}
        </span>
      </div>
      <div className="mp-rejilla mp-rejilla-animales">
        {ANIMALES.map((a) => {
          const l = bloqueo("animal", a.id, hechos);
          return (
            <button key={a.id} className={`mp-ficha-animal ${a.id === yo.animal ? "activa" : ""} ${l ? "bloqueada" : ""}`} onClick={() => elegir(l, { animal: a.id })} title={l ? textoBloqueo(l) : nombreAnimal(a.id)}>
              <span className="mp-ficha-dibujo">
                <Animal id={a.id} />
              </span>
              <span>{nombreAnimal(a.id)}</span>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      <div className="mp-seccion-titulo">
        <h2>{t("perfil.color")}</h2>
        <span>{nombreColor(yo.color)}</span>
      </div>
      <div className="mp-colores">
        {COLORES.map((c) => {
          const l = bloqueo("color", c.valor, hechos);
          return (
            <button key={c.id} className={`mp-color ${c.valor === yo.color ? "activa" : ""} ${l ? "bloqueada" : ""}`} style={{ "--c": c.valor } as CSSProperties} onClick={() => elegir(l, { color: c.valor })} title={l ? textoBloqueo(l) : nombreColor(c.valor)} aria-label={nombreColor(c.valor)}>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      <div className="mp-seccion-titulo">
        <h2>{t("perfil.tapete")}</h2>
        <span>
          {libres("tapete", TAPETES.map((t) => t.id))}/{TAPETES.length}
        </span>
      </div>
      <div className="mp-rejilla mp-rejilla-tapetes">
        {TAPETES.map((tp) => {
          const l = bloqueo("tapete", tp.id, hechos);
          return (
            <button key={tp.id} className={`mp-ficha-tapete ${tp.id === (yo.tapete ?? "basico") ? "activa" : ""} ${l ? "bloqueada" : ""}`} onClick={() => elegir(l, { tapete: tp.id })} title={l ? textoBloqueo(l) : nombreTapete(tp.id)}>
              <MuestraTapete className="mp-tapete-mini" color={yo.color} tapete={tp.id} />
              <span>{nombreTapete(tp.id)}</span>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      <div className="mp-seccion-titulo">
        <h2>{t("perfil.marco")}</h2>
        <span>
          {libres("marco", MARCOS.map((m) => m.id))}/{MARCOS.length}
        </span>
      </div>
      <div className="mp-rejilla mp-rejilla-marcos">
        {MARCOS.map((m) => {
          const l = bloqueo("marco", m.id, hechos);
          return (
            <button key={m.id} className={`mp-ficha-animal ${m.id === (yo.marco ?? "sencillo") ? "activa" : ""} ${l ? "bloqueada" : ""}`} onClick={() => elegir(l, { marco: m.id })} title={l ? textoBloqueo(l) : nombreMarco(m.id)}>
              <AvatarConMarco className="mp-ficha-marco" animal={yo.animal} color={yo.color} marco={m.id} />
              <span>{nombreMarco(m.id)}</span>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      <div className="mp-seccion-titulo">
        <h2>{t("perfil.titulo")}</h2>
        <span>
          {libres("titulo", TITULOS.map((x) => x.id))}/{TITULOS.length}
        </span>
      </div>
      <div className="mp-titulos">
        {TITULOS.map((x) => {
          const l = bloqueo("titulo", x.id, hechos);
          return (
            <button key={x.id} className={`mp-ficha-titulo ${x.id === (yo.titulo ?? "ninguno") ? "activa" : ""} ${l ? "bloqueada" : ""}`} onClick={() => elegir(l, { titulo: x.id })} title={l ? textoBloqueo(l) : nombreTitulo(x.id)}>
              {nombreTitulo(x.id)}
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      <div className="mp-seccion-titulo">
        <h2>{t("perfil.fondo")}</h2>
        <span>
          {libres("fondo", FONDOS.map((x) => x.id))}/{FONDOS.length}
        </span>
      </div>
      <div className="mp-rejilla mp-rejilla-tapetes">
        {FONDOS.map((x) => {
          const l = bloqueo("fondo", x.id, hechos);
          return (
            <button key={x.id} className={`mp-ficha-tapete ${x.id === (yo.fondo ?? "madera") ? "activa" : ""} ${l ? "bloqueada" : ""}`} onClick={() => elegir(l, { fondo: x.id })} title={l ? textoBloqueo(l) : nombreFondo(x.id)}>
              <MuestraFondo className="mp-fondo-mini" fondo={x.id} />
              <span>{nombreFondo(x.id)}</span>
              {l && <Candado />}
            </button>
          );
        })}
      </div>

      {aviso && (
        <p className="mp-nota-bloqueo">
          <Candado />
          {textoBloqueo(aviso)} {t("perfil.miraLogros")}
        </p>
      )}
    </div>
  );
}
