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

function Buho({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d="M12 12 L24 20 L11 27 Z" fill="#8a6440" />
        <path d="M52 12 L40 20 L53 27 Z" fill="#8a6440" />
        <path d="M10 36 C10 22 20 16 32 16 C44 16 54 22 54 36 C54 50 44 58 32 58 C20 58 10 50 10 36 Z" fill="#a67c52" />
        <path d="M42 19 C50 23 54 29 54 36 C54 47 47 55 38 57 C45 49 46 31 42 19 Z" fill="#8a6440" stroke="none" />
        <path d="M10 36 C10 22 20 16 32 16 C44 16 54 22 54 36 C54 50 44 58 32 58 C20 58 10 50 10 36 Z" fill="none" />
        <circle cx="22.5" cy="33" r="8.5" fill={CREMA} strokeWidth="2.4" />
        <circle cx="41.5" cy="33" r="8.5" fill={CREMA} strokeWidth="2.4" />
        <circle cx="23" cy="34" r="4" fill="#e8b04a" strokeWidth="2" />
        <circle cx="41" cy="34" r="4" fill="#e8b04a" strokeWidth="2" />
        <circle cx="23" cy="34" r="1.9" fill={TINTA} stroke="none" />
        <circle cx="41" cy="34" r="1.9" fill={TINTA} stroke="none" />
        <path d="M28.5 40 L35.5 40 L32 47 Z" fill="#e8933a" strokeWidth="2" />
        <path d="M23 51 q2.5 2.5 5 0 M30 53 q2 2.5 4 0 M36 51 q2.5 2.5 5 0" fill="none" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

function Ardilla({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      {/* Algo reducida para que la cola no toque el borde del círculo */}
      <g filter="url(#tinta-bosque)" {...trazo} transform="translate(32 34) scale(0.92) translate(-32 -34)">
        <path d="M46 58 C62 54 63 34 57 22 C53 14 44 12 41 20 C48 25 50 36 44 46 Z" fill="#b5602c" />
        <path d="M55 24 C59 34 58 46 50 54" fill="none" stroke="#e39a5c" strokeWidth="2.2" />
        <path d="M11 27 L13 7 L24 20 Z" fill="#c97a3f" />
        <path d="M47 27 L45 7 L34 20 Z" fill="#c97a3f" />
        <path d="M13 7 l-2 -4 M13 7 l2.5 -3.5 M45 7 l-2.5 -3.5 M45 7 l2 -4" strokeWidth="2" />
        <path d="M7 39 C7 27 17 20 29 20 C41 20 51 27 51 39 C51 50 41 57 29 57 C17 57 7 50 7 39 Z" fill="#c97a3f" />
        <path d="M39 23 C47 27 51 33 51 39 C51 47 46 54 37 56 C43 49 44 35 39 23 Z" fill="#ad6430" stroke="none" />
        <path d="M18 47 C20 41 38 41 40 47 C38 54 20 54 18 47 Z" fill={CREMA} />
        <path d="M7 39 C7 27 17 20 29 20 C41 20 51 27 51 39 C51 50 41 57 29 57 C17 57 7 50 7 39 Z" fill="none" />
        <circle cx="21" cy="35" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="37" cy="35" r="2.6" fill={TINTA} stroke="none" />
        <ellipse cx="29" cy="44.5" rx="2.8" ry="2.1" fill={TINTA} />
        <path d="M26 49 q3 2.5 6 0" fill="none" strokeWidth="1.8" />
        <circle cx="15" cy="43" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
        <circle cx="43" cy="43" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
      </g>
    </svg>
  );
}

function Tejon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <circle cx="13" cy="25" r="6.5" fill="#5a5550" />
        <circle cx="51" cy="25" r="6.5" fill="#5a5550" />
        <path d="M8 38 C8 26 18 20 32 20 C46 20 56 26 56 38 C56 50 44 58 32 58 C20 58 8 50 8 38 Z" fill="#a19c94" />
        <path d="M20 22 C15 30 17 43 26 51 L30 49 C26 40 25 30 27 20.5 Z" fill={TINTA} />
        <path d="M44 22 C49 30 47 43 38 51 L34 49 C38 40 39 30 37 20.5 Z" fill={TINTA} />
        <path d="M27 20.5 C25 30 26 40 30 49 L34 49 C38 40 39 30 37 20.5 C34 20 30 20 27 20.5 Z" fill="#f4eee6" />
        <path d="M8 38 C8 26 18 20 32 20 C46 20 56 26 56 38 C56 50 44 58 32 58 C20 58 8 50 8 38 Z" fill="none" />
        <circle cx="22.5" cy="36" r="2.4" fill={CREMA} stroke="none" />
        <circle cx="41.5" cy="36" r="2.4" fill={CREMA} stroke="none" />
        <circle cx="22.8" cy="36.4" r="1.2" fill={TINTA} stroke="none" />
        <circle cx="41.8" cy="36.4" r="1.2" fill={TINTA} stroke="none" />
        <ellipse cx="32" cy="51" rx="3.6" ry="2.6" fill={TINTA} />
        <circle cx="15" cy="46" r="3" fill="#f2a28f" stroke="none" opacity=".7" />
        <circle cx="49" cy="46" r="3" fill="#f2a28f" stroke="none" opacity=".7" />
      </g>
    </svg>
  );
}

