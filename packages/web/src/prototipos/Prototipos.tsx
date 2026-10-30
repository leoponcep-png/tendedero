import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { useT } from "../i18n";
import acciones from "../../../../data/acciones.json";
import cuerdas from "../../../../data/cuerdas.json";
import { ArteCesta, ArteCuerda } from "../arte/Escena";
import { IconoCarta } from "../arte/Iconos";
import { ArtePrenda } from "../arte/Prendas";
import * as fx from "./efectos";
import "./prototipos.css";

// Prototipos de mesa animada (beta). Una partida de mentira entre «Tú» y «Lu» para probar cómo se ve jugar
// una carta: a quién va, qué le hace a la ropa y cómo vuelve la mano. No usa el motor: solo sirve para decidir
// el estilo. Las tres versiones comparten todo y solo cambian el CSS (proto-a, proto-b, proto-c).

export const VERSIONES = [
  { id: "e", nombre: "Mesa final", lema: "Prendas iguales bajo la cuerda, 3 pinzas por cuerda y la humedad en gotas que asoman." },
  { id: "pizarra", nombre: "Pizarra", lema: "Dibuja un boceto y guárdalo para Claude." },
  { id: "taller", nombre: "Taller: prendas", lema: "Tres formas de colgar las prendas si todas las cartas son del mismo tamaño." },
  { id: "d", nombre: "Mesa ilustrada", lema: "Los componentes como en la mesa real, con ilustraciones de trazo de tinta." },
  { id: "a2", nombre: "Mesa de cartas", lema: "Todo son cartas: las cuerdas forman el tendedero y las prendas se cuelgan con pinzas." },
  { id: "a", nombre: "Mesa de madera", lema: "Como sentados a la mesa: cada uno con su tendedero delante." },
  { id: "b", nombre: "Patio de vecinos", lema: "Cada jugador es un balcón; el tiempo se ve en el cielo." },
  { id: "c", nombre: "Motion graphics", lema: "Plano, con mucho color y animaciones con rebote." },
] as const;

export type Def = { id: string; nombre: string; grupo: string; efecto: string; texto: string };
export const ACCIONES: Record<string, Def> = Object.fromEntries(acciones.cartas.map((c) => [c.id, c as Def]));
export const CUERDAS: Record<string, { nombre: string; efecto: string | null }> = Object.fromEntries(cuerdas.cartas.map((c) => [c.efecto ?? "basica", c]));

export const COLORES = { blanco: "#f4f1ea", azul: "#4a7fd0", rojo: "#d2513f", amarillo: "#e8c23a" };
export const TIPOS = { calcetin: { espacios: 1, humedad: 1, puntos: 1 }, camiseta: { espacios: 2, humedad: 2, puntos: 3 }, toalla: { espacios: 3, humedad: 3, puntos: 6 } };
export const JUGADORES = [
  { nombre: "Tú", color: "#2f7a63" },
  { nombre: "Lu", color: "#c4643d" },
];
export const MAZO_TU = ["rafaga-de-viento", "retrasar-secado", "mojar-cuerda-rival", "secar-prenda", "reducir-humedad"];
export const MAZO_RIVAL = ["rafaga-de-viento", "retrasar-secado", "mojar-cuerda-rival"];

/** `puntos`: los que da al secarse en la partida (cambian con el modo de juego); sin ellos, los de TIPOS. */
export type Prenda = { id: string; tipo: keyof typeof TIPOS; color: string; humedad: number; puntos?: number };
export type Cuerda = { id: string; efecto: string | null; pinzas?: string; colgadas: { prenda: Prenda; inicio: number }[] };
export type Jugador = { lineas: Cuerda[][]; porTender: Prenda[]; secas: Prenda[]; puntos: number };
export type CartaMano = { uid: string; id: string };
type Estado = { jugadores: Jugador[]; mano: CartaMano[]; manoRival: CartaMano[]; descarte: string | null };
export type Objetivo = { tipo: "prenda" | "cuerda"; jugador: number; id: string };

