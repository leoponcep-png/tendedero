import { fecha, localeActual, t, useT } from "../../i18n";
import { lista } from "../../i18n/juego";
import { Animal } from "../Animales";
import type { Balance, Estadisticas } from "./estadisticas";
import { IconoPerfil, type Icono } from "./Iconos";

// Pestaña «Récords y estadísticas»: todo sale de las partidas guardadas con registrarPartida().

const fechaCorta = (iso: string) => fecha(iso, { day: "numeric", month: "short" });
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
      <div className="mp-balance-barra" title={t("records.ganadasDe", { ganadas: b.ganadas, partidas: b.partidas })}>
        <span style={{ width: `${pct(b)}%` }} />
      </div>
      <span className="mp-balance-num">
        {b.ganadas}/{b.partidas} <small>{b.partidas ? t("comun.porcentaje", { n: pct(b) }) : "—"}</small>
      </span>
    </div>
  );
}

export function PanelRecords({ e }: { e: Estadisticas }) {
  const t = useT();
  if (!e.partidas) {
    return (
      <div className="mp-vacio">
        <IconoPerfil icono="grafica" />
        <h2>{t("records.vacioTitulo")}</h2>
        <p>{t("records.vacioTexto")}</p>
      </div>
    );
  }
  return (
    <div className="mp-records">
      <div className="mp-cifras">
        <Cifra icono="cesta" valor={e.partidas} texto={t("records.jugadas")} />
        <Cifra icono="copa" valor={e.ganadas} texto={t("records.ganadas")} />
        <Cifra icono="medalla" valor={t("comun.porcentaje", { n: e.porcentaje })} texto={t("records.deVictorias")} destacada />
        <Cifra icono="diana" valor={e.mejorPuntuacion} texto={t("records.mejorPuntuacion")} destacada />
        <Cifra icono="estrella" valor={e.puntosMedios.toLocaleString(localeActual())} texto={t("records.puntosMedia")} />
        <Cifra icono="camiseta" valor={e.prendasSecas} texto={t("records.prendasSecadas")} />
        <Cifra icono="llama" valor={e.mejorRacha} texto={t("records.mejorRacha", { n: e.rachaActual })} />
        <Cifra icono="secreto" valor={e.objetivosCumplidos} texto={t("records.objetivos")} />
        <Cifra icono="corona" valor={e.mayorVentaja} texto={t("records.mayorVentaja")} />
        <Cifra icono="rayo" valor={`${e.fastidiosJugados} / ${e.fastidiosRecibidos}`} texto={t("records.fastidios")} />
      </div>

      <div className="mp-dos-columnas">
        <section className="mp-bloque">
          <h2>{t("records.porJugadores")}</h2>
          <FilaBalance nombre={t("menu.jugadores", { n: 2 })} b={e.porJugadores[2]} />
          <FilaBalance nombre={t("menu.jugadores", { n: 3 })} b={e.porJugadores[3]} />
          <FilaBalance nombre={t("menu.jugadores", { n: 4 })} b={e.porJugadores[4]} />
        </section>
        <section className="mp-bloque">
          <h2>{t("records.porModo")}</h2>
          <FilaBalance nombre={t("records.modoIA")} b={e.contraIA} />
          <FilaBalance nombre={t("records.modoOnline")} b={e.online} />
          <FilaBalance nombre={t("records.modoMesa")} b={e.local} />
        </section>
      </div>

      <section className="mp-bloque">
        <h2>{t("records.ultimas")}</h2>
        <ol className="mp-ultimas">
          {e.ultimas.map((p, i) => (
            <li key={`${p.fecha}-${i}`} className={p.puesto === 1 ? "ganada" : ""}>
              <span className={`mp-puesto p${Math.min(p.puesto, 4)}`}>{t("comun.ordinal", { n: p.puesto })}</span>
              {p.animal && (
                <span className="mp-ultima-animal">
                  <Animal id={p.animal} />
                </span>
              )}
              <span className="mp-ultima-modo">
                <strong>{p.online ? t("records.modoOnline") : p.contraIA ? t("records.modoIA") : t("records.modoMesaCorto")}</strong>
                <small>
                  {t("menu.jugadores", { n: p.jugadores })} · {fechaCorta(p.fecha)}
                  {p.rivales?.length ? ` · ${t("records.con", { nombres: lista(p.rivales) })}` : ""}
                </small>
              </span>
              <span className="mp-ultima-dato">
                <strong>{p.puntos}</strong>
                <small>{t("records.puntos")}</small>
              </span>
              <span className="mp-ultima-dato">
                <strong>{p.prendasSecas}</strong>
                <small>{t("records.prendas")}</small>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
