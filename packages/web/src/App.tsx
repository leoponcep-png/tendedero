import { ajustesIniciales, aplicar, crearPartida, normalizarAjustes, type Datos, type Jugada, type Partida } from "@tendedero/motor";
import { useMemo, useState } from "react";
import { resultadoDatos } from "./datos";
import { PantallaAjustes } from "./pantallas/Ajustes";
import { ErroresDatos } from "./pantallas/ErroresDatos";
import { Mesa } from "./pantallas/Mesa";

export function App() {
  if (!resultadoDatos.ok) return <ErroresDatos errores={resultadoDatos.errores} />;
  return <Simulador datos={resultadoDatos.datos} />;
}

function Simulador({ datos }: { datos: Datos }) {
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
