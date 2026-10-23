import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { CestaBosque, DefsBosque, Raton, Zorra } from "./ArteBosque";
import { CaraAccionBosque, CartaCuerdaBosque, CartaDiaBosque, CartaPrendaBosque, CUERDA_H, DorsoBosque, HUECO_ALTO, HUECO_Y, LosetaBosque } from "./CartasBosque";
import { useAjustarMesa } from "./ajustar";
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
import "./mesa-bosque.css";
import "./estilos-dibujo.css";

// Versión D · «Mesa ilustrada»: los componentes tal como serán en la mesa real. Las cartas de cuerda son
// apaisadas (en la mano y en el tendedero, la misma carta) con sus tres huecos; cada tendedero empieza en una
// loseta de cartón con la leyenda de las cuerdas; 2 líneas de hasta 4 cartas. Ilustraciones de trazo grueso.

type CartaMesa = { uid: string; clase: "accion" | "cuerda"; id: string; pinzas?: string };
type Estado = { jugadores: Jugador[]; mano: CartaMesa[]; manoRival: CartaMano[]; descarte: string | null; recien: string | null };
type Espacio = { cuerda: string; inicio: number; ancho: number };
type Seleccion = { tipo: "carta"; carta: CartaMesa } | { tipo: "prenda"; prenda: Prenda };

const CUERDAS_POR_LINEA = 4;
const CUERDAS_MAZO: { id: string; pinzas?: string }[] = [{ id: "basica" }, { id: "tejadillo" }, { id: "resistente" }, { id: "secado-rapido" }, { id: "modificador-puntuacion", pinzas: COLORES.rojo }];
const NUEVAS_PRENDAS: [keyof typeof TIPOS, keyof typeof COLORES][] = [
  ["calcetin", "rojo"],
  ["camiseta", "amarillo"],
  ["toalla", "azul"],
  ["calcetin", "blanco"],
  ["camiseta", "rojo"],
];
const ANIMALES = [Raton, Zorra];

/** Estilos de dibujo: los mismos componentes con otra paleta, trazo, sombreado, texturas y letras (estilos-dibujo.css). */
export const ESTILOS = [
  { id: "fusion", nombre: "Fusión (tu mezcla)" },
  { id: "bosque", nombre: "Bosque (tinta)" },
  { id: "minimal", nombre: "Minimalista" },
  { id: "detallado", nombre: "Detallado" },
  { id: "impresionista", nombre: "Impresionista" },
  { id: "anime", nombre: "Anime" },
  { id: "cozy", nombre: "Cozy" },
  { id: "acuarela", nombre: "Acuarela" },
  { id: "pixel", nombre: "Pixel art" },
  { id: "grabado", nombre: "Grabado" },
  { id: "recortable", nombre: "Papel recortado" },
  { id: "retro", nombre: "Retro risografía" },
];

function leerEstilo(): string {
  try {
    return localStorage.getItem("tendedero-estilo") ?? "fusion";
  } catch {
    return "fusion";
  }
}

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
          [cuerda("resistente", [[prenda("toalla", "azul", 2), 0]]), cuerda("tejadillo", [[prenda("camiseta", "amarillo", 1), 0], [prenda("calcetin", "rojo", 1), 2]]), cuerda(null, [[prenda("calcetin", "blanco", 1), 1]])],
          [cuerda(null, [[prenda("camiseta", "blanco", 2), 0], [prenda("calcetin", "azul", 1), 2]]), cuerda("fragil", [[prenda("calcetin", "amarillo", 1), 1]])],
        ],
        porTender: [prenda("toalla", "rojo", 3), prenda("calcetin", "blanco", 1)],
        secas: [prenda("camiseta", "rojo", 0), prenda("calcetin", "azul", 0)],
        puntos: 7,
      },
    ],
    mano: [deAccion("rafaga-de-viento"), deCuerda("tejadillo"), deAccion("retrasar-secado"), deCuerda("resistente"), deAccion("secar-prenda")],
    manoRival: MAZO_RIVAL.concat("retrasar-secado").map(carta),
    descarte: null,
    recien: null,
  };
}

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