function Oso({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <circle cx="14" cy="19" r="8" fill="#8a5a36" />
        <circle cx="14" cy="19" r="4" fill="#c48d62" strokeWidth="2" />
        <circle cx="50" cy="19" r="8" fill="#8a5a36" />
        <circle cx="50" cy="19" r="4" fill="#c48d62" strokeWidth="2" />
        <path d="M8 37 C8 23 19 17 32 17 C45 17 56 23 56 37 C56 50 45 58 32 58 C19 58 8 50 8 37 Z" fill="#a06a40" />
        <path d="M44 20 C52 24 56 30 56 37 C56 48 49 56 39 57 C46 50 48 32 44 20 Z" fill="#8a5a36" stroke="none" />
        <path d="M8 37 C8 23 19 17 32 17 C45 17 56 23 56 37 C56 50 45 58 32 58 C19 58 8 50 8 37 Z" fill="none" />
        <ellipse cx="32" cy="45" rx="10" ry="8" fill="#e2c39b" />
        <ellipse cx="32" cy="41" rx="4" ry="3" fill={TINTA} />
        <path d="M32 44 v3 M28 48 q4 3 8 0" fill="none" strokeWidth="2" />
        <circle cx="23" cy="33" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="41" cy="33" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="16" cy="43" r="3" fill="#f2a28f" stroke="none" opacity=".7" />
        <circle cx="48" cy="43" r="3" fill="#f2a28f" stroke="none" opacity=".7" />
      </g>
    </svg>
  );
}

