import { createContext, StrictMode, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { tLibre, useT } from "../i18n";
import { SelectorIdioma } from "../i18n/react";
import { DefsBosque } from "./ArteBosque";
import { CaraAccionBosque, CartaCuerdaBosque, CartaDiaBosque, CartaPrendaBosque, CartaObjetivoBosque, CATALOGO_CARTAS, DorsoBosque, LosetaBosque } from "./CartasBosque";
import { MM } from "./medidas";
import { ESTILOS } from "./MesaBosque";
import { ACCIONES, CUERDAS } from "./Prototipos";
import dias from "../../../../data/dia.json";
import objetivos from "../../../../data/objetivos.json";
import "./prototipos.css";
import "./mesa-bosque.css";
import "./estilos-dibujo.css";
import "./mesa-final.css";
import "./galeria-valorar.css";

// Galería de todas las cartas a su proporción real, para revisar el diseño en cada estilo de dibujo.
// Se abre en /galeria-cartas.html del servidor de desarrollo; no forma parte de la web publicada.

const PINZAS = ["#d2513f", "#4a7fd0", "#e8c23a", "#f4f1ea"];

// ---------- Valoraciones carta por carta ----------
// Debajo de cada carta: de 1 a 5 estrellas y un comentario. Se guardan solas en valoraciones/cartas.json
// (servidor de desarrollo) para que Claude las lea; si no hay servidor, se quedan en este navegador.

type Valoracion = { carta: string; estrellas: number; nota: string; estilo: string; fecha: string };
type Valoraciones = Record<string, Valoracion>;

const ContextoValorar = createContext<{ datos: Valoraciones; poner: (clave: string, v: Partial<Valoracion> & { carta: string }) => void } | null>(null);

function useValoraciones(estilo: string) {
  const [datos, setDatos] = useState<Valoraciones>({});
  const [aviso, setAviso] = useState("");
  const cargado = useRef(false);
  useEffect(() => {
    fetch("/api/valoraciones")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => {
        try {
          return JSON.parse(localStorage.getItem("tendedero-valoraciones") ?? "{}");
        } catch {
          return {};
        }
      })
      .then((d: Valoraciones) => {
        setDatos(d ?? {});
        cargado.current = true;
      });
  }, []);
  // Se guarda un momento después del último cambio.
  useEffect(() => {
    if (!cargado.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem("tendedero-valoraciones", JSON.stringify(datos));
      } catch {
        // Sin almacenamiento solo queda la copia del servidor.
      }
      fetch("/api/valoraciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) })
        .then((r) => setAviso(r.ok ? "galeria.guardadoClaude" : "galeria.guardadoLocal"))
        .catch(() => setAviso("galeria.guardadoLocal"));
    }, 600);
    return () => clearTimeout(t);
  }, [datos]);
  const poner = (clave: string, v: Partial<Valoracion> & { carta: string }) =>
    setDatos((d) => {
      const antes = d[clave] ?? { carta: v.carta, estrellas: 0, nota: "", estilo, fecha: "" };
      return { ...d, [clave]: { ...antes, ...v, estilo, fecha: new Date().toISOString() } };
    });
  return { datos, poner, aviso };
}

/** Una carta con su valoración debajo. */
function Valorar({ clave, carta, children }: { clave: string; carta: string; children: ReactNode }) {
  const ctx = useContext(ContextoValorar)!;
  const t = useT();
  const v = ctx.datos[clave];
  return (
    <div className="valorar">
      {children}
      <div className="valorar-panel">
        <div className="valorar-estrellas" role="radiogroup" aria-label={t("galeria.valoracionDe", { carta })}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={(v?.estrellas ?? 0) >= n ? "llena" : ""}
              aria-label={t("galeria.estrellas", { n })}
              onClick={() => ctx.poner(clave, { carta, estrellas: v?.estrellas === n ? 0 : n })}
            >
              ★
            </button>
          ))}
        </div>
        <textarea placeholder={t("galeria.queCambiarias")} value={v?.nota ?? ""} onChange={(e) => ctx.poner(clave, { carta, nota: e.target.value })} rows={2} />
      </div>
    </div>
  );
}