export function MesaBosque({ onVersion, onVolver }: { onVersion: (v: string) => void; onVolver: () => void }) {
  const [estado, setEstado] = useState(inicial);
  const [sel, setSel] = useState<Seleccion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [estilo, setEstiloActual] = useState(leerEstilo);
  const raiz = useRef<HTMLDivElement>(null);
  const flecha = useRef<SVGPathElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const mesa = useRef<HTMLDivElement>(null);
  useAjustarMesa(escenario, mesa);

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

  // ---------- Acciones ----------

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
      const anchoMesa = (raiz.current!.querySelector<HTMLElement>(".mano .mb-accion")?.offsetWidth ?? 120) * 0.62;
      const clon = fx.clonar(cartaEl);
      cartaEl.style.visibility = "hidden";
      await fx.volar(clon, { x: fx.centro(zona).x, y: Math.max(90, zona.top - 70) }, { arco: 160, escala: anchoMesa / cartaEl.offsetWidth, giro: quien ? 6 : -6, duracion: 800, voltear: quien === 1 });
      await fx.golpe(clon);
      await EFECTOS[def.efecto]({ objetivo, selObjetivo, el, rect, cambiar: (fn) => cambiar(fn) });
      quitarEstela();
      await fx.esperar(150);
      const d = rect('[data-pila="descarte"]');
      await fx.volar(clon, fx.centro(d), { arco: 40, escala: d.width / cartaEl.offsetWidth, giro: 3, duracion: 500 });
      cambiar((e) => {
        if (quien === 0) e.mano = e.mano.filter((c) => c.uid !== uid);
        else e.manoRival = e.manoRival.filter((c) => c.uid !== uid);
        e.descarte = id;
      });
      clon.remove();
      await robar(quien);
    });
  }

  // ---------- Cuerdas: la misma carta pasa de la mano al tendedero ----------

  function ponerCuerda(quien: number, c: CartaMesa, linea: number) {
    return animar(async () => {
      const cartaEl = el(`[data-uid="${c.uid}"]`);
      const hueco = rect(`[data-hueco="${quien}:${linea}"]`);
      fx.anunciar(c.id === "modificador-puntuacion" ? "Pinzas rojas" : CUERDAS[c.id]?.nombre, `${JUGADORES[quien].nombre} · tiende una cuerda`, "cuerda");
      const clon = fx.clonar(cartaEl);
      cartaEl.style.visibility = "hidden";
      await fx.volar(clon, fx.centro(hueco), { arco: 170, escala: hueco.width / cartaEl.offsetWidth, giro: 0, duracion: 850 });
      await fx.golpe(clon);
      fx.salpicar({ x: hueco.left + 8, y: hueco.bottom - 4 }, "#d9c3a0", 7);
      fx.salpicar({ x: hueco.right - 8, y: hueco.bottom - 4 }, "#d9c3a0", 7);
      const nueva = cuerda(efectoDe(c.id), [], c.pinzas);
      cambiar((e) => {
        e.jugadores[quien].lineas[linea].push(nueva);
        if (quien === 0) e.mano = e.mano.filter((m) => m.uid !== c.uid);
        e.recien = nueva.id;
      });
      clon.remove();
      // La cuerda de la carta se ata a la de al lado: se tensa la línea entera.
      el(`[data-linea="${quien}:${linea}"]`).animate([{ transform: "none" }, { transform: "translateY(-3px)" }, { transform: "translateY(1px)" }, { transform: "none" }], {
        duration: 500,
        delay: 450,
        easing: "ease-out",
      });
      await fx.esperar(1100);
      cambiar((e) => void (e.recien = null));
      if (quien === 0) await robar(0);
    });
  }

  // ---------- Prendas ----------

  function colgar(quien: number, p: Prenda, cuerdaId: string, inicio: number) {
    return animar(async () => {
      const cartaEl = el(`[data-portender="${p.id}"]`);
      const cz = rect(`[data-cuerda="${cuerdaId}"]`);
      const celda = cz.width / 3;
      const esp = TIPOS[p.tipo].espacios;
      const ancho = celda * esp - celda * (10 / 60);
      const alto = (cz.height * HUECO_ALTO) / CUERDA_H;
      const destino = { x: cz.left + celda * (inicio + esp / 2), y: cz.top + (cz.height * HUECO_Y) / CUERDA_H + alto / 2 };
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
      const colgada = rect(`[data-prenda="${p.id}"]`);
      setTimeout(() => fx.salpicar({ x: colgada.left + celda / 2, y: colgada.top }, "#c99a62", 6), 250);
      if (esp > 1) setTimeout(() => fx.salpicar({ x: colgada.right - celda / 2, y: colgada.top }, "#c99a62", 6), 380);
      await fx.esperar(900);
      cambiar((e) => void (e.recien = null));
      const [tipo, color] = azar(NUEVAS_PRENDAS);
      const nueva = prenda(tipo, color, TIPOS[tipo].humedad);
      const cesta = rect(`[data-cesta="${Math.floor(Math.random() * 3)}"]`);
      cambiar((e) => void e.jugadores[quien].porTender.push(nueva));
      await fx.traerDesde(el(`[data-portender="${nueva.id}"]`), cesta);
    });
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
    const c = azar(CUERDAS_MAZO);
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

  function elegirEstilo(id: string) {
    setEstiloActual(id);
    try {
      localStorage.setItem("tendedero-estilo", id);
    } catch {
      // Sin almacenamiento solo se pierde la elección al recargar.
    }
  }

  function reiniciar() {
    setSel(null);
    raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
    setEstado(inicial());
  }

  function pulsarObjetivo(tipo: Objetivo["tipo"], jugador: number, id: string) {
    if (sel?.tipo !== "carta" || ocupado || !esValido(tipo, id)) return;
    void jugarAccion(0, sel.carta.uid, sel.carta.id, { tipo, jugador, id });
  }

  const apuntaAlRival = objetivosAccion.some((o) => o.jugador === 1);

  return (
    <div ref={raiz} className={`proto mb con-estilos estilo-${estilo} ${sel ? "apuntando" : ""} ${ocupado ? "ocupado" : ""}`}>
      <DefsBosque />
      <Barra version="d" onVersion={onVersion} onVolver={onVolver} ocupado={ocupado} onRival={() => void turnoRival()} onReiniciar={reiniciar} />
      <nav className="mb-estilos">
        <span>Estilo de dibujo:</span>
        {ESTILOS.map((e) => (
          <button key={e.id} className={e.id === estilo ? "activa" : ""} onClick={() => elegirEstilo(e.id)}>
            {e.nombre}
          </button>
        ))}
      </nav>

      <div className="escenario mb-escenario" ref={escenario}>
        <div className="mb-luz" aria-hidden />
        <div className="mb-mesa" ref={mesa}>
          <Tapete jugador={1} datos={estado.jugadores[1]} recien={estado.recien} esValido={esValido} onObjetivo={pulsarObjetivo} apuntada={apuntaAlRival} manoRival={estado.manoRival} />

          <section className="mb-centro">
            <div className="mb-cestas">
              {(["camiseta", "toalla", "calcetin"] as const).map((t, i) => (
                <div key={t} className="mb-cesta" data-cesta={i}>
                  <CartaPrendaBosque p={{ id: `cesta-${i}`, tipo: t, color: Object.values(COLORES)[(i + 1) % 4], humedad: TIPOS[t].humedad }} className="mb-cesta-carta" />
                  <CestaBosque className="mb-cesta-arte" />
                </div>
              ))}
            </div>
            <div className="mb-mazos">
              <div className="mb-pila mb-pila-cuerdas" data-pila="mazo-cuerdas" title="Mazo de cuerdas">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="mb-dorso-cuerda" style={{ translate: `${-i * 2}px ${-i * 2}px` }}>
                    <DorsoBosque clase="cuerdas" />
                  </div>
                ))}
                <span className="mb-pila-nombre">Cuerdas</span>
              </div>
              <div className="mb-pila" data-pila="mazo" title="Mazo de acciones">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="carta-p tapada" style={{ translate: `${-i * 2}px ${-i * 2}px` }}>
                    <div className="carta-giro">
                      <DorsoBosque />
                    </div>
                  </div>
                ))}
                <span className="mb-pila-nombre">Acciones</span>
              </div>
              <div className="mb-pila" data-pila="descarte" title="Descarte">
                {estado.descarte ? (
                  <div className="carta-p">
                    <div className="carta-giro">
                      <CaraAccionBosque id={estado.descarte} />
                    </div>
                  </div>
                ) : (
                  <div className="pila-vacia">descarte</div>
                )}
                <span className="mb-pila-nombre">Descarte</span>
              </div>
            </div>
            <CartaDiaBosque />
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
          const estilo = { "--abanico": `${centrado * 5}deg`, "--alzado": `${Math.abs(centrado) * 7}px` } as CSSProperties;
          const alPulsar = () => !ocupado && jugable && setSel(elegida ? null : { tipo: "carta", carta: c });
          return c.clase === "cuerda" ? (
            <CartaCuerdaBosque
              key={c.uid}
              data-uid={c.uid}
              efecto={efectoDe(c.id)}
              pinzas={c.pinzas}
              className={`carta-p mb-cuerda-mano ${elegida ? "elegida" : ""} ${jugable ? "" : "apagada"}`}
              style={estilo}
              onClick={alPulsar}
            />
          ) : (
            <div key={c.uid} data-uid={c.uid} className={`carta-p mb-accion ${elegida ? "elegida" : ""} ${jugable ? "" : "apagada"}`} style={estilo} onClick={alPulsar}>
              <div className="carta-giro">
                <CaraAccionBosque id={c.id} />
                <DorsoBosque />
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
          <marker id="punta-flecha-mb" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <path ref={flecha} markerEnd="url(#punta-flecha-mb)" />
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
  const Animal = ANIMALES[jugador];
  return (
    <section className={`mb-tapete mb-tapete-${jugador === 0 ? "tu" : "rival"} ${apuntada ? "apuntada" : ""}`} style={{ "--jugador": j.color } as CSSProperties}>
      <div className="mb-placa">
        <Animal className="mb-animal" />
        <div className="mb-placa-nombre">{j.nombre}</div>
        <div className="mb-placa-puntos" data-puntos={jugador}>
          <b>{datos.puntos}</b>
          <span>puntos</span>
        </div>
        <div className="mb-secas" data-pila={`secas-${jugador}`} title="Prendas secas">
          {datos.secas.slice(-4).map((p, i) => (
            <CartaPrendaBosque key={p.id} p={p} className="mb-seca" style={{ "--i": i } as CSSProperties} />
          ))}
          <span>{datos.secas.length} secas</span>
        </div>
      </div>

      <div className="mb-tendedero" data-zona={jugador}>
        <LosetaBosque lineas={datos.lineas.length} />
        <div className="mb-lineas">
          {datos.lineas.map((linea, l) => (
            <div key={l} className="mb-linea" data-linea={`${jugador}:${l}`}>
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
                  onEspacio={onEspacio}
                />
              ))}
              {linea.length < CUERDAS_POR_LINEA && (
                <div className={`mb-hueco ${huecos.includes(l) ? "valido" : ""}`} data-hueco={`${jugador}:${l}`} onClick={() => huecos.includes(l) && onHueco?.(l)}>
                  <span>cuerda</span>
                </div>
              )}
              {Array.from({ length: Math.max(0, CUERDAS_POR_LINEA - linea.length - 1) }, (_, i) => (
                <div key={i} className="mb-hueco vacio" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-portender" data-pila={`porTender-${jugador}`}>
        <div className="mb-portender-titulo">Por tender</div>
        <div className="mb-portender-cartas">
          {datos.porTender.map((p) => (
            <CartaPrendaBosque
              key={p.id}
              p={p}
              data-portender={p.id}
              className={`mb-pendiente ${onPrenda ? "jugable" : ""} ${prendaElegida === p.id ? "elegida" : ""}`}
              onClick={onPrenda ? () => onPrenda(p) : undefined}
            />
          ))}
        </div>
      </div>

      {manoRival && (
        <div className="mano-rival mb-mano-rival">
          {manoRival.map((m, i) => {
            const centrado = i - (manoRival.length - 1) / 2;
            return (
              <div key={m.uid} data-uid={m.uid} className="carta-p mb-accion tapada" style={{ "--abanico": `${centrado * -4}deg`, "--alzado": `${Math.abs(centrado) * -4}px` } as CSSProperties}>
                <div className="carta-giro">
                  <CaraAccionBosque id={m.id} />
                  <DorsoBosque />
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
  onEspacio,
}: {
  c: Cuerda;
  jugador: number;
  techada: boolean;
  recien: string | null;
  esValido: (tipo: Objetivo["tipo"], id: string) => boolean;
  onObjetivo: (tipo: Objetivo["tipo"], jugador: number, id: string) => void;
  espacios: Espacio[];
  onEspacio?: (cuerda: string, inicio: number) => void;
}) {
  return (
    <div
      data-cuerda={c.id}
      className={`mb-cuerda ${recien === c.id ? "aparece" : ""} ${esValido("cuerda", c.id) ? "valido" : ""} ${techada ? "techada" : ""}`}
      onClick={() => onObjetivo("cuerda", jugador, c.id)}
    >
      <CartaCuerdaBosque efecto={c.efecto} pinzas={c.pinzas} className="mb-cuerda-carta" />
      {espacios.map((s) => (
        <div
          key={s.inicio}
          className="mb-espacio"
          style={{ "--inicio": s.inicio, "--ancho": s.ancho } as CSSProperties}
          onClick={(ev) => {
            ev.stopPropagation();
            onEspacio?.(c.id, s.inicio);
          }}
        />
      ))}
      {c.colgadas.map(({ prenda: p, inicio }) => (
        <CartaPrendaBosque
          key={p.id}
          p={p}
          pinzas
          colorPinzas={c.pinzas}
          data-prenda={p.id}
          className={`mb-colgada prenda-p ${recien === p.id ? "colgando" : ""} ${esValido("prenda", p.id) ? "valido" : ""}`}
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
