import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { ArteCesta } from "../arte/Escena";
import { ArteCartaCuerda, CaraAccion, CaraCuerda, CartaDia, CartaPrenda, DorsoMesa, MedallonCuerda } from "./ArteMesa";
import * as fx from "./efectos";
import {
  ACCIONES,
  Barra,
  bajoTecho,
  carta,
  COLORES,
  cuerda,
  CUERDAS,
  EFECTOS,
  JUGADORES,
  MAZO_RIVAL,
  MAZO_TU,
  nuevoId,
  objetivos,
  prenda,
  TIPOS,
  type CartaMano,
  type Cuerda,
  type Jugador,
  type Objetivo,
  type Prenda,
} from "./Prototipos";
import "./prototipos.css";
import "./mesa-cartas.css";

// Versión A2 · «Mesa de cartas»: lo mismo que la mesa de madera, pero todo son cartas. Las cartas de cuerda
// se juegan en el tendedero y, al caer, se convierten en un tramo de cuerda que empalma con las de al lado;
// las prendas son cartas que se cuelgan con pinzas. Las acciones reutilizan las animaciones de Prototipos.

type CartaMesa = { uid: string; clase: "accion" | "cuerda"; id: string; pinzas?: string };
type Estado = {
  jugadores: Jugador[];
  mano: CartaMesa[];
  manoRival: CartaMano[];
  descarte: string | null;
  /** Cuerda o prenda recién puesta, para su animación de entrada. */
  recien: string | null;
};
type Espacio = { cuerda: string; inicio: number; ancho: number };
type Seleccion = { tipo: "carta"; carta: CartaMesa } | { tipo: "prenda"; prenda: Prenda };

const CUERDAS_MAZO: { id: string; pinzas?: string }[] = [{ id: "basica" }, { id: "tejadillo" }, { id: "resistente" }, { id: "secado-rapido" }, { id: "modificador-puntuacion", pinzas: COLORES.rojo }];
const CUERDAS_POR_LINEA = 3;
const NUEVAS_PRENDAS: [keyof typeof TIPOS, keyof typeof COLORES][] = [
  ["calcetin", "rojo"],
  ["camiseta", "amarillo"],
  ["toalla", "azul"],
  ["calcetin", "blanco"],
  ["camiseta", "rojo"],
];

const deAccion = (id: string): CartaMesa => ({ uid: nuevoId("k"), clase: "accion", id });
const deCuerda = (id: string, pinzas?: string): CartaMesa => ({ uid: nuevoId("k"), clase: "cuerda", id, pinzas });
const efectoDe = (id: string) => (id === "basica" ? null : id);
const azar = <T,>(lista: T[]) => lista[Math.floor(Math.random() * lista.length)];

function inicial(): Estado {
  return {
    jugadores: [
      {
        lineas: [
          [cuerda(null, [[prenda("camiseta", "rojo", 2), 0], [prenda("calcetin", "azul", 1), 2]]), cuerda("secado-rapido", [[prenda("toalla", "amarillo", 3), 0]])],
          [cuerda("modificador-puntuacion", [[prenda("calcetin", "rojo", 1), 0]], COLORES.rojo)],
        ],
        porTender: [prenda("camiseta", "azul", 2), prenda("calcetin", "amarillo", 1), prenda("toalla", "blanco", 3)],
        secas: [prenda("calcetin", "blanco", 0)],
        puntos: 4,
      },
      {
        lineas: [
          [cuerda("resistente", [[prenda("toalla", "azul", 2), 0]]), cuerda("tejadillo", [[prenda("camiseta", "amarillo", 1), 0], [prenda("calcetin", "rojo", 1), 2]])],
          [cuerda(null, [[prenda("camiseta", "blanco", 2), 0], [prenda("calcetin", "azul", 1), 2]]), cuerda("fragil", [[prenda("calcetin", "amarillo", 1), 1]])],
        ],
        porTender: [prenda("toalla", "rojo", 3), prenda("calcetin", "blanco", 1)],
        secas: [prenda("camiseta", "rojo", 0), prenda("calcetin", "azul", 0)],
        puntos: 7,
      },
    ],
    mano: [deAccion("rafaga-de-viento"), deCuerda("tejadillo"), deAccion("retrasar-secado"), deCuerda("resistente"), deAccion("secar-prenda"), deAccion("mojar-cuerda-rival")],
    manoRival: MAZO_RIVAL.concat("retrasar-secado").map(carta),
    descarte: null,
    recien: null,
  };
}

