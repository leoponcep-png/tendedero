import { useState, type CSSProperties, type HTMLAttributes } from "react";
import { t } from "../i18n";
import { PrendaBosque } from "./ArteBosque";
import { GotaCozy, PrendaCozy, tieneDibujoCozy, tonosDe } from "./ArtePrendas";
import { CartaCuerdaBosque } from "./CartasBosque";
import { COLORES, TIPOS, type Prenda } from "./Prototipos";
import "./carta-prenda.css";

// Humedad «física»: la carta de prenda va por debajo de la carta de cuerda y lleva la escala de humedad arriba.
// Lo que asoma por debajo del borde es la humedad que le queda; al secarse se sube un paso y se esconde una
// gota. Tres diseños de escala para comparar, con botones para secar y mojar.

/**
 * Filas de la escala: la humedad máxima de una prenda (`humedadMaxima` de los ajustes). Al mojarla la carta baja
 * una fila y asoma una gota más; al secarse sube. Va a la par con --filas del CSS.
 */
export const MAXIMO = 4;

export type Variante = "columna" | "regla" | "filas";

const VARIANTES: { id: Variante; titulo: string; texto: string }[] = [
  { id: "columna", titulo: "Columna de gotas", texto: "Una gota por fila. Cuentas las gotas que asoman." },
  { id: "regla", titulo: "Regla numerada", texto: "Como una cinta métrica: el número que asoma justo bajo el borde es la humedad." },
  { id: "filas", titulo: "Filas que menguan", texto: "Cada fila tiene una gota menos que la de encima: la primera que asoma dice cuántas quedan." },
];

type Colgada = { prenda: Prenda; inicio: number; cuerda: number };

const inicial = (): Colgada[] => [
  { prenda: { id: "h1", tipo: "camiseta", color: COLORES.rojo, humedad: 2 }, inicio: 0, cuerda: 0 },
  { prenda: { id: "h2", tipo: "calcetin", color: COLORES.azul, humedad: 1 }, inicio: 2, cuerda: 0 },
  { prenda: { id: "h3", tipo: "toalla", color: COLORES.amarillo, humedad: 3 }, inicio: 0, cuerda: 1 },
];

