// Mesa de juego con el aspecto de la mesa E: paneles de jugador a la izquierda, zona común arriba, el tendedero
// en grande con pestañas, el registro a la derecha y la mano abajo. Todo sale de una Partida del motor y cada
// jugada pasa por el motor (onJugada); la mesa solo anima: cuando llega una jugada (tuya, de la IA o de otro
// jugador online) la anima sobre la partida que se está viendo y después enseña la nueva.

import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import {
  cartaDeReaccion,
  cierraLaRonda,
  defCarta,
  efectoAccion,
  maxCuerdasRobadas,
  motivoInvalida,
  nombrePrenda,
  type Jugada,
  type JugadaDe,
  type Partida,
} from "@tendedero/motor";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import { admisible, jugadaDe, necesitaDestino, type Arrastre, type Destino } from "../mesa/contexto";
import { Animal } from "../prototipos/Animales";
import { DefsBosque } from "../prototipos/ArteBosque";
import * as fx from "../prototipos/efectos";
import { useAjustarMesa } from "../prototipos/ajustar";
import type { Perfil } from "../prototipos/MenuPartida";
import { ESTILOS } from "../prototipos/MesaBosque";
import { AvisoLogros } from "../prototipos/perfil/AvisoLogros";
import { registrarPartida } from "../prototipos/perfil/registro";
import { VERSIONES } from "../prototipos/Prototipos";
import { animarJugada, despuesDe, olvidarVuelta, restaurar, volverVista, type Escena } from "./animar";
import { CartaAccion, CartaDeMano, CartaDiaJuego, CartaObjetivoJuego, CartaPrenda } from "./cartas";
import { ContextoJuego, type Juego } from "./contexto";
import { Lupa } from "./Lupa";
import { Mano, Mazos, Objetivos, PanelJugador, Registro, Reparto, Tapete } from "./piezas";
import { sinObjetivo } from "./vista";
import "../prototipos/prototipos.css";
import "../prototipos/mesa-bosque.css";
import "../prototipos/estilos-dibujo.css";
import "../prototipos/taller.css";
import "../prototipos/mesa-final.css";
import "../prototipos/menu-partida.css";
import "../prototipos/mesa-hud.css";
import "./juego.css";
import "../prototipos/tapetes.css";

export interface PropsMesaJuego {
  /** La partida tal como la ve quien mira (online y contra la IA, ya pasada por vistaPara). */
  partida: Partida;
  /** La jugada que llevó a `partida` y su número de orden, para animarla antes de enseñarla. */
  ultima?: { jugada: Jugada; n: number } | null;
  perfiles: Perfil[];
  miAsiento: number;
  modo: "ia" | "online";
  /** Devuelve el motivo si la jugada no vale (online, el motivo llega después por `avisoExterno`). */
  onJugada: (j: Jugada) => string | null;
  onSalir: () => void;
  onNueva: () => void;
  conexion?: ReactNode;
  avisoExterno?: string | null;
  /** Avisa de cuándo la mesa está animando (la IA espera a que acabe para jugar). */
  onOcupado?: (ocupado: boolean) => void;
  /** Online: el código de la sala, para apuntarlo en el perfil. */
  codigoSala?: string;
}

function leer(clave: string, porDefecto: string): string {
  try {
    return localStorage.getItem(clave) ?? porDefecto;
  } catch {
    return porDefecto;
  }
}
function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento solo se pierde la preferencia al recargar.
  }
}

const TAMANOS = [0.9, 1, 1.15, 1.3];

/** Lo que acaba de aparecer en la mesa: cuerdas tendidas y prendas colgadas que antes no estaban. */
function recienLlegados(antes: Partida, despues: Partida): Set<string> {
  const habia = new Set<string>();
  for (const j of antes.jugadores) for (const l of j.lineas) for (const t of l.cartas) [t.carta, ...t.colgadas.map((c) => c.prenda)].forEach((x) => habia.add(x));
  const nuevos = new Set<string>();
  for (const j of despues.jugadores) for (const l of j.lineas) for (const t of l.cartas) [t.carta, ...t.colgadas.map((c) => c.prenda)].forEach((x) => !habia.has(x) && nuevos.add(x));
  return nuevos;
}

/** Qué pulsar para completar una acción de dos pasos. */
function textoSegundoPaso(p: Partida, j: JugadaDe<"jugarAccion">): string {
  const o = j.objetivo!;
  const cuerda = defCarta(p, p.jugadores[o.jugador].lineas[o.linea].cartas[o.posicion].carta).nombre;
  switch (efectoAccion(p, j.carta)?.blanco) {
    case "cambiarPrendas":
      return `Pulsa la prenda tuya con la que intercambiar la ${nombrePrenda(p, o.prenda!)}.`;
    case "cambiarCuerdas":
      return `Pulsa otra carta de cuerda tuya para intercambiar lo colgado con ${cuerda}.`;
    case "moverCuerda":
      return `Pulsa otra carta de cuerda tuya para cambiarlas de sitio, o un hueco libre para llevar ${cuerda} al final de esa línea.`;
    default:
      return `Pulsa el hueco al que mover la ${nombrePrenda(p, o.prenda!)}.`;
  }
}

