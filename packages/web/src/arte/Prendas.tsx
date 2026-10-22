import { useId } from "react";
import { tono } from "./color";

// Ilustraciones beta de las prendas, en SVG. Cada hueco de cuerda mide 60 × 76 unidades, así que una prenda de
// n huecos se dibuja en un lienzo de 60·n de ancho. Arriba quedan las pinzas, que la sujetan a la cuerda.

const ALTO = 76;

/** Pinza de madera vista de frente, centrada en x. */
export function Pinza({ x, color = "#c99a62" }: { x: number; color?: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={-3.6} y={-1} width={7.2} height={17} rx={2} fill={color} stroke={tono(color, -0.45)} strokeWidth={0.8} />
      <line x1={0} y1={0} x2={0} y2={15.5} stroke={tono(color, -0.35)} strokeWidth={0.7} />
      <rect x={-4.6} y={5} width={9.2} height={3.4} rx={1.2} fill="#9aa3a8" stroke="#5f686d" strokeWidth={0.6} />
    </g>
  );
}

/** Gotas que indican la humedad que le queda a la prenda (hasta 5 dibujadas; más, con número). */
export function Gotas({ humedad, x, y }: { humedad: number; x: number; y: number }) {
  if (humedad <= 0) return null;
  const dibujadas = Math.min(humedad, 5);
  return (
    <g transform={`translate(${x} ${y})`} className="gotas">
      {Array.from({ length: dibujadas }, (_, i) => (
        <path
          key={i}
          transform={`translate(${i * 9} 0)`}
          d="M0 -6 C2.6 -2.2 4 0 4 1.8 A4 4 0 0 1 -4 1.8 C-4 0 -2.6 -2.2 0 -6Z"
          fill="#5fb3e6"
          stroke="#1f5e86"
          strokeWidth={0.9}
        />
      ))}
      {humedad > 5 && (
        <text x={dibujadas * 9 + 1} y={4} fontSize={9} fontWeight={700} fill="#1f5e86">
          +{humedad - 5}
        </text>
      )}
    </g>
  );
}

function Calcetin({ color, id }: { color: string; id: string }) {
  const sombra = tono(color, -0.25);
  const claro = tono(color, 0.35);
  return (
    <g>
      <path
        d="M19 10 H41 V44 C41 48 43 51 46 54 L52 60 C57 65 54 73 47 73 C44 73 41.6 71.8 39.6 69.8 L22.4 52.6 C20.2 50.4 19 47.6 19 44.5 Z"
        fill={`url(#${id}-tela)`}
        stroke={tono(color, -0.5)}
        strokeWidth={1.4}
      />
      {/* Puño con rayas, talón y punta */}
      <rect x={19} y={10} width={22} height={9} fill={claro} stroke={tono(color, -0.5)} strokeWidth={1.2} />
      <path d="M21 13.2 H39 M21 16 H39" stroke={sombra} strokeWidth={1} />
      <path d="M41 44 C41 48 43 51 46 54 L52 60 C54.6 62.6 54.6 66 53 68.5 C49 64 44 59.5 41 52Z" fill={sombra} opacity={0.55} />
      <path d="M22.4 52.6 C20.2 50.4 19 47.6 19 44.5 V40 C23 45 25 47 30 49.5 Z" fill={sombra} opacity={0.45} />
      <path d="M26 22 V42" stroke={claro} strokeWidth={2} opacity={0.5} strokeLinecap="round" />
    </g>
  );
}

function Camiseta({ color, id }: { color: string; id: string }) {
  const sombra = tono(color, -0.25);
  const claro = tono(color, 0.35);
  return (
    <g>
      <path
        d="M44 9 L22 18 L6 36 L20 46 L30 37 V72 H90 V37 L100 46 L114 36 L98 18 L76 9 C73 17 67 21 60 21 C53 21 47 17 44 9 Z"
        fill={`url(#${id}-tela)`}
        stroke={tono(color, -0.5)}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Cuello, costuras de las mangas y pliegues */}
      <path d="M44 9 C47 17 53 21 60 21 C67 21 73 17 76 9" fill="none" stroke={tono(color, -0.5)} strokeWidth={2.4} />
      <path d="M46 10.5 C49 16.5 54 19 60 19 C66 19 71 16.5 74 10.5" fill="none" stroke={claro} strokeWidth={1.2} />
      <path d="M30 37 L22 29 M90 37 L98 29" stroke={sombra} strokeWidth={1.2} />
      <path d="M38 30 C40 45 37 58 40 70 M80 34 C78 48 82 60 79 70" stroke={sombra} strokeWidth={1.3} fill="none" opacity={0.6} />
      <path d="M30 66 H90" stroke={sombra} strokeWidth={1} strokeDasharray="2.5 2" opacity={0.7} />
      <path d="M48 28 C52 40 50 52 53 64" stroke={claro} strokeWidth={2.5} fill="none" opacity={0.45} strokeLinecap="round" />
    </g>
  );
}

