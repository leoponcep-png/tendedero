import { tono } from "./color";

/** Cesta de mimbre vista de frente; el contenido se pone encima con CSS. */
export function ArteCesta() {
  const mimbre = "#c9955b";
  return (
    <svg viewBox="0 0 120 80" className="arte-cesta" aria-hidden preserveAspectRatio="none">
      <path d="M8 22 H112 L100 74 C99 77 97 78 94 78 H26 C23 78 21 77 20 74 Z" fill={mimbre} stroke={tono(mimbre, -0.5)} strokeWidth={2} />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={`h${i}`} d={`M${11 + i * 2.4} ${32 + i * 10} H${109 - i * 2.4}`} stroke={tono(mimbre, -0.3)} strokeWidth={2} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <path key={`v${i}`} d={`M${14 + i * 9.2} 24 L${22 + i * 7.6} 76`} stroke={tono(mimbre, 0.25)} strokeWidth={1.4} opacity={0.8} />
      ))}
      <rect x={4} y={16} width={112} height={9} rx={4.5} fill={tono(mimbre, -0.1)} stroke={tono(mimbre, -0.5)} strokeWidth={2} />
    </svg>
  );
}

/** Poste de madera del tendedero (el inicio de cada línea). */
export function ArtePoste({ numero }: { numero: number }) {
  return (
    <svg viewBox="0 0 30 100" className="arte-poste" aria-hidden preserveAspectRatio="none">
      <rect x={9} y={4} width={12} height={96} rx={2} fill="#9b6b3d" stroke="#5c3d1f" strokeWidth={1.5} />
      <path d="M12 12 V92 M17 20 V80" stroke="#7d5330" strokeWidth={1} />
      <rect x={4} y={8} width={22} height={8} rx={2} fill="#b07d4b" stroke="#5c3d1f" strokeWidth={1.5} />
      <circle cx={15} cy={12} r={2} fill="#5c3d1f" />
      <text x={15} y={62} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fbe9cf">
        {numero}
      </text>
    </svg>
  );
}

/**
 * Fondo de una carta de cuerda: la cuerda que cruza la carta y, según su clase, un tejadillo encima,
 * sol, hilo grueso, pinzas de color o la cuerda deshilachada de la vieja.
 */
export function ArteCuerda({ efecto, espacios, colorPinzas }: { efecto: string | null; espacios: number; colorPinzas?: string }) {
  const ancho = 60 * espacios;
  const grueso = efecto === "resistente";
  const vieja = efecto === "fragil";
  const colorCuerda = vieja ? "#a3927a" : grueso ? "#6e5b43" : "#8c7a62";
  return (
    <svg viewBox={`0 0 ${ancho} 100`} className="arte-cuerda" aria-hidden preserveAspectRatio="none">
      {efecto === "tejadillo" && (
        <g>
          <path d={`M-2 6 L${ancho + 2} 6 L${ancho - 6} 18 L6 18 Z`} fill="#c4643d" stroke="#7a3518" strokeWidth={1.5} />
          {Array.from({ length: Math.ceil(ancho / 14) }, (_, i) => (
            <path key={i} d={`M${4 + i * 14} 8 q7 9 14 0`} fill="none" stroke="#8f4426" strokeWidth={1.2} />
          ))}
        </g>
      )}
      {efecto === "secado-rapido" && (
        <g opacity={0.9}>
          <circle cx={ancho - 16} cy={14} r={7} fill="#ffc93c" stroke="#d98a1c" strokeWidth={1.5} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={ancho - 16 + Math.cos(a) * 9} y1={14 + Math.sin(a) * 9} x2={ancho - 16 + Math.cos(a) * 12} y2={14 + Math.sin(a) * 12} stroke="#d98a1c" strokeWidth={1.6} strokeLinecap="round" />;
          })}
        </g>
      )}
      <path
        d={`M0 22 Q${ancho / 2} 32 ${ancho} 22`}
        fill="none"
        stroke={colorCuerda}
        strokeWidth={grueso ? 5 : 3}
        strokeLinecap="round"
        strokeDasharray={vieja ? "10 3 6 4" : undefined}
      />
      {grueso && <path d={`M0 22 Q${ancho / 2} 32 ${ancho} 22`} fill="none" stroke="#c9b48f" strokeWidth={1.2} strokeDasharray="3 3" />}
      {colorPinzas && <path d={`M0 22 Q${ancho / 2} 32 ${ancho} 22`} fill="none" stroke={colorPinzas} strokeWidth={1.4} strokeDasharray="2 6" />}
    </svg>
  );
}
