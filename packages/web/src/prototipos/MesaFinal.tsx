import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Animal } from "./Animales";
import { CestaBosque, DefsBosque } from "./ArteBosque";
import { useCamara } from "./camara";
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

// Versión E · «Mesa final»: las decisiones de componentes aplicadas. Las prendas son cartas del mismo tamaño
// que se cuelgan solapadas por debajo de la carta de cuerda; cada cuerda tiene 3 pinzas (calcetín 1, camiseta 2,
// toalla 3). La humedad es la columna de gotas de arriba de la prenda: lo que asoma bajo la cuerda es lo que le
// queda, y al secarse la carta sube. Antes de jugar, un menú para el nombre, el animal y los rivales (2 a 4
// jugadores). Una cámara acerca la vista a cada tendedero y sigue las jugadas.

type CartaMesa = { uid: string; clase: "accion" | "cuerda"; id: string; pinzas?: string };
type Estado = { jugadores: Jugador[]; mano: CartaMesa[]; manos: CartaMano[][]; descarte: string | null; recien: string | null };
type Seleccion = { tipo: "carta"; carta: CartaMesa } | { tipo: "prenda"; prenda: Prenda };

const CUERDAS_POR_LINEA = 4;
const PINZAS_POR_CUERDA = 3;
const CUERDAS_MAZO: { id: string; pinzas?: string }[] = [{ id: "basica" }, { id: "tejadillo" }, { id: "resistente" }, { id: "secado-rapido" }, { id: "modificador-puntuacion", pinzas: COLORES.rojo }];
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
const pinzasUsadas = (c: Cuerda) => c.colgadas.reduce((s, g) => s + TIPOS[g.prenda.tipo].espacios, 0);
const tapete = (j: number) => `[data-tapete="${j}"]`;

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
  return {
    jugadores: [tuTendedero(), ...RIVALES.slice(0, n - 1).map((f) => f())],
    mano: [deAccion("rafaga-de-viento"), deCuerda("tejadillo"), deAccion("retrasar-secado"), deCuerda("resistente"), deAccion("secar-prenda")],
    manos: Array.from({ length: n - 1 }, () => MAZO_RIVAL.concat("retrasar-secado").map(carta)),
    descarte: null,
    recien: null,
  };
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
  const [camaraAuto, setCamaraAuto] = useState(true);
  const [enfoque, setEnfoque] = useState("todo");
  const raiz = useRef<HTMLDivElement>(null);
  const flecha = useRef<SVGPathElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const mesa = useRef<HTMLDivElement>(null);
  const camara = useCamara(escenario, mesa);

  const ultimo = useRef(estado);
  ultimo.current = estado;

  const yo = estado.jugadores[0];
  const objetivosAccion = sel?.tipo === "carta" && sel.carta.clase === "accion" ? objetivos(estado, 0, sel.carta.id) : [];
  const huecos = sel?.tipo === "carta" && sel.carta.clase === "cuerda" ? lineasConHueco(yo) : [];
  const cuerdasValidas = sel?.tipo === "prenda" ? cuerdasLibres(yo, sel.prenda).map((c) => c.id) : [];
  const esValido = (tipo: Objetivo["tipo"], id: string) => objetivosAccion.some((o) => o.tipo === tipo && o.id === id);
  const origenSel = sel ? (sel.tipo === "carta" ? `[data-uid="${sel.carta.uid}"]` : `[data-portender="${sel.prenda.id}"]`) : null;

  function enfocar(objetivo: string, animado = true) {
    setEnfoque(objetivo);
    camara.enfocar(objetivo, animado);
  }

  /** Con «seguir las jugadas», mira a un jugador durante la jugada y devuelve cómo volver a donde estaba. */
  async function mirar(jugador: number | "todo") {
    const nada = () => Promise.resolve();
    if (!camaraAuto) return nada;
    const antes = camara.objetivo();
    const destino = jugador === "todo" ? "todo" : tapete(jugador);
    if (destino === antes) return nada;
    enfocar(destino);
    await fx.esperar(850);
    return async () => {
      enfocar(antes);
      await fx.esperar(500);
    };
  }

  // Al empezar, la cámara viaja de la mesa entera a tu tendedero.
  useEffect(() => {
    camara.enfocar("todo", false);
    const t = setTimeout(() => enfocar(tapete(0)), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cambiar(fn: (e: Estado) => void) {
    flushSync(() =>
      setEstado((e) => {
        const nuevo = structuredClone(e);
        fn(nuevo);
        return nuevo;
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
      raiz.current?.querySelectorAll<HTMLElement>("[data-uid], [data-prenda], [data-portender]").forEach((x) => (x.style.visibility = ""));
    } finally {
      setOcupado(false);
    }
  }

  // ---------- Acciones ----------

  function jugarAccion(quien: number, uid: string, id: string, objetivo: Objetivo) {
    return animar(async () => {
      const def = ACCIONES[id];
      const volver = await mirar(objetivo.jugador);
      const selObjetivo = objetivo.tipo === "prenda" ? `[data-prenda="${objetivo.id}"]` : `[data-cuerda="${objetivo.id}"]`;
      const cartaEl = el(`[data-uid="${uid}"]`);
      const zona = rect(selObjetivo);
      fx.anunciar(
        def.nombre,
        objetivo.jugador === quien ? `${perfiles[quien].nombre} · en su tendedero` : `${perfiles[quien].nombre}  ➜  ${perfiles[objetivo.jugador].nombre}`,
        def.grupo === "fastidio" ? "fastidio" : "tactica",
      );
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
      });
      clon.remove();
      await robar(quien);
    });
  }

  // ---------- Cuerdas ----------

  function ponerCuerda(quien: number, c: CartaMesa, linea: number) {
    return animar(async () => {
      const volver = await mirar(quien);
      const cartaEl = el(`[data-uid="${c.uid}"]`);
      const hueco = rect(`[data-hueco="${quien}:${linea}"]`);
      fx.anunciar(c.id === "modificador-puntuacion" ? "Pinzas rojas" : CUERDAS[c.id]?.nombre, `${perfiles[quien].nombre} · tiende una cuerda`, "cuerda");
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
      el(`[data-linea="${quien}:${linea}"]`).animate([{ transform: "none" }, { transform: "translateY(-3px)" }, { transform: "translateY(1px)" }, { transform: "none" }], { duration: 500, delay: 450, easing: "ease-out" });
      await fx.esperar(1100);
      cambiar((e) => void (e.recien = null));
      await volver();
      if (quien === 0) await robar(0);
    });
  }

  // ---------- Prendas ----------

  function colgar(quien: number, p: Prenda, cuerdaId: string) {
    return animar(async () => {
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
      const [tipo, color] = azar(NUEVAS_PRENDAS);
      const nueva = prenda(tipo, color, TIPOS[tipo].humedad);
      const cesta = rect(`[data-cesta="${Math.floor(Math.random() * 3)}"]`);
      cambiar((e) => void e.jugadores[quien].porTender.push(nueva));
      await fx.traerDesde(el(`[data-portender="${nueva.id}"]`), cesta);
      await volver();
    });
  }

  /** Acaba el día: toda la ropa sube un paso (dos en secado rápido); la que se seca se va a «secas» y puntúa. */
  function acabarDia() {
    return animar(async () => {
      const volver = await mirar("todo");
      fx.anunciar("Se acaba el día", "La ropa se seca un poco", "tactica");
      cambiar((e) => {
        for (const j of e.jugadores) for (const c of j.lineas.flat()) for (const g of c.colgadas) g.prenda.humedad = Math.max(0, g.prenda.humedad - (c.efecto === "secado-rapido" ? 2 : 1));
      });
      await fx.esperar(900);
      const secas = ultimo.current.jugadores.flatMap((j, ji) => j.lineas.flat().flatMap((c) => c.colgadas.filter((g) => g.prenda.humedad === 0).map((g) => ({ ji, c, g }))));
      for (const { ji, c, g } of secas) {
        const p = el(`[data-prenda="${g.prenda.id}"]`);
        const clon = fx.clonar(p);
        p.style.visibility = "hidden";
        const destino = rect(`[data-pila="secas-${ji}"]`);
        const puntos = TIPOS[g.prenda.tipo].puntos + (c.pinzas && c.pinzas === g.prenda.color ? 1 : 0);
        await fx.volar(clon, fx.centro(destino), { arco: 120, escala: 0.4, giro: -10, duracion: 600 });
        clon.remove();
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
      await fx.esperar(400);
      await volver();
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
    raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
    setEstado(inicial(n));
  }

  function pulsarObjetivo(tipo: Objetivo["tipo"], jugador: number, id: string) {
    if (ocupado) return;
    if (sel?.tipo === "prenda" && tipo === "cuerda" && cuerdasValidas.includes(id)) return void colgar(0, sel.prenda, id);
    if (sel?.tipo !== "carta" || !esValido(tipo, id)) return;
    void jugarAccion(0, sel.carta.uid, sel.carta.id, { tipo, jugador, id });
  }

  const apuntados = new Set(objetivosAccion.map((o) => o.jugador));

  return (
    <div ref={raiz} className={`proto mb me me-n${n} con-estilos estilo-${estilo} ${sel ? "apuntando" : ""} ${ocupado ? "ocupado" : ""}`}>
      <DefsBosque />
      <Barra
        version="e"
        onVersion={onVersion}
        onVolver={onVolver}
        ocupado={ocupado}
        onRival={() => void jugarRival()}
        onReiniciar={reiniciar}
        textoRival={`Que juegue ${perfiles[turnoRival].nombre}`}
      />
      {estilos}

      <div className="escenario mb-escenario me-escenario" ref={escenario}>
        <div className="mb-luz" aria-hidden />
        <div className="mb-mesa me-mesa" ref={mesa}>
          <div className="me-rivales">
            {estado.jugadores.slice(1).map((datos, k) => (
              <Tapete
                key={k + 1}
                jugador={k + 1}
                perfil={perfiles[k + 1]}
                datos={datos}
                recien={estado.recien}
                esValido={esValido}
                onObjetivo={pulsarObjetivo}
                apuntada={apuntados.has(k + 1)}
                manoRival={estado.manos[k]}
              />
            ))}
          </div>

          <section className="mb-centro">
            <div className="mb-cestas">
              {(["camiseta", "toalla", "calcetin"] as const).map((t, i) => (
                <div key={t} className="mb-cesta" data-cesta={i}>
                  <CartaPrendaHumeda p={{ id: `cesta-${i}`, tipo: t, color: Object.values(COLORES)[(i + 1) % 4], humedad: TIPOS[t].humedad }} className="me-cesta-carta" />
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
            <div className="me-dia">
              <CartaDiaBosque />
              <button className="principal" disabled={ocupado} onClick={() => void acabarDia()}>
                Acabar el día
              </button>
            </div>
          </section>

          <Tapete
            jugador={0}
            perfil={perfiles[0]}
            datos={yo}
            recien={estado.recien}
            esValido={esValido}
            onObjetivo={pulsarObjetivo}
            huecos={huecos}
            cuerdasValidas={cuerdasValidas}
            prendaElegida={sel?.tipo === "prenda" ? sel.prenda.id : null}
            onHueco={(l) => sel?.tipo === "carta" && void ponerCuerda(0, sel.carta, l)}
            onPrenda={(p) => !ocupado && setSel(sel?.tipo === "prenda" && sel.prenda.id === p.id ? null : { tipo: "prenda", prenda: p })}
          />
        </div>

        <nav className="me-camara" aria-label="Cámara">
          <div className="me-camara-titulo">Cámara</div>
          <button className={enfoque === "todo" ? "activa" : ""} onClick={() => enfocar("todo")}>
            Toda la mesa
          </button>
          {perfiles.map((p, i) => (
            <button key={i} className={enfoque === tapete(i) ? "activa" : ""} onClick={() => enfocar(tapete(i))} style={{ "--jugador": p.color } as CSSProperties}>
              <Animal id={p.animal} className="me-camara-animal" />
              {i === 0 ? "Tu tendedero" : p.nombre}
            </button>
          ))}
          <div className="me-camara-zoom">
            <button onClick={() => camara.zoom(1 / 1.25)} aria-label="Alejar">
              −
            </button>
            <button onClick={() => camara.zoom(1.25)} aria-label="Acercar">
              +
            </button>
          </div>
          <label>
            <input type="checkbox" checked={camaraAuto} onChange={(e) => setCamaraAuto(e.target.checked)} /> Seguir las jugadas
          </label>
          <p className="me-camara-ayuda">Rueda para acercar · arrastra para mover</p>
          <button onClick={onMenu}>Volver al menú</button>
        </nav>
      </div>

      <div className="mano">
        {estado.mano.map((c, i) => {
          const jugable = c.clase === "cuerda" ? lineasConHueco(yo).length > 0 : objetivos(estado, 0, c.id).length > 0;
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
                ? "Elige a qué se la juegas (Esc para cancelar)"
                : "Juega una carta, cuelga una prenda de tu pila o acaba el día"}
        </p>
      </div>

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

function Tapete({
  jugador,
  perfil,
  datos,
  recien,
  esValido,
  onObjetivo,
  apuntada,
  manoRival,
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
  manoRival?: CartaMano[];
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
      <div className="mb-placa">
        <Animal id={perfil.animal} className="mb-animal" />
        <div className="mb-placa-nombre">{perfil.nombre}</div>
        <div className="mb-placa-puntos" data-puntos={jugador}>
          <b>{datos.puntos}</b>
          <span>puntos</span>
        </div>
        <div className="mb-secas" data-pila={`secas-${jugador}`} title="Prendas secas">
          {datos.secas.slice(-4).map((p, i) => (
            <CartaPrendaHumeda key={p.id} p={p} className="me-seca" style={{ "--i": i } as CSSProperties} />
          ))}
          <span>{datos.secas.length} secas</span>
        </div>
      </div>

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