/** Huecos donde cabe una prenda: cada inicio con espacio libre para todo su ancho. */
function espaciosLibres(j: Jugador, p: Prenda): Espacio[] {
  const ancho = TIPOS[p.tipo].espacios;
  const lista: Espacio[] = [];
  for (const l of j.lineas)
    for (const c of l) {
      const ocupado = new Set(c.colgadas.flatMap((g) => Array.from({ length: TIPOS[g.prenda.tipo].espacios }, (_, i) => g.inicio + i)));
      for (let i = 0; i + ancho <= 3; i++) if (!Array.from({ length: ancho }, (_, k) => i + k).some((k) => ocupado.has(k))) lista.push({ cuerda: c.id, inicio: i, ancho });
    }
  return lista;
}

const lineasConHueco = (j: Jugador) => j.lineas.flatMap((l, i) => (l.length < CUERDAS_POR_LINEA ? [i] : []));

export function MesaCartas({ onVersion, onVolver }: { onVersion: (v: string) => void; onVolver: () => void }) {
  const [estado, setEstado] = useState(inicial);
  const [sel, setSel] = useState<Seleccion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const flecha = useRef<SVGPathElement>(null);

  const yo = estado.jugadores[0];
  const objetivosAccion = sel?.tipo === "carta" && sel.carta.clase === "accion" ? objetivos(estado, 0, sel.carta.id) : [];
  const huecos = sel?.tipo === "carta" && sel.carta.clase === "cuerda" ? lineasConHueco(yo) : [];
  const espacios = sel?.tipo === "prenda" ? espaciosLibres(yo, sel.prenda) : [];
  const esValido = (tipo: Objetivo["tipo"], id: string) => objetivosAccion.some((o) => o.tipo === tipo && o.id === id);
  const origenSel = sel ? (sel.tipo === "carta" ? `[data-uid="${sel.carta.uid}"]` : `[data-portender="${sel.prenda.id}"]`) : null;

  function cambiar(fn: (e: Estado) => void) {
    flushSync(() =>
      setEstado((e) => {
        const n = structuredClone(e);
        fn(n);
        return n;
      }),
    );
  }
  const el = (s: string) => raiz.current!.querySelector<HTMLElement>(s)!;
  const rect = (s: string) => el(s).getBoundingClientRect();

  // Flecha de la carta (o prenda) elegida al ratón.
  useEffect(() => {
    if (!origenSel) return;
    const mover = (ev: MouseEvent) => {
      const o = raiz.current?.querySelector(origenSel);
      if (!o || !flecha.current) return;
      const r = o.getBoundingClientRect();
      const a = { x: r.left + r.width / 2, y: r.top + 10 };
      const c = { x: (a.x + ev.clientX) / 2, y: Math.min(a.y, ev.clientY) - 80 };
      flecha.current.setAttribute("d", `M${a.x} ${a.y} Q${c.x} ${c.y} ${ev.clientX} ${ev.clientY}`);
    };
    const cancelar = (ev: KeyboardEvent) => ev.key === "Escape" && setSel(null);
    window.addEventListener("mousemove", mover);
    window.addEventListener("keydown", cancelar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("keydown", cancelar);
      flecha.current?.setAttribute("d", "");
    };
  }, [origenSel]);

  /** Ejecuta una jugada animada sin dejar que se pulse nada a la vez; si algo falla, recoge la mesa. */
  async function animar(fn: () => Promise<void>) {
    setSel(null);
    setOcupado(true);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
      raiz.current?.querySelectorAll<HTMLElement>("[data-uid], [data-prenda], [data-portender]").forEach((n) => (n.style.visibility = ""));
    } finally {
      setOcupado(false);
    }
  }

  async function lanzarCarta(cartaEl: HTMLElement, destino: { x: number; y: number }, rival: boolean) {
    const anchoMesa = (raiz.current!.querySelector<HTMLElement>(".mano .carta-p")?.offsetWidth ?? 120) * 0.62;
    const clon = fx.clonar(cartaEl);
    cartaEl.style.visibility = "hidden";
    await fx.volar(clon, destino, { arco: 160, escala: anchoMesa / cartaEl.offsetWidth, giro: rival ? 6 : -6, duracion: 800, voltear: rival });
    await fx.golpe(clon);
    return clon;
  }

  async function aDescarte(clon: HTMLElement, cartaEl: HTMLElement) {
    const d = rect('[data-pila="descarte"]');
    await fx.volar(clon, fx.centro(d), { arco: 40, escala: d.width / cartaEl.offsetWidth, giro: 3, duracion: 500 });
  }

  // ---------- Acciones (las mismas animaciones que las otras versiones) ----------

  function jugarAccion(quien: number, uid: string, id: string, objetivo: Objetivo) {
    return animar(async () => {
      const def = ACCIONES[id];
      const selObjetivo = objetivo.tipo === "prenda" ? `[data-prenda="${objetivo.id}"]` : `[data-cuerda="${objetivo.id}"]`;
      const cartaEl = el(`[data-uid="${uid}"]`);
      const zona = rect(selObjetivo);
      fx.anunciar(
        def.nombre,
        objetivo.jugador === quien ? `${JUGADORES[quien].nombre} · en su tendedero` : `${JUGADORES[quien].nombre}  ➜  ${JUGADORES[objetivo.jugador].nombre}`,
        def.grupo === "fastidio" ? "fastidio" : "tactica",
      );
      const quitarEstela = fx.estela(fx.centro(cartaEl.getBoundingClientRect()), fx.centro(zona), JUGADORES[quien].color);
      const clon = await lanzarCarta(cartaEl, { x: fx.centro(zona).x, y: Math.max(90, zona.top - 70) }, quien === 1);
      await EFECTOS[def.efecto]({ objetivo, selObjetivo, el, rect, cambiar: (fn) => cambiar(fn) });
      quitarEstela();
      await fx.esperar(150);
      await aDescarte(clon, cartaEl);
      cambiar((e) => {
        if (quien === 0) e.mano = e.mano.filter((c) => c.uid !== uid);
        else e.manoRival = e.manoRival.filter((c) => c.uid !== uid);
        e.descarte = id;
      });
      clon.remove();
      await robar(quien);
    });
  }

  // ---------- Cuerdas: la carta cae en el hueco y se convierte en tendedero ----------

  function ponerCuerda(quien: number, c: CartaMesa, linea: number) {
    return animar(async () => {
      const cartaEl = el(`[data-uid="${c.uid}"]`);
      const hueco = rect(`[data-hueco="${quien}:${linea}"]`);
      const nombre = c.id === "modificador-puntuacion" ? "Pinzas rojas" : CUERDAS[c.id]?.nombre;
      fx.anunciar(nombre, `${JUGADORES[quien].nombre} · tiende una cuerda`, "cuerda");
      const clon = fx.clonar(cartaEl);
      cartaEl.style.visibility = "hidden";
      // La carta vertical gira en el aire hasta quedar apaisada, del tamaño del hueco.
      const escala = Math.min(hueco.width / cartaEl.offsetHeight, hueco.height / cartaEl.offsetWidth);
      await fx.volar(clon, fx.centro(hueco), { arco: 180, escala, giro: -90, duracion: 850 });
      await fx.golpe(clon);
      fx.salpicar({ x: hueco.left + 8, y: hueco.bottom - 4 }, "#d9c3a0", 7);
      fx.salpicar({ x: hueco.right - 8, y: hueco.bottom - 4 }, "#d9c3a0", 7);

      // El poste del final se aparta para dejar sitio, y la cuerda nueva se tiende.
      const fin = `[data-fin="${quien}:${linea}"]`;
      const antes = rect(fin);
      const nueva = cuerda(efectoDe(c.id), [], c.pinzas);
      cambiar((e) => {
        e.jugadores[quien].lineas[linea].push(nueva);
        if (quien === 0) e.mano = e.mano.filter((m) => m.uid !== c.uid);
        e.recien = nueva.id;
      });
      const despues = rect(fin);
      el(fin).animate([{ transform: `translateX(${antes.left - despues.left}px)` }, { transform: "translateX(6px)", offset: 0.7 }, { transform: "none" }], {
        duration: 650,
        easing: "cubic-bezier(.3,.7,.3,1)",
      });
      void fx.desvanecer(clon, 450);
      // La línea entera se tensa un momento, como una cuerda al atarla.
      el(`[data-linea="${quien}:${linea}"]`).animate([{ transform: "none" }, { transform: "scaleY(1.04) translateY(-2px)" }, { transform: "none" }], { duration: 420, delay: 380, easing: "ease-out" });
      await fx.esperar(1100);
      cambiar((e) => void (e.recien = null));
      if (quien === 0) await robar(0);
    });
  }

  // ---------- Prendas: de la pila «por tender» a la cuerda, con pinzas ----------

  function colgar(quien: number, p: Prenda, cuerdaId: string, inicio: number) {
    return animar(async () => {
      const cartaEl = el(`[data-portender="${p.id}"]`);
      const cz = rect(`[data-cuerda="${cuerdaId}"]`);
      const celda = cz.width / 3;
      const ancho = celda * TIPOS[p.tipo].espacios - 6;
      // Misma proporción que .mc-colgada en el CSS: arriba en la cuerda y 1,48 celdas de alto.
      const destino = { x: cz.left + celda * (inicio + TIPOS[p.tipo].espacios / 2), y: cz.top + cz.height * 0.188 + (celda * 1.48) / 2 };
      const clon = fx.clonar(cartaEl);
      cartaEl.style.visibility = "hidden";
      await fx.volar(clon, destino, { arco: 120, escala: ancho / cartaEl.offsetWidth, giro: 0, duracion: 750 });
      cambiar((e) => {
        const j = e.jugadores[quien];
        const pr = j.porTender.find((x) => x.id === p.id)!;
        j.porTender = j.porTender.filter((x) => x.id !== p.id);
        for (const l of j.lineas) for (const c of l) if (c.id === cuerdaId) c.colgadas.push({ prenda: pr, inicio });
        e.recien = p.id;
      });
      clon.remove();
      // Clac, clac: saltan astillas donde muerden las pinzas.
      const colgada = rect(`[data-prenda="${p.id}"]`);
      setTimeout(() => fx.salpicar({ x: colgada.left + celda / 2, y: colgada.top }, "#c99a62", 6), 250);
      if (TIPOS[p.tipo].espacios > 1) setTimeout(() => fx.salpicar({ x: colgada.right - celda / 2, y: colgada.top }, "#c99a62", 6), 380);
      await fx.esperar(900);
      cambiar((e) => void (e.recien = null));
      await reponerPrenda(quien);
    });
  }

  /** Sale una prenda nueva de una cesta y va a la pila del jugador. */
  async function reponerPrenda(quien: number) {
    const [tipo, color] = azar(NUEVAS_PRENDAS);
    const nueva = prenda(tipo, color, TIPOS[tipo].humedad);
    const cesta = rect(`[data-cesta="${Math.floor(Math.random() * 3)}"]`);
    cambiar((e) => void e.jugadores[quien].porTender.push(nueva));
    await fx.traerDesde(el(`[data-portender="${nueva.id}"]`), cesta);
  }

  async function robar(quien: number) {
    if (quien === 1) {
      const nueva = carta(azar(MAZO_RIVAL));
      const desde = rect('[data-pila="mazo"]');
      cambiar((e) => void e.manoRival.push(nueva));
      await fx.traerDesde(el(`[data-uid="${nueva.uid}"]`), desde);
      return;
    }
    const esCuerda = Math.random() < 0.35;
    const c = CUERDAS_MAZO[Math.floor(Math.random() * CUERDAS_MAZO.length)];
    const nueva = esCuerda ? deCuerda(c.id, c.pinzas) : deAccion(azar(MAZO_TU));
    const desde = rect(esCuerda ? '[data-pila="mazo-cuerdas"]' : '[data-pila="mazo"]');
    cambiar((e) => void e.mano.push(nueva));
    await fx.traerDesde(el(`[data-uid="${nueva.uid}"]`), desde, true);
  }

  async function turnoRival() {
    const lu = estado.jugadores[1];
    const ataques = estado.manoRival.flatMap((m) => objetivos(estado, 1, m.id).map((o) => () => jugarAccion(1, m.uid, m.id, o)));
    const tendidos = lu.porTender.flatMap((p) => espaciosLibres(lu, p).map((s) => () => colgar(1, p, s.cuerda, s.inicio)));
    const opciones = Math.random() < 0.6 && ataques.length ? ataques : tendidos.length ? tendidos : ataques;
    if (opciones.length) await azar(opciones)();
  }

  function reiniciar() {
    setSel(null);
    raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
    setEstado(inicial());
  }

  function elegirCarta(c: CartaMesa, jugable: boolean) {
    if (ocupado || !jugable) return;
    setSel(sel?.tipo === "carta" && sel.carta.uid === c.uid ? null : { tipo: "carta", carta: c });
  }

  function pulsarObjetivo(tipo: Objetivo["tipo"], jugador: number, id: string) {
    if (sel?.tipo !== "carta" || ocupado || !esValido(tipo, id)) return;
    void jugarAccion(0, sel.carta.uid, sel.carta.id, { tipo, jugador, id });
  }

  const apuntaAlRival = objetivosAccion.some((o) => o.jugador === 1);

  return (
    <div ref={raiz} className={`proto proto-a mc ${sel ? "apuntando" : ""} ${ocupado ? "ocupado" : ""}`}>
      <Barra version="a2" onVersion={onVersion} onVolver={onVolver} ocupado={ocupado} onRival={() => void turnoRival()} onReiniciar={reiniciar} />

      <div className="escenario mc-escenario">
        <div className="mc-luz" aria-hidden />
        <div className="mc-mesa">
          <Tapete
            jugador={1}
            datos={estado.jugadores[1]}
            recien={estado.recien}
            esValido={esValido}
            onObjetivo={pulsarObjetivo}
            apuntada={apuntaAlRival}
            manoRival={estado.manoRival}
          />

          <section className="mc-centro">
            <div className="mc-cestas">
              {(["camiseta", "toalla", "calcetin"] as const).map((t, i) => (
                <div key={t} className="mc-cesta" data-cesta={i}>
                  <CartaPrenda p={{ id: `cesta-${i}`, tipo: t, color: Object.values(COLORES)[(i + 1) % 4], humedad: TIPOS[t].humedad }} className="mc-cesta-carta" />
                  <ArteCesta />
                </div>
              ))}
            </div>
            <div className="mc-mazos">
              <div className="mc-pila" data-pila="mazo-cuerdas" title="Mazo de cuerdas">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="carta-p tapada" style={{ translate: `${-i * 2}px ${-i * 2}px` }}>
                    <div className="carta-giro">
                      <DorsoMesa clase="cuerdas" />
                    </div>
                  </div>
                ))}
                <span className="mc-pila-nombre">Cuerdas</span>
              </div>
              <div className="mc-pila" data-pila="mazo" title="Mazo de acciones">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="carta-p tapada" style={{ translate: `${-i * 2}px ${-i * 2}px` }}>
                    <div className="carta-giro">
                      <DorsoMesa />
                    </div>
                  </div>
                ))}
                <span className="mc-pila-nombre">Acciones</span>
              </div>
              <div className="mc-pila" data-pila="descarte" title="Descarte">
                {estado.descarte ? (
                  <div className="carta-p">
                    <div className="carta-giro">
                      <CaraAccion id={estado.descarte} />
                    </div>
                  </div>
                ) : (
                  <div className="pila-vacia">descarte</div>
                )}
                <span className="mc-pila-nombre">Descarte</span>
              </div>
            </div>
            <CartaDia />
          </section>

          <Tapete
            jugador={0}
            datos={yo}
            recien={estado.recien}
            esValido={esValido}
            onObjetivo={pulsarObjetivo}
            huecos={huecos}
            espacios={espacios}
            prendaElegida={sel?.tipo === "prenda" ? sel.prenda.id : null}
            onHueco={(l) => sel?.tipo === "carta" && void ponerCuerda(0, sel.carta, l)}
            onEspacio={(c, i) => sel?.tipo === "prenda" && void colgar(0, sel.prenda, c, i)}
            onPrenda={(p) => !ocupado && setSel(sel?.tipo === "prenda" && sel.prenda.id === p.id ? null : { tipo: "prenda", prenda: p })}
          />
        </div>
      </div>

      <div className="mano">
        {estado.mano.map((c, i) => {
          const jugable = c.clase === "cuerda" ? lineasConHueco(yo).length > 0 : objetivos(estado, 0, c.id).length > 0;
          const elegida = sel?.tipo === "carta" && sel.carta.uid === c.uid;
          const centrado = i - (estado.mano.length - 1) / 2;
          return (
            <div
              key={c.uid}
              data-uid={c.uid}
              className={`carta-p mc-carta ${elegida ? "elegida" : ""} ${jugable ? "" : "apagada"}`}
              style={{ "--abanico": `${centrado * 5}deg`, "--alzado": `${Math.abs(centrado) * 7}px` } as CSSProperties}
              onClick={() => elegirCarta(c, jugable)}
            >
              <div className="carta-giro">
                {c.clase === "accion" ? <CaraAccion id={c.id} /> : <CaraCuerda efecto={efectoDe(c.id)} pinzas={c.pinzas} />}
                <DorsoMesa clase={c.clase === "accion" ? "acciones" : "cuerdas"} />
              </div>
            </div>
          );
        })}
        <p className="ayuda-mano">
          {sel?.tipo === "prenda"
            ? "Elige dónde colgarla (Esc para cancelar)"
            : sel?.tipo === "carta" && sel.carta.clase === "cuerda"
              ? "Elige en qué línea tenderla"
              : sel
                ? "Elige a qué se la juegas (Esc para cancelar)"
                : "Juega una carta o cuelga una prenda de tu pila"}
        </p>
      </div>

      <svg className="flecha-apuntar" aria-hidden>
        <defs>
          <marker id="punta-flecha-mc" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <path ref={flecha} markerEnd="url(#punta-flecha-mc)" />
      </svg>
      <div className="capa-efectos" ref={fx.usarCapa} />
    </div>
  );
}

