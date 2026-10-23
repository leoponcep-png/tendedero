import { useState } from "react";
import { ArtePrenda } from "../arte/Prendas";

const PORTADA: { tipo: string; color: string; espacios: number }[] = [
  { tipo: "camiseta", color: "#d2513f", espacios: 2 },
  { tipo: "calcetin", color: "#4a7fd0", espacios: 1 },
  { tipo: "toalla", color: "#e8c23a", espacios: 3 },
  { tipo: "calcetin", color: "#f4f1ea", espacios: 1 },
  { tipo: "camiseta", color: "#4a7fd0", espacios: 2 },
];

/** Ropa tendida de adorno, de lado a lado. */
export function Portada() {
  return (
    <div className="portada">
      <svg className="portada-cuerda" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
        <path d="M0 2 Q50 9 100 2" fill="none" stroke="#8c7a62" strokeWidth={0.8} />
      </svg>
      <div className="portada-ropa">
        {PORTADA.map((p, i) => (
          <ArtePrenda key={i} {...p} className="portada-prenda" />
        ))}
      </div>
    </div>
  );
}

export function PantallaInicio({ onLocal, onCrear, onUnirse }: { onLocal: () => void; onCrear: () => void; onUnirse: (codigo: string) => void }) {
  const [codigo, setCodigo] = useState("");
  // Se acepta el código suelto o el enlace entero.
  const limpio = codigo.trim().split("/").pop()?.toLowerCase() ?? "";
  return (
    <main className="inicio">
      <Portada />
      <h1 className="titulo-juego">Tendedero</h1>
      <p className="lema">Tiende tu ropa antes de que llueva… o de que tus vecinos te la líen.</p>

      <div className="opciones-inicio">
        <section className="opcion">
          <h2>En este ordenador</h2>
          <p>Todos los jugadores juegan desde la misma pantalla. Se puede deshacer y ver todas las manos.</p>
          <button className="principal" onClick={onLocal}>
            Jugar aquí
          </button>
        </section>

        <section className="opcion">
          <h2>Crear partida online</h2>
          <p>Eliges las reglas y te da un enlace para pasárselo a tus amigos. Cada uno juega desde su navegador.</p>
          <button className="principal" onClick={onCrear}>
            Crear sala
          </button>
        </section>

        <section className="opcion">
          <h2>Unirse a una partida</h2>
          <p>Abre el enlace que te han pasado o escribe aquí el código de la sala.</p>
          <form
            className="unirse"
            onSubmit={(e) => {
              e.preventDefault();
              if (limpio) onUnirse(limpio);
            }}
          >
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="código, p. ej. k7m2qx" aria-label="Código de la sala" />
            <button className="principal" disabled={!limpio}>
              Entrar
            </button>
          </form>
        </section>
      </div>

      <p className="lema">
        <a href="#/prototipos/a2">Prototipos de mesa animada (beta)</a>
      </p>
    </main>
  );
}
