import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Animal } from "./Animales";
import { colorEstilo, DefsBosque, PrendaBosque } from "./ArteBosque";
import { useAjustarMesa } from "./ajustar";
import { CaraAccionBosque, CartaCuerdaBosque, CartaDiaBosque, DorsoBosque, LosetaBosque } from "./CartasBosque";
import * as fx from "./efectos";
import { CartaPrendaHumeda } from "./HumedadTaller";
import { ESTILOS } from "./MesaBosque";
import { MenuPartida, type ConfigPartida, type Perfil } from "./MenuPartida";
import {
  ACCIONES,
  Barra,
  bajoTecho,
  carta,
  COLORES,
  cuerda,
  CUERDAS,
  EFECTOS,
  MAZO_RIVAL,
  MAZO_TU,
  nuevoId,
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
import "./taller.css";
import "./mesa-final.css";
import "./menu-partida.css";
import "./mesa-hud.css";

// Versión E · «Mesa final»: las decisiones de componentes aplicadas. Las prendas son cartas del mismo tamaño
// que se cuelgan solapadas por debajo de la carta de cuerda; cada cuerda tiene 3 pinzas (calcetín 1, camiseta 2,
// toalla 3). La humedad es la columna de gotas de arriba de la prenda: lo que asoma bajo la cuerda es lo que le
// queda, y al secarse la carta sube. Antes de jugar, un menú para el nombre, el animal y los rivales (2 a 4
// jugadores). Una cámara acerca la vista a cada tendedero y sigue las jugadas.

type CartaMesa = { uid: string; clase: "accion" | "cuerda"; id: string; pinzas?: string };
type Fase = "cesta" | "centro" | "juego";
type Estado = {
  jugadores: Jugador[];
  mano: CartaMesa[];
  manos: CartaMano[][];
  descarte: string | null;
  recien: string | null;
  bolsa: Prenda[];
  cestas: Prenda[][];
  centro: Prenda[];
  /** Reparto al empezar la ronda: primero se coge de una cesta, luego del centro; después se juega. */
  fase: Fase;
  /** A quién le toca coger en el reparto (índice de jugador). */
  coge: number;
  ronda: number;
  /** Lo que va pasando, lo último primero (j = jugador, o -1 para avisos de la partida). */
  registro: { id: string; j: number; texto: string; ronda: number }[];
};
type Seleccion = { tipo: "carta"; carta: CartaMesa } | { tipo: "prenda"; prenda: Prenda };
/** En el reparto se coge todo un color o todo un tipo. */
type Patron = { color: string } | { tipo: keyof typeof TIPOS };
type Origen = number | "centro";

const NUM_CESTAS = 4;
const PRENDAS_POR_CESTA = 4;
const NOMBRE_COLOR: Record<string, [string, string]> = {
  [COLORES.blanco]: ["blanca", "blancas"],
  [COLORES.azul]: ["azul", "azules"],
  [COLORES.rojo]: ["roja", "rojas"],
  [COLORES.amarillo]: ["amarilla", "amarillas"],
};
const NOMBRE_TIPO: Record<string, [string, string]> = { calcetin: ["calcetín", "calcetines"], camiseta: ["camiseta", "camisetas"], toalla: ["toalla", "toallas"] };

const cumple = (p: Prenda, patron: Patron) => ("color" in patron ? p.color === patron.color : p.tipo === patron.tipo);

/** Lo que se puede coger de un montón: cada color y cada tipo que haya, con cuántas prendas son. */
function opciones(prendas: Prenda[]): { patron: Patron; cuantas: number; texto: string }[] {
  const lista: { patron: Patron; cuantas: number; texto: string }[] = [];
  for (const color of Object.values(COLORES)) {
    const n = prendas.filter((p) => p.color === color).length;
    if (n) lista.push({ patron: { color }, cuantas: n, texto: `${n} ${NOMBRE_COLOR[color][n === 1 ? 0 : 1]}` });
  }
  for (const tipo of Object.keys(TIPOS) as (keyof typeof TIPOS)[]) {
    const n = prendas.filter((p) => p.tipo === tipo).length;
    if (n) lista.push({ patron: { tipo }, cuantas: n, texto: `${n} ${NOMBRE_TIPO[tipo][n === 1 ? 0 : 1]}` });
  }
  return lista;
}

/** La bolsa entera según los datos del juego (por color: 10 calcetines, 9 camisetas y 6 toallas), barajada. */
function bolsaLlena(): Prenda[] {
  const bolsa = (Object.keys(COLORES) as (keyof typeof COLORES)[]).flatMap((color) =>
    (Object.keys(TIPOS) as (keyof typeof TIPOS)[]).flatMap((tipo) => Array.from({ length: { calcetin: 10, camiseta: 9, toalla: 6 }[tipo] }, () => prenda(tipo, color, TIPOS[tipo].humedad))),
  );
  for (let i = bolsa.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [bolsa[i], bolsa[k]] = [bolsa[k], bolsa[i]];
  }
  return bolsa;
}

const CUERDAS_POR_LINEA = 4;
const PINZAS_POR_CUERDA = 3;
const CUERDAS_MAZO: { id: string; pinzas?: string }[] = [{ id: "basica" }, { id: "tejadillo" }, { id: "resistente" }, { id: "secado-rapido" }, { id: "modificador-puntuacion", pinzas: COLORES.rojo }];

const deAccion = (id: string): CartaMesa => ({ uid: nuevoId("k"), clase: "accion", id });
const deCuerda = (id: string, pinzas?: string): CartaMesa => ({ uid: nuevoId("k"), clase: "cuerda", id, pinzas });
const efectoDe = (id: string) => (id === "basica" ? null : id);
const azar = <T,>(lista: T[]) => lista[Math.floor(Math.random() * lista.length)];
const pinzasUsadas = (c: Cuerda) => c.colgadas.reduce((s, g) => s + TIPOS[g.prenda.tipo].espacios, 0);

function leerEstilo(): string {
  try {
    return localStorage.getItem("tendedero-estilo") ?? "fusion";
  } catch {
    return "fusion";
  }
}

// ---------- Partida de prueba ----------

function tuTendedero(): Jugador {
  return {
    lineas: [
      [cuerda(null, [[prenda("calcetin", "azul", 1), 0], [prenda("camiseta", "rojo", 2), 1]]), cuerda("secado-rapido", [[prenda("toalla", "amarillo", 3), 0]])],
      [cuerda("modificador-puntuacion", [[prenda("calcetin", "rojo", 1), 0]], COLORES.rojo)],
    ],
    porTender: [prenda("camiseta", "azul", 2), prenda("calcetin", "amarillo", 1), prenda("toalla", "blanco", 3)],
    secas: [prenda("calcetin", "blanco", 0)],
    puntos: 4,
  };
}

/** Tendederos de los rivales, distintos entre sí, para que cada uno tenga algo que ver. */
const RIVALES: (() => Jugador)[] = [
  () => ({
    lineas: [
      [cuerda("resistente", [[prenda("toalla", "azul", 2), 0]]), cuerda("tejadillo", [[prenda("camiseta", "amarillo", 1), 0], [prenda("calcetin", "rojo", 1), 1]]), cuerda(null, [[prenda("calcetin", "blanco", 1), 0]])],
      [cuerda(null, [[prenda("camiseta", "blanco", 2), 0], [prenda("calcetin", "azul", 1), 1]]), cuerda("fragil", [[prenda("calcetin", "amarillo", 1), 0]])],
    ],
    porTender: [prenda("toalla", "rojo", 3), prenda("calcetin", "blanco", 1)],
    secas: [prenda("camiseta", "rojo", 0), prenda("calcetin", "azul", 0)],
    puntos: 7,
  }),
  () => ({
    lineas: [
      [cuerda("secado-rapido", [[prenda("camiseta", "azul", 2), 0]]), cuerda(null, [[prenda("calcetin", "rojo", 1), 0], [prenda("calcetin", "amarillo", 2), 1]])],
      [cuerda("tejadillo", [[prenda("toalla", "blanco", 3), 0]])],
    ],
    porTender: [prenda("camiseta", "amarillo", 2)],
    secas: [prenda("toalla", "azul", 0)],
    puntos: 6,
  }),
  () => ({
    lineas: [[cuerda(null, [[prenda("toalla", "rojo", 2), 0]]), cuerda("modificador-puntuacion", [[prenda("camiseta", "rojo", 1), 0]], COLORES.rojo)], []],
    porTender: [prenda("calcetin", "azul", 1), prenda("camiseta", "blanco", 2)],
    secas: [],
    puntos: 3,
  }),
];

function inicial(n: number): Estado {
  const bolsa = bolsaLlena();
  const jugadores = [tuTendedero(), ...RIVALES.slice(0, n - 1).map((f) => f())];
  // Las prendas por tender salen del reparto: se empieza con la pila vacía.
  for (const j of jugadores) j.porTender = [];
  return {
    jugadores,
    mano: [deAccion("rafaga-de-viento"), deCuerda("tejadillo"), deAccion("retrasar-secado"), deCuerda("resistente"), deAccion("secar-prenda")],
    manos: Array.from({ length: n - 1 }, () => MAZO_RIVAL.concat("retrasar-secado").map(carta)),
    descarte: null,
    recien: null,
    cestas: Array.from({ length: NUM_CESTAS }, () => bolsa.splice(-PRENDAS_POR_CESTA)),
    centro: [],
    bolsa,
    fase: "cesta",
    coge: 0,
    ronda: 1,
    registro: [{ id: nuevoId("r"), j: -1, texto: "Empieza la partida: reparto de prendas de la ronda 1.", ronda: 1 }],
  };
}

/** Quién coge después en el reparto, o el paso a la fase siguiente (quien no tiene nada que coger se salta). */
function siguienteReparto(e: Estado) {
  const n = e.jugadores.length;
  const hayAlgo = (f: Fase) => (f === "cesta" ? e.cestas.some((c) => c.length > 0) : e.centro.length > 0);
  let fase = e.fase;
  let coge = e.coge + 1;
  if (coge >= n || !hayAlgo(fase)) {
    if (fase === "cesta") {
      fase = "centro";
      coge = 0;
    } else {
      fase = "juego";
    }
  }
  if (fase === "centro" && !hayAlgo("centro")) fase = "juego";
  e.fase = fase;
  e.coge = fase === "juego" ? 0 : coge;
}

/** A qué se le puede jugar cada acción, con cualquier número de rivales (las mismas protecciones que el juego). */
function objetivos(e: { jugadores: Jugador[] }, quien: number, id: string): Objetivo[] {
  const efecto = ACCIONES[id].efecto;
  const lista: Objetivo[] = [];
  e.jugadores.forEach((j, ji) => {
    const rival = ji !== quien;
    j.lineas.forEach((l, li) =>
      l.forEach((c, pi) => {
        const techo = bajoTecho(j, li, pi);
        if (rival && efecto === "rafaga-de-viento" && c.efecto !== "resistente") c.colgadas.forEach((g) => lista.push({ tipo: "prenda", jugador: ji, id: g.prenda.id }));
        if (rival && efecto === "retrasar-secado" && !techo) c.colgadas.forEach((g) => lista.push({ tipo: "prenda", jugador: ji, id: g.prenda.id }));
        if (rival && efecto === "mojar-cuerda-rival" && !techo && c.colgadas.length) lista.push({ tipo: "cuerda", jugador: ji, id: c.id });
        if (!rival && (efecto === "secar-prenda" || efecto === "reducir-humedad")) c.colgadas.forEach((g) => g.prenda.humedad > 0 && lista.push({ tipo: "prenda", jugador: ji, id: g.prenda.id }));
      }),
    );
  });
  return lista;
}

const cuerdasLibres = (j: Jugador, p: Prenda) => j.lineas.flat().filter((c) => PINZAS_POR_CUERDA - pinzasUsadas(c) >= TIPOS[p.tipo].espacios);
const lineasConHueco = (j: Jugador) => j.lineas.flatMap((l, i) => (l.length < CUERDAS_POR_LINEA ? [i] : []));

/** Dónde va cada prenda en su cuerda (en celdas): repartidas de lado a lado y solapadas si no caben. */
function posicion(i: number, n: number): number {
  const ancho = 1.45;
  if (n <= 1) return (3 - ancho) / 2;
  return 0.08 + (i * (3 - ancho - 0.16)) / (n - 1);
}

// ---------- Menú y partida ----------

export function MesaFinal({ onVersion, onVolver }: { onVersion: (v: string) => void; onVolver: () => void }) {
  const [config, setConfig] = useState<ConfigPartida | null>(null);
  const [estilo, setEstiloActual] = useState(leerEstilo);

  function elegirEstilo(id: string) {
    setEstiloActual(id);
    try {
      localStorage.setItem("tendedero-estilo", id);
    } catch {
      // Sin almacenamiento solo se pierde la elección al recargar.
    }
  }

  const estilos = (
    <nav className="mb-estilos">
      <span>Estilo de dibujo:</span>
      {ESTILOS.map((e) => (
        <button key={e.id} className={e.id === estilo ? "activa" : ""} onClick={() => elegirEstilo(e.id)}>
          {e.nombre}
        </button>
      ))}
    </nav>
  );

  if (!config) {
    return (
      <div className={`proto mb me con-estilos estilo-${estilo}`}>
        <DefsBosque />
        <Barra version="e" onVersion={onVersion} onVolver={onVolver} ocupado onRival={() => {}} onReiniciar={() => {}} />
        {estilos}
        <div className="escenario mb-escenario me-menu-fondo">
          <div className="mb-luz" aria-hidden />
          <MenuPartida onEmpezar={setConfig} />
        </div>
      </div>
    );
  }
  return <Partida key={JSON.stringify(config)} config={config} estilo={estilo} estilos={estilos} onVersion={onVersion} onVolver={onVolver} onMenu={() => setConfig(null)} />;
}

function Partida({
  config,
  estilo,
  estilos,
  onVersion,
  onVolver,
  onMenu,
}: {
  config: ConfigPartida;
  estilo: string;
  estilos: ReactNode;
  onVersion: (v: string) => void;
  onVolver: () => void;
  onMenu: () => void;
}) {
  const perfiles = config.jugadores;
  const n = perfiles.length;
  const [estado, setEstado] = useState(() => inicial(n));
  const [sel, setSel] = useState<Seleccion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [turnoRival, setTurnoRival] = useState(1);
  // Qué tendedero se ve en grande y si la vista salta sola al de quien juega.
  const [vista, setVista] = useState(0);
  const [seguir, setSeguir] = useState(true);
  // Quién está haciendo una jugada ahora (para marcar su panel).
  const [actor, setActor] = useState<number | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const flecha = useRef<SVGPathElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const tendedero = useRef<HTMLDivElement>(null);
  const zonaComun = useRef<HTMLDivElement>(null);
  const comun = useRef<HTMLDivElement>(null);
  useAjustarMesa(lienzo, tendedero, 1.6);
  useAjustarMesa(zonaComun, comun, 1.15);

  const ultimo = useRef(estado);
  ultimo.current = estado;
  const vistaActual = useRef(vista);
  vistaActual.current = vista;

  const yo = estado.jugadores[0];
  const objetivosAccion = sel?.tipo === "carta" && sel.carta.clase === "accion" ? objetivos(estado, 0, sel.carta.id) : [];
  const huecos = sel?.tipo === "carta" && sel.carta.clase === "cuerda" ? lineasConHueco(yo) : [];
  const cuerdasValidas = sel?.tipo === "prenda" ? cuerdasLibres(yo, sel.prenda).map((c) => c.id) : [];
  const esValido = (tipo: Objetivo["tipo"], id: string) => objetivosAccion.some((o) => o.tipo === tipo && o.id === id);
  const origenSel = sel ? (sel.tipo === "carta" ? `[data-uid="${sel.carta.uid}"]` : `[data-portender="${sel.prenda.id}"]`) : null;
  const apuntados = new Set(objetivosAccion.map((o) => o.jugador));

  // Al elegir una carta, se enseña el tendedero donde se puede jugar: el tuyo para cuerdas y prendas, el de un
  // rival con objetivos para los fastidios.
  useEffect(() => {
    if (!sel) return;
    if (sel.tipo === "prenda" || sel.carta.clase === "cuerda") return setVista(0);
    if (!apuntados.has(vistaActual.current) && apuntados.size) setVista([...apuntados][0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  /** Durante una jugada enseña el tendedero de `jugador` (si «ver las jugadas» está activo) y devuelve cómo volver. */
  async function mirar(jugador: number) {
    const nada = () => Promise.resolve();
    const antes = vistaActual.current;
    if (!seguir || jugador === antes) return nada;
    flushSync(() => setVista(jugador));
    await fx.esperar(450);
    return async () => {
      flushSync(() => setVista(antes));
      await fx.esperar(300);
    };
  }

  function cambiar(fn: (e: Estado) => void) {
    flushSync(() =>
      setEstado((e) => {
        const nuevo = structuredClone(e);
        fn(nuevo);
        return nuevo;
      }),
    );
  }
  const anotar = (e: Estado, j: number, texto: string) => void e.registro.unshift({ id: nuevoId("r"), j, texto, ronda: e.ronda });
  const el = (s: string) => raiz.current!.querySelector<HTMLElement>(s)!;
  const rect = (s: string) => el(s).getBoundingClientRect();
  /** El primer elemento que exista de la lista (p. ej. la pila «por tender» si se ve, o si no el panel del jugador). */
  const rectDe = (...selectores: string[]) => {
    for (const s of selectores) {
      const e = raiz.current!.querySelector<HTMLElement>(s);
      if (e) return e.getBoundingClientRect();
    }
    return rect("[data-bolsa]");
  };

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

  async function animar(quien: number | null, fn: () => Promise<void>) {
    setSel(null);
    setOcupado(true);
    setActor(quien);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
      raiz.current?.querySelectorAll<HTMLElement>("[data-uid], [data-prenda], [data-portender]").forEach((x) => (x.style.visibility = ""));
    } finally {
      setOcupado(false);
      setActor(null);
    }
  }

  // ---------- Acciones ----------

  function jugarAccion(quien: number, uid: string, id: string, objetivo: Objetivo) {
    return animar(quien, async () => {
      const def = ACCIONES[id];
      const volver = await mirar(objetivo.jugador);
      const selObjetivo = objetivo.tipo === "prenda" ? `[data-prenda="${objetivo.id}"]` : `[data-cuerda="${objetivo.id}"]`;
      const cartaEl = el(`[data-uid="${uid}"]`);
      const zona = rect(selObjetivo);
      const contra = objetivo.jugador === quien ? "en su tendedero" : `contra ${objetivo.jugador === 0 ? "ti" : perfiles[objetivo.jugador].nombre}`;
      fx.anunciar(def.nombre, objetivo.jugador === quien ? `${perfiles[quien].nombre} · en su tendedero` : `${perfiles[quien].nombre}  ➜  ${perfiles[objetivo.jugador].nombre}`, def.grupo === "fastidio" ? "fastidio" : "tactica");
      const quitarEstela = fx.estela(fx.centro(cartaEl.getBoundingClientRect()), fx.centro(zona), perfiles[quien].color);
      const anchoMesa = (raiz.current!.querySelector<HTMLElement>(".mano .mb-accion")?.offsetWidth ?? 120) * 0.62;
      const clon = fx.clonar(cartaEl);
      cartaEl.style.visibility = "hidden";
      await fx.volar(clon, { x: fx.centro(zona).x, y: Math.max(90, zona.top - 70) }, { arco: 160, escala: anchoMesa / cartaEl.offsetWidth, giro: quien ? 6 : -6, duracion: 800, voltear: quien !== 0 });
      await fx.golpe(clon);
      await EFECTOS[def.efecto]({ objetivo, selObjetivo, el, rect, cambiar: (fn) => cambiar(fn) });
      quitarEstela();
      await fx.esperar(150);
      await volver();
      const d = rect('[data-pila="descarte"]');
      await fx.volar(clon, fx.centro(d), { arco: 40, escala: d.width / cartaEl.offsetWidth, giro: 3, duracion: 500 });
      cambiar((e) => {
        if (quien === 0) e.mano = e.mano.filter((c) => c.uid !== uid);
        else e.manos[quien - 1] = e.manos[quien - 1].filter((c) => c.uid !== uid);
        e.descarte = id;
        anotar(e, quien, `juega ${def.nombre} ${contra}.`);
      });
      clon.remove();
      await robar(quien);
    });
  }

  // ---------- Cuerdas ----------

  function ponerCuerda(quien: number, c: CartaMesa, linea: number) {
    return animar(quien, async () => {
      const volver = await mirar(quien);
      const cartaEl = el(`[data-uid="${c.uid}"]`);
      const hueco = rect(`[data-hueco="${quien}:${linea}"]`);
      const nombre = c.id === "modificador-puntuacion" ? "Pinzas rojas" : CUERDAS[c.id]?.nombre;
      fx.anunciar(nombre, `${perfiles[quien].nombre} · tiende una cuerda`, "cuerda");
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
        anotar(e, quien, `tiende ${nombre} en la línea ${linea + 1}.`);
      });
      clon.remove();
      el(`[data-linea="${quien}:${linea}"]`).animate([{ transform: "none" }, { transform: "translateY(-3px)" }, { transform: "translateY(1px)" }, { transform: "none" }], { duration: 500, delay: 450, easing: "ease-out" });
      await fx.esperar(1100);
      cambiar((e) => void (e.recien = null));
      await volver();
      if (quien === 0) await robar(0);
    });
  }

  // ---------- Prendas ----------

  function colgar(quien: number, p: Prenda, cuerdaId: string) {
    return animar(quien, async () => {
      const volver = await mirar(quien);
      const origen = el(`[data-portender="${p.id}"]`);
      const clon = fx.clonar(origen);
      origen.style.visibility = "hidden";
      // Se añade ya a la cuerda (invisible) para saber dónde queda, y la carta vuela hasta allí.
      cambiar((e) => {
        const j = e.jugadores[quien];
        const pr = j.porTender.find((x) => x.id === p.id)!;
        j.porTender = j.porTender.filter((x) => x.id !== p.id);
        for (const c of j.lineas.flat()) if (c.id === cuerdaId) c.colgadas.push({ prenda: pr, inicio: c.colgadas.length });
        e.recien = p.id;
        anotar(e, quien, `cuelga ${NOMBRE_TIPO[p.tipo][0] === "toalla" || NOMBRE_TIPO[p.tipo][0] === "camiseta" ? "una" : "un"} ${NOMBRE_TIPO[p.tipo][0]} ${NOMBRE_COLOR[p.color][0]}.`);
      });
      const destino = el(`[data-prenda="${p.id}"]`);
      destino.style.visibility = "hidden";
      const r = destino.getBoundingClientRect();
      await fx.volar(clon, fx.centro(r), { arco: 120, escala: r.width / origen.offsetWidth, giro: 0, duracion: 750 });
      destino.style.visibility = "";
      clon.remove();
      const cz = rect(`[data-cuerda="${cuerdaId}"]`);
      fx.salpicar({ x: r.left + r.width / 2, y: cz.bottom }, "#c99a62", 8);
      await fx.esperar(800);
      cambiar((e) => void (e.recien = null));
      await volver();
    });
  }

  // ---------- Reparto (draft) ----------

  /** Coge todas las prendas de un color o de un tipo de una cesta (lo demás va al centro) o del centro. */
  function coger(quien: number, origen: Origen, patron: Patron) {
    return animar(quien, async () => {
      const e0 = ultimo.current;
      const monton = origen === "centro" ? e0.centro : e0.cestas[origen];
      const cogidas = monton.filter((p) => cumple(p, patron));
      const resto = monton.filter((p) => !cumple(p, patron));
      const nombres = "color" in patron ? NOMBRE_COLOR[patron.color] : NOMBRE_TIPO[patron.tipo];
      const que = `${cogidas.length} ${nombres[cogidas.length === 1 ? 0 : 1]}`;
      const deDonde = origen === "centro" ? "del centro" : `de la cesta ${origen + 1}`;
      fx.anunciar(`${perfiles[quien].nombre} coge ${que}`, `${deDonde}${origen !== "centro" && resto.length ? " · el resto va al centro" : ""}`, "tactica");
      const pila = rectDe(`[data-pila="porTender-${quien}"]`, `[data-panel-portender="${quien}"]`);
      const centro = rect("[data-centro]");
      const elemento = (p: Prenda) => el(origen === "centro" ? `[data-encentro="${p.id}"]` : `[data-encesta="${p.id}"]`);
      const vuelos = [...cogidas.map((p) => ({ p, destino: pila })), ...(origen === "centro" ? [] : resto.map((p) => ({ p, destino: centro })))];
      await Promise.all(
        vuelos.map(async ({ p, destino }, i) => {
          await fx.esperar(i * 120);
          const original = elemento(p);
          const clon = fx.clonar(original);
          original.style.visibility = "hidden";
          await fx.volar(clon, fx.centro(destino), { arco: 120, escala: 0.85, giro: i % 2 ? 7 : -7, duracion: 700 });
          clon.remove();
        }),
      );
      cambiar((e) => {
        if (origen === "centro") e.centro = e.centro.filter((p) => !cumple(p, patron));
        else {
          e.cestas[origen] = [];
          e.centro.push(...resto);
        }
        e.jugadores[quien].porTender.push(...cogidas);
        anotar(e, quien, `coge ${que} ${deDonde}.`);
        siguienteReparto(e);
      });
      fx.salpicar(fx.centro(rectDe(`[data-pila="porTender-${quien}"]`, `[data-panel-portender="${quien}"]`)), perfiles[quien].color, 10);
    });
  }

  // Cuando en el reparto le toca a un rival, coge solo: el color o tipo con más prendas.
  useEffect(() => {
    if (estado.fase === "juego" || estado.coge === 0 || ocupado) return;
    const quien = estado.coge;
    const t = setTimeout(() => {
      const origenes: Origen[] = estado.fase === "centro" ? ["centro"] : estado.cestas.flatMap((c, i) => (c.length ? [i] : []));
      const todas = origenes.flatMap((o) => opciones(o === "centro" ? estado.centro : estado.cestas[o]).map((op) => ({ o, ...op })));
      const mejor = Math.max(...todas.map((x) => x.cuantas));
      const elegida = azar(todas.filter((x) => x.cuantas === mejor));
      if (elegida) void coger(quien, elegida.o, elegida.patron);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.fase, estado.coge, ocupado]);

  // Al acabar el reparto se vuelve a tu tendedero.
  useEffect(() => {
    if (estado.fase === "juego") setVista(0);
  }, [estado.fase]);

  /** Fin de ronda: lo que queda en el centro vuelve a la bolsa y solo se rellenan las cestas vacías. */
  async function renovarCestas() {
    const bolsa = rect("[data-bolsa]");
    const centro = ultimo.current.centro;
    await Promise.all(
      centro.map(async (p, i) => {
        await fx.esperar(i * 80);
        const original = el(`[data-encentro="${p.id}"]`);
        const clon = fx.clonar(original);
        original.style.visibility = "hidden";
        await fx.volar(clon, fx.centro(bolsa), { arco: 80, escala: 0.4, giro: 20, duracion: 550 });
        clon.remove();
      }),
    );
    const vacias = ultimo.current.cestas.flatMap((c, i) => (c.length ? [] : [i]));
    cambiar((e) => {
      e.bolsa.push(...e.centro);
      e.centro = [];
      for (let i = e.bolsa.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        [e.bolsa[i], e.bolsa[k]] = [e.bolsa[k], e.bolsa[i]];
      }
      e.cestas = e.cestas.map((c) => (c.length ? c : e.bolsa.splice(-PRENDAS_POR_CESTA)));
    });
    const nuevas = vacias.flatMap((i) => ultimo.current.cestas[i]);
    await Promise.all(nuevas.map((p, i) => fx.esperar(i * 70).then(() => fx.traerDesde(el(`[data-encesta="${p.id}"]`), bolsa))));
    fx.anunciar(`Ronda ${ultimo.current.ronda + 1}`, "Reparto: cada uno coge de una cesta", "tactica");
    cambiar((e) => {
      e.ronda++;
      e.fase = "cesta";
      e.coge = 0;
      anotar(e, -1, `Empieza la ronda ${e.ronda}: se rellenan ${vacias.length} cestas.`);
    });
  }

  /** Acaba el día: toda la ropa sube un paso (dos en secado rápido); la que se seca se va a «secas» y puntúa. */
  function acabarDia() {
    return animar(null, async () => {
      fx.anunciar("Se acaba el día", "La ropa se seca un poco", "tactica");
      cambiar((e) => {
        for (const j of e.jugadores) for (const c of j.lineas.flat()) for (const g of c.colgadas) g.prenda.humedad = Math.max(0, g.prenda.humedad - (c.efecto === "secado-rapido" ? 2 : 1));
      });
      await fx.esperar(900);
      const secas = ultimo.current.jugadores.flatMap((j, ji) => j.lineas.flat().flatMap((c) => c.colgadas.filter((g) => g.prenda.humedad === 0).map((g) => ({ ji, c, g }))));
      const ganados = perfiles.map(() => 0);
      for (const { ji, c, g } of secas) {
        // Solo se anima la ropa del tendedero que se ve; la de los demás se recoge directamente.
        const p = raiz.current!.querySelector<HTMLElement>(`[data-prenda="${g.prenda.id}"]`);
        const puntos = TIPOS[g.prenda.tipo].puntos + (c.pinzas && c.pinzas === g.prenda.color ? 1 : 0);
        ganados[ji] += puntos;
        if (p) {
          const clon = fx.clonar(p);
          p.style.visibility = "hidden";
          await fx.volar(clon, fx.centro(rect(`[data-pila="secas-${ji}"]`)), { arco: 120, escala: 0.4, giro: -10, duracion: 600 });
          clon.remove();
        }
        cambiar((e) => {
          const j = e.jugadores[ji];
          for (const cc of j.lineas.flat()) {
            const i = cc.colgadas.findIndex((x) => x.prenda.id === g.prenda.id);
            if (i >= 0) j.secas.push(cc.colgadas.splice(i, 1)[0].prenda);
          }
          j.puntos += puntos;
        });
        const m = rect(`[data-puntos="${ji}"]`);
        fx.cartelito({ x: m.left + m.width / 2, y: m.top }, `+${puntos}`, "puntos");
        fx.salpicar(fx.centro(m), "#ffc93c", 12);
      }
      cambiar((e) => {
        anotar(e, -1, `Se acaba el día: se secan ${secas.length} ${secas.length === 1 ? "prenda" : "prendas"}.`);
        ganados.forEach((g, j) => g && anotar(e, j, `suma ${g} ${g === 1 ? "punto" : "puntos"} con la ropa seca.`));
      });
      await fx.esperar(400);
      await renovarCestas();
    });
  }

  async function robar(quien: number) {
    if (quien !== 0) {
      const nueva = carta(azar(MAZO_RIVAL));
      const desde = rect('[data-pila="mazo"]');
      cambiar((e) => void e.manos[quien - 1].push(nueva));
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

  /** Juega el rival al que le toca y pasa el turno al siguiente. */
  async function jugarRival() {
    const quien = turnoRival;
    setTurnoRival(quien + 1 < n ? quien + 1 : 1);
    const j = estado.jugadores[quien];
    const ataques = estado.manos[quien - 1].flatMap((m) => objetivos(estado, quien, m.id).map((o) => () => jugarAccion(quien, m.uid, m.id, o)));
    const tendidos = j.porTender.flatMap((p) => cuerdasLibres(j, p).map((c) => () => colgar(quien, p, c.id)));
    const opciones = Math.random() < 0.6 && ataques.length ? ataques : tendidos.length ? tendidos : ataques;
    if (opciones.length) await azar(opciones)();
  }

  function reiniciar() {
    setSel(null);
    setVista(0);
    raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
    setEstado(inicial(n));
  }

  function pulsarObjetivo(tipo: Objetivo["tipo"], jugador: number, id: string) {
    if (ocupado) return;
    if (sel?.tipo === "prenda" && tipo === "cuerda" && cuerdasValidas.includes(id)) return void colgar(0, sel.prenda, id);
    if (sel?.tipo !== "carta" || !esValido(tipo, id)) return;
    void jugarAccion(0, sel.carta.uid, sel.carta.id, { tipo, jugador, id });
  }

  const turnoDe = estado.fase !== "juego" ? estado.coge : actor;
  const vistoPerfil = perfiles[vista];

  return (
    <div ref={raiz} className={`proto mb me mf con-estilos estilo-${estilo} ${sel ? "apuntando" : ""} ${ocupado ? "ocupado" : ""}`}>
      <DefsBosque />
      <Barra
        version="e"
        onVersion={onVersion}
        onVolver={onVolver}
        ocupado={ocupado || estado.fase !== "juego"}
        onRival={() => void jugarRival()}
        onReiniciar={reiniciar}
        textoRival={`Que juegue ${perfiles[turnoRival].nombre}`}
      />
      {estilos}

      <div className="mf-juego">
        <aside className="mf-jugadores" aria-label="Jugadores">
          {perfiles.map((p, j) => (
            <PanelJugador
              key={j}
              jugador={j}
              perfil={p}
              datos={estado.jugadores[j]}
              mano={j === 0 ? null : estado.manos[j - 1]}
              turno={turnoDe === j}
              viendo={vista === j}
              apuntado={apuntados.has(j)}
              onVer={() => setVista(j)}
            />
          ))}
          <button className="mf-menu" onClick={onMenu}>
            Volver al menú
          </button>
        </aside>

        <section className="mf-comun" ref={zonaComun}>
          <div className="mf-comun-contenido" ref={comun}>
            <Reparto estado={estado} perfiles={perfiles} ocupado={ocupado} onCoger={(o, patron) => void coger(0, o, patron)} />
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
          </div>
        </section>

        <section className="mf-vista">
          <nav className="mf-pestanas" aria-label="Tendederos">
            {perfiles.map((p, j) => (
              <button
                key={j}
                className={`mf-pestana ${vista === j ? "activa" : ""} ${apuntados.has(j) ? "apuntada" : ""}`}
                style={{ "--jugador": p.color } as CSSProperties}
                onClick={() => setVista(j)}
              >
                <Animal id={p.animal} className="mf-pestana-animal" />
                {j === 0 ? "Tu tendedero" : `Tendedero de ${p.nombre}`}
                {apuntados.has(j) && <span className="mf-objetivo">objetivo</span>}
              </button>
            ))}
            <label className="mf-seguir">
              <input type="checkbox" checked={seguir} onChange={(e) => setSeguir(e.target.checked)} /> Ver las jugadas de los rivales
            </label>
          </nav>
          <div className="mf-lienzo" ref={lienzo}>
            <div className="mf-tendedero" ref={tendedero}>
              <Tapete
                jugador={vista}
                perfil={vistoPerfil}
                datos={estado.jugadores[vista]}
                recien={estado.recien}
                esValido={esValido}
                onObjetivo={pulsarObjetivo}
                apuntada={apuntados.has(vista)}
                huecos={vista === 0 ? huecos : []}
                cuerdasValidas={vista === 0 ? cuerdasValidas : []}
                prendaElegida={sel?.tipo === "prenda" ? sel.prenda.id : null}
                onHueco={(l) => sel?.tipo === "carta" && void ponerCuerda(0, sel.carta, l)}
                onPrenda={
                  vista === 0
                    ? (p) => !ocupado && estado.fase === "juego" && setSel(sel?.tipo === "prenda" && sel.prenda.id === p.id ? null : { tipo: "prenda", prenda: p })
                    : undefined
                }
              />
            </div>
          </div>
        </section>

        <Registro registro={estado.registro} perfiles={perfiles} />
      </div>

      <div className="mano mf-mano">
        {estado.mano.map((c, i) => {
          const jugable = estado.fase === "juego" && (c.clase === "cuerda" ? lineasConHueco(yo).length > 0 : objetivos(estado, 0, c.id).length > 0);
          const elegida = sel?.tipo === "carta" && sel.carta.uid === c.uid;
          const centrado = i - (estado.mano.length - 1) / 2;
          const estiloCarta = { "--abanico": `${centrado * 5}deg`, "--alzado": `${Math.abs(centrado) * 7}px` } as CSSProperties;
          const alPulsar = () => !ocupado && jugable && setSel(elegida ? null : { tipo: "carta", carta: c });
          return c.clase === "cuerda" ? (
            <CartaCuerdaBosque
              key={c.uid}
              data-uid={c.uid}
              efecto={efectoDe(c.id)}
              pinzas={c.pinzas}
              modo="borde"
              className={`carta-p mb-cuerda-mano ${elegida ? "elegida" : ""} ${jugable ? "" : "apagada"}`}
              style={estiloCarta}
              onClick={alPulsar}
            />
          ) : (
            <div key={c.uid} data-uid={c.uid} className={`carta-p mb-accion ${elegida ? "elegida" : ""} ${jugable ? "" : "apagada"}`} style={estiloCarta} onClick={alPulsar}>
              <div className="carta-giro">
                <CaraAccionBosque id={c.id} />
                <DorsoBosque />
              </div>
            </div>
          );
        })}
        <p className="ayuda-mano">
          {sel?.tipo === "prenda"
            ? "Elige en qué cuerda colgarla (Esc para cancelar)"
            : sel?.tipo === "carta" && sel.carta.clase === "cuerda"
              ? "Elige en qué línea tenderla"
              : sel
                ? "Elige a qué se la juegas: cambia de tendedero con las pestañas (Esc para cancelar)"
                : estado.fase === "juego"
                  ? "Juega una carta, cuelga una prenda de tu pila o acaba el día"
                  : "Reparto de prendas: elige en la zona de arriba"}
        </p>
      </div>

      <button className="principal mf-acabar" disabled={ocupado || estado.fase !== "juego"} onClick={() => void acabarDia()}>
        <span>Acabar el día</span>
        <small>{estado.fase === "juego" ? "seca la ropa y pasa de ronda" : "primero, el reparto"}</small>
      </button>

      <svg className="flecha-apuntar" aria-hidden>
        <defs>
          <marker id="punta-flecha-me" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <path ref={flecha} markerEnd="url(#punta-flecha-me)" />
      </svg>
      <div className="capa-efectos" ref={fx.usarCapa} />
    </div>
  );
}

/** Panel de un jugador: lo importante de un vistazo, y un clic para ver su tendedero en grande. */
function PanelJugador({
  jugador,
  perfil,
  datos,
  mano,
  turno,
  viendo,
  apuntado,
  onVer,
}: {
  jugador: number;
  perfil: Perfil;
  datos: Jugador;
  mano: CartaMano[] | null;
  turno: boolean;
  viendo: boolean;
  apuntado: boolean;
  onVer: () => void;
}) {
  const cuerdas = datos.lineas.flat().length;
  const colgadas = datos.lineas.flat().reduce((s, c) => s + c.colgadas.length, 0);
  return (
    <div
      className={`mf-panel ${turno ? "turno" : ""} ${viendo ? "viendo" : ""} ${apuntado ? "apuntado" : ""}`}
      style={{ "--jugador": perfil.color } as CSSProperties}
      onClick={onVer}
      role="button"
      title={jugador === 0 ? "Ver tu tendedero" : `Ver el tendedero de ${perfil.nombre}`}
    >
      <div className="mf-panel-cabeza">
        <Animal id={perfil.animal} className="mf-panel-animal" />
        <div className="mf-panel-nombre">
          {perfil.nombre}
          {jugador === 0 && <small> (tú)</small>}
        </div>
        <div className="mf-panel-puntos" data-puntos={jugador} title="Puntos">
          {datos.puntos}
        </div>
      </div>
      <div className="mf-panel-datos">
        <span className="mf-dato" data-pila={`secas-${jugador}`} title="Prendas secas">
          <i className="mf-icono mf-icono-seca" />
          {datos.secas.length} secas
        </span>
        <span className="mf-dato" data-panel-portender={jugador} title="Prendas por tender">
          <i className="mf-icono mf-icono-tender" />
          {datos.porTender.length} por tender
        </span>
        <span className="mf-dato" title="Prendas colgadas">
          <i className="mf-icono mf-icono-colgada" />
          {colgadas} colgadas
        </span>
        <span className="mf-dato" title="Cartas de cuerda">
          <i className="mf-icono mf-icono-cuerda" />
          {cuerdas}/{CUERDAS_POR_LINEA * 2} cuerdas
        </span>
      </div>
      {mano && (
        <div className="mf-panel-mano" title={`${mano.length} cartas en la mano`}>
          {mano.map((m, i) => (
            <div key={m.uid} data-uid={m.uid} className="carta-p mb-accion tapada" style={{ "--i": i } as CSSProperties}>
              <div className="carta-giro">
                <CaraAccionBosque id={m.id} />
                <DorsoBosque />
              </div>
            </div>
          ))}
          <span>{mano.length} cartas</span>
        </div>
      )}
      {turno && <div className="mf-turno">{jugador === 0 ? "Tu turno" : "Jugando…"}</div>}
      {apuntado && <div className="mf-turno mf-turno-objetivo">Objetivo</div>}
    </div>
  );
}

/** Las entradas del registro se escriben en tercera persona; las tuyas se pasan a «tú» («coge» → «coges»). */
function enSegunda(texto: string): string {
  const [verbo, ...resto] = texto.split(" ");
  return [`${verbo}s`, ...resto].join(" ");
}

/** Registro de lo que va pasando, lo último arriba. */
function Registro({ registro, perfiles }: { registro: Estado["registro"]; perfiles: Perfil[] }) {
  return (
    <aside className="mf-registro" aria-label="Registro de la partida">
      <h2>Lo que ha pasado</h2>
      <ol>
        {registro.slice(0, 40).map((r) => (
          <li key={r.id} style={{ "--jugador": r.j >= 0 ? perfiles[r.j].color : "#8a7356" } as CSSProperties}>
            {r.j >= 0 ? <Animal id={perfiles[r.j].animal} className="mf-registro-animal" /> : <span className="mf-registro-ronda">R{r.ronda}</span>}
            <p>
              {r.j >= 0 && <b>{r.j === 0 ? "Tú" : perfiles[r.j].nombre} </b>}
              {r.j === 0 ? enSegunda(r.texto) : r.texto}
            </p>
          </li>
        ))}
        {registro.length === 0 && <li className="mf-registro-vacio">Aún no ha pasado nada.</li>}
      </ol>
    </aside>
  );
}

function Tapete({
  jugador,
  perfil,
  datos,
  recien,
  esValido,
  onObjetivo,
  apuntada,
  huecos = [],
  cuerdasValidas = [],
  prendaElegida,
  onHueco,
  onPrenda,
}: {
  jugador: number;
  perfil: Perfil;
  datos: Jugador;
  recien: string | null;
  esValido: (tipo: Objetivo["tipo"], id: string) => boolean;
  onObjetivo: (tipo: Objetivo["tipo"], jugador: number, id: string) => void;
  apuntada?: boolean;
  huecos?: number[];
  cuerdasValidas?: string[];
  prendaElegida?: string | null;
  onHueco?: (linea: number) => void;
  onPrenda?: (p: Prenda) => void;
}) {
  return (
    <section
      data-tapete={jugador}
      className={`mb-tapete mb-tapete-${jugador === 0 ? "tu" : "rival"} ${apuntada ? "apuntada" : ""}`}
      style={{ "--jugador": perfil.color } as CSSProperties}
    >
      <div className="mb-tendedero" data-zona={jugador}>
        <LosetaBosque lineas={datos.lineas.length} />
        <div className="mb-lineas">
          {datos.lineas.map((linea, l) => (
            <div key={l} className="mb-linea me-linea" data-linea={`${jugador}:${l}`}>
              {linea.map((c, pos) => {
                const libres = PINZAS_POR_CUERDA - pinzasUsadas(c);
                const valida = cuerdasValidas.includes(c.id);
                return (
                  <div
                    key={c.id}
                    data-cuerda={c.id}
                    className={`mb-cuerda me-cuerda ${recien === c.id ? "aparece" : ""} ${esValido("cuerda", c.id) || valida ? "valido" : ""} ${bajoTecho(datos, l, pos) ? "techada" : ""}`}
                    onClick={() => onObjetivo("cuerda", jugador, c.id)}
                  >
                    <CartaCuerdaBosque efecto={c.efecto} pinzas={c.pinzas} modo="borde" className="mb-cuerda-carta me-cuerda-carta" />
                    <span className={`me-pinzas-libres ${libres === 0 ? "llena" : ""}`}>{libres === 0 ? "llena" : `${libres} ${libres === 1 ? "pinza libre" : "pinzas libres"}`}</span>
                    {c.colgadas.map(({ prenda: p }, i) => (
                      <CartaPrendaHumeda
                        key={p.id}
                        p={p}
                        data-prenda={p.id}
                        className={`me-colgada prenda-p ${recien === p.id ? "colgando" : ""} ${esValido("prenda", p.id) ? "valido" : ""}`}
                        style={{ "--x": posicion(i, c.colgadas.length), "--orden": i } as CSSProperties}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onObjetivo("prenda", jugador, p.id);
                        }}
                      />
                    ))}
                  </div>
                );
              })}
              {linea.length < CUERDAS_POR_LINEA && (
                <div className={`mb-hueco me-hueco ${huecos.includes(l) ? "valido" : ""}`} data-hueco={`${jugador}:${l}`} onClick={() => huecos.includes(l) && onHueco?.(l)}>
                  <span>cuerda</span>
                </div>
              )}
              {Array.from({ length: Math.max(0, CUERDAS_POR_LINEA - linea.length - 1) }, (_, i) => (
                <div key={i} className="mb-hueco me-hueco vacio" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-portender" data-pila={`porTender-${jugador}`}>
        <div className="mb-portender-titulo">Por tender</div>
        <div className="mb-portender-cartas">
          {datos.porTender.map((p) => (
            <CartaPrendaHumeda
              key={p.id}
              p={p}
              data-portender={p.id}
              className={`me-pendiente ${onPrenda ? "jugable" : ""} ${prendaElegida === p.id ? "elegida" : ""}`}
              onClick={onPrenda ? () => onPrenda(p) : undefined}
            />
          ))}
          {datos.porTender.length === 0 && <div className="mf-pila-vacia">Sin prendas: llegan en el reparto</div>}
        </div>
      </div>
    </section>
  );
}

/** Saco de la bolsa de prendas. */
function Bolsa({ cuantas }: { cuantas: number }) {
  return (
    <div className="me-bolsa" data-bolsa title="Bolsa de prendas">
      <svg viewBox="0 0 64 70" className="ilu" aria-hidden>
        <g filter="url(#tinta-bosque)">
          <path d="M18 22 C8 34 6 60 20 64 C30 67 40 67 46 64 C60 58 56 34 46 22 Z" fill="#d6b98c" stroke="#2b2019" strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 22 C24 14 40 14 42 22" fill="#c9a877" stroke="#2b2019" strokeWidth="3" />
          <path d="M19 23 Q32 28 45 23" fill="none" stroke="#c2553a" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 34 C44 44 44 54 40 60" fill="none" stroke="#2b2019" strokeWidth="1.5" opacity=".4" />
        </g>
      </svg>
      <span>
        Bolsa · <b>{cuantas}</b>
      </span>
    </div>
  );
}

/** Reparto de la ronda: las 4 cestas, el centro y la bolsa. Cuando te toca, botones para coger un color o un tipo. */
function Reparto({
  estado,
  perfiles,
  ocupado,
  onCoger,
}: {
  estado: Estado;
  perfiles: Perfil[];
  ocupado: boolean;
  onCoger: (origen: Origen, patron: Patron) => void;
}) {
  const [resaltado, setResaltado] = useState<{ origen: Origen; patron: Patron } | null>(null);
  // Cesta (o centro) abierta con un clic: se queda abierta hasta que se pulsa fuera, se elige otra o se coge.
  const [abierto, setAbierto] = useState<Origen | null>(null);
  useEffect(() => {
    if (abierto === null) return;
    const fuera = (ev: PointerEvent) => {
      if (!(ev.target as Element).closest?.(".me-monton.abierta")) setAbierto(null);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);
  useEffect(() => setAbierto(null), [estado.fase, estado.coge]);
  const abrir = (o: Origen, hay: boolean) => hay && setAbierto(o);
  const repartiendo = estado.fase !== "juego";
  const miTurno = repartiendo && estado.coge === 0 && !ocupado;
  const quien = perfiles[estado.coge];
  const aviso = !repartiendo
    ? "A jugar: juega cartas, cuelga prendas y, al final, acaba el día"
    : miTurno
      ? estado.fase === "cesta"
        ? "Te toca: elige una cesta y llévate todo un color o todo un tipo. Lo demás va al centro."
        : "Te toca: llévate del centro todo un color o todo un tipo."
      : `${quien.nombre} está cogiendo ${estado.fase === "cesta" ? "de una cesta" : "del centro"}…`;

  const estado_ = (o: Origen, p: Prenda) => (resaltado && resaltado.origen === o ? (cumple(p, resaltado.patron) ? "destacada" : "apagada") : "");

  const botones = (o: Origen, prendas: Prenda[]) =>
    abierto === o && miTurno && (estado.fase === "centro") === (o === "centro") && prendas.length > 0 ? (
      <div className="me-opciones">
        {opciones(prendas).map((op) => (
          <button
            key={op.texto}
            className="me-opcion"
            onMouseEnter={() => setResaltado({ origen: o, patron: op.patron })}
            onMouseLeave={() => setResaltado(null)}
            onClick={(ev) => {
              // Que el clic no llegue al montón (que lo volvería a abrir).
              ev.stopPropagation();
              setResaltado(null);
              setAbierto(null);
              onCoger(o, op.patron);
            }}
          >
            {"color" in op.patron ? <i className="me-muestra" style={{ background: colorEstilo(op.patron.color) }} /> : <PrendaBosque tipo={op.patron.tipo} color={COLORES.blanco} espacios={TIPOS[op.patron.tipo].espacios} className="me-muestra-tipo" />}
            {op.texto}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="me-reparto">
      <div className={`me-reparto-aviso ${miTurno ? "tu-turno" : ""}`} style={{ "--jugador": repartiendo ? quien.color : "#2b2019" } as CSSProperties}>
        {repartiendo && <Animal id={quien.animal} className="me-reparto-animal" />}
        <span className="me-ronda">Ronda {estado.ronda}</span>
        <span>{aviso}</span>
      </div>
      <div className={`me-montones ${abierto !== null ? "hay-abierta" : ""}`}>
        {estado.cestas.map((c, i) => (
          <div
            key={i}
            className={`me-monton ${miTurno && estado.fase === "cesta" && c.length ? "elegible" : ""} ${abierto === i ? "abierta" : ""}`}
            onClick={() => abrir(i, c.length > 0)}
            data-cesta={i}
            style={{ "--n": Math.max(1, c.length) } as CSSProperties}
          >
            <div className="me-monton-nombre">Cesta {i + 1}</div>
            <div className="me-monton-cartas">
              {c.map((p, k) => (
                <CartaPrendaHumeda key={p.id} p={p} data-encesta={p.id} className={`me-en-monton ${estado_(i, p)}`} style={{ "--k": k } as CSSProperties} />
              ))}
            </div>
            {c.length === 0 && <div className="me-cesta-vacia">vacía</div>}
            {botones(i, c)}
          </div>
        ))}
        <div
          className={`me-monton me-monton-centro ${miTurno && estado.fase === "centro" ? "elegible" : ""} ${abierto === "centro" ? "abierta" : ""}`}
          onClick={() => abrir("centro", estado.centro.length > 0)}
          data-centro
          style={{ "--n": Math.max(1, estado.centro.length) } as CSSProperties}
        >
          <div className="me-monton-nombre">Centro</div>
          <div className="me-monton-cartas">
            {estado.centro.map((p, k) => (
              <CartaPrendaHumeda key={p.id} p={p} data-encentro={p.id} className={`me-en-monton ${estado_("centro", p)}`} style={{ "--k": k } as CSSProperties} />
            ))}
          </div>
          {estado.centro.length === 0 && <div className="me-cesta-vacia">vacío</div>}
          {botones("centro", estado.centro)}
        </div>
        <Bolsa cuantas={estado.bolsa.length} />
      </div>
    </div>
  );
}
