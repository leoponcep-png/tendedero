// Ambiente de la mesa según la carta del día, en dos capas que no reciben clics: «fondo», sobre la madera y por
// debajo de paneles y cartas, con la luz del día y, si las animaciones están puestas, sus efectos (lluvia, brillos
// de sol, hojas con el viento…); y «luz», un tinte muy suave por encima de todo. Es sutil a propósito: se nota el
// clima y se juega como siempre. Se queda mientras dura ese día y cambia con un fundido.

import { useMemo, type CSSProperties } from "react";

/** Qué ambiente pone cada efecto de carta del día (data/dia.json). */
const AMBIENTE: Record<string, string> = {
  soleado: "sol",
  lluvia: "lluvia",
  viento: "viento",
  "tormenta-repentina": "tormenta",
  "ola-de-calor": "calor",
  "vecina-sacude-alfombra": "polvo",
  "pinzas-viejas": "pinzas",
  "ropa-se-engancha": "enganche",
  "viento-traicionero": "rafagas",
};

/** Cuántas partículas lleva cada ambiente (0: solo la luz). */
const PARTICULAS: Record<string, number> = { sol: 6, lluvia: 26, viento: 5, tormenta: 34, calor: 5, polvo: 14, pinzas: 3, enganche: 6, rafagas: 7 };
/** Gotitas de la tormenta que caen por encima de la mesa (las demás van por debajo, sobre la madera). */
const GOTITAS_ENCIMA = 14;

/** Azar fijo (siempre las mismas posiciones para el mismo ambiente: no salta al volver a pintar). */
function azar(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function ambienteDe(efecto: string | null | undefined): string | null {
  return efecto ? (AMBIENTE[efecto] ?? null) : null;
}

export function Ambiente({ efecto, animar, capa }: { efecto: string | null | undefined; animar: boolean; capa: "fondo" | "luz" }) {
  const tipo = ambienteDe(efecto);
  const particulas = useMemo(() => {
    if (!tipo) return [];
    const r = azar(tipo.length * 7919 + tipo.charCodeAt(0));
    return Array.from({ length: PARTICULAS[tipo] ?? 0 }, (_, i) => ({
      "--x": r().toFixed(3),
      "--y": r().toFixed(3),
      "--r": r().toFixed(3),
      "--t": (r() * 0.7 + 0.65).toFixed(3),
      "--d": (-r() * 12).toFixed(2) + "s",
      "--i": i,
    }));
  }, [tipo]);
  if (!tipo) return null;
  if (capa === "luz")
    return (
      <div key={tipo} className={`mj-ambiente-luz amb-${tipo} ${animar ? "" : "quieto"}`} aria-hidden>
        {/* En la tormenta caen por encima unas pocas gotitas pequeñas y transparentes: se ven sin tapar el juego. */}
        {animar && tipo === "tormenta" && (
          <div className="amb-gotitas">
            {particulas.slice(0, GOTITAS_ENCIMA).map((p) => (
              <i key={p["--i"]} style={p as unknown as CSSProperties} />
            ))}
          </div>
        )}
      </div>
    );
  return (
    // La clave hace que al cambiar de día el ambiente nuevo entre con su fundido.
    <div key={tipo} className={`mj-ambiente amb-${tipo} ${animar ? "" : "quieto"}`} aria-hidden>
      <div className="amb-luz" />
      {animar && (
        <div className="amb-particulas">
          {particulas.map((p) => (
            <i key={p["--i"]} style={p as unknown as CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
}
