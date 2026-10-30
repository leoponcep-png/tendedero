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
  porQueNoVale,
  type Dificultad,
  type Jugada,
  type JugadaDe,
  type Partida,
} from "@tendedero/motor";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import { ambiente, climaDeCarta, musica, reproducir } from "../audio";
import { nombreVisible, t, useT } from "../i18n";
import { nombreCarta, nombreObjetivoId, nombrePrendaT, textoMotivo } from "../i18n/juego";
import { SelectorIdioma, tNodos } from "../i18n/react";
import { admisible, jugadaDe, necesitaDestino, type Arrastre, type Destino } from "../mesa/contexto";
import { Animal } from "../prototipos/Animales";
import { DefsBosque } from "../prototipos/ArteBosque";
import * as fx from "../prototipos/efectos";
import { useAjustarMesa } from "../prototipos/ajustar";
import type { Perfil } from "../prototipos/MenuPartida";
import { AvisoLogros } from "../prototipos/perfil/AvisoLogros";
import { registrarPartida } from "../prototipos/perfil/registro";
import { acabaElDia, animarJugada, despuesDe, olvidarVuelta, restaurar, volverVista, type Escena } from "./animar";
import { CartaAccion, CartaDeMano, CartaDiaJuego, CartaObjetivoJuego, CartaPrenda } from "./cartas";
import { ContextoJuego, type Juego } from "./contexto";
import { Lupa } from "./Lupa";
import { Mosaico, VentanaSecas } from "./Vistazos";
import { Mano, Mazos, MOJADAS_VISIBLES, Objetivos, PanelJugador, Registro, Reparto, Tapete } from "./piezas";
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
import { Ambiente } from "./Ambiente";
import "./ambiente.css";
import { usePresenciaPartida } from "../plataforma";

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
  /** Contra la IA: su nivel, para apuntarlo en el perfil. */
  dificultad?: Dificultad;
  /** Tutorial: solo se pueden hacer las jugadas que pasen este filtro (las demás ni se iluminan). */
  permitida?: (j: Jugada) => boolean;
  /** Tutorial: lo que se avisa al intentar una jugada que el filtro no deja. */
  avisoNoPermitida?: string;
  /** Tutorial: lo que se pinta por encima de la mesa (el foco y el bocadillo del guía). */
  encima?: ReactNode;
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
  // Cartas de mojar que se acaban de meter bajo una prenda (entran deslizándose por debajo).
  for (const [id, pr] of Object.entries(despues.prendas)) {
    const ahora = Math.min(pr.extra ?? 0, pr.humedad);
    const era = antes.prendas[id] ? Math.min(antes.prendas[id].extra ?? 0, antes.prendas[id].humedad) : 0;
    for (let k = era; k < Math.min(ahora, MOJADAS_VISIBLES); k++) nuevos.add(`moja:${id}:${k}`);
  }
  return nuevos;
}

/** Qué pulsar para completar una acción de dos pasos. */
function textoSegundoPaso(p: Partida, j: JugadaDe<"jugarAccion">): string {
  const o = j.objetivo!;
  const cuerda = nombreCarta(p, p.jugadores[o.jugador].lineas[o.linea].cartas[o.posicion].carta);
  switch (efectoAccion(p, j.carta)?.blanco) {
    case "cambiarPrendas":
      return t("mesa.paso.cambiarPrendas", { prenda: nombrePrendaT(p, o.prenda!) });
    case "cambiarCuerdas":
      return t("mesa.paso.cambiarCuerdas", { cuerda });
    case "moverCuerda":
      return t("mesa.paso.moverCuerda", { cuerda });
    default:
      return t("mesa.paso.mover", { prenda: nombrePrendaT(p, o.prenda!) });
  }
}

