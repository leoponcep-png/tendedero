import { ajustesIniciales, aplicar, crearPartida, normalizarAjustes, type Datos, type Jugada, type Partida } from "@tendedero/motor";
import { useEffect, useMemo, useState } from "react";
import { resultadoDatos } from "./datos";
import { guardarSala, leerSala, nuevaSala } from "./online/anfitrion";
import { nuevoCodigo } from "./online/protocolo";
import { PantallaAjustes } from "./pantallas/Ajustes";
import { ErroresDatos } from "./pantallas/ErroresDatos";
import { PantallaInicio } from "./pantallas/Inicio";
import { Mesa } from "./pantallas/Mesa";
import { SalaAnfitrion, SalaInvitado } from "./pantallas/SalaOnline";
import { MesaBosque } from "./prototipos/MesaBosque";
import { MesaCartas } from "./prototipos/MesaCartas";
import { MesaFinal } from "./prototipos/MesaFinal";
import { Pizarra } from "./prototipos/Pizarra";
import { Prototipos } from "./prototipos/Prototipos";
import { TallerPrendas } from "./prototipos/TallerPrendas";

// Cada pantalla tiene su dirección (#/local, #/crear, #/anfitrion/código, #/sala/código) para que el enlace
// de una sala lleve directo a ella y recargar no saque a nadie de la partida.
// La versión para enseñar se construye con VITE_INICIO=/prototipos/e para que abra directamente el juego.
const INICIO: string = import.meta.env.VITE_INICIO || "/";

function useRuta(): [string, (ruta: string) => void] {
  const leer = () => location.hash.replace(/^#/, "") || INICIO;
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const alCambiar = () => setRuta(leer());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  return [ruta, (r: string) => (location.hash = r)];
}

export function App() {
  if (!resultadoDatos.ok) return <ErroresDatos errores={resultadoDatos.errores} />;
  return <Rutas datos={resultadoDatos.datos} />;
}

function Rutas({ datos }: { datos: Datos }) {
  const [ruta, ir] = useRuta();
  const [, seccion, codigo, ...resto] = ruta.split("/");
  const inicio = () => ir("/");

  if (seccion === "prototipos" && (codigo ?? "e") === "e") return <MesaFinal key={resto.join("/")} onVersion={(v) => ir(`/prototipos/${v}`)} onVolver={inicio} datos={datos} ruta={resto} />;
  if (seccion === "prototipos" && codigo === "pizarra") return <Pizarra onVersion={(v) => ir(`/prototipos/${v}`)} onVolver={inicio} />;
  if (seccion === "prototipos" && codigo === "taller") return <TallerPrendas onVersion={(v) => ir(`/prototipos/${v}`)} onVolver={inicio} />;
  if (seccion === "prototipos" && (codigo ?? "d") === "d") return <MesaBosque onVersion={(v) => ir(`/prototipos/${v}`)} onVolver={inicio} />;
  if (seccion === "prototipos" && codigo === "a2") return <MesaCartas onVersion={(v) => ir(`/prototipos/${v}`)} onVolver={inicio} />;
  if (seccion === "prototipos") return <Prototipos version={codigo ?? "a"} onVersion={(v) => ir(`/prototipos/${v}`)} onVolver={inicio} />;
  if (seccion === "local") return <Simulador datos={datos} onVolver={inicio} />;
  if (seccion === "crear") return <CrearSala datos={datos} onVolver={inicio} onCreada={(c) => ir(`/anfitrion/${c}`)} />;
  if (seccion === "anfitrion" && codigo) {
    const sala = leerSala(codigo);
    if (!sala) {
      return (
        <main className="sala">
          <h1>Sala {codigo}</h1>
          <p>Esta sala no está guardada en este navegador. Si te la han pasado, entra como invitado.</p>
          <div className="acciones-barra">
            <button onClick={inicio}>Volver</button>
            <button className="principal" onClick={() => ir(`/sala/${codigo}`)}>
              Entrar como invitado
            </button>
          </div>
        </main>
      );
    }
    return <SalaAnfitrion key={codigo} inicial={sala} datos={datos} onSalir={inicio} />;
  }
  if (seccion === "sala" && codigo) return <SalaInvitado key={codigo} codigo={codigo} onSalir={inicio} />;
  return <PantallaInicio onLocal={() => ir("/local")} onCrear={() => ir("/crear")} onUnirse={(c) => ir(`/sala/${c}`)} />;
}

function leerNombre(): string {
  try {
    return localStorage.getItem("tendedero-nombre") ?? "";
  } catch {
    return "";
  }
}

/** Reglas de la sala online: las mismas que en local; al crearla se abre la sala de espera. */
function CrearSala({ datos, onVolver, onCreada }: { datos: Datos; onVolver: () => void; onCreada: (codigo: string) => void }) {
  const [borrador, setBorrador] = useState(() => ajustesIniciales(datos));
  const [nombreConfig, setNombreConfig] = useState("");
  const ajustes = useMemo(() => normalizarAjustes(borrador, datos), [borrador, datos]);
  return (
    <PantallaAjustes
      datos={datos}
      ajustes={ajustes}
      onCambio={setBorrador}
      nombreConfig={nombreConfig}
      onNombreConfig={setNombreConfig}
      titulo="Partida online · reglas"
      textoEmpezar="Crear sala"
      onVolver={onVolver}
      onEmpezar={() => {
        const codigo = nuevoCodigo();
        guardarSala(nuevaSala(codigo, ajustes, leerNombre() || "Anfitrión"));
        onCreada(codigo);
      }}
    />
  );
}

/** Modo local: un mismo ordenador juega por todos y puede deshacer. */
function Simulador({ datos, onVolver }: { datos: Datos; onVolver: () => void }) {
  const [borrador, setBorrador] = useState(() => ajustesIniciales(datos));
  const [nombreConfig, setNombreConfig] = useState("");
  // Cada jugada añade una partida nueva; deshacer es quitar la última.
  const [historial, setHistorial] = useState<Partida[]>([]);

  // Si se editan los JSON con la página abierta, los ajustes se adaptan a los datos nuevos.
  const ajustes = useMemo(() => normalizarAjustes(borrador, datos), [borrador, datos]);
  const partida = historial.at(-1);

  if (!partida) {
    return (
      <PantallaAjustes
        datos={datos}
        ajustes={ajustes}
        onCambio={setBorrador}
        nombreConfig={nombreConfig}
        onNombreConfig={setNombreConfig}
        onVolver={onVolver}
        onEmpezar={() => setHistorial([crearPartida(datos, ajustes)])}
      />
    );
  }

  function jugar(j: Jugada): string | null {
    const r = aplicar(partida!, j);
    if (!r.ok) return r.motivo;
    setHistorial((h) => [...h, r.partida]);
    return null;
  }

  return (
    <Mesa
      partida={partida}
      nombreConfig={nombreConfig}
      onJugada={jugar}
      puedeDeshacer={historial.length > 1}
      onDeshacer={() => setHistorial((h) => h.slice(0, -1))}
      onSalir={() => {
        if (confirm("¿Abandonar la partida y volver a los ajustes?")) setHistorial([]);
      }}
      onNueva={() => setHistorial([])}
    />
  );
}