function Nutria({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <circle cx="13" cy="27" r="5" fill="#6e4a30" />
        <circle cx="51" cy="27" r="5" fill="#6e4a30" />
        <path d="M8 39 C8 27 18 21 32 21 C46 21 56 27 56 39 C56 51 45 58 32 58 C19 58 8 51 8 39 Z" fill="#8b5e3c" />
        <path d="M44 24 C52 28 56 33 56 39 C56 49 49 56 40 57 C46 50 48 36 44 24 Z" fill="#744d31" stroke="none" />
        <path d="M13 45 C15 37 24 35 32 39 C40 35 49 37 51 45 C49 53 41 57 32 57 C23 57 15 53 13 45 Z" fill="#e6cfa8" />
        <path d="M8 39 C8 27 18 21 32 21 C46 21 56 27 56 39 C56 51 45 58 32 58 C19 58 8 51 8 39 Z" fill="none" />
        <circle cx="23" cy="35" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="41" cy="35" r="2.6" fill={TINTA} stroke="none" />
        <path d="M28 41 h8 c0 3 -2 5 -4 5 c-2 0 -4 -2 -4 -5 Z" fill={TINTA} strokeWidth="1.8" />
        <path d="M29 49.5 q3 3 6 0" fill="none" strokeWidth="1.8" />
        <path d="M22 46 L10 44 M22 49 L11 51 M42 46 L54 44 M42 49 L53 51" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

function Gato({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d="M10 8 L26 19 L12 30 Z" fill="#4f4862" />
        <path d="M13.5 14 L21 19.5 L14.5 25 Z" fill="#e8a9a0" stroke="none" />
        <path d="M54 8 L38 19 L52 30 Z" fill="#4f4862" />
        <path d="M50.5 14 L43 19.5 L49.5 25 Z" fill="#e8a9a0" stroke="none" />
        <path d="M8 38 C8 24 18 18 32 18 C46 18 56 24 56 38 C56 50 45 57 32 57 C19 57 8 50 8 38 Z" fill="#5f5876" />
        <path d="M44 21 C52 25 56 31 56 38 C56 48 49 55 39 56 C46 49 48 33 44 21 Z" fill="#4f4862" stroke="none" />
        <path d="M27 19 l2 6 M32 18.5 v6.5 M37 19 l-2 6" stroke="#4a4359" strokeWidth="2" />
        <path d="M8 38 C8 24 18 18 32 18 C46 18 56 24 56 38 C56 50 45 57 32 57 C19 57 8 50 8 38 Z" fill="none" />
        <ellipse cx="22.5" cy="36" rx="4.6" ry="4.2" fill="#f2c25a" strokeWidth="2" />
        <ellipse cx="41.5" cy="36" rx="4.6" ry="4.2" fill="#f2c25a" strokeWidth="2" />
        <ellipse cx="22.5" cy="36" rx="1.3" ry="3" fill={TINTA} stroke="none" />
        <ellipse cx="41.5" cy="36" rx="1.3" ry="3" fill={TINTA} stroke="none" />
        <path d="M29.5 44 h5 l-2.5 2.6 z" fill="#e8a9a0" strokeWidth="1.6" />
        <path d="M32 46.6 q-2.5 3 -5 1 M32 46.6 q2.5 3 5 1" fill="none" strokeWidth="1.6" />
        <path d="M20 45 L9 43 M20 48 L10 50 M44 45 L55 43 M44 48 L54 50" stroke={CREMA} strokeWidth="1.3" />
      </g>
    </svg>
  );
}

function Pato({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d="M30 16 C27 9 31 6 33.5 10 C35 5 41 7 36 16 Z" fill="#f2c94c" strokeWidth="2.4" />
        <path d="M10 36 C10 22 20 14 32 14 C44 14 54 22 54 36 C54 50 44 58 32 58 C20 58 10 50 10 36 Z" fill="#f5d35a" />
        <path d="M43 18 C51 22 54 29 54 36 C54 47 47 55 38 57 C45 50 47 32 43 18 Z" fill="#e3b737" stroke="none" />
        <path d="M10 36 C10 22 20 14 32 14 C44 14 54 22 54 36 C54 50 44 58 32 58 C20 58 10 50 10 36 Z" fill="none" />
        <circle cx="23" cy="32" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="41" cy="32" r="2.6" fill={TINTA} stroke="none" />
        <path d="M19 42 C23 36.5 41 36.5 45 42 C45 48 39 51 32 51 C25 51 19 48 19 42 Z" fill="#ef8f3a" />
        <path d="M21 44 Q32 47.5 43 44" fill="none" strokeWidth="1.8" />
        <circle cx="16" cy="40" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
        <circle cx="48" cy="40" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
      </g>
    </svg>
  );
}

function Tortuga({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        {/* De perfil: caparazón en cúpula, cabeza asomando a la derecha y patitas debajo */}
        <path d="M9 40 L4 44.5 L11 44 Z" fill="#9cc46a" />
        <ellipse cx="16" cy="47.5" rx="4.6" ry="5.5" fill="#9cc46a" />
        <ellipse cx="36" cy="47.5" rx="4.6" ry="5.5" fill="#9cc46a" />
        <path d="M38 40 C40 34 42 31 45 29" fill="none" stroke={TINTA} strokeWidth="11" />
        <path d="M38 40 C40 34 42 31 45 29" fill="none" stroke="#9cc46a" strokeWidth="5" />
        <circle cx="50" cy="28" r="9" fill="#9cc46a" />
        <path d="M54 20.5 C58 23 59.5 28 58 32 C56.5 35.5 53 37 50 37 C55 33 56 25 54 20.5 Z" fill="#82ab52" stroke="none" />
        <circle cx="50" cy="28" r="9" fill="none" />
        <circle cx="52" cy="26" r="2.5" fill={TINTA} stroke="none" />
        <circle cx="52.8" cy="25.2" r=".8" fill="#fff" stroke="none" />
        <path d="M49.5 31.5 Q53 34.5 56.5 31" fill="none" strokeWidth="2" />
        <circle cx="46" cy="31" r="2.2" fill="#f2a28f" stroke="none" opacity=".8" />
        {/* Caparazón con sus placas y el borde claro */}
        <path d="M7 41 C7 22 16 12 26.5 12 C37 12 46 22 46 41 Z" fill="#7a8f3a" />
        <path d="M33 13.5 C41 17 46 27 46 41 L38 41 C40 30 38 20 33 13.5 Z" fill="#647a2c" stroke="none" />
        <path d="M19 22 L34 22 L38 33 L26.5 38 L15 33 Z M19 22 L15 15.5 M34 22 L38 15.5 M15 33 L7.5 35 M38 33 L45.5 35 M26.5 38 V41" fill="none" strokeWidth="2" />
        <path d="M7 41 C7 22 16 12 26.5 12 C37 12 46 22 46 41 Z" fill="none" />
        <path d="M6 40 H47 Q50 40 50 42.5 Q50 45 47 45 H6 Q3 45 3 42.5 Q3 40 6 40 Z" fill="#d9c27a" />
      </g>
    </svg>
  );
}

function Ciervo({ className }: { className?: string }) {
  const astas = "M21 19 C17 13 17 7 19 2 M18.5 11 C14 10 12 7 12 3.5 M19 13 L24.5 8 M43 19 C47 13 47 7 45 2 M45.5 11 C50 10 52 7 52 3.5 M45 13 L39.5 8";
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      {/* Un poco más pequeño que los demás para que las astas quepan dentro del círculo del avatar */}
      <g filter="url(#tinta-bosque)" {...trazo} transform="translate(32 37) scale(0.88) translate(-32 -37)">
        <path d={astas} fill="none" strokeWidth="5" />
        <path d={astas} fill="none" stroke="#d9b27a" strokeWidth="2" />
        <ellipse cx="12" cy="27" rx="8" ry="4" fill="#b9844f" transform="rotate(-25 12 27)" />
        <ellipse cx="52" cy="27" rx="8" ry="4" fill="#b9844f" transform="rotate(25 52 27)" />
        <path d="M14 31 C14 21 22 17 32 17 C42 17 50 21 50 31 C50 43 42 56 32 58 C22 56 14 43 14 31 Z" fill="#c48e56" />
        <path d="M41 19 C47 22 50 26 50 31 C50 42 44 53 36 57 C42 47 45 32 41 19 Z" fill="#ad7a46" stroke="none" />
        <path d="M24 47 C26 43 38 43 40 47 C40 53 36 58 32 58 C28 58 24 53 24 47 Z" fill={CREMA} />
        <path d="M14 31 C14 21 22 17 32 17 C42 17 50 21 50 31 C50 43 42 56 32 58 C22 56 14 43 14 31 Z" fill="none" />
        <circle cx="25" cy="33" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="39" cy="33" r="2.6" fill={TINTA} stroke="none" />
        <ellipse cx="32" cy="50" rx="3.4" ry="2.6" fill={TINTA} />
        <circle cx="23" cy="24" r="1.5" fill={CREMA} stroke="none" />
        <circle cx="27.5" cy="21.5" r="1.3" fill={CREMA} stroke="none" />
        <circle cx="41" cy="24" r="1.5" fill={CREMA} stroke="none" />
        <circle cx="36.5" cy="21.5" r="1.3" fill={CREMA} stroke="none" />
      </g>
    </svg>
  );
}

function Castor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <circle cx="14" cy="23" r="5" fill="#6b4428" />
        <circle cx="50" cy="23" r="5" fill="#6b4428" />
        <path d="M10 38 C10 26 19 19 32 19 C45 19 54 26 54 38 C54 50 45 57 32 57 C19 57 10 50 10 38 Z" fill="#8f5d36" />
        <path d="M43 22 C50 26 54 31 54 38 C54 48 48 55 39 56 C45 49 47 34 43 22 Z" fill="#774b2b" stroke="none" />
        <ellipse cx="32" cy="44" rx="10" ry="6.5" fill="#c99b6c" />
        <path d="M10 38 C10 26 19 19 32 19 C45 19 54 26 54 38 C54 50 45 57 32 57 C19 57 10 50 10 38 Z" fill="none" />
        <circle cx="24" cy="33" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="40" cy="33" r="2.6" fill={TINTA} stroke="none" />
        <ellipse cx="32" cy="40.5" rx="3.6" ry="2.6" fill={TINTA} />
        <path d="M28.5 46 h7 v7 h-7 Z" fill="#fffaf0" strokeWidth="1.8" />
        <path d="M32 46 v7" strokeWidth="1.4" />
        <circle cx="17" cy="43" r="3" fill="#f2a28f" stroke="none" opacity=".7" />
        <circle cx="47" cy="43" r="3" fill="#f2a28f" stroke="none" opacity=".7" />
      </g>
    </svg>
  );
}

