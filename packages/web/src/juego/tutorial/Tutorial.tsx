// La partida tutorial «Aprender a jugar»: una partida de verdad (escenario.ts) que se juega en la mesa de siempre
// mientras un personaje del juego va explicando el guion de pasos.ts. Lleva la partida como ContraIA (tú en el
// asiento 0), pero la IA solo juega en los pasos de espera y la mesa solo deja hacer lo que pide cada paso.
// Se puede saltar (se guarda por dónde ibas) y retomar desde la portada o el menú de partida.

import { aplicar, vistaPara, type Datos, type Jugada, type Partida } from "@tendedero/motor";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { tLibre, useT } from "../../i18n";
import { Animal } from "../../prototipos/Animales";
import { leerConfig, type Perfil } from "../../prototipos/MenuPartida";
import { nombreAnimal } from "../../prototipos/perfil/catalogo";
import { actualizarLogros } from "../../prototipos/perfil/logros";
import { leerPartidas } from "../../prototipos/perfil/registro";
import { MesaJuego } from "../MesaJuego";
import { perfilesDe } from "../vista";
import { guiaTutorial, jugadaIA, partidaTutorial, quienJuegaIA, RIVAL, rivalTutorial, YO } from "./escenario";
import { PASOS, siguientePaso } from "./pasos";
import { borrarProgreso, guardarProgreso, leerProgreso, marcarHecho, marcarOfrecido } from "./progreso";
import "./tutorial.css";

interface Estado {
  partida: Partida;
  ultima: { jugada: Jugada; n: number } | null;
  /** Índice del paso en PASOS. */
  paso: number;
}

/** Tus datos del menú de partida, el rival del tutorial y el personaje que hace de guía (distinto de los dos). */
function personajes(): { yo: Perfil; rival: Partial<Perfil>; guia: string } {
  const yo = leerConfig().jugadores[0];
  const rival = rivalTutorial(yo.animal);
  const guia = guiaTutorial(yo.animal);
  return { yo: { ...yo, nombre: yo.nombre.trim() || tLibre("menu.tu") }, rival: { animal: rival }, guia };
}

