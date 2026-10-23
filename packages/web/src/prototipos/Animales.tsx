import { CREMA, Raton, TINTA, Zorra } from "./ArteBosque";

// Animales que se pueden elegir como avatar, en el mismo estilo de tinta que el resto de la mesa.

const trazo = { stroke: TINTA, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Conejo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <ellipse cx="22" cy="16" rx="6" ry="15" fill="#e9e1d6" />
        <ellipse cx="22" cy="17" rx="2.6" ry="10" fill="#e8a9a0" strokeWidth="1.6" />
        <ellipse cx="42" cy="16" rx="6" ry="15" fill="#e9e1d6" transform="rotate(12 42 16)" />
        <ellipse cx="42" cy="17" rx="2.6" ry="10" fill="#e8a9a0" strokeWidth="1.6" transform="rotate(12 42 17)" />
        <path d="M12 42 C12 30 21 26 32 26 C43 26 52 30 52 42 C52 52 43 58 32 58 C21 58 12 52 12 42 Z" fill="#f4eee6" />
        <path d="M42 29 C49 33 52 37 52 42 C52 50 46 56 39 57 C45 50 46 38 42 29 Z" fill="#d9cfc2" stroke="none" />
        <path d="M12 42 C12 30 21 26 32 26 C43 26 52 30 52 42 C52 52 43 58 32 58 C21 58 12 52 12 42 Z" fill="none" />
        <circle cx="24" cy="40" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="40" cy="40" r="2.6" fill={TINTA} stroke="none" />
        <path d="M29 46 h6 l-3 3 z" fill="#d9776b" strokeWidth="1.6" />
        <path d="M30 52 h4 v3 h-4 z" fill="#fff" strokeWidth="1.4" />
        <circle cx="19" cy="47" r="3" fill="#f2b5ac" stroke="none" opacity=".8" />
        <circle cx="45" cy="47" r="3" fill="#f2b5ac" stroke="none" opacity=".8" />
      </g>
    </svg>
  );
}

function Erizo({ className }: { className?: string }) {
  const puas = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.85 + i * 0.16);
    const r1 = 22;
    const r2 = 31;
    return `L${32 + Math.cos(a) * r2} ${40 + Math.sin(a) * r2} L${32 + Math.cos(a + 0.08) * r1} ${40 + Math.sin(a + 0.08) * r1}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d={`M8 44 ${puas} L56 44 Z`} fill="#7a5a3a" />
        <path d="M14 44 C14 32 22 28 32 28 C42 28 50 32 50 44 C50 52 42 57 32 57 C22 57 14 52 14 44 Z" fill="#e8cfa6" />
        <circle cx="25" cy="42" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="39" cy="42" r="2.6" fill={TINTA} stroke="none" />
        <ellipse cx="32" cy="49" rx="3.6" ry="2.8" fill={TINTA} />
        <circle cx="20" cy="48" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
        <circle cx="44" cy="48" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
      </g>
    </svg>
  );
}

function Mapache({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d="M10 16 L22 22 L13 30 Z" fill="#8c8f96" />
        <path d="M54 16 L42 22 L51 30 Z" fill="#8c8f96" />
        <path d="M8 36 C8 24 19 18 32 18 C45 18 56 24 56 36 C56 48 45 56 32 56 C19 56 8 48 8 36 Z" fill="#a9acb3" />
        <path d="M10 34 C16 28 26 30 32 34 C38 30 48 28 54 34 C50 42 40 42 32 38 C24 42 14 42 10 34 Z" fill={TINTA} />
        <circle cx="22" cy="35" r="3.4" fill="#fff" stroke="none" />
        <circle cx="42" cy="35" r="3.4" fill="#fff" stroke="none" />
        <circle cx="22.6" cy="35.4" r="1.8" fill={TINTA} stroke="none" />
        <circle cx="42.6" cy="35.4" r="1.8" fill={TINTA} stroke="none" />
        <path d="M22 44 C26 52 38 52 42 44 C38 47 26 47 22 44 Z" fill={CREMA} />
        <ellipse cx="32" cy="46" rx="3.4" ry="2.4" fill={TINTA} />
      </g>
    </svg>
  );
}

function Rana({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d="M6 42 C6 30 18 24 32 24 C46 24 58 30 58 42 C58 52 46 58 32 58 C18 58 6 52 6 42 Z" fill="#7fbf5a" />
        <path d="M44 27 C52 31 58 36 58 42 C58 50 50 56 40 57 C48 50 50 38 44 27 Z" fill="#5f9e45" stroke="none" />
        <path d="M6 42 C6 30 18 24 32 24 C46 24 58 30 58 42 C58 52 46 58 32 58 C18 58 6 52 6 42 Z" fill="none" />
        <circle cx="20" cy="22" r="9" fill="#7fbf5a" />
        <circle cx="44" cy="22" r="9" fill="#7fbf5a" />
        <circle cx="20" cy="22" r="5" fill="#fff" strokeWidth="2" />
        <circle cx="44" cy="22" r="5" fill="#fff" strokeWidth="2" />
        <circle cx="21" cy="23" r="2.4" fill={TINTA} stroke="none" />
        <circle cx="45" cy="23" r="2.4" fill={TINTA} stroke="none" />
        <path d="M20 44 Q32 52 44 44" fill="none" />
        <circle cx="15" cy="45" r="3.4" fill="#f2a28f" stroke="none" opacity=".8" />
        <circle cx="49" cy="45" r="3.4" fill="#f2a28f" stroke="none" opacity=".8" />
      </g>
    </svg>
  );
}

export const ANIMALES = [
  { id: "raton", nombre: "Ratón", Dibujo: Raton },
  { id: "zorra", nombre: "Zorra", Dibujo: Zorra },
  { id: "conejo", nombre: "Conejo", Dibujo: Conejo },
  { id: "erizo", nombre: "Erizo", Dibujo: Erizo },
  { id: "mapache", nombre: "Mapache", Dibujo: Mapache },
  { id: "rana", nombre: "Rana", Dibujo: Rana },
];

export function Animal({ id, className }: { id: string; className?: string }) {
  const { Dibujo } = ANIMALES.find((a) => a.id === id) ?? ANIMALES[0];
  return <Dibujo className={className} />;
}