let contador = 0;
export const nuevoId = (p: string) => `${p}${++contador}`;

export function prenda(tipo: keyof typeof TIPOS, color: keyof typeof COLORES, humedad: number): Prenda {
  return { id: nuevoId("p"), tipo, color: COLORES[color], humedad };
}

export function cuerda(efecto: string | null, colgadas: [Prenda, number][], pinzas?: string): Cuerda {
  return { id: nuevoId("c"), efecto, pinzas, colgadas: colgadas.map(([prenda, inicio]) => ({ prenda, inicio })) };
}

export const carta = (id: string): CartaMano => ({ uid: nuevoId("k"), id });

function inicial(): Estado {
  return {
    jugadores: [
      {
        lineas: [
          [cuerda(null, [[prenda("camiseta", "rojo", 2), 0], [prenda("calcetin", "azul", 1), 2]]), cuerda("secado-rapido", [[prenda("toalla", "amarillo", 3), 0]])],
          [cuerda("modificador-puntuacion", [[prenda("calcetin", "rojo", 1), 0], [prenda("camiseta", "blanco", 2), 1]], COLORES.rojo)],
        ],
        porTender: [prenda("calcetin", "amarillo", 1), prenda("camiseta", "azul", 2)],
        secas: [prenda("calcetin", "blanco", 0)],
        puntos: 4,
      },
      {
        lineas: [
          [cuerda("resistente", [[prenda("toalla", "azul", 2), 0]]), cuerda("tejadillo", [[prenda("camiseta", "amarillo", 1), 0], [prenda("calcetin", "rojo", 1), 2]])],
          [cuerda(null, [[prenda("camiseta", "blanco", 2), 0], [prenda("calcetin", "azul", 1), 2]]), cuerda("fragil", [[prenda("calcetin", "amarillo", 1), 1]])],
        ],
        porTender: [prenda("toalla", "rojo", 3)],
        secas: [prenda("camiseta", "rojo", 0), prenda("calcetin", "azul", 0)],
        puntos: 7,
      },
    ],
    mano: MAZO_TU.map(carta),
    manoRival: MAZO_RIVAL.concat("retrasar-secado").map(carta),
    descarte: null,
  };
}

/** Si una cuerda está bajo techo: es un tejadillo o tiene uno justo encima. */
export function bajoTecho(j: Jugador, linea: number, pos: number): boolean {
  return j.lineas[linea][pos].efecto === "tejadillo" || j.lineas[linea - 1]?.[pos]?.efecto === "tejadillo";
}

/** A qué se le puede jugar cada carta (las mismas protecciones que en el juego). */
export function objetivos(e: { jugadores: Jugador[] }, quien: number, id: string): Objetivo[] {
  const efecto = ACCIONES[id].efecto;
  const rival = 1 - quien;
  const lista: Objetivo[] = [];
  const recorrer = (jugador: number, fn: (c: Cuerda, linea: number, pos: number) => void) =>
    e.jugadores[jugador].lineas.forEach((l, li) => l.forEach((c, pi) => fn(c, li, pi)));
  if (efecto === "rafaga-de-viento")
    recorrer(rival, (c) => c.efecto !== "resistente" && c.colgadas.forEach((g) => lista.push({ tipo: "prenda", jugador: rival, id: g.prenda.id })));
  if (efecto === "retrasar-secado")
    recorrer(rival, (c, l, p) => !bajoTecho(e.jugadores[rival], l, p) && c.colgadas.forEach((g) => lista.push({ tipo: "prenda", jugador: rival, id: g.prenda.id })));
  if (efecto === "mojar-cuerda-rival")
    recorrer(rival, (c, l, p) => !bajoTecho(e.jugadores[rival], l, p) && c.colgadas.length > 0 && lista.push({ tipo: "cuerda", jugador: rival, id: c.id }));
  if (efecto === "secar-prenda" || efecto === "reducir-humedad")
    recorrer(quien, (c) => c.colgadas.forEach((g) => g.prenda.humedad > 0 && lista.push({ tipo: "prenda", jugador: quien, id: g.prenda.id })));
  return lista;
}

