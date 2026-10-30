import { useSyncExternalStore } from "react";

// Sonido del juego: música de fondo, ambiente según el clima y efectos cortos. Todo va por Web Audio:
// los bucles empalman sin hueco y los efectos pueden solaparse. Los archivos están en ./sonidos (CC0;
// ver CREDITOS.md) y Vite los publica con la web, así que también se cargan con tendedero:// en escritorio.
//
//   volumenMusica()            // 0..100 (0 si está en silencio)
//   cambiarVolumen("efectos", 40)
//   reproducir("pinza")        // efecto corto
//   musica("menu")             // pista de fondo en bucle (null para quitarla), con fundido
//   ambiente("lluvia")         // fondo de clima en bucle (null para quitarlo), con fundido
//   silenciar(true)            // nada suena, sin perder los volúmenes
//
// Los navegadores no dejan sonar nada hasta que el usuario toca la página: hasta el primer clic o tecla no
// se crea el AudioContext. Lo que se pida antes (música, ambiente) se apunta y empieza en ese momento;
// los efectos de antes se descartan.

export type Canal = "musica" | "efectos";

/** Efectos con sonido. Los nombres desconocidos no suenan (y no fallan). */
export type Efecto =
  | "boton"
  | "robar"
  | "colocar"
  | "deslizar"
  | "carta"
  | "pinza"
  | "prenda"
  | "secar"
  | "punto"
  | "gota"
  | "fastidio"
  | "niHablar"
  | "turno"
  | "ultimaRonda"
  | "victoria"
  | "derrota"
  | "logro"
  | (string & {});
/** Pistas de música. */
export type Pista = "menu" | "partida" | "final" | (string & {});
/** Ambientes de clima. */
export type Clima = "lluvia" | "sol" | "viento" | "tormenta";

export interface EstadoAudio {
  musica: number;
  efectos: number;
  /** Silencio general: ni música ni efectos, sin perder los volúmenes elegidos. */
  silencio: boolean;
}

const CLAVES: Record<keyof EstadoAudio, string> = {
  musica: "tendedero-volumen-musica",
  efectos: "tendedero-volumen-efectos",
  silencio: "tendedero-silencio",
};

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}
function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento solo se pierde la preferencia al recargar.
  }
}