function Oveja({ className }: { className?: string }) {
  // Lana de la frente: varios círculos con trazo y, encima, los mismos sin trazo, para que solo quede el contorno.
  const lana: [number, number, number][] = [
    [19, 24, 8],
    [32, 18, 9.5],
    [45, 24, 8],
    [13.5, 33, 6],
    [50.5, 33, 6],
    [25.5, 27, 7],
    [38.5, 27, 7],
  ];
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <ellipse cx="10" cy="40" rx="7.5" ry="3.8" fill="#d9b994" transform="rotate(18 10 40)" />
        <ellipse cx="54" cy="40" rx="7.5" ry="3.8" fill="#d9b994" transform="rotate(-18 54 40)" />
        <path d="M17 38 C17 28 23 23 32 23 C41 23 47 28 47 38 C47 50 40 58 32 58 C24 58 17 50 17 38 Z" fill="#ead2b6" />
        <path d="M40 26 C45 29 47 33 47 38 C47 48 42 55 36 57.5 C41 50 43 37 40 26 Z" fill="#d9b994" stroke="none" />
        <path d="M17 38 C17 28 23 23 32 23 C41 23 47 28 47 38 C47 50 40 58 32 58 C24 58 17 50 17 38 Z" fill="none" />
        {lana.map(([x, y, r], i) => (
          <circle key={`t${i}`} cx={x} cy={y} r={r} fill="#fbf6ec" />
        ))}
        {lana.map(([x, y, r], i) => (
          <circle key={`r${i}`} cx={x} cy={y} r={r - 1.4} fill="#fbf6ec" stroke="none" />
        ))}
        <circle cx="26" cy="40" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="38" cy="40" r="2.6" fill={TINTA} stroke="none" />
        <path d="M29.5 48 h5 l-2.5 2.4 z" fill="#c98274" strokeWidth="1.6" />
        <path d="M32 50.4 q-2.5 3 -5 1 M32 50.4 q2.5 3 5 1" fill="none" strokeWidth="1.6" />
        <circle cx="21.5" cy="46" r="2.8" fill="#f2a28f" stroke="none" opacity=".8" />
        <circle cx="42.5" cy="46" r="2.8" fill="#f2a28f" stroke="none" opacity=".8" />
      </g>
    </svg>
  );
}