export function buscarPrenda(e: { jugadores: Jugador[] }, id: string) {
  for (const j of e.jugadores)
    for (const l of j.lineas)
      for (const c of l) {
        const i = c.colgadas.findIndex((g) => g.prenda.id === id);
        if (i >= 0) return { jugador: j, cuerda: c, indice: i, prenda: c.colgadas[i].prenda };
      }
  throw new Error(`No encuentro la prenda ${id}`);
}

export function buscarCuerda(e: { jugadores: Jugador[] }, id: string): Cuerda {
  for (const j of e.jugadores) for (const l of j.lineas) for (const c of l) if (c.id === id) return c;
  throw new Error(`No encuentro la cuerda ${id}`);
}

export function Prototipos({ version, onVersion, onVolver }: { version: string; onVersion: (v: string) => void; onVolver: () => void }) {
  const [estado, setEstado] = useState(inicial);
  const [seleccion, setSeleccion] = useState<CartaMano | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const flecha = useRef<SVGPathElement>(null);
  const v = VERSIONES.find((x) => x.id === version) ?? VERSIONES[0];

  const validos = seleccion ? objetivos(estado, 0, seleccion.id) : [];
  const esValido = (tipo: Objetivo["tipo"], id: string) => validos.some((o) => o.tipo === tipo && o.id === id);
  const apuntaAlRival = validos.some((o) => o.jugador === 1);

  /** Cambia el estado ya mismo (sin esperar a React), para medir y animar justo después. */
  function cambiar(fn: (e: Estado) => void) {
    flushSync(() =>
      setEstado((e) => {
        const n = structuredClone(e);
        fn(n);
        return n;
      }),
    );
  }

  const el = (selector: string) => raiz.current!.querySelector<HTMLElement>(selector)!;
  const rect = (selector: string) => el(selector).getBoundingClientRect();

  // Mientras hay una carta elegida, una flecha va de la carta al ratón.
  useEffect(() => {
    if (!seleccion) return;
    const mover = (ev: MouseEvent) => {
      const origen = raiz.current?.querySelector(`[data-uid="${seleccion.uid}"]`);
      if (!origen || !flecha.current) return;
      const a = fx.centro(origen.getBoundingClientRect());
      const control = { x: (a.x + ev.clientX) / 2, y: Math.min(a.y, ev.clientY) - 80 };
      flecha.current.setAttribute("d", `M${a.x} ${a.y - 60} Q${control.x} ${control.y} ${ev.clientX} ${ev.clientY}`);
    };
    const cancelar = (ev: KeyboardEvent) => ev.key === "Escape" && setSeleccion(null);
    window.addEventListener("mousemove", mover);
    window.addEventListener("keydown", cancelar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("keydown", cancelar);
      flecha.current?.setAttribute("d", "");
    };
  }, [seleccion]);

  async function jugar(quien: number, mano: CartaMano, objetivo: Objetivo) {
    setSeleccion(null);
    setOcupado(true);
    try {
      const def = ACCIONES[mano.id];
      const selObjetivo = objetivo.tipo === "prenda" ? `[data-prenda="${objetivo.id}"]` : `[data-cuerda="${objetivo.id}"]`;
      const cartaEl = el(`[data-uid="${mano.uid}"]`);
      const zonaObjetivo = rect(selObjetivo);
      const propio = objetivo.jugador === quien;
      fx.anunciar(
        def.nombre,
        propio ? `${JUGADORES[quien].nombre} · en su tendedero` : `${JUGADORES[quien].nombre}  ➜  ${JUGADORES[objetivo.jugador].nombre}`,
        def.grupo === "fastidio" ? "fastidio" : "tactica",
      );
      const quitarEstela = fx.estela(fx.centro(cartaEl.getBoundingClientRect()), fx.centro(zonaObjetivo), JUGADORES[quien].color);
      const clon = fx.clonar(cartaEl);
      cartaEl.style.visibility = "hidden";
      const arriba = { x: fx.centro(zonaObjetivo).x, y: Math.max(90, zonaObjetivo.top - 70) };
      // Sobre la mesa se ve igual de grande la venga de donde venga (las del rival son pequeñas en su mano).
      const anchoMesa = (raiz.current!.querySelector<HTMLElement>(".mano .carta-p")?.offsetWidth ?? 120) * 0.62;
      await fx.volar(clon, arriba, { arco: 160, escala: anchoMesa / cartaEl.offsetWidth, giro: quien ? 6 : -6, duracion: 800, voltear: quien === 1 });
      await fx.golpe(clon);

      await EFECTOS[def.efecto]({ objetivo, selObjetivo, el, rect, cambiar });

      quitarEstela();
      await fx.esperar(150);
      await fx.volar(clon, fx.centro(rect('[data-pila="descarte"]')), { arco: 40, escala: rect('[data-pila="descarte"]').width / cartaEl.offsetWidth, giro: 4, duracion: 500 });
      cambiar((e) => {
        if (quien === 0) e.mano = e.mano.filter((c) => c.uid !== mano.uid);
        else e.manoRival = e.manoRival.filter((c) => c.uid !== mano.uid);
        e.descarte = mano.id;
      });
      clon.remove();
      await fx.esperar(200);
      await robar(quien);
    } catch (e) {
      // Si algo falla a mitad, se recoge la mesa para que se pueda seguir jugando.
      console.error(e);
      raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
      raiz.current?.querySelectorAll<HTMLElement>("[data-uid], [data-prenda]").forEach((n) => (n.style.visibility = ""));
    } finally {
      setOcupado(false);
    }
  }

  /** Roba una carta: sale del mazo y vuela a la mano (boca abajo si es del rival). */
  async function robar(quien: number) {
    const mazo = quien === 0 ? MAZO_TU : MAZO_RIVAL;
    const nueva = carta(mazo[Math.floor(Math.random() * mazo.length)]);
    const desde = rect('[data-pila="mazo"]');
    cambiar((e) => (quien === 0 ? e.mano.push(nueva) : e.manoRival.push(nueva)));
    await fx.traerDesde(el(`[data-uid="${nueva.uid}"]`), desde, quien === 0);
  }

  async function turnoRival() {
    const opciones = estado.manoRival.flatMap((m) => objetivos(estado, 1, m.id).map((o) => ({ m, o })));
    if (!opciones.length) return;
    const { m, o } = opciones[Math.floor(Math.random() * opciones.length)];
    await jugar(1, m, o);
  }

  function reiniciar() {
    setSeleccion(null);
    raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
    setEstado(inicial());
  }

  function elegir(m: CartaMano) {
    if (ocupado) return;
    setSeleccion(seleccion?.uid === m.uid ? null : m);
  }

  function pulsarObjetivo(tipo: Objetivo["tipo"], jugador: number, id: string) {
    if (!seleccion || ocupado || !esValido(tipo, id)) return;
    void jugar(0, seleccion, { tipo, jugador, id });
  }

  return (
    <div ref={raiz} className={`proto proto-${v.id} ${seleccion ? "apuntando" : ""} ${ocupado ? "ocupado" : ""}`}>
      <Barra version={v.id} onVersion={onVersion} onVolver={onVolver} ocupado={ocupado} onRival={() => void turnoRival()} onReiniciar={reiniciar} />

      <div className="escenario">
        <Decorado />
        <div className="p-tablero">
          <section className={`p-zona p-zona-rival ${apuntaAlRival ? "apuntada" : ""}`}>
            <Marcador jugador={1} datos={estado.jugadores[1]} />
            <div className="mano-rival">
              {estado.manoRival.map((m, i) => (
                <Carta key={m.uid} mano={m} tapada style={abanico(i, estado.manoRival.length, true)} />
              ))}
            </div>
            <TendederoVista jugador={1} datos={estado.jugadores[1]} esValido={esValido} onObjetivo={pulsarObjetivo} />
          </section>

          <section className="p-centro">
            <div className="p-cestas">
              {(["camiseta", "toalla", "calcetin"] as const).map((t, i) => (
                <div key={t} className="p-cesta">
                  <ArtePrenda tipo={t} color={Object.values(COLORES)[i + 1]} espacios={TIPOS[t].espacios} conPinzas={false} className="cesta-prenda" />
                  <ArteCesta />
                </div>
              ))}
            </div>
            <div className="pila" data-pila="mazo" title="Mazo de acciones">
              {[0, 1, 2].map((i) => (
                <div key={i} className="carta-p grupo-tactica tapada" style={{ translate: `${i * -2}px ${i * -2}px` } as CSSProperties}>
                  <div className="carta-giro">
                    <CaraCarta id="secar-prenda" />
                    <Dorso />
                  </div>
                </div>
              ))}
            </div>
            <div className="pila" data-pila="descarte" title="Descarte">
              {estado.descarte ? (
                <div className={`carta-p grupo-${ACCIONES[estado.descarte].grupo === "fastidio" ? "fastidio" : "tactica"}`}>
                  <div className="carta-giro">
                    <CaraCarta id={estado.descarte} />
                  </div>
                </div>
              ) : (
                <div className="pila-vacia">descarte</div>
              )}
            </div>
            <Dia />
          </section>

          <section className="p-zona p-zona-tu">
            <TendederoVista jugador={0} datos={estado.jugadores[0]} esValido={esValido} onObjetivo={pulsarObjetivo} />
            <Marcador jugador={0} datos={estado.jugadores[0]} />
          </section>
        </div>
      </div>

      <div className="mano">
        {estado.mano.map((m, i) => {
          const jugable = objetivos(estado, 0, m.id).length > 0;
          return (
            <Carta
              key={m.uid}
              mano={m}
              elegida={seleccion?.uid === m.uid}
              apagada={!jugable}
              style={abanico(i, estado.mano.length, false)}
              onClick={() => jugable && elegir(m)}
            />
          );
        })}
        <p className="ayuda-mano">{seleccion ? "Elige a qué se la juegas (Esc para cancelar)" : "Pulsa una carta para jugarla"}</p>
      </div>

      <svg className="flecha-apuntar" aria-hidden>
        <defs>
          <marker id="punta-flecha" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <path ref={flecha} markerEnd="url(#punta-flecha)" />
      </svg>
      <div className="capa-efectos" ref={fx.usarCapa} />
    </div>
  );
}

