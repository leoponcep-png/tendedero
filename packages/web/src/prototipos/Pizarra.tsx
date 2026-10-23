import { useEffect, useRef, useState } from "react";
import { Barra } from "./Prototipos";
import "./prototipos.css";
import "./pizarra.css";

// Pizarra para dibujar bocetos del juego (cómo es cada componente en la mesa real) y guardarlos en /bocetos,
// donde Claude puede abrirlos. Funciona con ratón, lápiz o dedo.

type Herramienta = "lapiz" | "rect" | "texto" | "goma";

const COLORES = ["#2b2019", "#c2553a", "#2f86e8", "#3f8a6d", "#e1a73a", "#8a5a30", "#9b59b6"];
const HERRAMIENTAS: { id: Herramienta; nombre: string }[] = [
  { id: "lapiz", nombre: "Lápiz" },
  { id: "rect", nombre: "Rectángulo (cartas)" },
  { id: "texto", nombre: "Texto" },
  { id: "goma", nombre: "Goma" },
];

export function Pizarra({ onVersion, onVolver }: { onVersion: (v: string) => void; onVolver: () => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const historial = useRef<ImageData[]>([]);
  const trazo = useRef<{ x: number; y: number; base?: ImageData } | null>(null);
  const [herramienta, setHerramienta] = useState<Herramienta>("lapiz");
  const [color, setColor] = useState(COLORES[0]);
  const [grosor, setGrosor] = useState(4);
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("");
  const [cuadricula, setCuadricula] = useState(true);
  const [aviso, setAviso] = useState("");

  const ctx = () => lienzo.current!.getContext("2d")!;

  // El lienzo ocupa su caja a la resolución real de la pantalla; es transparente para que se vea la cuadrícula.
  useEffect(() => {
    const c = lienzo.current!;
    const r = c.getBoundingClientRect();
    const escala = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * escala);
    c.height = Math.round(r.height * escala);
    ctx().scale(escala, escala);
  }, []);

  function guardarPaso() {
    const c = lienzo.current!;
    historial.current.push(ctx().getImageData(0, 0, c.width, c.height));
    if (historial.current.length > 40) historial.current.shift();
  }

  function deshacer() {
    const anterior = historial.current.pop();
    if (anterior) ctx().putImageData(anterior, 0, 0);
  }

  function borrarTodo() {
    guardarPaso();
    const c = lienzo.current!;
    const g = ctx();
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.restore();
  }

  const punto = (ev: React.PointerEvent) => {
    const r = lienzo.current!.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  function empezar(ev: React.PointerEvent) {
    lienzo.current!.setPointerCapture(ev.pointerId);
    guardarPaso();
    const p = punto(ev);
    const g = ctx();
    if (herramienta === "texto") {
      if (!texto.trim()) {
        setAviso("Escribe primero el texto en la casilla y luego pulsa donde quieras ponerlo.");
        historial.current.pop();
        return;
      }
      g.fillStyle = color;
      g.font = `700 ${10 + grosor * 3}px Nunito, sans-serif`;
      g.fillText(texto, p.x, p.y);
      return;
    }
    const c = lienzo.current!;
    trazo.current = { ...p, base: herramienta === "rect" ? g.getImageData(0, 0, c.width, c.height) : undefined };
  }

  function mover(ev: React.PointerEvent) {
    const t = trazo.current;
    if (!t) return;
    const p = punto(ev);
    const g = ctx();
    // El lápiz de presión (si lo hay) engorda la línea al apretar.
    const presion = ev.pointerType === "pen" && ev.pressure > 0 ? 0.4 + ev.pressure : 1;
    g.lineCap = "round";
    g.lineJoin = "round";
    if (herramienta === "rect" && t.base) {
      g.putImageData(t.base, 0, 0);
      g.strokeStyle = color;
      g.lineWidth = grosor;
      g.beginPath();
      g.roundRect(Math.min(t.x, p.x), Math.min(t.y, p.y), Math.abs(p.x - t.x), Math.abs(p.y - t.y), 8);
      g.stroke();
      return;
    }
    g.globalCompositeOperation = herramienta === "goma" ? "destination-out" : "source-over";
    g.strokeStyle = color;
    g.lineWidth = (herramienta === "goma" ? grosor * 5 : grosor) * presion;
    g.beginPath();
    g.moveTo(t.x, t.y);
    g.lineTo(p.x, p.y);
    g.stroke();
    g.globalCompositeOperation = "source-over";
    t.x = p.x;
    t.y = p.y;
  }

  function terminar() {
    trazo.current = null;
  }

  /** El dibujo sobre fondo blanco (el lienzo es transparente). */
  function imagen(): string {
    const c = lienzo.current!;
    const copia = document.createElement("canvas");
    copia.width = c.width;
    copia.height = c.height;
    const g = copia.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, copia.width, copia.height);
    g.drawImage(c, 0, 0);
    return copia.toDataURL("image/png");
  }

  async function guardar() {
    setAviso("Guardando…");
    try {
      const png = imagen();
      const r = await fetch("/api/bocetos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, png }) });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);
      setAviso(`Guardado en ${datos.archivo}. Dime en el chat que lo mire.`);
    } catch {
      // En la web publicada no hay servidor: se descarga para pegarlo en el chat.
      const a = document.createElement("a");
      a.href = imagen();
      a.download = `${nombre || "boceto"}.png`;
      a.click();
      setAviso("No he podido guardarlo en el proyecto: te lo he descargado para que lo pegues en el chat.");
    }
  }

  return (
    <div className="proto pizarra">
      <Barra version="pizarra" onVersion={onVersion} onVolver={onVolver} ocupado onRival={() => {}} onReiniciar={() => {}} />
      <div className="pizarra-herramientas">
        {HERRAMIENTAS.map((h) => (
          <button key={h.id} className={h.id === herramienta ? "activa" : ""} onClick={() => setHerramienta(h.id)}>
            {h.nombre}
          </button>
        ))}
        <span className="pizarra-colores">
          {COLORES.map((c) => (
            <button key={c} className={c === color ? "activa" : ""} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Color ${c}`} />
          ))}
        </span>
        <label>
          Grosor
          <input type="range" min={1} max={14} value={grosor} onChange={(e) => setGrosor(+e.target.value)} />
        </label>
        {herramienta === "texto" && <input className="pizarra-texto" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Texto, p. ej. «carta de cuerda»" />}
        <button onClick={deshacer}>Deshacer</button>
        <button onClick={borrarTodo}>Borrar todo</button>
        <label>
          <input type="checkbox" checked={cuadricula} onChange={(e) => setCuadricula(e.target.checked)} /> Cuadrícula
        </label>
        <span className="pizarra-guardar">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del boceto" />
          <button className="principal" onClick={() => void guardar()}>
            Guardar para Claude
          </button>
        </span>
      </div>
      {aviso && <div className="pizarra-aviso">{aviso}</div>}
      <div className={`pizarra-hoja ${cuadricula ? "con-cuadricula" : ""}`}>
        <canvas ref={lienzo} onPointerDown={empezar} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={terminar} />
      </div>
    </div>
  );
}
