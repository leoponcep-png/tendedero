import { Animal } from "../Animales";
import type { Balance, Estadisticas } from "./estadisticas";
import { IconoPerfil, type Icono } from "./Iconos";

// Pestaña «Récords y estadísticas»: todo sale de las partidas guardadas con registrarPartida().

const fechaCorta = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return iso.slice(0, 10);
  }
};
const pct = (b: Balance) => (b.partidas ? Math.round((b.ganadas / b.partidas) * 100) : 0);

function Cifra({ icono, valor, texto, destacada }: { icono: Icono; valor: string | number; texto: string; destacada?: boolean }) {
  return (
    <div className={`mp-cifra ${destacada ? "destacada" : ""}`}>
      <IconoPerfil icono={icono} />
      <strong>{valor}</strong>
      <span>{texto}</span>
    </div>
  );
}

function FilaBalance({ nombre, b }: { nombre: string; b: Balance }) {
  return (
    <div className="mp-balance">
      <span className="mp-balance-nombre">{nombre}</span>
      <div className="mp-balance-barra" title={`${b.ganadas} de ${b.partidas}`}>
        <span style={{ width: `${pct(b)}%` }} />
      </div>
      <span className="mp-balance-num">
        {b.ganadas}/{b.partidas} <small>{b.partidas ? `${pct(b)} %` : "—"}</small>
      </span>
    </div>
  );
}

export function PanelRecords({ e }: { e: Estadisticas }) {
  if (!e.partidas) {
    return (
      <div className="mp-vacio">
        <IconoPerfil icono="grafica" />
        <h2>Aún no hay partidas</h2>
        <p>Juega tu primera colada y aquí irán apareciendo tus récords, tus rachas y tus últimas partidas.</p>
      </div>
    );
  }
  return (
    <div className="mp-records">
      <div className="mp-cifras">
        <Cifra icono="cesta" valor={e.partidas} texto="Partidas jugadas" />
        <Cifra icono="copa" valor={e.ganadas} texto="Ganadas" />
        <Cifra icono="medalla" valor={`${e.porcentaje} %`} texto="De victorias" destacada />
        <Cifra icono="diana" valor={e.mejorPuntuacion} texto="Mejor puntuación" destacada />
        <Cifra icono="estrella" valor={e.puntosMedios} texto="Puntos de media" />
        <Cifra icono="camiseta" valor={e.prendasSecas} texto="Prendas secadas" />
        <Cifra icono="llama" valor={e.mejorRacha} texto={`Mejor racha (ahora ${e.rachaActual})`} />
        <Cifra icono="secreto" valor={e.objetivosCumplidos} texto="Objetivos secretos" />
        <Cifra icono="corona" valor={e.mayorVentaja} texto="Mayor ventaja al ganar" />
        <Cifra icono="rayo" valor={`${e.fastidiosJugados} / ${e.fastidiosRecibidos}`} texto="Fastidios hechos / sufridos" />
      </div>

      <div className="mp-dos-columnas">
        <section className="mp-bloque">
          <h2>Por número de jugadores</h2>
          <FilaBalance nombre="2 jugadores" b={e.porJugadores[2]} />
          <FilaBalance nombre="3 jugadores" b={e.porJugadores[3]} />
          <FilaBalance nombre="4 jugadores" b={e.porJugadores[4]} />
        </section>
        <section className="mp-bloque">
          <h2>Por modo de juego</h2>
          <FilaBalance nombre="Contra la IA" b={e.contraIA} />
          <FilaBalance nombre="Online" b={e.online} />
          <FilaBalance nombre="En la misma mesa" b={e.local} />
        </section>
      </div>

      <section className="mp-bloque">
        <h2>Últimas partidas</h2>
        <ol className="mp-ultimas">
          {e.ultimas.map((p, i) => (
            <li key={`${p.fecha}-${i}`} className={p.puesto === 1 ? "ganada" : ""}>
              <span className={`mp-puesto p${Math.min(p.puesto, 4)}`}>{p.puesto === 1 ? "1.º" : `${p.puesto}.º`}</span>
              {p.animal && (
                <span className="mp-ultima-animal">
                  <Animal id={p.animal} />
                </span>
              )}
              <span className="mp-ultima-modo">
                <strong>{p.online ? "Online" : p.contraIA ? "Contra la IA" : "En la mesa"}</strong>
                <small>
                  {p.jugadores} jugadores · {fechaCorta(p.fecha)}
                  {p.rivales?.length ? ` · con ${p.rivales.join(", ")}` : ""}
                </small>
              </span>
              <span className="mp-ultima-dato">
                <strong>{p.puntos}</strong>
                <small>puntos</small>
              </span>
              <span className="mp-ultima-dato">
                <strong>{p.prendasSecas}</strong>
                <small>prendas</small>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
