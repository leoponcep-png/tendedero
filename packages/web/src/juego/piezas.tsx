// Piezas de la mesa de juego: el tendedero de cada jugador (con sus huecos para soltar), la mano, los paneles de
// jugador, el registro y la zona común con el reparto. Todo se dibuja a partir de la Partida del motor.

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  defCarta,
  efectoAccion,
  efectoDeCuerda,
  rondasHastaRomperse,
  tipoDe,
  type CartaTendida,
  type Jugada,
  type Origen,
  type Patron,
  type Partida,
} from "@tendedero/motor";
import { esNombreTu, nombreVisible, t, t as tr, useT } from "../i18n";
import { lineasRegistro } from "../i18n/juego";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { admisible, jugadaDe, movidaHacia, type Arrastre, type Destino } from "../mesa/contexto";
import { Animal } from "../prototipos/Animales";
import { colorEstilo, IconoBosque, PrendaBosque } from "../prototipos/ArteBosque";
import { DorsoBosque, LosetaBosque } from "../prototipos/CartasBosque";
import type { Perfil } from "../prototipos/MenuPartida";
import { CintaTitulo } from "../prototipos/perfil/Comunes";
import { CartaAccion, CartaCuerda, CartaDeMano, CartaObjetivoJuego, CartaPrenda } from "./cartas";
import { activo, useJuego, useSoloVer } from "./contexto";
import { cuerdaDibujo, huecosLibres, humedadExtra, opcionesReparto, sePuedeJugar } from "./vista";

/** Ancho de la carta de prenda colgada, en huecos (las cartas de cuerda miden 3). */
const ANCHO_PRENDA = 1.45;

// ---------- Tendedero ----------

/** La jugada que saldría al soltar lo que tienes en la mano en este destino (o al completar un movimiento). */
function useJugadaEn(destino: Destino, posicionMovida: number): Jugada | null {
  const juego = useJuego();
  const a = activo(juego);
  if (juego.movimiento) {
    if (destino.tipo === "espacio") return movidaHacia(juego.p, juego.movimiento, destino.jugador, destino);
    return movidaHacia(juego.p, juego.movimiento, destino.jugador, { linea: destino.linea, posicion: posicionMovida, inicio: 0 });
  }
  if (!a || !juego.puedoJugar) return null;
  const j = jugadaDe(juego.p, a, destino);
  return j && admisible(juego.p, j) ? j : null;
}