function Tapete({
  jugador,
  datos,
  recien,
  esValido,
  onObjetivo,
  apuntada,
  manoRival,
  huecos = [],
  espacios = [],
  prendaElegida,
  onHueco,
  onEspacio,
  onPrenda,
}: {
  jugador: number;
  datos: Jugador;
  recien: string | null;
  esValido: (tipo: Objetivo["tipo"], id: string) => boolean;
  onObjetivo: (tipo: Objetivo["tipo"], jugador: number, id: string) => void;
  apuntada?: boolean;
  manoRival?: CartaMano[];
  huecos?: number[];
  espacios?: Espacio[];
  prendaElegida?: string | null;
  onHueco?: (linea: number) => void;
  onEspacio?: (cuerda: string, inicio: number) => void;
  onPrenda?: (p: Prenda) => void;
}) {
  const j = JUGADORES[jugador];
  return (
    <section className={`mc-tapete mc-tapete-${jugador === 0 ? "tu" : "rival"} ${apuntada ? "apuntada" : ""}`} style={{ "--jugador": j.color } as CSSProperties}>
      <div className="mc-placa">
        <div className="mc-ficha">{j.nombre[0]}</div>
        <div className="mc-placa-nombre">{j.nombre}</div>
        <div className="mc-placa-puntos" data-puntos={jugador}>
          <b>{datos.puntos}</b>
          <span>puntos</span>
        </div>
        <div className="mc-secas" data-pila={`secas-${jugador}`} title="Prendas secas">
          {datos.secas.slice(-4).map((p, i) => (
            <CartaPrenda key={p.id} p={p} className="mc-seca" style={{ "--i": i } as CSSProperties} />
          ))}
          <span>{datos.secas.length} secas</span>
        </div>
      </div>

      <div className="mc-tendedero" data-zona={jugador}>
        {datos.lineas.map((linea, l) => (
          <div key={l} className="mc-linea" data-linea={`${jugador}:${l}`}>
            <div className="mc-poste">
              <span>{l + 1}</span>
            </div>
            {linea.map((c, pos) => (
              <CuerdaEnMesa
                key={c.id}
                c={c}
                jugador={jugador}
                techada={bajoTecho(datos, l, pos)}
                recien={recien}
                esValido={esValido}
                onObjetivo={onObjetivo}
                espacios={espacios.filter((s) => s.cuerda === c.id)}
                prendaElegida={prendaElegida}
                onEspacio={onEspacio}
              />
            ))}
            <div className="mc-poste fin" data-fin={`${jugador}:${l}`} />
            {linea.length < CUERDAS_POR_LINEA && (
              <div className={`mc-hueco ${huecos.includes(l) ? "valido" : ""}`} data-hueco={`${jugador}:${l}`} onClick={() => huecos.includes(l) && onHueco?.(l)}>
                <span>cuerda</span>
              </div>
            )}
            {Array.from({ length: Math.max(0, CUERDAS_POR_LINEA - linea.length - 1) }, (_, i) => (
              <div key={i} className="mc-hueco vacio" />
            ))}
          </div>
        ))}
      </div>

      <div className="mc-portender" data-pila={`porTender-${jugador}`}>
        <div className="mc-portender-titulo">Por tender</div>
        <div className="mc-portender-cartas">
          {datos.porTender.map((p) => (
            <CartaPrenda
              key={p.id}
              p={p}
              data-portender={p.id}
              className={`mc-pendiente ${onPrenda ? "jugable" : ""} ${prendaElegida === p.id ? "elegida" : ""}`}
              onClick={onPrenda ? () => onPrenda(p) : undefined}
            />
          ))}
        </div>
      </div>

      {manoRival && (
        <div className="mano-rival mc-mano-rival">
          {manoRival.map((m, i) => {
            const centrado = i - (manoRival.length - 1) / 2;
            return (
              <div key={m.uid} data-uid={m.uid} className="carta-p tapada" style={{ "--abanico": `${centrado * -4}deg`, "--alzado": `${Math.abs(centrado) * -4}px` } as CSSProperties}>
                <div className="carta-giro">
                  <CaraAccion id={m.id} />
                  <DorsoMesa />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CuerdaEnMesa({
  c,
  jugador,
  techada,
  recien,
  esValido,
  onObjetivo,
  espacios,
  prendaElegida,
  onEspacio,
}: {
  c: Cuerda;
  jugador: number;
  techada: boolean;
  recien: string | null;
  esValido: (tipo: Objetivo["tipo"], id: string) => boolean;
  onObjetivo: (tipo: Objetivo["tipo"], jugador: number, id: string) => void;
  espacios: Espacio[];
  prendaElegida?: string | null;
  onEspacio?: (cuerda: string, inicio: number) => void;
}) {
  const nombre = c.efecto === "modificador-puntuacion" ? "Pinzas rojas" : CUERDAS[c.efecto ?? "basica"]?.nombre;
  return (
    <div
      data-cuerda={c.id}
      className={`mc-cuerda ${recien === c.id ? "aparece" : ""} ${esValido("cuerda", c.id) ? "valido" : ""} ${techada ? "techada" : ""}`}
      onClick={() => onObjetivo("cuerda", jugador, c.id)}
      title={nombre}
    >
      <ArteCartaCuerda efecto={c.efecto} pinzas={c.pinzas} className="mc-cuerda-arte" />
      <div className="mc-cuerda-cinta">{nombre}</div>
      <MedallonCuerda efecto={c.efecto} />
      {espacios.map((s) => (
        <div
          key={s.inicio}
          className="mc-espacio"
          style={{ "--inicio": s.inicio, "--ancho": s.ancho } as CSSProperties}
          onClick={(ev) => {
            ev.stopPropagation();
            onEspacio?.(c.id, s.inicio);
          }}
        />
      ))}
      {c.colgadas.map(({ prenda: p, inicio }) => (
        <CartaPrenda
          key={p.id}
          p={p}
          pinzas
          colorPinzas={c.pinzas}
          data-prenda={p.id}
          className={`mc-colgada prenda-p ${recien === p.id ? "colgando" : ""} ${esValido("prenda", p.id) ? "valido" : ""}`}
          style={{ "--inicio": inicio, "--d": `${(inicio * 0.7 + p.id.length) % 3}s` } as CSSProperties}
          onClick={(ev) => {
            ev.stopPropagation();
            onObjetivo("prenda", jugador, p.id);
          }}
        />
      ))}
    </div>
  );
}