/** Barra de arriba, común a todas las versiones. */
export function Barra({
  version,
  onVersion,
  onVolver,
  ocupado,
  onRival,
  onReiniciar,
  textoRival = "Que juegue Lu",
}: {
  version: string;
  onVersion: (v: string) => void;
  onVolver: () => void;
  ocupado: boolean;
  /** Sin él no sale el botón (en la mesa E la ronda avanza sola). */
  onRival?: () => void;
  onReiniciar: () => void;
  textoRival?: string;
}) {
  const v = VERSIONES.find((x) => x.id === version) ?? VERSIONES[0];
  const t = useT();
  // Barra de herramienta de desarrollo: los nombres y lemas de las versiones se quedan en español.
  return (
    <header className="proto-barra">
      <button onClick={onVolver}>{t("barra.inicio")}</button>
      <div className="proto-titulo">
        <strong>{t("barra.titulo")}</strong>
        <span>{v.lema}</span>
      </div>
      <nav className="proto-versiones">
        {VERSIONES.map((x) => (
          <button key={x.id} className={x.id === v.id ? "activa" : ""} onClick={() => onVersion(x.id)}>
            {x.id.toUpperCase()} · {x.nombre}
          </button>
        ))}
      </nav>
      <div className="proto-acciones">
        {onRival && (
          <button disabled={ocupado} onClick={onRival}>
            {textoRival}
          </button>
        )}
        <button disabled={ocupado} onClick={onReiniciar}>
          {t("barra.reiniciar")}
        </button>
      </div>
    </header>
  );
}