export function Tapete({ jugador, perfil }: { jugador: number; perfil: Perfil }) {
  const { p, yo } = useJuego();
  const datos = p.jugadores[jugador];
  const { cartasPorLinea } = p.ajustes.tendedero;
  return (
    <section
      data-tapete={jugador}
      data-tapete-estilo={perfil.tapete ?? "basico"}
      className={`mb-tapete mj-tapete ${jugador === yo ? "mb-tapete-tu" : "mb-tapete-rival"}`}
      style={{ "--jugador": perfil.color } as CSSProperties}
    >
      <div className="mb-tendedero" data-zona={jugador}>
        <LosetaBosque lineas={datos.lineas.length} />
        <div className="mb-lineas">
          {datos.lineas.map((linea, l) => (
            <div key={l} className="mb-linea me-linea" data-linea={`${jugador}:${l}`}>
              {linea.cartas.map((t, pos) => (
                <CuerdaTendida key={t.carta} jugador={jugador} linea={l} posicion={pos} tendida={t} />
              ))}
              {linea.cartas.length < cartasPorLinea && <Hueco jugador={jugador} linea={l} posicion={linea.cartas.length} />}
              {Array.from({ length: Math.max(0, cartasPorLinea - linea.cartas.length - 1) }, (_, i) => (
                <div key={i} className="mb-hueco me-hueco vacio" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <PorTender jugador={jugador} />
    </section>
  );
}

/** Lo que conviene saber de una carta tendida: si se va a romper, si está protegida, si la cubre un tejadillo. */
function avisos(p: Partida, jugador: number, linea: number, posicion: number, t: CartaTendida, yo: number): string[] {
  const lista: string[] = [];
  const quedan = rondasHastaRomperse(p, t);
  if (quedan !== null) lista.push(quedan <= 1 ? tr("mesa.nota.rompeYa") : tr("mesa.nota.rompeEn", { n: quedan }));
  if (t.protegida) lista.push(tr("mesa.nota.protegida"));
  const arriba = p.jugadores[jugador].lineas[linea - 1]?.cartas[posicion];
  if (arriba && efectoDeCuerda(p, arriba.carta)?.efecto.cubreAbajo?.length) lista.push(tr("mesa.nota.bajoTecho"));
  if (t.colocadaPor !== undefined && t.colocadaPor !== jugador) lista.push(t.colocadaPor === yo ? tr("mesa.nota.laPusiste") : tr("mesa.nota.laPuso", { nombre: nombreVisible(p.jugadores[t.colocadaPor].nombre) }));
  return lista;
}

function CuerdaTendida({ jugador, linea, posicion, tendida }: { jugador: number; linea: number; posicion: number; tendida: CartaTendida }) {
  const juego = useJuego();
  const { p, movimiento, recien } = juego;
  const def = defCarta(p, tendida.carta);
  const [encima, setEncima] = useState<number | null>(null);
  const libres = huecosLibres(p, jugador, linea, posicion);
  const notas = avisos(p, jugador, linea, posicion, tendida, juego.yo);
  const rompe = rondasHastaRomperse(p, tendida) !== null;
  const o = movimiento?.objetivo;
  const moviendoCarta = o && !o.prenda && o.jugador === jugador && o.linea === linea && o.posicion === posicion;

  // Qué jugada saldría en cada hueco de la carta, para iluminar lo que toca al pasar por encima.
  const destinos = Array.from({ length: def.espacios }, (_, inicio): Destino => ({ tipo: "espacio", jugador, linea, posicion, inicio }));
  const a = activo(juego);
  const jugadas = destinos.map((d) => {
    if (movimiento) return movidaHacia(p, movimiento, jugador, d as Destino & { tipo: "espacio" });
    if (!a || !juego.puedoJugar) return null;
    const j = jugadaDe(p, a, d);
    return j && admisible(p, j) ? j : null;
  });
  const apuntada = jugadas.map(resalte);
  const hay = jugadas.some(Boolean);
  const actual = encima !== null ? apuntada[encima] : null;
  const prendasPosibles = new Set(apuntada.flatMap((r) => (r?.tipo === "prenda" ? [r.prenda] : [])));
  const cartaPosible = apuntada.some((r) => r?.tipo === "carta");

  function resalte(j: Jugada | null): { tipo: "carta" } | { tipo: "prenda"; prenda: string } | { tipo: "fantasma"; x: number; prenda: string } | null {
    if (!j) return null;
    if (j.tipo === "colgarPrenda") return { tipo: "fantasma", x: j.inicio + tipoDe(p, j.prenda).espacios / 2 - ANCHO_PRENDA / 2, prenda: j.prenda };
    if (j.tipo === "mejorarCuerda") return { tipo: "carta" };
    if (j.tipo !== "jugarAccion" || !j.objetivo) return null;
    const ob = j.objetivo;
    if (ob.destino) {
      const blanco = efectoAccion(p, j.carta)?.blanco;
      if (blanco === "moverPropia" || blanco === "moverRival") {
        return { tipo: "fantasma", x: ob.destino.inicio + tipoDe(p, ob.prenda!).espacios / 2 - ANCHO_PRENDA / 2, prenda: ob.prenda! };
      }
      if (blanco === "cambiarPrendas") {
        const otra = tendida.colgadas.find((c) => ob.destino!.inicio >= c.inicio && ob.destino!.inicio < c.inicio + tipoDe(p, c.prenda).espacios);
        return otra ? { tipo: "prenda", prenda: otra.prenda } : null;
      }
      return { tipo: "carta" };
    }
    return ob.prenda ? { tipo: "prenda", prenda: ob.prenda } : { tipo: "carta" };
  }

  const dib = cuerdaDibujo(p, tendida.carta);
  return (
    <div
      data-tendida={`${jugador}:${linea}:${posicion}`}
      className={[
        "mb-cuerda me-cuerda mj-cuerda",
        recien.has(tendida.carta) ? "aparece" : "",
        rompe ? "rompe" : "",
        tendida.protegida ? "protegida" : "",
        moviendoCarta ? "moviendo" : "",
        cartaPosible ? "posible" : "",
        actual?.tipo === "carta" ? "resaltada" : "",
      ].join(" ")}
    >
      <CartaCuerda p={p} carta={tendida.carta} className="mb-cuerda-carta me-cuerda-carta" data-lupa={`carta:${tendida.carta}`} />
      <span className={`me-pinzas-libres ${libres === 0 ? "llena" : ""}`}>{libres === 0 ? t("mesa.llena") : t("mesa.pinzasLibres", { n: libres })}</span>
      {notas.length > 0 && (
        <span className={`mj-notas ${rompe ? "peligro" : ""}`} title={notas.join(" · ")}>
          {notas.join(" · ")}
        </span>
      )}
      {tendida.colgadas.map((c, i) => {
        const esp = tipoDe(p, c.prenda).espacios;
        const x = c.inicio + esp / 2 - ANCHO_PRENDA / 2;
        const mojadas = humedadExtra(p, c.prenda);
        return [
          <CartaPrenda
            key={c.prenda}
            p={p}
            prenda={c.prenda}
            data-prenda={c.prenda}
            data-lupa={`prenda:${c.prenda}`}
            className={[
              "me-colgada prenda-p",
              recien.has(c.prenda) ? "colgando" : "",
              prendasPosibles.has(c.prenda) ? "posible" : "",
              actual?.tipo === "prenda" && actual.prenda === c.prenda ? "resaltada" : "",
              o?.prenda === c.prenda ? "moviendo" : "",
            ].join(" ")}
            style={{ "--x": x, "--orden": i } as CSSProperties}
          />,
          // Las cartas que la han mojado, al lado de la prenda: una gota cada una (se quitan antes que su escala).
          mojadas > 0 && (
            <div key={`${c.prenda}-mojada`} className="mj-mojadas" data-mojadas={c.prenda} style={{ "--x": x, "--orden": i } as CSSProperties} title={t("mesa.mojadas", { n: mojadas })}>
              {Array.from({ length: mojadas }, (_, k) => (
                <span key={k} className="mj-ficha-moja" style={{ "--k": k } as CSSProperties}>
                  <IconoBosque id="mojar-cuerda-rival" />
                </span>
              ))}
            </div>
          ),
        ];
      })}
      {actual?.tipo === "fantasma" && (
        <div className="mj-fantasma" style={{ "--x": actual.x, "--h": p.prendas[actual.prenda].humedad - humedadExtra(p, actual.prenda), "--colgada-pinzas": colorEstilo(dib.pinzas ?? "#c99a62") } as CSSProperties} />
      )}
      {destinos.map((d, i) => (
        <Ranura key={i} destino={d as Destino & { tipo: "espacio" }} jugada={jugadas[i]} activa={hay} onEncima={(si) => setEncima((e) => (si ? i : e === i ? null : e))} />
      ))}
    </div>
  );
}

/** Uno de los huecos de una carta de cuerda: se puede soltar encima (arrastrando) o pulsar (con algo elegido). */
function Ranura({ destino, jugada, activa, onEncima }: { destino: Destino & { tipo: "espacio" }; jugada: Jugada | null; activa: boolean; onEncima: (si: boolean) => void }) {
  const { jugar } = useJuego();
  const soloVer = useSoloVer();
  const { setNodeRef, isOver } = useDroppable({ disabled: soloVer, id: `${soloVer ? "vistazo:" : ""}ranura:${destino.jugador}:${destino.linea}:${destino.posicion}:${destino.inicio}`, data: destino });
  useEffect(() => onEncima(isOver), [isOver]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      ref={setNodeRef}
      data-ranura={`${destino.jugador}:${destino.linea}:${destino.posicion}:${destino.inicio}`}
      className={`mj-ranura ${activa ? "activa" : ""} ${jugada ? "valida" : ""}`}
      style={{ "--i": destino.inicio } as CSSProperties}
      onMouseEnter={() => onEncima(true)}
      onMouseLeave={() => onEncima(false)}
      onClick={jugada ? () => jugar(jugada) : undefined}
    />
  );
}

function Hueco({ jugador, linea, posicion }: { jugador: number; linea: number; posicion: number }) {
  const { jugar } = useJuego();
  const destino: Destino = { tipo: "hueco", jugador, linea };
  const soloVer = useSoloVer();
  const { setNodeRef, isOver } = useDroppable({ disabled: soloVer, id: `${soloVer ? "vistazo:" : ""}hueco:${jugador}:${linea}`, data: destino });
  const jugada = useJugadaEn(destino, posicion);
  return (
    <div
      ref={setNodeRef}
      data-hueco={`${jugador}:${linea}`}
      className={`mb-hueco me-hueco mj-hueco ${jugada ? "valido" : ""} ${jugada && isOver ? "resaltada" : ""}`}
      onClick={jugada ? () => jugar(jugada) : undefined}
    >
      <span>{t("mesa.huecoCuerda")}</span>
    </div>
  );
}

/** Prendas por tender del jugador: las tuyas se arrastran (o se pulsan) hasta un hueco de tus cuerdas. */
function PorTender({ jugador }: { jugador: number }) {
  const { p } = useJuego();
  const pendientes = p.jugadores[jugador].pendientes;
  return (
    <div className="mb-portender" data-pila={`porTender-${jugador}`}>
      <div className="mb-portender-titulo">{t("mesa.porTender")}</div>
      <div className="mb-portender-cartas">
        {pendientes.map((id) => (
          <Pendiente key={id} jugador={jugador} prenda={id} />
        ))}
        {pendientes.length === 0 && <div className="mf-pila-vacia">{t("mesa.sinPrendas")}</div>}
      </div>
    </div>
  );
}

function Pendiente({ jugador, prenda }: { jugador: number; prenda: string }) {
  const juego = useJuego();
  const { p, yo, sel, elegir, puedoJugar } = juego;
  const a: Arrastre = { tipo: "prenda", jugador, prenda };
  const mia = jugador === yo;
  const jugable = mia && puedoJugar && sePuedeJugar(p, a);
  const soloVer = useSoloVer();
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `${soloVer ? "vistazo:" : ""}prenda:${prenda}`, data: a, disabled: !jugable || soloVer });
  const elegida = sel?.tipo === "prenda" && sel.prenda === prenda;
  return (
    <div ref={setNodeRef} {...(jugable ? listeners : {})} {...attributes} className={`mj-pendiente ${isDragging ? "arrastrando" : ""}`}>
      <CartaPrenda
        p={p}
        prenda={prenda}
        data-pendiente={prenda}
        data-lupa={`prenda:${prenda}`}
        className={`me-pendiente ${jugable ? "jugable" : ""} ${elegida ? "elegida" : ""}`}
        onClick={jugable ? () => elegir(elegida ? null : a) : undefined}
      />
    </div>
  );
}

// ---------- Mano ----------

export function Mano({ ayuda, extra }: { ayuda: ReactNode; extra?: ReactNode }) {
  const juego = useJuego();
  const { p, yo, sel, elegir, puedoJugar, jugar, ocupado } = juego;
  const mano = p.jugadores[yo]?.mano ?? [];
  const descartando = !ocupado && !p.terminada && p.turno.fase === "descartar" && p.turno.jugador === yo;
  const jugables = useMemo(
    () => new Set(puedoJugar ? mano.filter((c) => sePuedeJugar(p, { tipo: defCarta(p, c).mazo === "cuerdas" ? "cuerda" : "accion", jugador: yo, carta: c })) : []),
    [p, puedoJugar, mano, yo],
  );
  return (
    <div className={`mano mf-mano mj-mano ${descartando ? "descartando" : ""}`}>
      {mano.map((c, i) => {
        const centrado = i - (mano.length - 1) / 2;
        const estilo = { "--abanico": `${centrado * 4}deg`, "--alzado": `${Math.abs(centrado) * 6}px` } as CSSProperties;
        const a: Arrastre = { tipo: defCarta(p, c).mazo === "cuerdas" ? "cuerda" : "accion", jugador: yo, carta: c };
        const jugable = descartando || jugables.has(c);
        const elegida = (sel?.tipo === "cuerda" || sel?.tipo === "accion") && sel.carta === c;
        return (
          <CartaMano
            key={c}
            carta={c}
            arrastre={a}
            arrastrable={jugables.has(c)}
            className={`${elegida ? "elegida" : ""} ${jugable ? "" : "apagada"}`}
            style={estilo}
            onClick={() => {
              if (descartando) return jugar({ tipo: "descartar", jugador: yo, carta: c });
              if (!jugables.has(c)) return;
              elegir(elegida ? null : a);
            }}
          />
        );
      })}
      <div className="ayuda-mano mj-ayuda">
        {ayuda}
        {extra}
      </div>
    </div>
  );
}

function CartaMano({
  carta,
  arrastre,
  arrastrable,
  className,
  style,
  onClick,
}: {
  carta: string;
  arrastre: Arrastre;
  arrastrable: boolean;
  className: string;
  style: CSSProperties;
  onClick: () => void;
}) {
  const { p } = useJuego();
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `mano:${carta}`, data: arrastre, disabled: !arrastrable });
  return (
    <CartaDeMano
      ref={setNodeRef}
      p={p}
      carta={carta}
      data-carta={carta}
      data-lupa={`carta:${carta}`}
      className={`${className} ${isDragging ? "arrastrando" : ""}`}
      style={style}
      onClick={onClick}
      {...(arrastrable ? listeners : {})}
      {...attributes}
    />
  );
}

// ---------- Paneles de jugador ----------

export function PanelJugador({ jugador, perfil, turno, onVer }: { jugador: number; perfil: Perfil; turno: string | null; onVer: () => void }) {
  const { p, yo, vista } = useJuego();
  const d = p.jugadores[jugador];
  const cuerdas = d.lineas.reduce((s, l) => s + l.cartas.length, 0);
  const colgadas = d.lineas.reduce((s, l) => s + l.cartas.reduce((t, c) => t + c.colgadas.length, 0), 0);
  const { lineas, cartasPorLinea } = p.ajustes.tendedero;
  return (
    <div
      className={`mf-panel mj-panel ${turno ? "turno" : ""} ${vista === jugador ? "viendo" : ""}`}
      style={{ "--jugador": perfil.color } as CSSProperties}
      data-panel={jugador}
      data-marco={perfil.marco ?? "sencillo"}
      onClick={onVer}
      role="button"
      title={jugador === yo ? t("mesa.secas.verTuyas") : t("mesa.secas.ver", { nombre: nombreVisible(perfil.nombre) })}
    >
      <div className="mf-panel-cabeza">
        <Animal id={perfil.animal} className="mf-panel-animal" />
        <div className="mf-panel-nombre">
          {nombreVisible(perfil.nombre)}
          {jugador === yo && !esNombreTu(perfil.nombre) && <small> {t("mesa.tuMarca")}</small>}
          {perfil.titulo && perfil.titulo !== "ninguno" && <CintaTitulo className="mf-panel-titulo" titulo={perfil.titulo} />}
        </div>
        <div className="mf-panel-puntos" data-puntos={jugador} title={t("mesa.puntos")}>
          {d.puntos}
        </div>
      </div>
      <div className="mf-panel-datos">
        <span className="mf-dato" data-pila={`secas-${jugador}`} title={t("mesa.prendasSecas")}>
          <i className="mf-icono mf-icono-seca" />
          {t("mesa.secas", { n: d.seca.length })}
        </span>
        <span className="mf-dato" data-panel-portender={jugador} title={t("mesa.prendasPorTender")}>
          <i className="mf-icono mf-icono-tender" />
          {t("mesa.porTenderN", { n: d.pendientes.length })}
        </span>
        <span className="mf-dato" title={t("mesa.prendasColgadas")}>
          <i className="mf-icono mf-icono-colgada" />
          {t("mesa.colgadas", { n: colgadas })}
        </span>
        <span className="mf-dato" title={t("mesa.cuerdasTendidas")}>
          <i className="mf-icono mf-icono-cuerda" />
          {t("mesa.cuerdasN", { n: cuerdas, max: lineas * cartasPorLinea })}
        </span>
        {d.trofeos.length > 0 && (
          <span className="mf-dato" title={t("mesa.trofeosTitulo")}>
            <i className="mf-icono mj-icono-trofeo" />
            {t("mesa.trofeos", { n: d.trofeos.length })}
          </span>
        )}
      </div>
      {jugador !== yo && (
        <div className="mf-panel-mano mj-panel-mano" data-mano-panel={jugador} title={t("mesa.cartasEnMano", { n: d.mano.length })}>
          {d.mano.map((_, i) => (
            <div key={i} className="carta-p mb-accion tapada" style={{ "--i": i } as CSSProperties}>
              <div className="carta-giro">
                <div className="cb" />
                <DorsoBosque />
              </div>
            </div>
          ))}
          <span>{t("mesa.cartas", { n: d.mano.length })}</span>
        </div>
      )}
      {turno && <div className="mf-turno">{turno}</div>}
    </div>
  );
}

// ---------- Registro ----------

export function Registro({ abierto, onAbrir }: { abierto: boolean; onAbrir: (si: boolean) => void }) {
  const { p, perfiles, yo } = useJuego();
  useT();
  // El registro estructurado del motor, en el idioma elegido; tus líneas, en segunda persona.
  const lineas = useMemo(
    () => lineasRegistro({ p, yo, nombre: (j) => nombreVisible(perfiles[j]?.nombre ?? p.jugadores[j]?.nombre ?? "") }).slice(-80).reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p, yo, perfiles, t("menu.tu")],
  );
  if (!abierto) {
    return (
      <button className="mf-registro mj-registro-cerrado" onClick={() => onAbrir(true)} title={t("mesa.abrirRegistro")}>
        <span>{t("mesa.loQueHaPasado")}</span>
      </button>
    );
  }
  return (
    <aside className="mf-registro mj-registro" aria-label={t("mesa.registroPartida")}>
      <h2>
        {t("mesa.loQueHaPasado")}
        <button className="mj-plegar" onClick={() => onAbrir(false)} title={t("mesa.plegarRegistro")} aria-label={t("mesa.plegarRegistro")}>
          ›
        </button>
      </h2>
      <ol>
        {lineas.map((l, i) => {
          const j = l.jugador ?? -1;
          return (
            <li key={p.registro.length - i} className={l.separador ? "mj-separador" : ""} style={{ "--jugador": j >= 0 && perfiles[j] ? perfiles[j].color : "#8a7356" } as CSSProperties}>
              {j >= 0 && perfiles[j] ? <Animal id={perfiles[j].animal} className="mf-registro-animal" /> : !l.separador && <span className="mf-registro-ronda">·</span>}
              <p>{l.texto}</p>
            </li>
          );
        })}
        {lineas.length === 0 && <li className="mf-registro-vacio">{t("mesa.registroVacio")}</li>}
      </ol>
    </aside>
  );
}

// ---------- Zona común: reparto, mazos, día y objetivos ----------

/**
 * Mazo de cartas de prenda boca abajo (la «bolsa» del motor): de aquí salen las que rellenan las cestas y aquí
 * vuelve lo que sobra en el centro. Conserva data-bolsa, que es lo que buscan esas animaciones.
 */
function Bolsa({ cuantas }: { cuantas: number }) {
  return (
    <div className="mj-mazo-prendas" data-bolsa title={t("mesa.mazoPrendas", { n: cuantas })}>
      {Array.from({ length: Math.min(3, Math.max(1, Math.ceil(cuantas / 12))) }, (_, i) => (
        <div key={i} className="mj-dorso-prenda" style={{ translate: `${-i * 2}px ${-i * 2}px` }}>
          <DorsoBosque clase="prendas" />
        </div>
      ))}
      <span className="mb-pila-nombre">{t("mesa.pilaPrendas", { n: cuantas })}</span>
    </div>
  );
}

/** Las 4 cestas (montones de cartas que se abren con un clic), el centro y la bolsa. */
export function Reparto() {
  const { p, yo, perfiles, jugar, ocupado } = useJuego();
  const [resaltado, setResaltado] = useState<{ origen: string; patron: Patron } | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const fase = p.turno.fase;
  const repartiendo = fase === "cesta" || fase === "centro";
  const miTurno = repartiendo && p.turno.jugador === yo && !ocupado && !p.terminada && p.jugadores.every((j) => j.objetivosOfrecidos.length === 0);
  useEffect(() => {
    if (abierto === null) return;
    const fuera = (ev: PointerEvent) => {
      if (!(ev.target as Element).closest?.(".me-monton.abierta")) setAbierto(null);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);
  useEffect(() => setAbierto(null), [fase, p.turno.jugador]);

  const clave = (o: Origen) => (o === "centro" ? "centro" : `c${o.cesta}`);
  const cumpleP = (id: string, patron: Patron) => ("color" in patron ? p.prendas[id].color === patron.color : p.prendas[id].tipo === patron.tipo);
  const marca = (o: Origen, id: string) => (resaltado && resaltado.origen === clave(o) ? (cumpleP(id, resaltado.patron) ? "destacada" : "apagada") : "");
  const quien = perfiles[p.turno.jugador];
  const aviso = !repartiendo
    ? t("reparto.aJugar")
    : miTurno
      ? fase === "cesta"
        ? t("reparto.teTocaCesta")
        : t("reparto.teTocaCentro")
      : p.turno.jugador === yo
        ? t(fase === "cesta" ? "reparto.teTocaCesta" : "reparto.teTocaCentro")
        : t(fase === "cesta" ? "reparto.cogiendoCesta" : "reparto.cogiendoCentro", { jugador: quien ? nombreVisible(quien.nombre) : t("reparto.alguien") });

  const monton = (o: Origen, titulo: string, prendas: string[], extra: Record<string, unknown>) => {
    const k = clave(o);
    const elegible = miTurno && (fase === "centro") === (o === "centro") && prendas.length > 0;
    return (
      <div
        key={k}
        className={`me-monton ${o === "centro" ? "me-monton-centro" : ""} ${elegible ? "elegible" : ""} ${abierto === k ? "abierta" : ""}`}
        onClick={() => prendas.length && setAbierto(k)}
        style={{ "--n": Math.max(1, prendas.length) } as CSSProperties}
        {...extra}
      >
        <div className="me-monton-nombre">{titulo}</div>
        <div className="me-monton-cartas">
          {prendas.map((id, i) => (
            <CartaPrenda
              key={id}
              p={p}
              prenda={id}
              {...{ [o === "centro" ? "data-encentro" : "data-encesta"]: id }}
              data-lupa={`prenda:${id}`}
              className={`me-en-monton ${marca(o, id)}`}
              style={{ "--k": i } as CSSProperties}
            />
          ))}
        </div>
        {prendas.length === 0 && <div className="me-cesta-vacia">{o === "centro" ? t("reparto.centroVacio") : t("reparto.cestaVacia")}</div>}
        {abierto === k && elegible && (
          <div className="me-opciones">
            {opcionesReparto(p, o).map((op) => (
              <button
                key={op.texto}
                className="me-opcion"
                onMouseEnter={() => setResaltado({ origen: k, patron: op.patron })}
                onMouseLeave={() => setResaltado(null)}
                onClick={(ev) => {
                  // Que el clic no llegue al montón (que lo volvería a abrir).
                  ev.stopPropagation();
                  setResaltado(null);
                  setAbierto(null);
                  jugar({ tipo: "draft", jugador: yo, origen: o, patron: op.patron });
                }}
              >
                {"color" in op.patron ? (
                  <i className="me-muestra" style={{ background: colorEstilo(p.catalogo.colores[op.patron.color]?.hex ?? "#ccc") }} />
                ) : (
                  <PrendaBosque tipo={op.patron.tipo} color="#f4f1ea" espacios={p.catalogo.tipos[op.patron.tipo]?.espacios ?? 1} className="me-muestra-tipo" />
                )}
                {op.texto}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="me-reparto">
      <div className={`me-reparto-aviso ${miTurno ? "tu-turno" : ""}`} style={{ "--jugador": repartiendo ? quien?.color : "#2b2019" } as CSSProperties}>
        {repartiendo && quien && <Animal id={quien.animal} className="me-reparto-animal" />}
        <span className="me-ronda">{t("reparto.ronda", { n: p.ronda })}</span>
        {p.ultimaRonda && <span className="me-ronda mj-ultima">{t("reparto.ultimaRonda")}</span>}
        <span>{aviso}</span>
      </div>
      <div className={`me-montones ${abierto !== null ? "hay-abierta" : ""}`}>
        {p.cestas.map((c, i) => monton({ cesta: i }, t("reparto.cesta", { n: i + 1 }), c, { "data-cesta": i }))}
        {monton("centro", t("reparto.centro"), p.centro, { "data-centro": "" })}
        <Bolsa cuantas={p.bolsa.length} />
      </div>
    </div>
  );
}

/** Mazos de cuerdas y acciones, con el descarte de acciones boca arriba. */
export function Mazos() {
  const { p } = useJuego();
  const descarte = p.descartes.acciones.at(-1);
  return (
    <div className="mb-mazos">
      <div className="mb-pila mb-pila-cuerdas" data-pila="mazo-cuerdas" title={t("mesa.mazoCuerdas", { n: p.mazos.cuerdas.length })}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-dorso-cuerda" style={{ translate: `${-i * 2}px ${-i * 2}px` }}>
            <DorsoBosque clase="cuerdas" />
          </div>
        ))}
        <span className="mb-pila-nombre">{t("mesa.pilaCuerdas", { n: p.mazos.cuerdas.length })}</span>
      </div>
      <div className="mb-pila" data-pila="mazo" title={t("mesa.mazoAcciones", { n: p.mazos.acciones.length })}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="carta-p tapada" style={{ translate: `${-i * 2}px ${-i * 2}px` }}>
            <div className="carta-giro">
              <DorsoBosque />
            </div>
          </div>
        ))}
        <span className="mb-pila-nombre">{t("mesa.pilaAcciones", { n: p.mazos.acciones.length })}</span>
      </div>
      <div className="mb-pila" data-pila="descarte" title={t("mesa.descarte")}>
        {descarte ? <CartaAccion p={p} carta={descarte} data-lupa={`carta:${descarte}`} /> : <div className="pila-vacia">{t("mesa.descarteVacio")}</div>}
        <span className="mb-pila-nombre">{t("mesa.descarte")}</span>
      </div>
    </div>
  );
}

/** Objetivos comunes y tu secreto, como cartas. */
export function Objetivos() {
  const { p, yo } = useJuego();
  const secreto = p.jugadores[yo]?.objetivoSecreto;
  return (
    <div className="mj-objetivos">
      {p.objetivosComunes.map((id) => (
        <CartaObjetivoJuego key={id} p={p} id={id} jugador={yo} />
      ))}
      {secreto && <CartaObjetivoJuego p={p} id={secreto} jugador={yo} secreto />}
    </div>
  );
}

