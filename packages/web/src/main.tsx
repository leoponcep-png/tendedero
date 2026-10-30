import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { iniciarPlataforma, probarInvitacion } from "./plataforma";
import { AvisoInvitacion } from "./plataforma/AvisoInvitacion";
import "./estilos.css";
import "./tema.css";

// Steam, si el juego corre en la aplicación de escritorio con Steam abierto; si no, todo sigue como siempre.
iniciarPlataforma();
// Para probar el aviso de invitación sin Steam: tendederoProbarInvitacion("Lu", "código") en la consola.
if (import.meta.env.DEV) Object.assign(window, { tendederoProbarInvitacion: probarInvitacion });

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <App />
    <AvisoInvitacion />
  </StrictMode>,
);