const recortar = (n: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
const numero = (t: string | null, porDefecto: number) => (t === null ? porDefecto : recortar(Number(t)));

let estado: EstadoAudio = {
  musica: numero(leer(CLAVES.musica), 30),
  efectos: numero(leer(CLAVES.efectos), 80),
  silencio: leer(CLAVES.silencio) === "si",
};
const avisar = new Set<() => void>();
const cambiar = (nuevo: EstadoAudio) => {
  estado = nuevo;
  aplicarVolumenes();
  avisar.forEach((f) => f());
};

/** Volumen de la música que de verdad sonaría (0 con silencio), de 0 a 100. */
export const volumenMusica = (): number => (estado.silencio ? 0 : estado.musica);
/** Volumen de los efectos que de verdad sonarían (0 con silencio), de 0 a 100. */
export const volumenEfectos = (): number => (estado.silencio ? 0 : estado.efectos);
export const estadoAudio = (): EstadoAudio => estado;

export function cambiarVolumen(canal: Canal, valor: number): void {
  const v = recortar(valor);
  guardar(CLAVES[canal], String(v));
  cambiar({ ...estado, [canal]: v });
}

export function silenciar(si: boolean): void {
  guardar(CLAVES.silencio, si ? "si" : "no");
  cambiar({ ...estado, silencio: si });
}

/** Para pintar los controles: se vuelve a pintar al cambiar cualquier volumen. */
export function useAudio(): EstadoAudio {
  return useSyncExternalStore(
    (f) => {
      avisar.add(f);
      return () => avisar.delete(f);
    },
    () => estado,
  );
}

// ---------------------------------------------------------------------------------------------------------
// Archivos

const URLS = import.meta.glob<string>("./sonidos/*.ogg", { eager: true, query: "?url", import: "default" });
const urlDe = (nombre: string): string | undefined => URLS[`./sonidos/${nombre}.ogg`];

/** Efecto → archivo, y cuánto suena respecto al volumen de efectos. */
const EFECTOS: Record<string, { archivo: string; volumen: number; variar?: boolean }> = {
  boton: { archivo: "boton", volumen: 0.5 },
  robar: { archivo: "robar", volumen: 0.8, variar: true },
  colocar: { archivo: "colocar", volumen: 0.8, variar: true },
  carta: { archivo: "colocar", volumen: 0.8, variar: true },
  deslizar: { archivo: "deslizar", volumen: 0.6, variar: true },
  pinza: { archivo: "pinza", volumen: 0.9, variar: true },
  prenda: { archivo: "pinza", volumen: 0.9, variar: true },
  secar: { archivo: "secar", volumen: 0.4, variar: true },
  punto: { archivo: "punto", volumen: 0.35, variar: true },
  gota: { archivo: "gota", volumen: 0.8, variar: true },
  fastidio: { archivo: "fastidio", volumen: 0.6 },
  niHablar: { archivo: "ni-hablar", volumen: 0.8 },
  turno: { archivo: "turno", volumen: 0.5 },
  ultimaRonda: { archivo: "ultima-ronda", volumen: 0.6 },
  victoria: { archivo: "victoria", volumen: 0.8 },
  derrota: { archivo: "derrota", volumen: 0.8 },
  logro: { archivo: "logro", volumen: 0.6 },
};
/** Los efectos que suenan, en orden, para la lista de prueba de Ajustes (sin los alias «carta» y «prenda»). */
export const LISTA_EFECTOS: Efecto[] = Object.keys(EFECTOS).filter((e) => e !== "carta" && e !== "prenda");

const PISTAS: Record<string, string> = { menu: "musica-menu", partida: "musica-partida", final: "musica-menu" };
const AMBIENTES: Record<Clima, { archivo: string; volumen: number }> = {
  lluvia: { archivo: "ambiente-lluvia", volumen: 0.28 },
  tormenta: { archivo: "ambiente-tormenta", volumen: 0.28 },
  sol: { archivo: "ambiente-sol", volumen: 0.22 },
  viento: { archivo: "ambiente-viento", volumen: 0.2 },
};

/** Qué ambiente pone el efecto de una carta de día (data/dia.json); null si no es de clima. */
export function climaDeCarta(efecto: string | null | undefined): Clima | null {
  switch (efecto) {
    case "lluvia":
      return "lluvia";
    case "tormenta-repentina":
      return "tormenta";
    case "soleado":
    case "ola-de-calor":
      return "sol";
    case "viento":
    case "viento-traicionero":
      return "viento";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------------------------------------
// Motor (Web Audio)

const FUNDIDO = 1.5; // segundos (música)
const FUNDIDO_AMBIENTE = 4; // el clima entra y sale despacio, sin que se note
const MAX_MUSICA = 0.5; // la música va por debajo de los efectos aunque esté al 100 %
const curva = (v: number) => (v / 100) ** 2; // el oído oye en escala logarítmica

interface Motor {
  ctx: AudioContext;
  maestro: GainNode;
  musica: GainNode;
  efectos: GainNode;
}
let motor: Motor | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function cargar(m: Motor, archivo: string): Promise<AudioBuffer | null> {
  let p = buffers.get(archivo);
  if (!p) {
    const url = urlDe(archivo);
    p = url
      ? fetch(url)
          .then((r) => r.arrayBuffer())
          .then((datos) => m.ctx.decodeAudioData(datos))
          .catch(() => null)
      : Promise.resolve(null);
    buffers.set(archivo, p);
  }
  return p;
}

function aplicarVolumenes() {
  if (!motor) return;
  const t = motor.ctx.currentTime;
  motor.maestro.gain.setTargetAtTime(estado.silencio ? 0 : 1, t, 0.05);
  motor.musica.gain.setTargetAtTime(curva(estado.musica) * MAX_MUSICA, t, 0.05);
  motor.efectos.gain.setTargetAtTime(curva(estado.efectos), t, 0.05);
}

function arrancar() {
  if (motor || typeof window === "undefined") return;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const maestro = ctx.createGain();
  maestro.connect(ctx.destination);
  const musica = ctx.createGain();
  musica.connect(maestro);
  const efectos = ctx.createGain();
  efectos.connect(maestro);
  motor = { ctx, maestro, musica, efectos };
  aplicarVolumenes();
  // Se cargan de antemano los efectos (son pequeños) para que el primero no llegue tarde.
  new Set(Object.values(EFECTOS).map((e) => e.archivo)).forEach((a) => void cargar(motor!, a));
  bucles.musica.sonar();
  bucles.ambiente.sonar();
}

// El primer gesto del usuario desbloquea el audio; si el navegador lo suspende después, otro gesto lo reanuda.
if (typeof window !== "undefined") {
  const desbloquear = () => {
    arrancar();
    if (motor?.ctx.state === "suspended") void motor.ctx.resume();
  };
  for (const ev of ["pointerdown", "keydown", "touchend"]) window.addEventListener(ev, desbloquear, { capture: true });
}

/** Un canal de fondo en bucle (música o ambiente): cambia de archivo con fundido cruzado. */
class Bucle {
  private archivo: string | null = null;
  private volumen = 1;
  private sonando: { archivo: string; fuente: AudioBufferSourceNode; gain: GainNode } | null = null;
  private turno = 0;

  constructor(
    private readonly salida: (m: Motor) => AudioNode,
    private readonly fundido = FUNDIDO,
  ) {}

  pedir(archivo: string | null, volumen = 1) {
    if (archivo === this.archivo && volumen === this.volumen) return;
    this.archivo = archivo;
    this.volumen = volumen;
    this.sonar();
  }

  get pedido() {
    return this.archivo;
  }

  sonar() {
    const m = motor;
    if (!m) return;
    const archivo = this.archivo;
    const turno = ++this.turno;
    if (this.sonando && this.sonando.archivo === archivo) {
      this.sonando.gain.gain.setTargetAtTime(this.volumen, m.ctx.currentTime, this.fundido / 4);
      return;
    }
    this.apagar(m);
    if (!archivo) return;
    void cargar(m, archivo).then((buffer) => {
      if (!buffer || turno !== this.turno) return; // se pidió otra cosa mientras cargaba
      const gain = m.ctx.createGain();
      gain.gain.value = 0;
      gain.connect(this.salida(m));
      const fuente = m.ctx.createBufferSource();
      fuente.buffer = buffer;
      fuente.loop = true;
      fuente.connect(gain);
      fuente.start();
      gain.gain.setTargetAtTime(this.volumen, m.ctx.currentTime, this.fundido / 4);
      this.sonando = { archivo, fuente, gain };
    });
  }

  private apagar(m: Motor) {
    const viejo = this.sonando;
    this.sonando = null;
    if (!viejo) return;
    const t = m.ctx.currentTime;
    viejo.gain.gain.setTargetAtTime(0, t, this.fundido / 4);
    viejo.fuente.stop(t + this.fundido * 1.5);
  }
}

const bucles = {
  musica: new Bucle((m) => m.musica),
  ambiente: new Bucle((m) => m.efectos, FUNDIDO_AMBIENTE),
};

let pistaActual: Pista | null = null;
let climaActual: Clima | null = null;
const ultimoEfecto = new Map<string, number>();

/** Efecto de sonido corto, con el volumen de efectos. No suena hasta el primer clic del usuario. */
export function reproducir(efecto: Efecto): void {
  const def = EFECTOS[efecto];
  const m = motor;
  if (!def || !m || volumenEfectos() === 0 || m.ctx.state !== "running") return;
  // Si se piden muchos a la vez (p. ej. varias cartas en la misma animación), basta con uno.
  const ahora = m.ctx.currentTime;
  if (ahora - (ultimoEfecto.get(def.archivo) ?? -1) < 0.06) return;
  ultimoEfecto.set(def.archivo, ahora);
  void cargar(m, def.archivo).then((buffer) => {
    if (!buffer || m.ctx.currentTime - ahora > 0.3) return; // si llega tarde, mejor callarse
    const gain = m.ctx.createGain();
    gain.gain.value = def.volumen;
    gain.connect(m.efectos);
    const fuente = m.ctx.createBufferSource();
    fuente.buffer = buffer;
    if (def.variar) fuente.playbackRate.value = 0.94 + Math.random() * 0.12;
    fuente.connect(gain);
    fuente.start();
  });
}

/** Cambia la música de fondo (null la quita), con fundido. Si aún no se ha tocado la página, espera al primer clic. */
export function musica(pista: Pista | null): void {
  pistaActual = pista;
  bucles.musica.pedir(pista ? (PISTAS[pista] ?? null) : null);
}

/** La pista que se ha pedido por última vez (aunque todavía no suene). */
export const pistaPedida = (): Pista | null => pistaActual;

/** Pone el ambiente de un clima en bucle (null lo quita), con fundido. Suena con el volumen de efectos. */
export function ambiente(clima: Clima | null): void {
  climaActual = clima;
  const def = clima ? AMBIENTES[clima] : null;
  bucles.ambiente.pedir(def?.archivo ?? null, def?.volumen ?? 1);
}

/** El clima que se ha pedido por última vez. */
export const climaPedido = (): Clima | null => climaActual;
