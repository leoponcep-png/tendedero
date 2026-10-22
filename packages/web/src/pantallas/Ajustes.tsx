import {
  cestasPorDefecto,
  normalizarAjustes,
  revisarAjustes,
  type Ajustes,
  type Datos,
  type DefCarta,
  type DefObjetivo,
} from "@tendedero/motor";
import { useEffect, useMemo, useState } from "react";
import { borrarConfiguracion, guardarConfiguracion, listarConfiguraciones, type ConfiguracionGuardada } from "../api";

interface Props {
  datos: Datos;
  ajustes: Ajustes;
  onCambio: (a: Ajustes) => void;
  nombreConfig: string;
  onNombreConfig: (nombre: string) => void;
  onEmpezar: () => void;
}

export function PantallaAjustes({ datos, ajustes, onCambio, nombreConfig, onNombreConfig, onEmpezar }: Props) {
  const revision = useMemo(() => revisarAjustes(ajustes, datos), [ajustes, datos]);

  // Copia, cambia y entrega: así cada campo solo dice qué toca.
  const cambiar = (fn: (a: Ajustes) => void) => {
    const nuevo = structuredClone(ajustes);
    fn(nuevo);
    onCambio(nuevo);
  };

  return (
    <main className="pagina ajustes">
      <header className="cabecera-ajustes">
        <div>
          <h1>Tendedero · ajustes de la partida</h1>
          <p className="nota">
            Los valores por defecto salen de <code>data/</code>. Al empezar, quedan bloqueados hasta que termine la partida.
          </p>
        </div>
        <button className="principal" disabled={revision.errores.length > 0} onClick={onEmpezar}>
          Empezar partida
        </button>
      </header>

      {(revision.errores.length > 0 || revision.avisos.length > 0) && (
        <section className="revision">
          {revision.errores.map((e) => (
            <p key={e} className="error">✖ {e}</p>
          ))}
          {revision.avisos.map((a) => (
            <p key={a} className="aviso">⚠ {a}</p>
          ))}
        </section>
      )}

      <Configuraciones datos={datos} ajustes={ajustes} onCambio={onCambio} nombre={nombreConfig} onNombre={onNombreConfig} />

      <div className="rejilla-ajustes">
        <fieldset>
          <legend>Partida</legend>
          <Numero
            etiqueta="Jugadores"
            valor={ajustes.jugadores}
            min={2}
            max={4}
            onCambio={(n) =>
              cambiar((a) => {
                a.jugadores = n;
                a.cestas.numero = cestasPorDefecto(datos, n);
              })
            }
          />
          <Numero etiqueta="Umbral de final (puntos)" valor={ajustes.umbralFinal} min={1} onCambio={(n) => cambiar((a) => void (a.umbralFinal = n))} />
          <Numero etiqueta="Límite de mano" valor={ajustes.limiteMano} min={1} onCambio={(n) => cambiar((a) => void (a.limiteMano = n))} />
          <label className="campo">
            <span>Semilla</span>
            <input
              type="text"
              placeholder="vacía = aleatoria"
              value={ajustes.semilla}
              onChange={(e) => cambiar((a) => void (a.semilla = e.target.value))}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Cartas por turno</legend>
          <Par etiqueta="Robo por turno" valor={ajustes.roboPorTurno} onCambio={(v) => cambiar((a) => void (a.roboPorTurno = v))} />
          <Par etiqueta="Se pueden jugar" valor={ajustes.jugablesPorTurno} onCambio={(v) => cambiar((a) => void (a.jugablesPorTurno = v))} />
          <Par etiqueta="Mano inicial" valor={ajustes.manoInicial} onCambio={(v) => cambiar((a) => void (a.manoInicial = v))} />
        </fieldset>

        <fieldset>
          <legend>Cestas</legend>
          <Numero etiqueta="Número de cestas" valor={ajustes.cestas.numero} min={1} onCambio={(n) => cambiar((a) => void (a.cestas.numero = n))} />
          <Numero etiqueta="Prendas por cesta" valor={ajustes.cestas.prendasPorCesta} min={1} onCambio={(n) => cambiar((a) => void (a.cestas.prendasPorCesta = n))} />
        </fieldset>

        <fieldset>
          <legend>Tendedero y objetivos</legend>
          <Numero etiqueta="Líneas por jugador" valor={ajustes.tendedero.lineas} min={1} onCambio={(n) => cambiar((a) => void (a.tendedero.lineas = n))} />
          <Numero etiqueta="Cartas de cuerda por línea" valor={ajustes.tendedero.cartasPorLinea} min={1} onCambio={(n) => cambiar((a) => void (a.tendedero.cartasPorLinea = n))} />
          <Numero etiqueta="Objetivos comunes" valor={ajustes.objetivos.comunes} min={0} onCambio={(n) => cambiar((a) => void (a.objetivos.comunes = n))} />
          <Numero etiqueta="Secretos repartidos (se queda 1)" valor={ajustes.objetivos.secretosRepartidos} min={0} onCambio={(n) => cambiar((a) => void (a.objetivos.secretosRepartidos = n))} />
        </fieldset>
      </div>

      <fieldset>
        <legend>Prendas</legend>
        <table className="tabla-prendas">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Por color</th>
              <th>Espacios</th>
              <th>Humedad inicial</th>
              <th>Puntos al secar</th>
            </tr>
          </thead>
          <tbody>
            {datos.tipos.map((t) => {
              const v = ajustes.prendas[t.id];
              const campo = (clave: keyof typeof v, min: number) => (
                <td>
                  <EntradaNumero valor={v[clave]} min={min} onCambio={(n) => cambiar((a) => void (a.prendas[t.id][clave] = n))} />
                </td>
              );
              return (
                <tr key={t.id}>
                  <td>{t.nombre}</td>
                  <td className="fijo" title="Se cambia en data/prendas.json">
                    {t.porColor} × {datos.colores.length} = {t.porColor * datos.colores.length}
                  </td>
                  {campo("espacios", 1)}
                  {campo("humedad", 0)}
                  {campo("puntos", -99)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </fieldset>

      <SeleccionCartas datos={datos} ajustes={ajustes} onCambio={onCambio} />
    </main>
  );
}

function Configuraciones({
  datos,
  ajustes,
  onCambio,
  nombre,
  onNombre,
}: {
  datos: Datos;
  ajustes: Ajustes;
  onCambio: (a: Ajustes) => void;
  nombre: string;
  onNombre: (n: string) => void;
}) {
  const [lista, setLista] = useState<ConfiguracionGuardada[]>([]);
  const [elegida, setElegida] = useState("");
  const [mensaje, setMensaje] = useState("");

  const refrescar = () => listarConfiguraciones().then(setLista).catch((e) => setMensaje(String(e)));
  useEffect(() => {
    refrescar();
  }, []);

  const avisar = (m: string) => {
    setMensaje(m);
    setTimeout(() => setMensaje(""), 3000);
  };

  return (
    <fieldset className="configuraciones">
      <legend>Configuraciones guardadas</legend>
      <div className="fila">
        <select value={elegida} onChange={(e) => setElegida(e.target.value)}>
          <option value="">— elige una —</option>
          {lista.map((c) => (
            <option key={c.archivo} value={c.archivo}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button
          disabled={!elegida}
          onClick={() => {
            const c = lista.find((x) => x.archivo === elegida);
            if (!c) return;
            onCambio(normalizarAjustes(c.ajustes, datos));
            onNombre(c.nombre);
            avisar(`Cargada «${c.nombre}».`);
          }}
        >
          Cargar
        </button>
        <button
          disabled={!elegida}
          onClick={async () => {
            const c = lista.find((x) => x.archivo === elegida);
            if (!c || !confirm(`¿Borrar «${c.nombre}»?`)) return;
            await borrarConfiguracion(c.archivo);
            setElegida("");
            refrescar();
          }}
        >
          Borrar
        </button>
        <span className="separador" />
        <input type="text" placeholder="Nombre, p. ej. 1-3-6 con umbral 40" value={nombre} onChange={(e) => onNombre(e.target.value)} />
        <button
          disabled={!nombre.trim()}
          onClick={async () => {
            try {
              const { archivo } = await guardarConfiguracion(nombre, ajustes);
              await refrescar();
              setElegida(archivo);
              avisar(`Guardada en configuraciones/${archivo}`);
            } catch (e) {
              avisar(String(e));
            }
          }}
        >
          Guardar
        </button>
        <button onClick={() => (onCambio(normalizarAjustes({}, datos)), onNombre(""))}>Valores por defecto</button>
      </div>
      {mensaje && <p className="nota">{mensaje}</p>}
    </fieldset>
  );
}

const NOMBRES_MAZO: Record<string, string> = {
  cuerdas: "Cuerdas",
  acciones: "Acciones",
  climas: "Climas",
  eventos: "Eventos",
  objetivos: "Objetivos",
};

function SeleccionCartas({ datos, ajustes, onCambio }: { datos: Datos; ajustes: Ajustes; onCambio: (a: Ajustes) => void }) {
  const todas: (DefCarta | DefObjetivo)[] = [...datos.cartas, ...datos.objetivos];
  const mazoDe = (c: DefCarta | DefObjetivo) => ("mazo" in c ? c.mazo : "objetivos");
  const grupoDe = (c: DefCarta | DefObjetivo) => ("grupo" in c ? c.grupo : c.uso);

  const poner = (ids: string[], valor: boolean) =>
    onCambio({ ...ajustes, incluidas: { ...ajustes.incluidas, ...Object.fromEntries(ids.map((id) => [id, valor])) } });

  const mazos = [...new Set(todas.map(mazoDe))];
  return (
    <fieldset>
      <legend>Cartas que entran en la partida</legend>
      <p className="nota">Las cartas «pendiente» no pueden entrar hasta que su efecto esté definido y programado.</p>
      <div className="rejilla-cartas">
        {mazos.map((mazo) => {
          const delMazo = todas.filter((c) => mazoDe(c) === mazo);
          const grupos = [...new Set(delMazo.map(grupoDe))];
          return (
            <div key={mazo} className="mazo-ajustes">
              <h3>{NOMBRES_MAZO[mazo] ?? mazo}</h3>
              {grupos.map((grupo) => {
                const cartas = delMazo.filter((c) => grupoDe(c) === grupo);
                const definidas = cartas.filter((c) => c.estado === "definida").map((c) => c.id);
                const todasDentro = definidas.length > 0 && definidas.every((id) => ajustes.incluidas[id] !== false);
                return (
                  <div key={grupo} className="grupo-ajustes">
                    <label className="grupo-titulo">
                      <input type="checkbox" disabled={!definidas.length} checked={todasDentro} onChange={(e) => poner(definidas, e.target.checked)} />
                      {grupo}
                    </label>
                    {cartas.map((c) => {
                      const pendiente = c.estado === "pendiente";
                      return (
                        <label key={c.id} className={`carta-ajuste ${pendiente ? "pendiente" : ""}`} title={c.texto}>
                          <input
                            type="checkbox"
                            disabled={pendiente}
                            checked={!pendiente && ajustes.incluidas[c.id] !== false}
                            onChange={(e) => poner([c.id], e.target.checked)}
                          />
                          {c.nombre}
                          {"copias" in c && <span className="copias">×{c.copias}</span>}
                          {pendiente && <span className="etiqueta-pendiente">pendiente</span>}
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function EntradaNumero({ valor, min, max, onCambio }: { valor: number; min?: number; max?: number; onCambio: (n: number) => void }) {
  return (
    <input
      type="number"
      value={valor}
      min={min}
      max={max}
      onChange={(e) => {
        const n = e.target.valueAsNumber;
        if (Number.isFinite(n)) onCambio(Math.round(n));
      }}
    />
  );
}

function Numero(props: { etiqueta: string; valor: number; min?: number; max?: number; onCambio: (n: number) => void }) {
  return (
    <label className="campo">
      <span>{props.etiqueta}</span>
      <EntradaNumero {...props} />
    </label>
  );
}

function Par({
  etiqueta,
  valor,
  onCambio,
}: {
  etiqueta: string;
  valor: { cuerdas: number; acciones: number };
  onCambio: (v: { cuerdas: number; acciones: number }) => void;
}) {
  return (
    <div className="campo par">
      <span>{etiqueta}</span>
      <label>
        cuerdas <EntradaNumero valor={valor.cuerdas} min={0} onCambio={(n) => onCambio({ ...valor, cuerdas: n })} />
      </label>
      <label>
        acciones <EntradaNumero valor={valor.acciones} min={0} onCambio={(n) => onCambio({ ...valor, acciones: n })} />
      </label>
    </div>
  );
}