export function TutorialPartida({ datos, onSalir }: { datos: Datos; onSalir: () => void }) {
  const t = useT();
  const quien = useMemo(personajes, []);
  const guardado = useMemo(leerProgreso, []);
  // Con un tutorial a medias, primero se pregunta si seguir o empezar de nuevo.
  const [preguntando, setPreguntando] = useState(!!guardado);
  const nuevo = (): Estado => ({ partida: partidaTutorial(datos, [quien.yo.nombre, tLibre("tutorial.rival")]), ultima: null, paso: 0 });
  const [estado, setEstado] = useState<Estado>(() => (guardado ? { partida: guardado.partida, ultima: null, paso: siguientePaso(guardado.partida, guardado.paso) } : nuevo()));
  const actual = useRef(estado);
  actual.current = estado;
  const [ocupada, setOcupada] = useState(false);
  /** La acción del paso ya está hecha: se pasa al siguiente en cuanto la mesa acaba de animarla. */
  const [hecho, setHecho] = useState(false);
  /** Tutorial acabado y la partida sigue: la IA juega como siempre y la mesa deja hacer de todo. */
  const [libre, setLibre] = useState(false);
  const [mesaN, setMesaN] = useState(0);

  const p = estado.partida;
  const paso = PASOS[Math.min(estado.paso, PASOS.length - 1)];
  const perfiles = useMemo(() => perfilesDe(p, YO, quien.yo, [undefined, quien.rival]), [p, quien]);

  useEffect(() => marcarOfrecido(), []);
  // Se guarda por dónde vas en cada cambio (hasta que lo acabas).
  useEffect(() => {
    if (!libre && paso.id !== "fin") guardarProgreso({ paso: estado.paso, partida: estado.partida });
  }, [estado.paso, estado.partida, libre, paso.id]);

  // Último paso: tutorial hecho y su logro.
  useEffect(() => {
    if (paso.id !== "fin" || preguntando) return;
    borrarProgreso();
    marcarHecho();
    actualizarLogros(leerPartidas());
  }, [paso.id, preguntando]);

  function jugar(j: Jugada): string | null {
    const antes = actual.current.partida;
    const r = aplicar(antes, j);
    if (!r.ok) return r.motivo;
    const pasoAhora = PASOS[actual.current.paso];
    const nuevoEstado = { ...actual.current, partida: r.partida, ultima: { jugada: j, n: (actual.current.ultima?.n ?? 0) + 1 } };
    actual.current = nuevoEstado;
    setEstado(nuevoEstado);
    if (!libre && j.jugador === YO && pasoAhora?.permitida?.(j, antes)) setHecho(true);
    return null;
  }

  // La IA juega en los pasos de espera (y siempre, cuando el tutorial ya ha acabado).
  useEffect(() => {
    if (ocupada || preguntando || (!libre && !paso.hasta)) return;
    const q = quienJuegaIA(p);
    if (q === null) return;
    const espera = setTimeout(() => {
      const ahora = actual.current.partida;
      const j = jugadaIA(ahora, q, !libre);
      if (!j || jugar(j)) {
        if (ahora.turno.jugador === q && ahora.turno.fase === "jugar") jugar({ tipo: "terminarTurno", jugador: q, cuerdas: 0 });
      }
    }, p.reaccion ? 900 : p.turno.fase === "jugar" ? 800 : 650);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, ocupada, preguntando, libre, paso]);

  // Pasar de paso: al hacer la acción o al cumplirse la espera, con la mesa quieta. El retraso deja que la mesa
  // empiece a animar lo último (si se pone a animar, se cancela y se espera a que acabe).
  useEffect(() => {
    if (ocupada || preguntando || libre) return;
    if (!hecho && !(paso.hasta && paso.hasta(p))) return;
    const espera = setTimeout(() => avanzar(), 450);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, ocupada, preguntando, libre, hecho]);

  function avanzar() {
    setHecho(false);
    const siguiente = siguientePaso(actual.current.partida, actual.current.paso + 1);
    const e = { ...actual.current, paso: Math.min(siguiente, PASOS.length - 1) };
    actual.current = e;
    setEstado(e);
  }

  function empezarDeNuevo() {
    const e = nuevo();
    actual.current = e;
    setEstado(e);
    setHecho(false);
    setOcupada(false);
    setMesaN((n) => n + 1);
    setPreguntando(false);
  }

  // Lo que deja hacer la mesa en este paso.
  const permitida = useCallback(
    (j: Jugada) => libre || (!preguntando && !hecho && !!paso.permitida && paso.permitida(j, actual.current.partida)),
    [libre, preguntando, hecho, paso],
  );

  const vista = useMemo(() => vistaPara(p, YO), [p]);

  // ---------- Bocadillo ----------
  const n = PASOS.length;
  let bocadillo: ReactNode = null;
  if (preguntando) {
    bocadillo = (
      <Bocadillo guia={quien.guia} titulo={t("tutorial.retomar.titulo")} texto={t("tutorial.retomar.texto")} centrado>
        <button className="tu-boton" onClick={empezarDeNuevo}>
          {t("tutorial.empezarDeNuevo")}
        </button>
        <button className="tu-boton principal" onClick={() => setPreguntando(false)}>
          {t("tutorial.seguir")}
        </button>
      </Bocadillo>
    );
  } else if (!libre) {
    const vars = { guia: nombreAnimal(quien.guia), rival: perfiles[RIVAL]?.nombre ?? "", ...(paso.datos?.(p) ?? {}) };
    const esFin = paso.id === "fin";
    const esAccion = !!paso.permitida;
    const esEspera = !!paso.hasta;
    bocadillo = (
      <Bocadillo
        guia={quien.guia}
        titulo={tLibre(`tutorial.${paso.id}.titulo`, vars)}
        texto={tLibre(`tutorial.${paso.id}.texto`, vars)}
        foco={esEspera || ocupada || hecho ? [] : (paso.foco?.(p) ?? []).filter((s): s is string => !!s)}
        centrado={paso.centrado}
        cuenta={esFin ? undefined : t("tutorial.cuenta", { i: estado.paso + 1, n })}
        onSaltar={esFin ? undefined : onSalir}
      >
        {esFin ? (
          <>
            <button className="tu-boton" onClick={onSalir}>
              {t("tutorial.volverMenu")}
            </button>
            <button className="tu-boton principal" onClick={() => setLibre(true)}>
              {t("tutorial.seguirJugando")}
            </button>
          </>
        ) : esAccion ? (
          <span className="tu-pista">{hecho ? t("tutorial.bien") : t("tutorial.teToca")}</span>
        ) : esEspera ? (
          <span className="tu-pista tu-esperando">{t("tutorial.esperando")}</span>
        ) : (
          <button className="tu-boton principal" onClick={avanzar} autoFocus>
            {t("tutorial.siguiente")}
          </button>
        )}
      </Bocadillo>
    );
  }

  return (
    <MesaJuego
      key={mesaN}
      partida={vista}
      ultima={estado.ultima}
      perfiles={perfiles}
      miAsiento={YO}
      modo="ia"
      dificultad="facil"
      onJugada={jugar}
      onOcupado={setOcupada}
      onSalir={onSalir}
      onNueva={onSalir}
      permitida={libre ? undefined : permitida}
      avisoNoPermitida={t("tutorial.ahoraNo")}
      encima={bocadillo}
    />
  );
}