export type Herramientas = {
  objetivo: Objetivo;
  selObjetivo: string;
  el: (s: string) => HTMLElement;
  rect: (s: string) => DOMRect;
  cambiar: (fn: (e: { jugadores: Jugador[] }) => void) => void;
};

/** Lo que hace cada carta en la mesa: la animación y, después, el cambio en la partida. */
export const EFECTOS: Record<string, (h: Herramientas) => Promise<void>> = {
  async "rafaga-de-viento"({ objetivo, selObjetivo, el, rect, cambiar }) {
    const zona = el(`[data-zona="${objetivo.jugador}"]`);
    zona.classList.add("ventolera");
    const viento = fx.viento(zona.getBoundingClientRect(), objetivo.jugador === 1);
    const p = el(selObjetivo);
    await fx.esperar(350);
    await fx.temblar(p, 14);
    // Saltan las pinzas y la prenda sale volando hasta las que le quedan por tender.
    const r = p.getBoundingClientRect();
    fx.salpicar({ x: r.left + r.width / 2, y: r.top + 4 }, "#c99a62", 8);
    const clon = fx.clonar(p);
    p.style.visibility = "hidden";
    await fx.volar(clon, fx.centro(rect(`[data-pila="porTender-${objetivo.jugador}"]`)), { arco: 90, giro: 300, escala: 0.45, duracion: 900 });
    cambiar((e) => {
      const { jugador, cuerda, indice, prenda } = buscarPrenda(e, objetivo.id);
      cuerda.colgadas.splice(indice, 1);
      prenda.humedad = TIPOS[prenda.tipo].humedad;
      jugador.porTender.push(prenda);
    });
    fx.salpicar(fx.centro(rect(`[data-pila="porTender-${objetivo.jugador}"]`)), "#ffffff", 6);
    clon.remove();
    await viento;
    zona.classList.remove("ventolera");
  },

  async "retrasar-secado"({ objetivo, selObjetivo, el, rect, cambiar }) {
    const quitarNube = fx.nube(rect(selObjetivo));
    await fx.esperar(700);
    await fx.gotaNueva(el(selObjetivo));
    cambiar((e) => void buscarPrenda(e, objetivo.id).prenda.humedad++);
    const r = rect(selObjetivo);
    fx.cartelito({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, "+1 humedad", "agua");
    await fx.esperar(500);
    await quitarNube();
  },

  async "mojar-cuerda-rival"({ objetivo, selObjetivo, el, rect, cambiar }) {
    const quitarNube = fx.nube(rect(selObjetivo));
    await fx.esperar(800);
    const prendas = [...el(selObjetivo).querySelectorAll<HTMLElement>("[data-prenda]")];
    await Promise.all(prendas.map((p, i) => fx.esperar(i * 140).then(() => fx.gotaNueva(p))));
    cambiar((e) => buscarCuerda(e, objetivo.id).colgadas.forEach((g) => g.prenda.humedad++));
    prendas.forEach((p) => {
      const r = p.getBoundingClientRect();
      fx.cartelito({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, "+1", "agua");
    });
    await fx.esperar(600);
    await quitarNube();
  },

  async "secar-prenda"(h) {
    await secar(h, Infinity);
  },

  async "reducir-humedad"(h) {
    await secar(h, 1);
  },
};

/** Quita humedad a una prenda propia; si se queda en 0, se seca y suma sus puntos. */
async function secar({ objetivo, selObjetivo, el, rect, cambiar }: Herramientas, cuanto: number) {
  const quitarSol = fx.sol(rect(selObjetivo));
  await fx.esperar(500);
  await fx.evaporar(el(selObjetivo), cuanto);
  let seca = false;
  cambiar((e) => {
    const p = buscarPrenda(e, objetivo.id).prenda;
    p.humedad = Math.max(0, p.humedad - cuanto);
    seca = p.humedad === 0;
  });
  await quitarSol();
  if (!seca) {
    const r = rect(selObjetivo);
    fx.cartelito({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, "−1 humedad", "sol");
    return;
  }
  const p = el(selObjetivo);
  const r = p.getBoundingClientRect();
  fx.salpicar({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, "#ffc93c", 14);
  const clon = fx.clonar(p);
  p.style.visibility = "hidden";
  const destino = rect(`[data-pila="secas-${objetivo.jugador}"]`);
  await fx.volar(clon, fx.centro(destino), { arco: 120, escala: 0.4, giro: -10, duracion: 800 });
  let puntos = 0;
  cambiar((e) => {
    const { jugador, cuerda, indice, prenda } = buscarPrenda(e, objetivo.id);
    cuerda.colgadas.splice(indice, 1);
    // Las pinzas de color dan +1 si la prenda es de su color.
    puntos = TIPOS[prenda.tipo].puntos + (cuerda.pinzas && cuerda.pinzas === prenda.color ? 1 : 0);
    jugador.secas.push(prenda);
    jugador.puntos += puntos;
  });
  clon.remove();
  const marcador = rect(`[data-puntos="${objetivo.jugador}"]`);
  fx.cartelito({ x: marcador.left + marcador.width / 2, y: marcador.top }, `+${puntos}`, "puntos");
  fx.salpicar(fx.centro(marcador), "#ffc93c", 12);
  await fx.esperar(400);
}

function abanico(i: number, n: number, rival: boolean): CSSProperties {
  const centrado = i - (n - 1) / 2;
  return { "--abanico": `${centrado * (rival ? -4 : 5)}deg`, "--alzado": `${Math.abs(centrado) * (rival ? -4 : 7)}px` } as CSSProperties;
}

function Decorado() {
  return (
    <div className="decorado" aria-hidden>
      <div className="deco-sol" />
      <div className="deco-nube n1" />
      <div className="deco-nube n2" />
      <div className="deco-nube n3" />
      <div className="deco-forma f1" />
      <div className="deco-forma f2" />
      <div className="deco-forma f3" />
    </div>
  );
}

function Dia() {
  return (
    <div className="dia" title="Carta del día">
      <svg viewBox="0 0 64 48" aria-hidden>
        <circle cx="22" cy="20" r="10" fill="#ffc93c" stroke="#d98a1c" strokeWidth="2" />
        <path d="M24 40 C14 40 12 30 20 27 C20 19 32 16 36 23 C42 17 54 22 51 31 C58 33 56 41 49 40 Z" fill="#eef3f7" stroke="#7d8fa0" strokeWidth="2" />
      </svg>
      <span>Hoy: nubes y claros</span>
    </div>
  );
}

function Marcador({ jugador, datos }: { jugador: number; datos: Jugador }) {
  const j = JUGADORES[jugador];
  return (
    <div className="marcador" style={{ "--jugador": j.color } as CSSProperties}>
      <div className="avatar">{j.nombre[0]}</div>
      <div className="marcador-nombre">{j.nombre}</div>
      <div className="marcador-puntos" data-puntos={jugador}>
        <b>{datos.puntos}</b> pts
      </div>
      <div className="pila-ropa" data-pila={`porTender-${jugador}`} title="Por tender">
        {datos.porTender.slice(-3).map((p, i) => (
          <ArtePrenda key={p.id} tipo={p.tipo} color={p.color} espacios={TIPOS[p.tipo].espacios} conPinzas={false} className={`mini mini-${i}`} />
        ))}
        <span>{datos.porTender.length} por tender</span>
      </div>
      <div className="pila-ropa secas" data-pila={`secas-${jugador}`} title="Secas">
        {datos.secas.slice(-3).map((p, i) => (
          <ArtePrenda key={p.id} tipo={p.tipo} color={p.color} espacios={TIPOS[p.tipo].espacios} conPinzas={false} className={`mini mini-${i}`} />
        ))}
        <span>{datos.secas.length} secas</span>
      </div>
    </div>
  );
}

function TendederoVista({
  jugador,
  datos,
  esValido,
  onObjetivo,
}: {
  jugador: number;
  datos: Jugador;
  esValido: (tipo: Objetivo["tipo"], id: string) => boolean;
  onObjetivo: (tipo: Objetivo["tipo"], jugador: number, id: string) => void;
}) {
  return (
    <div className="tendedero-p" data-zona={jugador} style={{ "--jugador": JUGADORES[jugador].color } as CSSProperties}>
      {datos.lineas.map((linea, l) => (
        <div key={l} className="linea-p">
          <div className="poste-p">
            <span>{l + 1}</span>
          </div>
          {linea.map((c, pos) => (
            <div
              key={c.id}
              data-cuerda={c.id}
              className={`cuerda-p ${esValido("cuerda", c.id) ? "valido" : ""} ${bajoTecho(datos, l, pos) ? "techada" : ""}`}
              onClick={() => onObjetivo("cuerda", jugador, c.id)}
              title={CUERDAS[c.efecto ?? "basica"]?.nombre}
            >
              <ArteCuerda efecto={c.efecto} espacios={3} colorPinzas={c.pinzas} />
              <span className="nombre-cuerda-p">{c.efecto === "modificador-puntuacion" ? "Pinzas rojas" : CUERDAS[c.efecto ?? "basica"]?.nombre}</span>
              {c.colgadas.map(({ prenda: p, inicio }) => (
                <div
                  key={p.id}
                  data-prenda={p.id}
                  className={`prenda-p ${esValido("prenda", p.id) ? "valido" : ""}`}
                  style={{ "--inicio": inicio, "--espacios": TIPOS[p.tipo].espacios, "--d": `${(inicio * 0.7 + l * 0.4 + pos) % 3}s` } as CSSProperties}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onObjetivo("prenda", jugador, p.id);
                  }}
                >
                  <ArtePrenda tipo={p.tipo} color={p.color} espacios={TIPOS[p.tipo].espacios} humedad={p.humedad} pinzaColor={c.pinzas} className="arte-prenda-p" />
                </div>
              ))}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - linea.length) }, (_, i) => (
            <div key={i} className="hueco-p" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CaraCarta({ id }: { id: string }) {
  const def = ACCIONES[id];
  return (
    <div className="cara">
      <div className="cara-grupo">{def.grupo === "fastidio" ? "Fastidio" : "Táctica"}</div>
      <IconoCarta id={def.id} efecto={def.efecto} />
      <div className="cara-nombre">{def.nombre}</div>
      <div className="cara-texto">{def.texto}</div>
    </div>
  );
}

export function Dorso() {
  return (
    <div className="dorso">
      <svg viewBox="0 0 60 84" aria-hidden>
        <path d="M6 22 Q30 32 54 22" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <rect x="16" y="20" width="5" height="12" rx="1.5" fill="currentColor" />
        <rect x="39" y="20" width="5" height="12" rx="1.5" fill="currentColor" />
        <text x="30" y="60" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
          Tendedero
        </text>
      </svg>
    </div>
  );
}

function Carta({
  mano,
  tapada,
  elegida,
  apagada,
  style,
  onClick,
}: {
  mano: CartaMano;
  tapada?: boolean;
  elegida?: boolean;
  apagada?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const grupo = ACCIONES[mano.id].grupo === "fastidio" ? "fastidio" : "tactica";
  return (
    <div
      data-uid={mano.uid}
      className={`carta-p grupo-${grupo} ${tapada ? "tapada" : ""} ${elegida ? "elegida" : ""} ${apagada ? "apagada" : ""}`}
      style={style}
      onClick={onClick}
      title={apagada ? "Ahora no tiene a qué jugarse" : undefined}
    >
      <div className="carta-giro">
        <CaraCarta id={mano.id} />
        <Dorso />
      </div>
    </div>
  );
}