/** «sobre tu calcetín rojo» o «sobre tu Cuerda básica», según a qué apunte el fastidio. */
function textoObjetivoAtaque(p: Partida, j: Jugada): string {
  if (j.tipo === "colocarCuerda") return " en tu tendedero";
  if (j.tipo !== "jugarAccion" || !j.objetivo) return "";
  const o = j.objetivo;
  const blanco = efectoAccion(p, j.carta)?.blanco ?? "";
  if (o.prenda && /prenda|mover|cambiarPrendas/i.test(blanco)) return ` sobre tu ${nombrePrenda(p, o.prenda)}`;
  const t = p.jugadores[o.jugador]?.lineas[o.linea]?.cartas[o.posicion];
  return t ? ` sobre tu ${defCarta(p, t.carta).nombre}` : "";
}

/** Escala el tendedero para que quepa en su sitio y deja acercarlo (rueda o botones) sin perder nitidez. */
function useEncuadre(lienzo: RefObject<HTMLElement | null>, marco: RefObject<HTMLElement | null>, contenido: RefObject<HTMLElement | null>, zoom: number) {
  useLayoutEffect(() => {
    const caja = lienzo.current;
    const m = marco.current;
    const c = contenido.current;
    if (!caja || !m || !c) return;
    const ajustar = () => {
      const est = getComputedStyle(caja);
      const ancho = caja.clientWidth - parseFloat(est.paddingLeft) - parseFloat(est.paddingRight);
      const alto = caja.clientHeight - parseFloat(est.paddingTop) - parseFloat(est.paddingBottom);
      const encaja = Math.min(1.6, ancho / c.offsetWidth, alto / c.offsetHeight);
      const s = Math.max(0.25, encaja * zoom);
      // Se escala con `scale` (sin will-change): el navegador lo vuelve a pintar nítido a cada tamaño.
      c.style.scale = String(s);
      m.style.width = `${c.offsetWidth * s}px`;
      m.style.height = `${c.offsetHeight * s}px`;
    };
    const obs = new ResizeObserver(ajustar);
    obs.observe(caja);
    obs.observe(c);
    ajustar();
    return () => obs.disconnect();
  }, [lienzo, marco, contenido, zoom]);
}

/** Soltar una acción sin objetivo en cualquier sitio del tendedero. */
function LienzoSoltar({ children, lienzo }: { children: ReactNode; lienzo: RefObject<HTMLDivElement | null> }) {
  const { setNodeRef } = useDroppable({ id: "mesa", data: { tipo: "mesa" } });
  return (
    <div
      className="mf-lienzo mj-lienzo"
      ref={(el) => {
        setNodeRef(el);
        lienzo.current = el;
      }}
    >
      {children}
    </div>
  );
}

// Primero lo más concreto (un hueco, una cuerda); el tendedero entero solo si no hay otra cosa debajo.
const colision: CollisionDetection = (args) => {
  const todas = pointerWithin(args);
  const concretas = todas.filter((c) => c.id !== "mesa");
  return concretas.length ? concretas : todas;
};