// ---------- Foco y bocadillo ----------

interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MARGEN = 8;
const iguales = (a: Caja[], b: Caja[]) => a.length === b.length && a.every((c, i) => c.x === b[i].x && c.y === b[i].y && c.w === b[i].w && c.h === b[i].h);
const solapan = (a: Caja, b: Caja) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Las cajas en pantalla de lo que se resalta (cada selector puede dar varias), al día en cada fotograma. */
function useCajas(selectores: string[]): Caja[] {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const clave = selectores.join("|");
  useEffect(() => {
    let vivo = true;
    let ultimas: Caja[] | null = null;
    const medir = () => {
      if (!vivo) return;
      const nuevas: Caja[] = [];
      for (const s of selectores) {
        let lista: Element[] = [];
        try {
          lista = [...document.querySelectorAll(s)];
        } catch {
          // Un selector que este navegador no entiende: no se resalta.
        }
        for (const el of lista) {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          nuevas.push({ x: Math.round(r.left - MARGEN), y: Math.round(r.top - MARGEN), w: Math.round(r.width + 2 * MARGEN), h: Math.round(r.height + 2 * MARGEN) });
        }
      }
      // Las que se tocan (una cuerda y lo que cuelga de ella) se juntan en un solo hueco.
      for (let i = 0; i < nuevas.length; i++) {
        for (let k = i + 1; k < nuevas.length; k++) {
          if (!solapan(nuevas[i], nuevas[k])) continue;
          const a = nuevas[i];
          const b = nuevas[k];
          const x = Math.min(a.x, b.x);
          const y = Math.min(a.y, b.y);
          nuevas[i] = { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
          nuevas.splice(k, 1);
          k = i;
        }
      }
      if (!ultimas || !iguales(nuevas, ultimas)) {
        ultimas = nuevas;
        setCajas(nuevas);
      }
      requestAnimationFrame(medir);
    };
    medir();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return cajas;
}

/** Dónde poner el bocadillo para no tapar lo resaltado: el sitio libre más cerca de lo que se explica. */
function colocar(cajas: Caja[], w: number, h: number, centrado: boolean | undefined): { x: number; y: number } {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const m = 14;
  const centro = { x: (W - w) / 2, y: (H - h) / 2 };
  if (centrado || cajas.length === 0) return centro;
  const u = cajas.reduce((a, c) => {
    const x = Math.min(a.x, c.x);
    const y = Math.min(a.y, c.y);
    return { x, y, w: Math.max(a.x + a.w, c.x + c.w) - x, h: Math.max(a.y + a.h, c.y + c.h) - y };
  });
  const ux = u.x + u.w / 2 - w / 2;
  const uy = u.y + u.h / 2 - h / 2;
  const candidatos = [
    { x: ux, y: u.y + u.h + m },
    { x: ux, y: u.y - h - m },
    { x: u.x + u.w + m, y: uy },
    { x: u.x - w - m, y: uy },
    // Si no cabe junto a lo resaltado, en los bordes de la pantalla.
    ...[0.5, 0, 1].flatMap((fx) => [0, 1, 0.5].map((fy) => ({ x: m + fx * (W - w - 2 * m), y: m + fy * (H - h - 2 * m) }))),
  ].map((c) => ({ x: Math.max(m, Math.min(W - w - m, c.x)), y: Math.max(m, Math.min(H - h - m, c.y)) }));
  const libre = candidatos.find((c) => !cajas.some((k) => solapan({ ...c, w, h }, k)));
  if (libre) return libre;
  // Si todo está ocupado, donde menos tape.
  const tapado = (c: { x: number; y: number }) =>
    cajas.reduce((s, k) => s + Math.max(0, Math.min(c.x + w, k.x + k.w) - Math.max(c.x, k.x)) * Math.max(0, Math.min(c.y + h, k.y + k.h) - Math.max(c.y, k.y)), 0);
  return candidatos.reduce((a, b) => (tapado(b) < tapado(a) ? b : a));
}

function Bocadillo({
  guia,
  titulo,
  texto,
  foco = [],
  centrado,
  cuenta,
  onSaltar,
  children,
}: {
  guia: string;
  titulo: string;
  texto: string;
  foco?: string[];
  centrado?: boolean;
  cuenta?: string;
  onSaltar?: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  const cajas = useCajas(foco);
  const caja = useRef<HTMLDivElement>(null);
  const [sitio, setSitio] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const el = caja.current;
    if (!el) return;
    const poner = () => {
      const s = colocar(cajas, el.offsetWidth, el.offsetHeight, centrado);
      setSitio((a) => (a && Math.abs(a.x - s.x) < 1 && Math.abs(a.y - s.y) < 1 ? a : s));
    };
    poner();
    window.addEventListener("resize", poner);
    return () => window.removeEventListener("resize", poner);
  }, [cajas, centrado, titulo, texto]);

  const W = typeof window === "undefined" ? 0 : window.innerWidth;
  const H = typeof window === "undefined" ? 0 : window.innerHeight;
  return (
    <div className="tu-capa" data-sin-clic>
      {cajas.length > 0 && (
        <svg className="tu-foco" width={W} height={H} aria-hidden>
          <defs>
            <mask id="tu-agujeros">
              <rect width={W} height={H} fill="#fff" />
              {cajas.map((c, i) => (
                <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={14} fill="#000" />
              ))}
            </mask>
          </defs>
          <rect width={W} height={H} className="tu-sombra" mask="url(#tu-agujeros)" />
          {cajas.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={14} className="tu-anillo" />
          ))}
        </svg>
      )}
      <div
        ref={caja}
        className={`tu-bocadillo ${centrado ? "centrado" : ""}`}
        style={{ left: sitio?.x ?? -9999, top: sitio?.y ?? -9999, visibility: sitio ? "visible" : "hidden" } as CSSProperties}
        role="dialog"
        aria-live="polite"
        aria-label={titulo}
      >
        <div className="tu-guia" aria-hidden>
          <Animal id={guia} className="tu-guia-animal" />
        </div>
        <div className="tu-cuerpo">
          <h2>{titulo}</h2>
          <p>{texto}</p>
          <div className="tu-pie">
            {onSaltar && (
              <button className="tu-saltar" onClick={onSaltar} title={t("tutorial.saltarTitulo")}>
                {t("tutorial.saltar")}
              </button>
            )}
            {cuenta && <span className="tu-cuenta">{cuenta}</span>}
            <span className="tu-hueco" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
