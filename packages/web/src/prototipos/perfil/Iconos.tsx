import type { ReactElement } from "react";
import { TINTA } from "../ArteBosque";

// Iconos de los logros y del menú: dibujitos de tinta con colores planos, como las cartas.

export type Icono =
  | "cesta"
  | "pinza"
  | "medalla"
  | "copa"
  | "corona"
  | "casa"
  | "sol"
  | "camiseta"
  | "secreto"
  | "mundo"
  | "llama"
  | "estrella"
  | "rayo"
  | "paraguas"
  | "robot"
  | "diana"
  | "candado"
  | "amigos"
  | "grafica"
  | "perfil"
  | "copiar"
  | "enlace";

const trazo = { stroke: TINTA, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const DIBUJOS: Record<Icono, ReactElement> = {
  cesta: (
    <>
      <path d="M9 13 C9 6 23 6 23 13" fill="none" strokeWidth="2.6" />
      <path d="M4 13 H28 L25 27 H7 Z" fill="#c7955a" />
      <path d="M8 17 H24 M9 21 H23 M13 13 L12 27 M19 13 L20 27" fill="none" strokeWidth="1.4" />
    </>
  ),
  pinza: (
    <>
      <path d="M11 3 L15 3 L16 29 L12 29 Z" fill="#d9b27a" />
      <path d="M17 3 L21 3 L20 29 L16 29 Z" fill="#e8c48e" />
      <circle cx="16" cy="17" r="3.4" fill="#9aa3ab" />
    </>
  ),
  medalla: (
    <>
      <path d="M10 3 L16 14 L22 3" fill="#c2457a" />
      <path d="M13 3 L16 9 L19 3" fill="none" strokeWidth="1.4" />
      <circle cx="16" cy="20" r="8.5" fill="#f2c25a" />
      <path d="M16 15.5 L17.4 18.6 L20.6 18.9 L18.2 21 L18.9 24.2 L16 22.6 L13.1 24.2 L13.8 21 L11.4 18.9 L14.6 18.6 Z" fill="#fff4d0" strokeWidth="1.3" />
    </>
  ),
  copa: (
    <>
      <path d="M8 6 C3 6 3 13 9.5 14 M24 6 C29 6 29 13 22.5 14" fill="none" />
      <path d="M8 4 H24 C24 13 20 17 16 17 C12 17 8 13 8 4 Z" fill="#f2c25a" />
      <path d="M14 17 L13 23 H19 L18 17" fill="#e0a83a" />
      <path d="M9 23 H23 V28 H9 Z" fill="#8a5a36" />
      <path d="M12 7 C12 11 13 13 14.5 14" fill="none" stroke="#fff4d0" strokeWidth="1.6" />
    </>
  ),
  corona: (
    <>
      <path d="M4 10 L10 16 L16 6 L22 16 L28 10 L26 25 H6 Z" fill="#f2c25a" />
      <path d="M6 21 H26" fill="none" strokeWidth="1.6" />
      <circle cx="16" cy="6" r="2" fill="#c2457a" strokeWidth="1.4" />
      <circle cx="4" cy="10" r="1.8" fill="#3f6fb5" strokeWidth="1.4" />
      <circle cx="28" cy="10" r="1.8" fill="#3f6fb5" strokeWidth="1.4" />
    </>
  ),
  casa: (
    <>
      <path d="M4 15 L16 5 L28 15" fill="none" strokeWidth="2.6" />
      <path d="M7 13 V27 H25 V13 L16 6 Z" fill="#e8cfa6" />
      <path d="M13 27 V19 H19 V27" fill="#c4643d" />
      <path d="M7 11 L16 4 L25 11" fill="none" stroke="#c4643d" strokeWidth="3" />
      <path d="M4 15 L16 5 L28 15" fill="none" />
    </>
  ),
  sol: (
    <>
      <path d="M16 2 V6 M16 26 V30 M2 16 H6 M26 16 H30 M6 6 L9 9 M23 23 L26 26 M26 6 L23 9 M9 23 L6 26" fill="none" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="7.5" fill="#f2c25a" />
      <path d="M12.5 17.5 Q16 20.5 19.5 17.5" fill="none" strokeWidth="1.6" />
    </>
  ),
  camiseta: (
    <>
      <path d="M11 4 L4 8 L7 14 L10 12.5 V28 H22 V12.5 L25 14 L28 8 L21 4 C20 7 12 7 11 4 Z" fill="#7fb6d9" />
      <path d="M13 17 H19 M13 21 H19" fill="none" stroke="#fff" strokeWidth="1.8" />
    </>
  ),
  secreto: (
    <>
      <path d="M3 9 H29 V25 H3 Z" fill="#f2e6cc" />
      <path d="M3 9 L16 19 L29 9" fill="none" />
      <circle cx="16" cy="19" r="4" fill="#b5523b" />
      <path d="M14.5 19 H17.5" fill="none" stroke="#f2c2b0" strokeWidth="1.4" />
    </>
  ),
  mundo: (
    <>
      <circle cx="16" cy="16" r="12" fill="#7fb6d9" />
      <path d="M8 9 C12 10 12 14 9 16 C7 18 9 22 12 23 M20 5 C18 9 22 11 24 12 C27 13 26 18 23 19 C20 21 21 25 19 28" fill="#7fbf5a" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="12" fill="none" />
    </>
  ),
  llama: (
    <>
      <path d="M16 3 C19 9 26 12 26 20 C26 26 21 29 16 29 C11 29 6 26 6 20 C6 15 9 13 11 9 C12 13 14 14 15 14 C14 10 14 6 16 3 Z" fill="#ef8f3a" />
      <path d="M16 15 C18 19 21 20 21 24 C21 27 18.5 28 16 28 C13.5 28 11 27 11 24 C11 21 14 19 16 15 Z" fill="#f2c25a" strokeWidth="1.6" />
    </>
  ),
  estrella: (
    <path d="M16 3 L19.8 11.2 L28.6 12.2 L22 18.2 L23.8 27 L16 22.5 L8.2 27 L10 18.2 L3.4 12.2 L12.2 11.2 Z" fill="#f2c25a" />
  ),
  rayo: <path d="M19 2 L6 18 H15 L12 30 L26 12 H17 Z" fill="#f2c25a" />,
  paraguas: (
    <>
      <path d="M3 16 C3 8 9 4 16 4 C23 4 29 8 29 16 C27 14 24 14 22.3 16 C20.6 14 18 14 16 16 C14 14 11.4 14 9.7 16 C8 14 5 14 3 16 Z" fill="#c2457a" />
      <path d="M16 16 V26 C16 29 12 29 12 26" fill="none" />
      <path d="M16 4 C13 7 12 11 12.5 15 M16 4 C19 7 20 11 19.5 15" fill="none" strokeWidth="1.4" />
    </>
  ),
  robot: (
    <>
      <path d="M16 3 V7" fill="none" />
      <circle cx="16" cy="3" r="1.8" fill="#c2457a" strokeWidth="1.4" />
      <rect x="5" y="7" width="22" height="17" rx="5" fill="#9aa3ab" />
      <circle cx="11.5" cy="15" r="3" fill="#f2c25a" strokeWidth="1.6" />
      <circle cx="20.5" cy="15" r="3" fill="#f2c25a" strokeWidth="1.6" />
      <path d="M12 20.5 H20" fill="none" strokeWidth="1.6" />
      <path d="M10 24 V28 H22 V24" fill="#7c858d" />
    </>
  ),
  diana: (
    <>
      <circle cx="15" cy="17" r="12" fill="#f2e6cc" />
      <circle cx="15" cy="17" r="8" fill="#c4643d" />
      <circle cx="15" cy="17" r="4" fill="#f2e6cc" />
      <path d="M15 17 L28 4 M24 4 H28 V8" fill="none" strokeWidth="2.4" />
    </>
  ),
  candado: (
    <>
      <path d="M10 14 V10 C10 3 22 3 22 10 V14" fill="none" strokeWidth="2.8" />
      <rect x="6" y="14" width="20" height="15" rx="3" fill="#e0a83a" />
      <circle cx="16" cy="20.5" r="2.2" fill={TINTA} stroke="none" />
      <path d="M16 21 V25" fill="none" strokeWidth="2.2" />
    </>
  ),
  amigos: (
    <>
      <circle cx="11" cy="11" r="5" fill="#e8cfa6" />
      <path d="M2 27 C2 20 6 17 11 17 C16 17 20 20 20 27 Z" fill="#4f7d6a" />
      <circle cx="22" cy="12" r="4.4" fill="#e8cfa6" />
      <path d="M17.5 19 C19 17.8 20.5 17.5 22 17.5 C26.5 17.5 30 20 30 26 H21" fill="#c4643d" />
    </>
  ),
  grafica: (
    <>
      <path d="M4 4 V28 H28" fill="none" />
      <rect x="8" y="16" width="5" height="12" fill="#4f7d6a" />
      <rect x="15" y="10" width="5" height="18" fill="#f2c25a" />
      <rect x="22" y="6" width="5" height="22" fill="#c4643d" />
    </>
  ),
  perfil: (
    <>
      <circle cx="16" cy="16" r="13" fill="#e8cfa6" />
      <circle cx="16" cy="13" r="5" fill="#fff8" />
      <path d="M7 25.5 C9 20 12 19 16 19 C20 19 23 20 25 25.5" fill="#fff8" />
      <circle cx="16" cy="16" r="13" fill="none" />
    </>
  ),
  copiar: (
    <>
      <rect x="10" y="10" width="17" height="19" rx="3" fill="#fff" />
      <path d="M7 22 H6 C4.9 22 4 21.1 4 20 V6 C4 4.9 4.9 4 6 4 H19 C20.1 4 21 4.9 21 6 V7" fill="none" />
    </>
  ),
  enlace: (
    <>
      <path d="M13.5 18.5 L18.5 13.5" fill="none" />
      <path d="M11 15 L7.5 18.5 C5 21 5 24.5 7.5 26 C9.5 27.5 12 27.3 14 25.2 L17 22.2" fill="none" strokeWidth="2.6" />
      <path d="M21 17 L24.5 13.5 C27 11 27 7.5 24.5 6 C22.5 4.5 20 4.7 18 6.8 L15 9.8" fill="none" strokeWidth="2.6" />
    </>
  ),
};

export function IconoPerfil({ icono, className }: { icono: Icono; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`mp-icono ${className ?? ""}`} aria-hidden>
      <g {...trazo}>{DIBUJOS[icono]}</g>
    </svg>
  );
}
