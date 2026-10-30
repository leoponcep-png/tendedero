import { useEffect, useState } from "react";
import { cambiarVolumen, LISTA_EFECTOS, reproducir, silenciar, useAudio, type Canal } from "../audio";
import { useT } from "../i18n";
import { SelectorIdioma } from "../i18n/react";
import { esEscritorio, ponerPantallaCompleta, usePantallaCompleta } from "../escritorio";
import { CLAVE_VELOCIDAD, leerVelocidad, type Velocidad } from "./efectos";

// Ventana de ajustes del juego: idioma, sonido, pantalla completa y las opciones de la mesa (las mismas que
// el menú de opciones de la partida, guardadas con las mismas claves para que la mesa las lea al abrirse).

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

/** «Velocidad de las animaciones»: multiplica todas las duraciones y pausas de la mesa (prototipos/efectos.ts). */
const VELOCIDADES: Velocidad[] = ["rapida", "normal", "lenta"];

/** Los mismos tamaños que el menú de opciones de la mesa (juego/MesaJuego.tsx). */
const TAMANOS = [0.9, 1, 1.15, 1.3];

/** Nombres de los efectos para la lista de prueba (de momento solo en castellano: es para elegir sonidos). */
const NOMBRES_EFECTOS: Record<string, string> = {
  boton: "Botón",
  robar: "Robar carta",
  colocar: "Colocar carta",
  deslizar: "Deslizar",
  pinza: "Pinza",
  secar: "Secar",
  punto: "Punto",
  gota: "Gota",
  fastidio: "Fastidio",
  niHablar: "¡Ni hablar!",
  turno: "Tu turno",
  ultimaRonda: "Última ronda",
  victoria: "Victoria",
  derrota: "Derrota",
  logro: "Logro",
};

/** Casilla de sí o no guardada en localStorage con «si»/«no» (como las opciones de la mesa). */
function Interruptor({ clave, texto }: { clave: string; texto: string }) {
  const [si, setSi] = useState(() => leer(clave, "si") === "si");
  return (
    <label className="aj-interruptor">
      <input
        type="checkbox"
        checked={si}
        onChange={(e) => {
          setSi(e.target.checked);
          guardar(clave, e.target.checked ? "si" : "no");
        }}
      />
      <span className="aj-palanca" aria-hidden />
      <span>{texto}</span>
    </label>
  );
}

function Volumen({ canal, texto, valor, apagado }: { canal: Canal; texto: string; valor: number; apagado: boolean }) {
  return (
    <label className={`aj-volumen ${apagado ? "apagado" : ""}`}>
      <span>{texto}</span>
      <input type="range" min={0} max={100} step={5} value={valor} onChange={(e) => cambiarVolumen(canal, Number(e.target.value))} aria-valuetext={`${valor} %`} />
      <output>{valor}</output>
    </label>
  );
}

export function VentanaAjustes({ onCerrar }: { onCerrar: () => void }) {
  const t = useT();
  const audio = useAudio();
  const completa = usePantallaCompleta();
  const [tamano, setTamano] = useState(() => Number(leer("tendedero-tamano", "1")) || 1);
  const [velocidad, setVelocidad] = useState<Velocidad>(leerVelocidad);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div className="aj-fondo" onPointerDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <section className="aj-ventana menu-tarjeta" role="dialog" aria-modal="true" aria-labelledby="aj-titulo">
        <header className="aj-cabeza">
          <h2 id="aj-titulo">{t("ajustes.titulo")}</h2>
          <button className="pt-redondo" onClick={onCerrar} aria-label={t("comun.cerrar")} title={t("comun.cerrar")}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="aj-cuerpo">
          <section className="aj-grupo">
            <h3>{t("idioma.titulo")}</h3>
            <SelectorIdioma compacto className="aj-idioma" />
          </section>

          <section className="aj-grupo">
            <h3>{t("ajustes.sonido")}</h3>
            <Volumen canal="musica" texto={t("ajustes.musica")} valor={audio.musica} apagado={audio.silencio} />
            <Volumen canal="efectos" texto={t("ajustes.efectos")} valor={audio.efectos} apagado={audio.silencio} />
            <label className="aj-interruptor">
              <input type="checkbox" checked={audio.silencio} onChange={(e) => silenciar(e.target.checked)} />
              <span className="aj-palanca" aria-hidden />
              <span>{t("ajustes.silencio")}</span>
            </label>
            <details className="aj-probar">
              <summary>Probar efectos</summary>
              <div className="aj-opciones" style={{ flexWrap: "wrap" }}>
                {LISTA_EFECTOS.map((ef) => (
                  <button key={ef} data-sin-clic onClick={() => reproducir(ef)}>
                    ▶ {NOMBRES_EFECTOS[ef] ?? ef}
                  </button>
                ))}
              </div>
            </details>
          </section>

          <section className="aj-grupo">
            <h3>{t("ajustes.pantalla")}</h3>
            <label className="aj-interruptor">
              <input type="checkbox" checked={completa} onChange={(e) => void ponerPantallaCompleta(e.target.checked)} />
              <span className="aj-palanca" aria-hidden />
              <span>{t("ajustes.pantallaCompleta")}</span>
            </label>
            {esEscritorio() && <p className="aj-nota">{t("ajustes.pantallaCompletaF11")}</p>}
            <div className="aj-fila">
              <span>{t("mesa.opTamano")}</span>
              <div className="aj-opciones" role="group" aria-label={t("mesa.opTamano")}>
                {TAMANOS.map((tm) => (
                  <button
                    key={tm}
                    className={tm === tamano ? "activa" : ""}
                    aria-pressed={tm === tamano}
                    onClick={() => {
                      setTamano(tm);
                      guardar("tendedero-tamano", String(tm));
                    }}
                  >
                    {t("comun.porcentaje", { n: Math.round(tm * 100) })}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="aj-grupo">
            <h3>{t("ajustes.mesa")}</h3>
            <Interruptor clave="tendedero-animaciones" texto={t("mesa.opAnimaciones")} />
            <div className="aj-fila">
              <span>{t("ajustes.velocidad")}</span>
              <div className="aj-opciones" role="group" aria-label={t("ajustes.velocidad")}>
                {VELOCIDADES.map((v) => (
                  <button
                    key={v}
                    className={v === velocidad ? "activa" : ""}
                    aria-pressed={v === velocidad}
                    onClick={() => {
                      setVelocidad(v);
                      guardar(CLAVE_VELOCIDAD, v);
                    }}
                  >
                    {t(`ajustes.velocidad.${v}`)}
                  </button>
                ))}
              </div>
            </div>
            <Interruptor clave="tendedero-seguir" texto={t("mesa.opVerJugadas")} />
            <Interruptor clave="tendedero-lupa" texto={t("mesa.opLupa")} />
          </section>
        </div>

        <footer className="aj-pie">
          <button className="principal" onClick={onCerrar}>
            {t("ajustes.listo")}
          </button>
        </footer>
      </section>
    </div>
  );
}