function Gallina({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`ilu ${className ?? ""}`} aria-hidden>
      <g filter="url(#tinta-bosque)" {...trazo}>
        <path d="M22 18 C19 9 26 6 28 12 C28 4 37 4 36 12 C39 6 46 9 42 18 Z" fill="#d9443a" />
        <path d="M12 39 C12 25 21 16 32 16 C43 16 52 25 52 39 C52 51 43 58 32 58 C21 58 12 51 12 39 Z" fill="#f7f1e6" />
        <path d="M42 19 C49 23 52 31 52 39 C52 49 46 56 38 57.5 C45 50 47 32 42 19 Z" fill="#e6dccb" stroke="none" />
        <path d="M12 39 C12 25 21 16 32 16 C43 16 52 25 52 39 C52 51 43 58 32 58 C21 58 12 51 12 39 Z" fill="none" />
        <circle cx="23.5" cy="34" r="2.6" fill={TINTA} stroke="none" />
        <circle cx="40.5" cy="34" r="2.6" fill={TINTA} stroke="none" />
        <path d="M30.5 46 C29 51 31 54.5 33 52.5 C34.5 51 34.5 48 33.5 46 Z" fill="#d9443a" strokeWidth="2" />
        <path d="M26.5 39.5 L37.5 39.5 L32 47 Z" fill="#f2b43a" />
        <path d="M27.5 43 H36.5" fill="none" strokeWidth="1.4" />
        <circle cx="18" cy="42" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
        <circle cx="46" cy="42" r="3" fill="#f2a28f" stroke="none" opacity=".8" />
      </g>
    </svg>
  );
}

