import type { CSSProperties, ReactNode } from "react";
import { DefsBosque, PinzaBosque } from "./ArteBosque";
import { CartaCuerdaBosque, CartaPrendaBosque } from "./CartasBosque";
import { HumedadTaller } from "./HumedadTaller";
import { Barra, COLORES, TIPOS, type Prenda } from "./Prototipos";
import "./prototipos.css";
import "./mesa-bosque.css";
import "./estilos-dibujo.css";
import "./taller.css";

// Taller de componentes: las formas de colgar prendas en una carta de cuerda, una al lado de otra, para decidir
// el tamaño de las cartas de prenda del juego físico. Las maquetas son orientativas; las medidas van en el texto.

const p = (id: string, tipo: keyof typeof TIPOS, color: keyof typeof COLORES, humedad: number): Prenda => ({ id, tipo, color: COLORES[color], humedad });
const CAMISETA = p("t1", "camiseta", "rojo", 2);
const CALCETIN = p("t2", "calcetin", "azul", 1);
const TOALLA = p("t3", "toalla", "amarillo", 3);

function leerEstilo(): string {
  try {
    return localStorage.getItem("tendedero-estilo") ?? "fusion";
  } catch {
    return "fusion";
  }
}

function Opcion({
  letra,
  titulo,
  idea,
  medidas,
  pros,
  contras,
  reglas,
  recomendada,
  children,
}: {
  letra: string;
  titulo: string;
  idea: string;
  medidas: string;
  pros: string[];
  contras: string[];
  reglas: string;
  recomendada?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`taller-opcion ${recomendada ? "recomendada" : ""}`}>
      <header>
        <span className="taller-letra">{letra}</span>
        <div>
          <h2>{titulo}</h2>
          <p>{idea}</p>
        </div>
        {recomendada && <span className="taller-sello">La que te recomiendo</span>}
      </header>
      <div className="taller-mesa">{children}</div>
      <p className="taller-medidas">{medidas}</p>
      <div className="taller-listas">
        <div>
          <h3>A favor</h3>
          <ul>
            {pros.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>En contra</h3>
          <ul>
            {contras.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="taller-reglas">
        <b>Reglas:</b> {reglas}
      </p>
    </section>
  );
}

/** Prenda colgada en su hueco; `ancho` fuerza el ancho en huecos (1 = todas iguales). */
function Colgada({ prenda, inicio, ancho }: { prenda: Prenda; inicio: number; ancho?: number }) {
  const estilo = { "--inicio": inicio, ...(ancho ? { "--espacios": ancho } : {}) } as CSSProperties;
  return <CartaPrendaBosque p={prenda} pinzas={!ancho} className="mb-colgada" style={estilo} />;
}

/** Marca de los huecos que ocupa una prenda aunque su carta no los tape. */
function Reserva({ inicio, ancho, prenda, huecos }: { inicio: number; ancho: number; prenda: Prenda; huecos: number }) {
  return (
    <div className="taller-reserva" style={{ "--inicio": inicio, "--ancho": ancho, "--c": `var(--p-${Object.entries(COLORES).find(([, h]) => h === prenda.color)?.[0]})` } as CSSProperties}>
      <span>ocupa {huecos}</span>
    </div>
  );
}

/** Prenda del mismo tamaño que las demás, colgada solapada con una pinza y su coste en pinzas. */
function Solapada({ prenda, orden }: { prenda: Prenda; orden: number }) {
  const n = TIPOS[prenda.tipo].espacios;
  return (
    <div className="taller-solapada" style={{ "--orden": orden } as CSSProperties}>
      <CartaPrendaBosque p={prenda} className="taller-solapada-carta" style={{ "--espacios": 1 } as CSSProperties} />
      <svg className="taller-pinza" viewBox="-8 -3 16 24" aria-hidden>
        <PinzaBosque x={0} />
      </svg>
      <span className="taller-coste">
        {n} {n === 1 ? "pinza" : "pinzas"}
      </span>
    </div>
  );
}

export function TallerPrendas({ onVersion, onVolver }: { onVersion: (v: string) => void; onVolver: () => void }) {
  const estilo = leerEstilo();
  return (
    <div className={`mb taller estilo-${estilo}`}>
      <DefsBosque />
      <Barra version="taller" onVersion={onVersion} onVolver={onVolver} ocupado onRival={() => {}} onReiniciar={() => {}} />
      <main className="taller-cuerpo">
        <HumedadTaller />
        <div className="taller-intro">
          <h1>¿Cómo se cuelgan las prendas?</h1>
          <p>
            Si las prendas van a ser cartas que se barajan juntas, tienen que ser del mismo tamaño. Pero en el juego un calcetín ocupa 1 hueco, una camiseta 2 y una
            toalla 3. Aquí tienes tres formas de resolverlo, con las mismas prendas. Las medidas reales de cada opción van debajo de su maqueta.
          </p>
        </div>

        <div className="taller-opciones">
          <Opcion
            letra="1"
            titulo="Tres anchos"
            idea="Cada prenda mide lo que ocupa: la carta de la toalla es tres veces más ancha que la del calcetín. Es lo que tienes ahora."
            medidas="Cuerda: carta de 120 × 70 mm (tamaño tarot) tumbada, con 3 huecos de 40 mm. Prendas: 38 × 52, 78 × 52 y 118 × 52 mm."
            pros={["Se ve de un vistazo cuánto ocupa cada prenda.", "Las prendas tapan justo sus huecos: queda muy limpio.", "No cambia ninguna regla."]}
            contras={["Tres tamaños de carta que no son estándar: imprimir sale más caro.", "No se barajan bien juntas; en una bolsa se nota al tacto cuál es grande."]}
            reglas="no cambia nada."
          >
            <div className="taller-linea">
              <div className="mb-cuerda">
                <CartaCuerdaBosque efecto={null} className="mb-cuerda-carta" />
                <Colgada prenda={CAMISETA} inicio={0} />
                <Colgada prenda={CALCETIN} inicio={2} />
              </div>
              <div className="mb-cuerda">
                <CartaCuerdaBosque efecto="secado-rapido" className="mb-cuerda-carta" />
                <Colgada prenda={TOALLA} inicio={0} />
              </div>
            </div>
          </Opcion>

          <Opcion
            letra="2"
            titulo="Mismo tamaño, reserva huecos"
            idea="Todas las prendas son cartas mini iguales. La camiseta y la toalla se cuelgan en su primer hueco y dejan libres, pero ocupados, los de al lado."
            medidas="Cuerda: 120 × 70 mm tumbada, huecos de 40 mm. Prendas: todas mini, de 41 × 63 mm."
            pros={["Una sola baraja de prendas, de tamaño estándar.", "No cambia ninguna regla."]}
            contras={["Una toalla parece tan pequeña como un calcetín.", "Quedan huecos que parecen libres y no lo están: es fácil equivocarse.", "Hay que imprimir en la carta cuántos huecos ocupa."]}
            reglas="no cambia nada, pero hay que acordarse de los huecos reservados."
          >
            <div className="taller-linea">
              <div className="mb-cuerda">
                <CartaCuerdaBosque efecto={null} className="mb-cuerda-carta" />
                <Reserva inicio={1} ancho={1} prenda={CAMISETA} huecos={2} />
                <Colgada prenda={CAMISETA} inicio={0} ancho={1} />
                <Colgada prenda={CALCETIN} inicio={2} ancho={1} />
              </div>
              <div className="mb-cuerda">
                <CartaCuerdaBosque efecto="secado-rapido" className="mb-cuerda-carta" />
                <Reserva inicio={1} ancho={2} prenda={TOALLA} huecos={3} />
                <Colgada prenda={TOALLA} inicio={0} ancho={1} />
              </div>
            </div>
          </Opcion>

          <Opcion
            letra="3"
            titulo="Mismo tamaño, solapadas con pinzas"
            idea="Todas las prendas son cartas mini iguales y se cuelgan solapadas, como la ropa de verdad. El tamaño pasa a ser pinzas: cada cuerda tiene 3."
            medidas="Cuerda: carta estándar de 88 × 63 mm tumbada, con 3 pinzas marcadas. Prendas: todas mini, de 41 × 63 mm, que asoman por debajo de la cuerda."
            pros={["Una sola baraja y tamaños estándar: lo más barato de imprimir.", "Es lo que más se parece a un tendedero de verdad.", "Las cuerdas pueden ser más pequeñas."]}
            contras={["Ocupa más mesa hacia abajo: las líneas van más separadas.", "La posición exacta deja de existir: cuenta el orden en la cuerda."]}
            reglas="cambia poco. Calcetín 1 pinza, camiseta 2 y toalla 3, y cada cuerda tiene 3 pinzas. «Mover a otro hueco libre» pasa a ser «mover a otra cuerda con pinzas libres»."
            recomendada
          >
            <div className="taller-linea taller-linea-solapada">
              <div className="mb-cuerda">
                <CartaCuerdaBosque efecto={null} modo="pinzas" className="mb-cuerda-carta" />
                <Solapada prenda={CALCETIN} orden={0} />
                <Solapada prenda={CAMISETA} orden={1} />
                <span className="taller-contador">3 / 3 pinzas</span>
              </div>
              <div className="mb-cuerda">
                <CartaCuerdaBosque efecto="secado-rapido" modo="pinzas" className="mb-cuerda-carta" />
                <Solapada prenda={TOALLA} orden={0} />
                <span className="taller-contador">3 / 3 pinzas</span>
              </div>
            </div>
          </Opcion>
        </div>
      </main>
    </div>
  );
}