/** «sobre tu calcetín rojo» o «sobre tu Cuerda básica», según a qué apunte el fastidio. */
function textoObjetivoAtaque(p: Partida, j: Jugada): string {
  if (j.tipo === "colocarCuerda") return t("mesa.ataqueEnTendedero");
  if (j.tipo !== "jugarAccion" || !j.objetivo) return "";
  const o = j.objetivo;
  const blanco = efectoAccion(p, j.carta)?.blanco ?? "";
  if (o.prenda && /prenda|mover|cambiarPrendas/i.test(blanco)) return t("mesa.ataqueSobre", { cosa: nombrePrendaT(p, o.prenda) });
  const tendida = p.jugadores[o.jugador]?.lineas[o.linea]?.cartas[o.posicion];
  return tendida ? t("mesa.ataqueSobre", { cosa: nombreCarta(p, tendida.carta) }) : "";
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

export function MesaJuego({ partida, ultima, perfiles, miAsiento: yo, modo, onJugada, onSalir, onNueva, conexion, avisoExterno, onOcupado, codigoSala, dificultad, permitida, avisoNoPermitida, encima }: PropsMesaJuego) {
  const [mostrada, setMostrada] = useState(partida);
  const mostradaRef = useRef(partida);
  const cola = useRef<{ partida: Partida; jugada?: Jugada }[]>([]);
  const vistoN = useRef(ultima?.n ?? 0);
  const procesando = useRef(false);
  const [animando, setAnimando] = useState(false);
  const [recien, setRecien] = useState<Set<string>>(new Set());
  const [muestra, setMuestra] = useState<string | null>(null);
  // Lo que ven tus amigos de Steam: «Jugando, ronda N» (sin Steam no hace nada).
  usePresenciaPartida(partida.ronda, modo === "online", partida.terminada);

  const [sel, setSel] = useState<Arrastre | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [movimiento, setMovimiento] = useState<JugadaDe<"jugarAccion"> | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  useT();
  // Cómo se enseña cada jugador (el «Tú» por defecto, en el idioma elegido).
  const nombreDe = (j: number) => nombreVisible(perfiles[j]?.nombre ?? mostrada.jugadores[j]?.nombre ?? "");
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
  // El estilo de dibujo ya está decidido: siempre la fusión.
  const estilo = "fusion";
  const [menu, setMenu] = useState(false);
  const [registroAbierto, setRegistroAbierto] = useState(() => leer("tendedero-registro", "si") === "si");
  const [zoom, setZoom] = useState(1);
  // Ventana con las prendas secas de un jugador (al pulsar su ficha) y mosaico de todos los tendederos (mientras se mantiene).
  const [secasDe, setSecasDe] = useState<number | null>(null);
  const [vistazo, setVistazo] = useState(false);
  useEffect(() => {
    // Mantener Tab enseña todos los tendederos; al soltarla vuelve la vista normal.
    const fuera = (e: KeyboardEvent) => e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    const abajo = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || fuera(e)) return;
      e.preventDefault();
      setVistazo(true);
    };
    const arriba = (e: KeyboardEvent) => e.key === "Tab" && setVistazo(false);
    const soltar = () => setVistazo(false);
    window.addEventListener("keydown", abajo);
    window.addEventListener("keyup", arriba);
    window.addEventListener("blur", soltar);
    return () => {
      window.removeEventListener("keydown", abajo);
      window.removeEventListener("keyup", arriba);
      window.removeEventListener("blur", soltar);
    };
  }, []);

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
  // El clima de la carta del día, para el ambiente de la mesa.
  const efectoDia = p.dia ? defCarta(p, p.dia)?.efecto : null;
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
    async ensenar(jugador) {
      const nada = async () => {};
      if (!seguirRef.current || !animaciones || jugador === vistaRef.current) return nada;
      const antes = vistaRef.current;
      const turno = claveTurnoRef.current;
      flushSync(() => setVista(jugador));
      vistaRef.current = jugador;
      await fx.esperar(420);
      return async () => {
        if (claveTurnoRef.current !== turno) return;
        flushSync(() => setVista(antes));
        vistaRef.current = antes;
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
          // El fin del día cuenta el secado prenda a prenda: puede durar bastante más que una jugada normal.
          const largo = acabaElDia(antes, item.partida);
          await aTiempo(animarJugada(e, antes, item.jugada, item.partida), largo ? 45000 : 9000);
        }
        const nuevos = recienLlegados(antes, item.partida);
        flushSync(() => {
          mostradaRef.current = item.partida;
          setMostrada(item.partida);
          setRecien(nuevos);
        });
        restaurar();
        if (item.jugada && raiz.current) {
          // El recuento de objetivos y la carta del día nueva también llevan su tiempo.
          const largo = item.partida.terminada !== antes.terminada || item.partida.dia !== antes.dia || item.partida.ultimaRonda !== antes.ultimaRonda;
          await aTiempo(despuesDe(e, antes, item.partida).then(volverVista), largo ? 60000 : 9000);
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
  async function aTiempo(animacion: Promise<void>, limite = 9000) {
    let tarde = false;
    try {
      await Promise.race([animacion, new Promise<void>((r) => setTimeout(r, limite)).then(() => void (tarde = true))]);
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
    // Se apunta (y salen los logros) cuando acaba el recuento animado, no encima de él.
    if (!p.terminada || !p.final || registrado.current || animando || mostrada !== partida) return;
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
      ...(modo === "ia" && { dificultad: dificultad ?? "normal" }),
    });
    reproducir(mio?.puesto === 1 ? "victoria" : "derrota");
    setVerFinal(true);
  }, [p, yo, modo, animando, partida]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (quien === yo) reproducir("turno");
    vistaDelTurno.current = quien === yo || !seguirRef.current ? yo : quien;
    if (quien === yo || seguirRef.current) setVista(vistaDelTurno.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveTurno]);

  // Música de la partida y, de fondo, el clima de la carta del día. Al salir vuelve la del menú.
  const climaDia = p.terminada ? null : climaDeCarta(p.dia ? defCarta(p, p.dia)?.efecto : null);
  useEffect(() => {
    musica("partida");
    return () => {
      musica("menu");
      ambiente(null);
    };
  }, []);
  useEffect(() => ambiente(climaDia), [climaDia]);

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
    if (permitida && !permitida(j)) return setAviso(avisoNoPermitida ?? null);
    // Las acciones de mover e intercambiar piden el destino en un segundo paso.
    if (necesitaDestino(p, j)) {
      if (admisible(p, j)) {
        setMovimiento(j);
        setSel(null);
      } else setAviso(motivo(j));
      return;
    }
    setSel(null);
    setMovimiento(null);
    // El motivo que devuelve onJugada viene en castellano: se vuelve a sacar estructurado para enseñarlo traducido.
    const r = onJugada(j);
    setAviso(r && (motivo(j) ?? r));
  }

  /** Por qué no vale una jugada, en el idioma elegido. */
  function motivo(j: Jugada): string | null {
    const m = porQueNoVale(p, j);
    return m ? textoMotivo(m, { p, yo, nombre: nombreDe }) : null;
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
    else if (j) setAviso(motivo(j));
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
    permitida,
  };

  // ---------- Textos ----------

  function etiquetaTurno(j: number): string | null {
    if (p.terminada) return null;
    if (p.reaccion) return p.reaccion.defensor === j ? (j === yo ? t("mesa.turno.respondes") : t("mesa.turno.decidiendo")) : null;
    if (eligiendoObjetivo) return p.jugadores[j].objetivosOfrecidos.length ? t("mesa.turno.eligeObjetivo") : null;
    if (p.turno.jugador !== j) return null;
    if (enReparto) return j === yo ? t("mesa.turno.teTocaCoger") : t("mesa.turno.cogiendo");
    if (fase === "descartar") return t("mesa.turno.descartando");
    return j === yo ? t("mesa.turno.tuTurno") : t("mesa.turno.jugando");
  }

  const maxCuerdas = maxCuerdasRobadas(p);
  const cuerdasElegidas = Math.min(robarCuerdas ?? maxCuerdas, maxCuerdas);
  const totalRobo = p.ajustes.roboPorTurno.cartas;
  const { ajustes, turno } = p;

  let ayuda: ReactNode;
  let extra: ReactNode = null;
  if (p.terminada) ayuda = t("mesa.ayuda.terminada");
  else if (movimiento) ayuda = textoSegundoPaso(p, movimiento);
  else if (descartando) ayuda = t("mesa.ayuda.descartar", { n: p.jugadores[yo].mano.length, limite: ajustes.limiteMano });
  else if (sel?.tipo === "prenda") ayuda = t("mesa.ayuda.prenda");
  else if (sel?.tipo === "cuerda") ayuda = t("mesa.ayuda.cuerda");
  else if (sel?.tipo === "accion" && sinObjetivo(p, sel.carta)) {
    ayuda = t("mesa.ayuda.sinObjetivo", { carta: nombreCarta(p, sel.carta) });
    extra = (
      <button className="principal mj-jugar-ya" onClick={() => jugar({ tipo: "jugarAccion", jugador: yo, carta: sel.carta })}>
        {t("mesa.jugarla")}
      </button>
    );
  } else if (sel?.tipo === "accion") ayuda = t("mesa.ayuda.accion");
  else if (!libre) ayuda = "…";
  else if (eligiendoObjetivo) ayuda = tengoQueElegir ? t("mesa.ayuda.eligeObjetivo") : t("mesa.ayuda.esperandoObjetivos");
  else if (p.reaccion) ayuda = tengoQueResponder ? t("mesa.ayuda.anulas") : t("mesa.ayuda.esperandoAnula", { jugador: nombreDe(p.reaccion.defensor) });
  else if (enReparto) ayuda = miTurno ? (fase === "centro" ? t("mesa.ayuda.repartoCentro") : t("mesa.ayuda.repartoCesta")) : t("mesa.ayuda.repartoOtro", { jugador: nombreDe(turno.jugador) });
  else if (miTurno) ayuda = t("mesa.ayuda.tuTurno");
  else ayuda = t("mesa.ayuda.juegaOtro", { jugador: nombreDe(turno.jugador) });

  const arrastrada = arrastre ? (arrastre.tipo === "prenda" ? `prenda:${arrastre.prenda}` : `carta:${arrastre.carta}`) : null;
  const ataque = p.reaccion?.jugada;

  // Contadores del turno, elección de robo y botón de terminar: un bloque fijo con su propio sitio.
  const cajaTurno = (
    <div className="mj-turno-caja">
      {/* Bloque de robo: qué robas al terminar y lo que llevas jugado, con su propio marco. */}
      {!p.terminada && !enReparto && (
        <div className="mj-robo-bloque">
          {puedoJugar && (
            <div className="mj-robo" role="group" aria-label={t("mesa.queRobas")}>
              <span>{t("mesa.robar")}</span>
              {Array.from({ length: maxCuerdas + 1 }, (_, c) => (
                <button key={c} className={c === cuerdasElegidas ? "activa" : ""} onClick={() => setRobarCuerdas(c)} title={t("mesa.roboTitulo", { c, a: totalRobo - c })}>
                  {c}<i className="mj-ico cuerda" /> {totalRobo - c}<i className="mj-ico accion" />
                </button>
              ))}
            </div>
          )}
          <div className="mj-contadores" title={t("mesa.contadoresTitulo")}>
            {t("mesa.contadores", { c: turno.cuerdasJugadas, cmax: ajustes.jugablesPorTurno.cuerdas + turno.cuerdasExtra, a: turno.accionesJugadas, amax: ajustes.jugablesPorTurno.acciones })}
          </div>
        </div>
      )}
      <button
        className="principal mf-acabar mj-acabar"
        disabled={!puedoJugar || (permitida && !permitida({ tipo: "terminarTurno", jugador: yo, cuerdas: cuerdasElegidas }))}
        onClick={() => jugar({ tipo: "terminarTurno", jugador: yo, cuerdas: cuerdasElegidas })}
      >
        <span>{puedoJugar && cierraLaRonda(p, yo) ? t("mesa.terminarTurnoDia") : t("mesa.terminarTurno")}</span>
        <small>{puedoJugar ? t("mesa.robas", { c: cuerdasElegidas, a: totalRobo - cuerdasElegidas }) : p.terminada ? t("mesa.partidaTerminada") : t("mesa.noTuTurno")}</small>
      </button>
    </div>
  );

  return (
    <ContextoJuego.Provider value={juego}>
      <DndContext sensors={sensores} collisionDetection={colision} onDragStart={alEmpezar} onDragEnd={alSoltar} onDragCancel={() => setArrastre(null)}>
        <div
          ref={raiz}
          className={`proto mb me mf mj con-estilos estilo-${estilo} ${sel || arrastre || movimiento ? "apuntando" : ""} ${!libre ? "ocupado" : ""} ${animaciones ? "" : "sin-animaciones"}`}
          style={{ "--tamano": tamano } as CSSProperties}
          data-fondo={perfiles[yo]?.fondo ?? "madera"}
        >
          <DefsBosque />
          <div className="mj-escala">
            <div className={`mf-juego mj-juego ${registroAbierto ? "" : "sin-registro"}`}>
              <Ambiente efecto={efectoDia} animar={animaciones} capa="fondo" />
              <aside className="mf-jugadores mj-jugadores" aria-label={t("mesa.jugadores")}>
                <div className="mj-arriba">
                  <button className="mj-boton-menu" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                    {t("mesa.menu")}
                  </button>
                  {conexion}
                </div>
                {perfiles.map((pf, j) => (
                  <PanelJugador key={j} jugador={j} perfil={pf} turno={etiquetaTurno(j)} onVer={() => setSecasDe(j)} />
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
                <nav className="mf-pestanas" aria-label={t("mesa.tendederos")}>
                  {perfiles.map((pf, j) => (
                    <button key={j} className={`mf-pestana ${vista === j ? "activa" : ""}`} style={{ "--jugador": pf.color } as CSSProperties} onClick={() => verManual(j)}>
                      <Animal id={pf.animal} className="mf-pestana-animal" />
                      {j === yo ? t("mesa.tuTendedero") : t("mesa.tendederoDe", { nombre: nombreDe(j) })}
                    </button>
                  ))}
                  <button
                    className={`mj-vistazo ${vistazo ? "activa" : ""}`}
                    title={t("mesa.vistazoTitulo")}
                    onPointerDown={(e) => {
                      try {
                        // Así se suelta aunque el dedo o el ratón se salgan del botón.
                        e.currentTarget.setPointerCapture(e.pointerId);
                      } catch {
                        // Sin captura también vale: se suelta con pointerup.
                      }
                      setVistazo(true);
                    }}
                    onPointerUp={() => setVistazo(false)}
                    onPointerCancel={() => setVistazo(false)}
                    onLostPointerCapture={() => setVistazo(false)}
                    onKeyDown={(e) => e.key === " " && (e.preventDefault(), setVistazo(true))}
                    onKeyUp={(e) => e.key === " " && setVistazo(false)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {t("mesa.vistazo")}
                  </button>
                  <div className="mj-zoom" role="group" aria-label={t("mesa.acercarTendedero")}>
                    <button onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))} title={t("mesa.alejar")}>
                      −
                    </button>
                    <button onClick={() => setZoom(1)} title={t("mesa.ajustar")}>
                      {t("comun.porcentaje", { n: Math.round(zoom * 100) })}
                    </button>
                    <button onClick={() => setZoom((z) => Math.min(3, z * 1.2))} title={t("mesa.acercar")}>
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
                {vistazo && <Mosaico perfiles={perfiles} yo={yo} />}
                {(movimiento || p.ultimaRonda || aviso) && (
                  <div className="mj-bandas">
                    {p.ultimaRonda && !p.terminada && <div className="mj-banda ultima">{t("mesa.ultimaRondaBanda", { n: ajustes.umbralFinal })}</div>}
                    {movimiento && (
                      <div className="mj-banda paso">
                        {textoSegundoPaso(p, movimiento)}
                        <button onClick={() => setMovimiento(null)}>{t("comun.cancelar")}</button>
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
              <h3>{t("mesa.opciones")}</h3>
              <div className="mj-menu-fila">
                <SelectorIdioma />
              </div>
              <label>
                <input type="checkbox" checked={seguir} onChange={(e) => (setSeguir(e.target.checked), guardar("tendedero-seguir", e.target.checked ? "si" : "no"))} /> {t("mesa.opVerJugadas")}
              </label>
              <label>
                <input type="checkbox" checked={animaciones} onChange={(e) => (setAnimaciones(e.target.checked), guardar("tendedero-animaciones", e.target.checked ? "si" : "no"))} />{" "}
                {t("mesa.opAnimaciones")}
              </label>
              <label>
                <input type="checkbox" checked={conLupa} onChange={(e) => (setConLupa(e.target.checked), guardar("tendedero-lupa", e.target.checked ? "si" : "no"))} /> {t("mesa.opLupa")}
              </label>
              <div className="mj-menu-fila">
                <span>{t("mesa.opTamano")}</span>
                {TAMANOS.map((tm) => (
                  <button key={tm} className={tm === tamano ? "activa" : ""} onClick={() => (setTamano(tm), guardar("tendedero-tamano", String(tm)))}>
                    {t("comun.porcentaje", { n: Math.round(tm * 100) })}
                  </button>
                ))}
              </div>
              <div className="mj-menu-botones">
                <button onClick={() => setMenu(false)}>{t("comun.cerrar")}</button>
                <button onClick={onSalir}>{modo === "online" ? t("mesa.salirSala") : p.terminada ? t("mesa.volverMenu") : t("mesa.abandonar")}</button>
              </div>
            </div>
          )}

          {tengoQueElegir && (
            <div className="fondo-modal mj-modal-fondo">
              <div className="mj-modal">
                <h2>{t("mesa.eligeObjetivoTitulo")}</h2>
                <p>{t("mesa.eligeObjetivoTexto")}</p>
                <div className="mj-elegir-objetivo">
                  {p.jugadores[yo].objetivosOfrecidos.map((id) => (
                    <button key={id} className="mj-opcion-objetivo" onClick={() => jugar({ tipo: "elegirObjetivo", jugador: yo, objetivo: id })}>
                      <CartaObjetivoJuego p={p} id={id} secreto className="grande" />
                      <span className="principal">{t("mesa.quedarmelo")}</span>
                    </button>
                  ))}
                </div>
                <div className="mj-comunes">
                  <h3>{t("mesa.objetivosComunes")}</h3>
                  <Objetivos />
                </div>
              </div>
            </div>
          )}

          {tengoQueResponder && ataque && (
            <div className="fondo-modal mj-modal-fondo">
              <div className="mj-modal mj-reaccion">
                <h2>{t("mesa.teAtacan")}</h2>
                <div className="mj-reaccion-cartas">
                  <CartaAccion p={p} carta={ataque.carta} className="grande" />
                  <span className="mj-flecha">➜</span>
                  {(() => {
                    const r = cartaDeReaccion(p, yo);
                    return r ? <CartaAccion p={p} carta={r} className="grande" /> : null;
                  })()}
                </div>
                <p>
                  {(() => {
                    const objetivo = textoObjetivoAtaque(p, ataque);
                    const carta = <b>{nombreCarta(p, ataque.carta)}</b>;
                    return objetivo
                      ? tNodos("mesa.teJuegaSobre", { jugador: nombreDe(ataque.jugador), carta, objetivo })
                      : tNodos("mesa.teJuega", { jugador: nombreDe(ataque.jugador), carta });
                  })()}
                </p>
                <div className="mj-menu-botones">
                  <button disabled={permitida && !permitida({ tipo: "responder", jugador: yo, anular: false })} onClick={() => jugar({ tipo: "responder", jugador: yo, anular: false })}>
                    {t("mesa.noQuePase")}
                  </button>
                  <button className="principal" onClick={() => jugar({ tipo: "responder", jugador: yo, anular: true })}>
                    {t("mesa.niHablar")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {p.terminada && p.final && verFinal && libre && <Final p={p} perfiles={perfiles} yo={yo} onCerrar={() => setVerFinal(false)} onNueva={onNueva} />}
          {p.terminada && !verFinal && (
            <button className="principal mj-ver-final" onClick={() => setVerFinal(true)}>
              {t("mesa.verClasificacion")}
            </button>
          )}

          <div className="mj-muestra" data-muestra aria-hidden>
            {muestra && <CartaDeMano p={p} carta={muestra} />}
          </div>
          <AvisoLogros color={perfiles[yo]?.color} />
          {encima}
          {secasDe !== null && perfiles[secasDe] && <VentanaSecas p={p} jugador={secasDe} perfil={perfiles[secasDe]} yo={yo} onCerrar={() => setSecasDe(null)} />}
          <Lupa raiz={raiz} p={p} arrastrada={arrastrada} activa={conLupa} />
          <Ambiente efecto={efectoDia} animar={animaciones} capa="luz" />
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
  const nombreDe = (j: number) => nombreVisible(perfiles[j]?.nombre ?? p.jugadores[j]?.nombre ?? "");
  return (
    <div className="fondo-modal mj-modal-fondo">
      <div className="mj-modal mj-final">
        <h2>{gano ? t("final.ganaste") : t("final.fin")}</h2>
        <p className="nota">{primero === null
            ? t("final.sinRopa")
            : primero === yo
              ? t("final.llegastePrimero", { n: p.ajustes.umbralFinal })
              : t("final.llegoPrimero", { jugador: nombreDe(primero), n: p.ajustes.umbralFinal })}</p>
        <ol className="mj-clasificacion">
          {final.map((r) => {
            const pf = perfiles[r.jugador];
            return (
              <li key={r.jugador} className={`${r.puesto === 1 ? "ganador" : ""} ${r.jugador === yo ? "yo" : ""}`} style={{ "--jugador": pf?.color } as CSSProperties}>
                <span className="mj-puesto">{t("comun.ordinal", { n: r.puesto })}</span>
                <Animal id={pf?.animal ?? ""} className="mf-panel-animal" />
                <div className="mj-final-nombre">
                  <b>{nombreDe(r.jugador)}</b>
                  {r.jugador === primero && <small> {t(r.jugador === yo ? "final.llegastePrimeroCorto" : "final.llegoPrimeroCorto")}</small>}
                  <div className="mj-desglose">
                    <span>{t("final.ropaSeca", { n: r.puntosPartida })}</span>
                    {r.objetivos.map((o) => (
                      <span key={o.objetivo}>
                        {nombreObjetivoId(p, o.objetivo)}: {o.cantidad} → <b>+{o.puntos}</b>
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
          <button onClick={onCerrar}>{t("final.verMesa")}</button>
          <button className="principal" onClick={onNueva}>
            {t("final.nueva")}
          </button>
        </div>
      </div>
    </div>
  );
}