/** Todos los personajes. Los que se ganan con logros están en perfil/logros.ts (sus recompensas). */
export const ANIMALES = [
  { id: "raton", nombre: "Ratón", Dibujo: Raton },
  { id: "zorra", nombre: "Zorra", Dibujo: Zorra },
  { id: "conejo", nombre: "Conejo", Dibujo: Conejo },
  { id: "erizo", nombre: "Erizo", Dibujo: Erizo },
  { id: "mapache", nombre: "Mapache", Dibujo: Mapache },
  { id: "rana", nombre: "Rana", Dibujo: Rana },
  { id: "ardilla", nombre: "Ardilla", Dibujo: Ardilla },
  { id: "tortuga", nombre: "Tortuga", Dibujo: Tortuga },
  { id: "buho", nombre: "Búho", Dibujo: Buho },
  { id: "oso", nombre: "Osa", Dibujo: Oso },
  { id: "tejon", nombre: "Tejón", Dibujo: Tejon },
  { id: "gato", nombre: "Gata", Dibujo: Gato },
  { id: "nutria", nombre: "Nutria", Dibujo: Nutria },
  { id: "pato", nombre: "Pato", Dibujo: Pato },
  { id: "ciervo", nombre: "Ciervo", Dibujo: Ciervo },
  { id: "castor", nombre: "Castor", Dibujo: Castor },
  { id: "oveja", nombre: "Oveja", Dibujo: Oveja },
  { id: "gallina", nombre: "Gallina", Dibujo: Gallina },
];

export function Animal({ id, className }: { id: string; className?: string }) {
  const { Dibujo } = ANIMALES.find((a) => a.id === id) ?? ANIMALES[0];
  return <Dibujo className={className} />;
}