export function MesaJuego({ partida, ultima, perfiles, miAsiento: yo, modo, onJugada, onSalir, onNueva, conexion, avisoExterno, onOcupado, codigoSala }: PropsMesaJuego) {
  const [mostrada, setMostrada] = useState(partida);
  const mostradaRef = useRef(partida);
  const cola = useRef<{ partida: Partida; jugada?: Jugada }[]>([]);
  const vistoN = useRef(ultima?.n ?? 0);
  const procesando = useRef(false);
  const [animando, setAnimando] = useState(false);
  const [recien, setRecien] = useState<Set<string>>(new Set());
  const [muestra, setMuestra] = useState<string | null>(null);

  const [sel, setSel] = useState<Arrastre | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [movimiento, setMovimiento] = useState<JugadaDe<"jugarAccion"> | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [robarCuerdas, setRobarCuerdas] = useState<number | null>(null);
  const [verFinal, setVerFinal] = useState(true);

  const [vista, setVista] = useState(yo);
  const vistaRef = useRef(vista);
  // Si has elegido a mano qué tendedero ver durante el turno de otro, la mesa no te lo cambia hasta el siguiente turno.
  const manual = useRef(false);
  /** El tendedero que toca ver en este turno (el de quien juega, o el tuyo) y el turno al que corresponde. */
  const vistaDelTurno = useRef(yo);
  const claveTurnoRef = useRef("");
  vistaRef.current = vista;
  const [seguir, setSeguir] = useState(() => leer("tendedero-seguir", "si") === "si");
  const seguirRef = useRef(seguir);
  seguirRef.current = seguir;
  const [conLupa, setConLupa] = useState(() => leer("tendedero-lupa", "si") === "si");
  const [animaciones, setAnimaciones] = useState(() => leer("tendedero-animaciones", "si") === "si");
  const [tamano, setTamano] = useState(() => Number(leer("tendedero-tamano", "1")) || 1);
  const [estilo, setEstilo] = useState(() => leer("tendedero-estilo", "fusion"));
  const [menu, setMenu] = useState(false);
  const [registroAbierto, setRegistroAbierto] = useState(() => leer("tendedero-registro", "si") === "si");
  const [zoom, setZoom] = useState(1);

  const raiz = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement | null>(null);
  const marco = useRef<HTMLDivElement>(null);
  const tendedero = useRef<HTMLDivElement>(null);
  const zonaComun = useRef<HTMLDivElement>(null);
  const comun = useRef<HTMLDivElement>(null);
  const actor = useRef<number | null>(null);
  const fastidios = useRef({ jugados: 0, recibidos: 0 });
  const registrado = useRef(false);
  useEncuadre(lienzo, marco, tendedero, zoom);
  useAjustarMesa(zonaComun, comun, 1.15);

  const p = mostrada;
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // ---------- Cola de jugadas: se anima cada una sobre lo que se ve y luego se enseña la partida nueva ----------

  const escena: Escena = {
    raiz: raiz.current!,
    yo,
    perfiles,
    sinAnimar: !animaciones,
    async mirar(jugador) {
      // La vista ya está en el tendedero de quien tiene el turno; solo se va al afectado durante esta jugada
      // (un fastidio, una vieja) y luego vuelve al de quien juega. Tus jugadas se hacen donde estás mirando,
      // y si has cambiado de pestaña a mano durante este turno, se respeta.
      const nada = async () => {};
      if (!seguirRef.current || !animaciones || manual.current || jugador === vistaRef.current || actor.current === yo) return nada;
      const turno = claveTurnoRef.current;
      flushSync(() => setVista(jugador));
      await fx.esperar(450);
      return async () => {
        // Se vuelve al tendedero de quien tiene el turno ahora (no al de antes); si ya es otro turno o has
        // elegido otra pestaña, no se toca.
        if (manual.current || claveTurnoRef.current !== turno) return;
        flushSync(() => setVista(vistaDelTurno.current));
        await fx.esperar(250);
      };
    },
    muestra(carta) {
      flushSync(() => setMuestra(carta));
    },
  };
  const escenaRef = useRef(escena);
  escenaRef.current = escena;

  async function procesar() {
    if (procesando.current) return;
    procesando.current = true;
    let animo = false;
    try {
      while (cola.current.length) {
        const item = cola.current.shift()!;
        const antes = mostradaRef.current;
        const e = { ...escenaRef.current, raiz: raiz.current! };
        if (item.jugada && raiz.current) {
          if (!animo) {
            animo = true;
            setAnimando(true);
            onOcupado?.(true);
          }
          setSel(null);
          setMovimiento(null);
          actor.current = item.jugada.jugador;
          contarFastidio(antes, item.jugada);
          await aTiempo(animarJugada(e, antes, item.jugada, item.partida));
        }
        const nuevos = recienLlegados(antes, item.partida);
        flushSync(() => {
          mostradaRef.current = item.partida;
          setMostrada(item.partida);
          setRecien(nuevos);
        });
        restaurar();
        if (item.jugada && raiz.current) {
          await aTiempo(despuesDe(e, antes, item.partida).then(volverVista));
        }
        actor.current = null;
      }
    } finally {
      procesando.current = false;
      if (animo) {
        setAnimando(false);
        onOcupado?.(false);
      }
    }
  }

  /**
   * Una animación nunca puede dejar la mesa parada: si falla o tarda demasiado (p. ej. con la pestaña en segundo
   * plano el navegador no pinta y las animaciones no avanzan), se sigue y se limpia lo que quedara volando.
   */
  async function aTiempo(animacion: Promise<void>) {
    let tarde = false;
    try {
      await Promise.race([animacion, fx.esperar(9000).then(() => void (tarde = true))]);
    } catch (err) {
      console.error(err);
      tarde = true;
    }
    if (tarde) raiz.current?.querySelector(".capa-efectos")?.replaceChildren();
  }

  function verManual(j: number) {
    manual.current = true;
    setVista(j);
  }

  function contarFastidio(antes: Partida, j: Jugada) {
    if (j.tipo !== "jugarAccion" || !j.objetivo || j.objetivo.jugador === j.jugador) return;
    if (!efectoAccion(antes, j.carta)?.etiquetas.includes("fastidio")) return;
    if (j.jugador === yo) fastidios.current.jugados++;
    if (j.objetivo.jugador === yo) fastidios.current.recibidos++;
  }

  useEffect(() => {
    const jugada = ultima && ultima.n !== vistoN.current ? ultima.jugada : undefined;
    if (ultima) vistoN.current = ultima.n;
    cola.current.push({ partida, jugada });
    // Fuera del efecto: procesar usa flushSync, que no se puede llamar mientras React pinta.
    void Promise.resolve().then(procesar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida, ultima]);

  useEffect(() => {
    if (avisoExterno) setAviso(avisoExterno);
  }, [avisoExterno]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);
  useEffect(() => {
    if (recien.size === 0) return;
    const t = setTimeout(() => setRecien(new Set()), 1300);
    return () => clearTimeout(t);
  }, [recien]);

  // Al acabar la partida se apunta en el perfil (una sola vez).
  useEffect(() => {
    if (!p.terminada || !p.final || registrado.current) return;
    registrado.current = true;
    const mio = p.final.find((r) => r.jugador === yo);
    const secreto = p.jugadores[yo].objetivoSecreto;
    registrarPartida({
      fecha: new Date().toISOString(),
      jugadores: p.jugadores.length,
      contraIA: modo === "ia",
      online: modo === "online",
      puesto: mio?.puesto ?? p.jugadores.length,
      puntos: mio?.total ?? 0,
      puntosRivales: p.final.filter((r) => r.jugador !== yo).map((r) => r.total),
      rondas: p.ronda,
      prendasSecas: p.jugadores[yo].seca.length,
      fastidiosJugados: fastidios.current.jugados,
      fastidiosRecibidos: fastidios.current.recibidos,
      objetivoSecreto: secreto,
      objetivoSecretoCumplido: !!mio?.objetivos.some((o) => o.objetivo === secreto && o.puntos > 0),
      rivales: p.final.filter((r) => r.jugador !== yo).map((r) => perfiles[r.jugador]?.nombre ?? p.jugadores[r.jugador].nombre),
      animal: perfiles[yo]?.animal,
      codigoSala,
    });
    setVerFinal(true);
  }, [p, yo, modo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al empezar cada turno (o cada parte del reparto) la vista se fija en el tendedero de quien juega, y no se
  // mueve entre jugada y jugada; en tu turno vuelve al tuyo. Con «ver las jugadas» quitado solo vuelve al tuyo.
  const pendienteObjetivo = p.jugadores.some((j) => j.objetivosOfrecidos.length > 0);
  const claveTurno = p.terminada || pendienteObjetivo ? "quieta" : `${p.ronda}:${p.turno.numero}:${p.turno.fase === "jugar" || p.turno.fase === "descartar" ? "juego" : p.turno.fase}:${p.turno.jugador}`;
  claveTurnoRef.current = claveTurno;
  useEffect(() => {
    if (claveTurno === "quieta") return;
    manual.current = false;
    olvidarVuelta();
    const quien = p.turno.jugador;
    vistaDelTurno.current = quien === yo || !seguirRef.current ? yo : quien;
    if (quien === yo || seguirRef.current) setVista(vistaDelTurno.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveTurno]);

  // Esc cancela lo elegido o el segundo paso de una acción.
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      setSel(null);
      setMovimiento(null);
      setMenu(false);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  // Rueda del ratón sobre el tendedero: acercar y alejar (con Mayús se desplaza como siempre).
  useEffect(() => {
    const el = lienzo.current;
    if (!el) return;
    const rueda = (ev: WheelEvent) => {
      if (ev.shiftKey) return;
      ev.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.5, z * (ev.deltaY < 0 ? 1.1 : 1 / 1.1))));
    };
    el.addEventListener("wheel", rueda, { passive: false });
    return () => el.removeEventListener("wheel", rueda);
  }, []);

  // Arrastrar el fondo del tendedero lo desplaza cuando está acercado.
  function alPulsarLienzo(ev: React.PointerEvent<HTMLDivElement>) {
    const el = lienzo.current;
    if (!el || ev.button !== 0 || (ev.target as Element).closest("[data-lupa], .mj-ranura.activa, .mj-hueco.valido, button")) return;
    if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
    const x0 = ev.clientX + el.scrollLeft;
    const y0 = ev.clientY + el.scrollTop;
    const mover = (e: PointerEvent) => {
      el.scrollLeft = x0 - e.clientX;
      el.scrollTop = y0 - e.clientY;
    };
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  // ---------- Quién hace qué ----------

  // Libre: nada animándose y la partida que se ve es la última que ha llegado.
  const libre = !animando && mostrada === partida;
  const eligiendoObjetivo = p.jugadores.some((j) => j.objetivosOfrecidos.length > 0);
  const fase = p.turno.fase;
  const enReparto = fase === "cesta" || fase === "centro";
  const miTurno = p.turno.jugador === yo;
  const puedoJugar = libre && !p.terminada && !eligiendoObjetivo && !p.reaccion && miTurno && fase === "jugar";
  const tengoQueElegir = libre && !p.terminada && (p.jugadores[yo]?.objetivosOfrecidos.length ?? 0) > 0;
  const tengoQueResponder = libre && !p.terminada && p.reaccion?.defensor === yo;
  const descartando = libre && !p.terminada && !p.reaccion && miTurno && fase === "descartar";

  function jugar(j: Jugada) {
    if (!libre) return;
    // Las acciones de mover e intercambiar piden el destino en un segundo paso.
    if (necesitaDestino(p, j)) {
      if (admisible(p, j)) {
        setMovimiento(j);
        setSel(null);
      } else setAviso(motivoInvalida(p, j));
      return;
    }
    setSel(null);
    setMovimiento(null);
    setAviso(onJugada(j));
  }

  function elegir(a: Arrastre | null) {
    setMovimiento(null);
    setSel(a);
    // Al elegir algo, se enseña tu tendedero (las cuerdas y las prendas van ahí); un fastidio, en el de un rival.
    if (!a) return;
    if (a.tipo !== "accion") return setVista(yo);
    const blanco = efectoAccion(p, a.carta)?.blanco ?? "";
    if (blanco.endsWith("Rival") && vista === yo) setVista(p.jugadores.findIndex((_, i) => i !== yo));
    else if (blanco !== "ninguno" && !blanco.endsWith("Rival") && blanco !== "reaccion") setVista(yo);
  }

  function alEmpezar(e: DragStartEvent) {
    setMovimiento(null);
    setSel(null);
    setArrastre((e.active.data.current as Arrastre) ?? null);
  }

  function alSoltar(e: DragEndEvent) {
    const a = arrastre;
    setArrastre(null);
    if (!a || !e.over) return;
    const destino = e.over.data.current as Destino | { tipo: "mesa" };
    if (a.tipo === "accion" && sinObjetivo(p, a.carta)) return jugar({ tipo: "jugarAccion", jugador: yo, carta: a.carta });
    if (destino.tipo === "mesa") return;
    const j = jugadaDe(p, a, destino);
    if (j && admisible(p, j)) jugar(j);
    else if (j) setAviso(motivoInvalida(p, j));
  }

  const juego: Juego = {
    p,
    yo,
    perfiles,
    sel,
    arrastre,
    movimiento,
    puedoJugar,
    ocupado: !libre,
    recien,
    jugar,
    elegir,
    vista,
    verTendedero: verManual,
  };

  // ---------- Textos ----------

  function etiquetaTurno(j: number): string | null {
    if (p.terminada) return null;
    if (p.reaccion) return p.reaccion.defensor === j ? (j === yo ? "¿Respondes?" : "Decidiendo…") : null;
    if (eligiendoObjetivo) return p.jugadores[j].objetivosOfrecidos.length ? "Elige objetivo" : null;
    if (p.turno.jugador !== j) return null;
    if (enReparto) return j === yo ? "Te toca coger" : "Cogiendo prendas";
    if (fase === "descartar") return "Descartando";
    return j === yo ? "Tu turno" : "Jugando…";
  }

  const maxCuerdas = maxCuerdasRobadas(p);
  const cuerdasElegidas = Math.min(robarCuerdas ?? maxCuerdas, maxCuerdas);
  const totalRobo = p.ajustes.roboPorTurno.cartas;
  const { ajustes, turno } = p;

  let ayuda: ReactNode;
  let extra: ReactNode = null;
  if (p.terminada) ayuda = "La partida ha terminado";
  else if (movimiento) ayuda = textoSegundoPaso(p, movimiento);
  else if (descartando) ayuda = `Tienes ${p.jugadores[yo].mano.length} cartas: pulsa las que descartas hasta quedarte con ${ajustes.limiteMano}`;
  else if (sel?.tipo === "prenda") ayuda = "Pulsa un hueco libre de tus cuerdas (se ilumina al pasar por encima). Esc para cancelar";
  else if (sel?.tipo === "cuerda") ayuda = "Pulsa un hueco de una línea, o una cuerda básica o vieja tuya para mejorarla. Esc para cancelar";
  else if (sel?.tipo === "accion" && sinObjetivo(p, sel.carta)) {
    ayuda = `${defCarta(p, sel.carta).nombre}: se juega sin objetivo`;
    extra = (
      <button className="principal mj-jugar-ya" onClick={() => jugar({ tipo: "jugarAccion", jugador: yo, carta: sel.carta })}>
        Jugarla
      </button>
    );
  } else if (sel?.tipo === "accion") ayuda = "Pulsa su objetivo: cambia de tendedero con las pestañas. Esc para cancelar";
  else if (!libre) ayuda = "…";
  else if (eligiendoObjetivo) ayuda = tengoQueElegir ? "Elige tu objetivo secreto" : "Esperando a que los demás elijan su objetivo secreto";
  else if (p.reaccion) ayuda = tengoQueResponder ? "¿Anulas el fastidio?" : `Esperando a que ${perfiles[p.reaccion.defensor]?.nombre} decida si lo anula`;
  else if (enReparto) ayuda = miTurno ? (fase === "centro" ? "Reparto: abre el centro y elige color o tipo" : "Reparto: abre una cesta de arriba y elige color o tipo") : `Reparto: le toca a ${perfiles[turno.jugador]?.nombre}`;
  else if (miTurno) ayuda = "Arrastra (o pulsa) cartas y prendas; al acabar, termina el turno";
  else ayuda = `Juega ${perfiles[turno.jugador]?.nombre}…`;

  const arrastrada = arrastre ? (arrastre.tipo === "prenda" ? `prenda:${arrastre.prenda}` : `carta:${arrastre.carta}`) : null;
  const ataque = p.reaccion?.jugada;

  // Contadores del turno, elección de robo y botón de terminar: un bloque fijo con su propio sitio.
  const cajaTurno = (
    <div className="mj-turno-caja">
      {/* Bloque de robo: qué robas al terminar y lo que llevas jugado, con su propio marco. */}
      {!p.terminada && !enReparto && (
        <div className="mj-robo-bloque">
          {puedoJugar && (
            <div className="mj-robo" role="group" aria-label="Qué robas al terminar">
              <span>Robar:</span>
              {Array.from({ length: maxCuerdas + 1 }, (_, c) => (
                <button key={c} className={c === cuerdasElegidas ? "activa" : ""} onClick={() => setRobarCuerdas(c)} title={`${c} de cuerda y ${totalRobo - c} de acción`}>
                  {c}<i className="mj-ico cuerda" /> {totalRobo - c}<i className="mj-ico accion" />
                </button>
              ))}
            </div>
          )}
          <div className="mj-contadores" title="Lo que llevas jugado en este turno">
            cuerdas {turno.cuerdasJugadas}/{ajustes.jugablesPorTurno.cuerdas + turno.cuerdasExtra} · acciones {turno.accionesJugadas}/{ajustes.jugablesPorTurno.acciones}
          </div>
        </div>
      )}
      <button
        className="principal mf-acabar mj-acabar"
        disabled={!puedoJugar}
        onClick={() => jugar({ tipo: "terminarTurno", jugador: yo, cuerdas: cuerdasElegidas })}
      >
        <span>{puedoJugar && cierraLaRonda(p, yo) ? "Terminar turno y el día" : "Terminar turno"}</span>
        <small>{puedoJugar ? `robas ${cuerdasElegidas} de cuerda y ${totalRobo - cuerdasElegidas} de acción` : p.terminada ? "partida terminada" : "no es tu turno"}</small>
      </button>
    </div>
  );

  return (
    <ContextoJuego.Provider value={juego}>
      <DndContext sensors={sensores} collisionDetection={colision} onDragStart={alEmpezar} onDragEnd={alSoltar} onDragCancel={() => setArrastre(null)}>
        <div
          ref={raiz}
          className={`proto mb me mf mj con-estilos estilo-${estilo} ${sel || arrastre || movimiento ? "apuntando" : ""} ${!libre ? "ocupado" : ""}`}
          style={{ "--tamano": tamano } as CSSProperties}
        >
          <DefsBosque />
          <div className="mj-escala">
            <div className={`mf-juego mj-juego ${registroAbierto ? "" : "sin-registro"}`}>
              <aside className="mf-jugadores mj-jugadores" aria-label="Jugadores">
                <div className="mj-arriba">
                  <button className="mj-boton-menu" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                    ☰ Menú
                  </button>
                  {conexion}
                </div>
                {perfiles.map((pf, j) => (
                  <PanelJugador key={j} jugador={j} perfil={pf} turno={etiquetaTurno(j)} onVer={() => verManual(j)} />
                ))}
              </aside>

              <section className="mf-comun" ref={zonaComun}>
                <div className="mf-comun-contenido" ref={comun}>
                  <Reparto />
                  <Mazos />
                  {/* A la derecha del descarte: la carta del día y los objetivos (comunes y tu secreto). */}
                  <CartaDiaJuego p={p} carta={p.dia} />
                  <Objetivos />
                </div>
              </section>

              <section className="mf-vista">
                <nav className="mf-pestanas" aria-label="Tendederos">
                  {perfiles.map((pf, j) => (
                    <button key={j} className={`mf-pestana ${vista === j ? "activa" : ""}`} style={{ "--jugador": pf.color } as CSSProperties} onClick={() => verManual(j)}>
                      <Animal id={pf.animal} className="mf-pestana-animal" />
                      {j === yo ? "Tu tendedero" : `Tendedero de ${pf.nombre}`}
                    </button>
                  ))}
                  <div className="mj-zoom" role="group" aria-label="Acercar el tendedero">
                    <button onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))} title="Alejar">
                      −
                    </button>
                    <button onClick={() => setZoom(1)} title="Ajustar al hueco">
                      {Math.round(zoom * 100)} %
                    </button>
                    <button onClick={() => setZoom((z) => Math.min(3, z * 1.2))} title="Acercar">
                      +
                    </button>
                  </div>
                </nav>
                <LienzoSoltar lienzo={lienzo}>
                  <div className="mj-desplazable" onPointerDown={alPulsarLienzo}>
                    <div className="mj-marco" ref={marco}>
                      <div className="mf-tendedero mj-tendedero" ref={tendedero}>
                        <Tapete jugador={vista} perfil={perfiles[vista]} />
                      </div>
                    </div>
                  </div>
                </LienzoSoltar>
                {(movimiento || p.ultimaRonda || aviso) && (
                  <div className="mj-bandas">
                    {p.ultimaRonda && !p.terminada && <div className="mj-banda ultima">Última ronda: alguien ha llegado a {ajustes.umbralFinal} puntos</div>}
                    {movimiento && (
                      <div className="mj-banda paso">
                        {textoSegundoPaso(p, movimiento)}
                        <button onClick={() => setMovimiento(null)}>Cancelar</button>
                      </div>
                    )}
                    {aviso && <div className="mj-banda aviso">{aviso}</div>}
                  </div>
                )}
              </section>

              <div className={`mj-derecha ${registroAbierto ? "" : "plegada"}`}>
                <Registro abierto={registroAbierto} onAbrir={(si) => (setRegistroAbierto(si), guardar("tendedero-registro", si ? "si" : "no"))} />
                {/* Debajo del registro, en su misma columna: contadores, robo y terminar turno (no tapan nada). */}
                {cajaTurno}
              </div>
            </div>

            <Mano ayuda={ayuda} extra={extra} />

          </div>

          {menu && (
            <div className="mj-menu" onPointerDown={(e) => e.stopPropagation()}>
              <h3>Opciones</h3>
              <label>
                <input type="checkbox" checked={seguir} onChange={(e) => (setSeguir(e.target.checked), guardar("tendedero-seguir", e.target.checked ? "si" : "no"))} /> Ver las jugadas de los
                rivales
              </label>
              <label>
                <input type="checkbox" checked={animaciones} onChange={(e) => (setAnimaciones(e.target.checked), guardar("tendedero-animaciones", e.target.checked ? "si" : "no"))} />{" "}
                Animaciones (sin ellas la mesa cambia de golpe)
              </label>
              <label>
                <input type="checkbox" checked={conLupa} onChange={(e) => (setConLupa(e.target.checked), guardar("tendedero-lupa", e.target.checked ? "si" : "no"))} /> Lupa de carta al pasar
                el ratón
              </label>
              <div className="mj-menu-fila">
                <span>Tamaño de la interfaz</span>
                {TAMANOS.map((t) => (
                  <button key={t} className={t === tamano ? "activa" : ""} onClick={() => (setTamano(t), guardar("tendedero-tamano", String(t)))}>
                    {Math.round(t * 100)} %
                  </button>
                ))}
              </div>
              <div className="mj-menu-fila">
                <span>Estilo de dibujo</span>
                {ESTILOS.map((e) => (
                  <button key={e.id} className={e.id === estilo ? "activa" : ""} onClick={() => (setEstilo(e.id), guardar("tendedero-estilo", e.id))}>
                    {e.nombre}
                  </button>
                ))}
              </div>
              <div className="mj-menu-fila">
                <span>Prototipos</span>
                {VERSIONES.map((v) => (
                  <a key={v.id} href={`#/prototipos/${v.id}`}>
                    {v.id.toUpperCase()} · {v.nombre}
                  </a>
                ))}
              </div>
              <div className="mj-menu-botones">
                <button onClick={() => setMenu(false)}>Cerrar</button>
                <button onClick={onSalir}>{modo === "online" ? "Salir de la sala" : p.terminada ? "Volver al menú" : "Abandonar y volver al menú"}</button>
              </div>
            </div>
          )}

          {tengoQueElegir && (
            <div className="fondo-modal mj-modal-fondo">
              <div className="mj-modal">
                <h2>Elige tu objetivo secreto</h2>
                <p>Te quedas uno; el otro vuelve a la caja. Al final da puntos según lo que hayas conseguido.</p>
                <div className="mj-elegir-objetivo">
                  {p.jugadores[yo].objetivosOfrecidos.map((id) => (
                    <button key={id} className="mj-opcion-objetivo" onClick={() => jugar({ tipo: "elegirObjetivo", jugador: yo, objetivo: id })}>
                      <CartaObjetivoJuego p={p} id={id} secreto className="grande" />
                      <span className="principal">Quedármelo</span>
                    </button>
                  ))}
                </div>
                <div className="mj-comunes">
                  <h3>Objetivos comunes de esta partida</h3>
                  <Objetivos />
                </div>
              </div>
            </div>
          )}

          {tengoQueResponder && ataque && (
            <div className="fondo-modal mj-modal-fondo">
              <div className="mj-modal mj-reaccion">
                <h2>¡Te atacan!</h2>
                <div className="mj-reaccion-cartas">
                  <CartaAccion p={p} carta={ataque.carta} className="grande" />
                  <span className="mj-flecha">➜</span>
                  {(() => {
                    const r = cartaDeReaccion(p, yo);
                    return r ? <CartaAccion p={p} carta={r} className="grande" /> : null;
                  })()}
                </div>
                <p>
                  {perfiles[ataque.jugador]?.nombre} te juega <b>{defCarta(p, ataque.carta).nombre}</b>
                  {textoObjetivoAtaque(p, ataque)}. ¿Lo anulas con tu
                  «¡Ni hablar!»?
                </p>
                <div className="mj-menu-botones">
                  <button onClick={() => jugar({ tipo: "responder", jugador: yo, anular: false })}>No, que pase</button>
                  <button className="principal" onClick={() => jugar({ tipo: "responder", jugador: yo, anular: true })}>
                    ¡Ni hablar!
                  </button>
                </div>
              </div>
            </div>
          )}

          {p.terminada && p.final && verFinal && libre && <Final p={p} perfiles={perfiles} yo={yo} onCerrar={() => setVerFinal(false)} onNueva={onNueva} />}
          {p.terminada && !verFinal && (
            <button className="principal mj-ver-final" onClick={() => setVerFinal(true)}>
              Ver la clasificación
            </button>
          )}

          <div className="mj-muestra" data-muestra aria-hidden>
            {muestra && <CartaDeMano p={p} carta={muestra} />}
          </div>
          <AvisoLogros color={perfiles[yo]?.color} />
          <Lupa raiz={raiz} p={p} arrastrada={arrastrada} activa={conLupa} />
          <div className="capa-efectos" ref={fx.usarCapa} />
        </div>

        <DragOverlay dropAnimation={null}>
          {arrastre?.tipo === "prenda" && <CartaPrenda p={p} prenda={arrastre.prenda} className="mj-arrastrada-prenda" />}
          {arrastre && arrastre.tipo !== "prenda" && <CartaDeMano p={p} carta={arrastre.carta} className="mj-arrastrada" />}
        </DragOverlay>
      </DndContext>
    </ContextoJuego.Provider>
  );
}