/** Escala de humedad impresa arriba de la carta de prenda (fila 0 es la de más arriba). */
export function Escala({ variante }: { variante: Variante }) {
  return (
    <div className={`hp-escala hp-${variante}`}>
      {Array.from({ length: MAXIMO }, (_, fila) => {
        const valor = MAXIMO - fila;
        return (
          <div key={fila} className="hp-fila">
            {variante === "columna" && (
              <svg viewBox="-7 -9 14 16">
                <GotaCozy />
              </svg>
            )}
            {variante === "regla" && (
              <>
                <span className="hp-marca" />
                <b>{valor}</b>
                <svg viewBox="-7 -9 14 16">
                  <GotaCozy />
                </svg>
              </>
            )}
            {variante === "filas" && (
              <svg viewBox={`0 -9 ${valor * 13} 16`} style={{ width: `${valor * 0.95}em` }}>
                {Array.from({ length: valor }, (_, i) => (
                  <GotaCozy key={i} x={6.5 + i * 13} />
                ))}
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CartaHumeda({ c, variante }: { c: Colgada; variante: Variante }) {
  const esp = TIPOS[c.prenda.tipo].espacios;
  const seca = c.prenda.humedad === 0;
  return (
    <div
      className={`hp ${seca ? "seca" : ""}`}
      style={{ "--inicio": c.inicio, "--espacios": esp, "--h": c.prenda.humedad, "--c": `var(--p-${Object.entries(COLORES).find(([, h]) => h === c.prenda.color)?.[0]})` } as CSSProperties}
    >
      <Escala variante={variante} />
      <div className="hp-ilustra">
        <PrendaBosque tipo={c.prenda.tipo} color={c.prenda.color} espacios={esp} className="hp-arte" />
      </div>
      <div className="hp-pie">
        <span className="pb-puntos">{c.prenda.puntos ?? TIPOS[c.prenda.tipo].puntos}</span>
        {seca && <span className="hp-sello">¡Seca!</span>}
      </div>
    </div>
  );
}

/** Carta de prenda de tamaño único: escala de humedad arriba, ilustración, puntos y cuántas pinzas gasta. */
export function CartaPrendaHumeda({ p, variante = "columna", className, style, ...resto }: { p: Prenda; variante?: Variante } & HTMLAttributes<HTMLDivElement>) {
  const esp = TIPOS[p.tipo].espacios;
  const nombre = Object.entries(COLORES).find(([, h]) => h === p.color)?.[0];
  return (
    <div
      {...resto}
      className={`hp hp-unica ${p.humedad === 0 ? "seca" : ""} ${className ?? ""}`}
      style={{ "--h": p.humedad, "--c": `var(--p-${nombre})`, "--fondo": tonosDe(p.color).fondo, ...style } as CSSProperties}
    >
      <Escala variante={variante} />
      <div className="hp-ilustra">
        {tieneDibujoCozy(p.tipo) ? (
          <PrendaCozy tipo={p.tipo} color={p.color} className="hp-arte" />
        ) : (
          <PrendaBosque tipo={p.tipo} color={p.color} espacios={esp} className="hp-arte" />
        )}
      </div>
      <div className="hp-pie">
        <span className="pb-puntos">{p.puntos ?? TIPOS[p.tipo].puntos}</span>
        <span className="hp-coste" title={t("carta.gastaPinzas", { n: esp })}>
          {Array.from({ length: esp }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      </div>
    </div>
  );
}

function Maqueta({ variante, colgadas }: { variante: Variante; colgadas: Colgada[] }) {
  return (
    <div className="hum-linea">
      {[null, "secado-rapido"].map((efecto, i) => (
        <div key={i} className="hum-cuerda">
          <CartaCuerdaBosque efecto={efecto} modo="borde" className="hum-cuerda-carta" />
          {colgadas
            .filter((c) => c.cuerda === i)
            .map((c) => (
              <CartaHumeda key={c.prenda.id} c={c} variante={variante} />
            ))}
        </div>
      ))}
    </div>
  );
}

export function HumedadTaller() {
  const [colgadas, setColgadas] = useState(inicial);
  // Secado rápido (la segunda cuerda) quita 2 de humedad por día.
  const secar = () => setColgadas((l) => l.map((c) => ({ ...c, prenda: { ...c.prenda, humedad: Math.max(0, c.prenda.humedad - (c.cuerda === 1 ? 2 : 1)) } })));
  const mojar = () => setColgadas((l) => l.map((c) => ({ ...c, prenda: { ...c.prenda, humedad: Math.min(MAXIMO, c.prenda.humedad + 1) } })));

  return (
    <section className="hum">
      <div className="taller-intro">
        <h1>La humedad, debajo de la cuerda</h1>
        <p>
          La carta de prenda se mete por debajo de la carta de cuerda y lleva arriba su escala de humedad. Lo que asoma es la humedad que le queda: al secarse se
          sube un paso y se esconde una gota. La ropa mojada cuelga más baja y va subiendo según se seca.
        </p>
        <div className="hum-botones">
          <button className="principal" onClick={secar}>
            Pasar un día de sol (−1, −2 en secado rápido)
          </button>
          <button onClick={mojar}>Que llueva (+1)</button>
          <button onClick={() => setColgadas(inicial())}>Volver a empezar</button>
        </div>
      </div>
      <div className="hum-variantes">
        {VARIANTES.map((v) => (
          <div key={v.id} className="hum-variante taller-opcion">
            <h2>{v.titulo}</h2>
            <p>{v.texto}</p>
            <div className="taller-mesa hum-mesa">
              <Maqueta variante={v.id} colgadas={colgadas} />
            </div>
          </div>
        ))}
      </div>
      <div className="taller-opcion hum-notas">
        <h2>Para que funcione en la mesa</h2>
        <ul>
          <li>
            <b>Paso de unos 7 mm por gota.</b> Con 5 de humedad como máximo, la escala mide 35 mm y cabe de sobra bajo la carta de cuerda.
          </li>
          <li>
            <b>Las cartas de cuerda cambian:</b> la cuerda y las pinzas van en el borde de abajo, y arriba queda sitio para el nombre y el texto de la habilidad.
          </li>
          <li>
            <b>Las líneas van más separadas:</b> debajo de cada línea tiene que caber la prenda más mojada colgando.
          </li>
          <li>
            <b>Para que no se mueva sin querer:</b> el borde de la carta de cuerda tapa la fila exacta, así que basta con alinear la raya de la escala con el borde.
            Un tapete de neopreno ayuda a que no resbalen.
          </li>
          <li>
            <b>Te recomiendo «Filas que menguan»:</b> la primera fila que asoma ya dice la humedad sin contar, y se lee bien desde el otro lado de la mesa.
          </li>
        </ul>
      </div>
    </section>
  );
}