function Toalla({ color, id }: { color: string; id: string }) {
  const sombra = tono(color, -0.25);
  const claro = tono(color, 0.4);
  return (
    <g>
      {/* La toalla cuelga doblada sobre la cuerda: un pliegue arriba y flecos abajo. */}
      <path d="M10 8 H170 V66 C150 70 128 64 108 68 C86 72 66 64 46 68 C30 71 18 68 10 66 Z" fill={`url(#${id}-tela)`} stroke={tono(color, -0.5)} strokeWidth={1.5} />
      <path d="M10 8 H170 V17 H10 Z" fill={sombra} opacity={0.55} />
      <path d="M10 50 C40 54 70 47 100 51 C130 55 150 49 170 51" fill="none" stroke={claro} strokeWidth={4} />
      <path d="M10 57 C40 61 70 54 100 58 C130 62 150 56 170 58" fill="none" stroke={claro} strokeWidth={2} />
      {Array.from({ length: 23 }, (_, i) => (
        <path key={i} d={`M${14 + i * 7} ${66 + (i % 2)} v6`} stroke={tono(color, -0.4)} strokeWidth={1.4} strokeLinecap="round" />
      ))}
      <path d="M40 22 C44 34 41 44 44 52 M120 22 C116 32 120 42 117 50" stroke={sombra} strokeWidth={1.3} fill="none" opacity={0.6} />
    </g>
  );
}

const DIBUJOS: Record<string, (p: { color: string; id: string }) => React.ReactElement> = {
  calcetin: Calcetin,
  camiseta: Camiseta,
  toalla: Toalla,
};

/** Dónde van las pinzas según cuántos huecos ocupa la prenda. */
function pinzas(espacios: number): number[] {
  if (espacios <= 1) return [30];
  return Array.from({ length: espacios }, (_, i) => 30 + i * 60).filter((_, i, l) => i === 0 || i === l.length - 1);
}

/**
 * Prenda ilustrada. Si su tipo no tiene dibujo propio, se dibuja un paño genérico del ancho que ocupa.
 * `pinzaColor` pinta las pinzas (las cuerdas de pinzas de color).
 */
export function ArtePrenda({
  tipo,
  color,
  espacios,
  humedad,
  pinzaColor,
  conPinzas = true,
  className,
}: {
  tipo: string;
  color: string;
  espacios: number;
  humedad?: number;
  pinzaColor?: string;
  /** Sin pinzas: la ropa que está en una cesta o ya seca. */
  conPinzas?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const ancho = 60 * Math.max(1, espacios);
  const Dibujo = DIBUJOS[tipo];
  return (
    <svg viewBox={`0 0 ${ancho} ${ALTO}`} className={className} aria-hidden preserveAspectRatio="xMidYMin meet">
      <defs>
        <linearGradient id={`${id}-tela`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tono(color, 0.12)} />
          <stop offset="1" stopColor={tono(color, -0.12)} />
        </linearGradient>
      </defs>
      {Dibujo ? (
        <Dibujo color={color} id={id} />
      ) : (
        <rect x={6} y={8} width={ancho - 12} height={60} rx={4} fill={`url(#${id}-tela)`} stroke={tono(color, -0.5)} />
      )}
      {conPinzas &&
        pinzas(espacios).map((x) => (
          <Pinza key={x} x={x} color={pinzaColor} />
        ))}
      {humedad !== undefined && <Gotas humedad={humedad} x={ancho - 10 - Math.min(humedad, 5) * 9 + 4} y={ALTO - 12} />}
    </svg>
  );
}