/** Clasificación tras el recuento de objetivos, con el desglose de cada uno. */
function Final({ p, perfiles, yo, onCerrar, onNueva }: { p: Partida; perfiles: Perfil[]; yo: number; onCerrar: () => void; onNueva: () => void }) {
  const final = p.final!;
  const primero = p.primeroEnLlegar;
  const gano = final.find((r) => r.jugador === yo)?.puesto === 1;
  return (
    <div className="fondo-modal mj-modal-fondo">
      <div className="mj-modal mj-final">
        <h2>{gano ? "¡Has ganado!" : "Fin de la partida"}</h2>
        <p className="nota">
          {primero !== null
            ? `${perfiles[primero]?.nombre} llegó primero a ${p.ajustes.umbralFinal} puntos; se terminó la ronda y se contaron los objetivos.`
            : "Se acabó la ropa antes de que nadie llegara al final; se terminó la ronda y se contaron los objetivos."}
        </p>
        <ol className="mj-clasificacion">
          {final.map((r) => {
            const pf = perfiles[r.jugador];
            return (
              <li key={r.jugador} className={`${r.puesto === 1 ? "ganador" : ""} ${r.jugador === yo ? "yo" : ""}`} style={{ "--jugador": pf?.color } as CSSProperties}>
                <span className="mj-puesto">{r.puesto}.º</span>
                <Animal id={pf?.animal ?? ""} className="mf-panel-animal" />
                <div className="mj-final-nombre">
                  <b>{pf?.nombre}</b>
                  {r.jugador === primero && <small> llegó primero</small>}
                  <div className="mj-desglose">
                    <span>Ropa seca: {r.puntosPartida}</span>
                    {r.objetivos.map((o) => (
                      <span key={o.objetivo}>
                        {o.nombre}: {o.cantidad} → <b>+{o.puntos}</b>
                      </span>
                    ))}
                  </div>
                </div>
                <span className="mj-total">{r.total}</span>
              </li>
            );
          })}
        </ol>
        <div className="mj-menu-botones">
          <button onClick={onCerrar}>Ver la mesa</button>
          <button className="principal" onClick={onNueva}>
            Nueva partida
          </button>
        </div>
      </div>
    </div>
  );
}