const nombreDia = (id: string) => dias.cartas.find((c) => c.id === id)?.nombre ?? id;
const nombreObjetivo = (id: string) => objetivos.objetivos.find((o) => o.id === id)?.nombre ?? id;
const nombreCuerda = (id: string) => CUERDAS[id]?.nombre ?? id;

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ font: "800 22px var(--fuente-titulo)", color: "#fff6e6", margin: "0 0 14px", textShadow: "0 2px 0 #0006" }}>{titulo}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "flex-start" }}>{children}</div>
    </section>
  );
}

function Galeria() {
  const t = useT();
  const [estilo, setEstilo] = useState("fusion");
  const [mm, setMm] = useState(3);
  const [mesaFinal, setMesaFinal] = useState(true);
  const vertical = { position: "relative", width: MM.accion.ancho * mm, height: MM.accion.alto * mm } as CSSProperties;
  const apaisada = { position: "relative", width: MM.cuerda.ancho * mm, height: MM.cuerda.alto * mm } as CSSProperties;
  const valorar = useValoraciones(estilo);
  const valoradas = Object.entries(valorar.datos).filter(([k, v]) => k !== "general" && (v.estrellas > 0 || v.nota.trim())).length;
  return (
    <ContextoValorar.Provider value={valorar}>
    <div className={`mb ${mesaFinal ? "me" : ""} estilo-${estilo}`} style={{ minHeight: "100vh", padding: "16px 24px 60px", "--carta-w": `${MM.accion.ancho * mm}px`, "--celda": `${(MM.cuerda.ancho * mm) / 3}px`, "--celda-base": `${(MM.cuerda.ancho * mm) / 3}px` } as CSSProperties}>
      <DefsBosque />
      <nav className="mb-estilos" style={{ position: "sticky", top: 0, marginBottom: 20, borderRadius: 12 }}>
        <SelectorIdioma compacto />
        <span>{t("galeria.estilo")}</span>
        {ESTILOS.map((e) => (
          <button key={e.id} className={estilo === e.id ? "activa" : ""} onClick={() => setEstilo(e.id)}>
            {tLibre(`estilo.${e.id}`)}
          </button>
        ))}
        <span style={{ marginLeft: 12 }}>{t("galeria.escala")}</span>
        {[1.6, 2.2, 3, 5, 8].map((v) => (
          <button key={v} className={mm === v ? "activa" : ""} onClick={() => setMm(v)}>
            {v} px/mm
          </button>
        ))}
        <button className={mesaFinal ? "activa" : ""} onClick={() => setMesaFinal(!mesaFinal)}>
          {t("galeria.acabados")}
        </button>
        <span className="valorar-contador">
          {t("galeria.valoradas", { n: valoradas })}
          {valorar.aviso && ` · ${tLibre(valorar.aviso)}`}
        </span>
      </nav>
      <div className="valorar-general">
        <b>{t("galeria.valoraTitulo")}</b> {t("galeria.valoraTexto")}
        <textarea
          placeholder={t("galeria.comentarioGeneral")}
          value={valorar.datos.general?.nota ?? ""}
          onChange={(e) => valorar.poner("general", { carta: "Comentario general", nota: e.target.value })}
          rows={2}
        />
      </div>
      <Seccion titulo={t("galeria.acciones")}>
        {CATALOGO_CARTAS.acciones.map((id) => (
          <Valorar key={id} clave={`accion:${id}`} carta={`${ACCIONES[id]?.nombre ?? id} (acción)`}>
            <div style={vertical}>
              <div style={{ position: "absolute", inset: 0, display: "grid" }}>
                <CaraAccionBosque id={id} />
              </div>
            </div>
          </Valorar>
        ))}
      </Seccion>
      <Seccion titulo={t("galeria.cuerdas")}>
        {CATALOGO_CARTAS.cuerdas.map((id) => (
          <Valorar key={id} clave={`cuerda:${id}`} carta={`${nombreCuerda(id)} (cuerda)`}>
            <CartaCuerdaBosque efecto={id === "basica" ? null : id} modo="borde" style={apaisada} />
          </Valorar>
        ))}
        {PINZAS.slice(1).map((c) => (
          <Valorar key={c} clave={`cuerda:pinzas-${c}`} carta={`Pinzas de color ${c} (cuerda)`}>
            <CartaCuerdaBosque efecto="modificador-puntuacion" pinzas={c} modo="borde" style={apaisada} />
          </Valorar>
        ))}
      </Seccion>
      <Seccion titulo={t("galeria.dias")}>
        {CATALOGO_CARTAS.dias.map((id) => (
          <Valorar key={id} clave={`dia:${id}`} carta={`${nombreDia(id)} (día)`}>
            <CartaDiaBosque id={id} style={{ width: MM.dia.ancho * mm, rotate: "0deg" }} />
          </Valorar>
        ))}
        <CartaDiaBosque style={{ width: MM.dia.ancho * mm, rotate: "0deg" }} />
      </Seccion>
      <Seccion titulo={t("galeria.objetivos")}>
        {CATALOGO_CARTAS.objetivos.map((id) => (
          <Valorar key={id} clave={`objetivo:${id}`} carta={`${nombreObjetivo(id)} (objetivo)`}>
            <CartaObjetivoBosque id={id} style={vertical} />
          </Valorar>
        ))}
      </Seccion>
      <Seccion titulo={t("galeria.dorsos")}>
        {(["acciones", "objetivos"] as const).map((c) => (
          <Valorar key={c} clave={`dorso:${c}`} carta={`Dorso de ${c}`}>
            <div style={vertical}>
              <div style={{ position: "absolute", inset: 0, display: "grid" }}>
                <DorsoBosque clase={c} />
              </div>
            </div>
          </Valorar>
        ))}
        {(["cuerdas", "dias"] as const).map((c) => (
          <Valorar key={c} clave={`dorso:${c}`} carta={`Dorso de ${c}`}>
            <div style={apaisada}>
              <div style={{ position: "absolute", inset: 0, display: "grid" }}>
                <DorsoBosque clase={c} />
              </div>
            </div>
          </Valorar>
        ))}
        <Valorar clave="dorso:prendas" carta="Dorso de prendas">
          <div style={{ position: "relative", width: MM.prenda.ancho * mm, height: MM.prenda.alto * mm }}>
            <div style={{ position: "absolute", inset: 0, display: "grid" }}>
              <DorsoBosque clase="prendas" />
            </div>
          </div>
        </Valorar>
      </Seccion>
      <Seccion titulo={t("galeria.prendas")}>
        {(["calcetin", "camiseta", "toalla"] as const).flatMap((tipo) =>
          PINZAS.map((color) => (
            <CartaPrendaBosque
              key={`${tipo}-${color}`}
              p={{ id: `${tipo}-${color}`, tipo, color, humedad: 2 }}
              style={{ width: MM.prenda.ancho * mm * (tipo === "calcetin" ? 1 : tipo === "camiseta" ? 1.6 : 2.2), height: MM.prenda.alto * mm, fontSize: 4 * mm } as CSSProperties}
            />
          )),
        )}
      </Seccion>
      <Seccion titulo={t("galeria.loseta")}>
        <Valorar clave="loseta" carta="Loseta de cartón">
          <div style={{ "--alto-cuerda": `${MM.cuerda.alto * mm}px`, "--hueco-linea": `${6 * mm}px` } as CSSProperties}>
            <LosetaBosque lineas={2} />
          </div>
        </Valorar>
      </Seccion>
    </div>
    </ContextoValorar.Provider>
  );
}

// Al recargar en caliente se reutiliza la raíz de React en vez de crear otra.
const contenedor = document.getElementById("raiz") as HTMLElement & { raizReact?: Root };
contenedor.raizReact ??= createRoot(contenedor);
// Con ?plantilla=1 se pintan las plantillas vacías de cada tipo de carta (para dibujar las ilustraciones).
const plantilla = new URLSearchParams(location.search).has("plantilla");
// Se carga aparte para que sus estilos no lleguen a la galería normal.
if (plantilla) import("./PlantillasCartas").then(({ PlantillasCartas }) => contenedor.raizReact!.render(<StrictMode><PlantillasCartas /></StrictMode>));
else contenedor.raizReact.render(<StrictMode><Galeria /></StrictMode>);
