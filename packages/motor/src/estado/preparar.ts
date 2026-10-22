import { enJuego, type Ajustes } from "../ajustes";
import { barajar, semillaNueva, sembrar } from "../azar";
import type { Datos } from "../datos/esquemas";
import { empezarReparto, renovarCestas } from "./reparto";
import { inicioDeRonda } from "./ronda";
import type { Partida } from "./tipos";
import { pilaDe, robar } from "./utilidades";

export function crearPartida(datos: Datos, ajustesElegidos: Ajustes): Partida {
  const semilla = ajustesElegidos.semilla.trim() || semillaNueva();
  const ajustes = structuredClone({ ...ajustesElegidos, semilla });

  const p: Partida = {
    version: 1,
    ajustes,
    semilla,
    azar: sembrar(semilla),
    catalogo: {
      colores: Object.fromEntries(datos.colores.map((c) => [c.id, c])),
      tipos: Object.fromEntries(datos.tipos.map((t) => [t.id, { ...t, ...ajustes.prendas[t.id] }])),
      cartas: {},
      objetivos: {},
    },
    prendas: {},
    cartas: {},
    bolsa: [],
    cestas: [],
    centro: [],
    clima: null,
    climaDesde: null,
    mazos: { cuerdas: [], acciones: [], clima: [] },
    descartes: { cuerdas: [], acciones: [], clima: [] },
    objetivosComunes: [],
    jugadores: [],
    turno: { numero: 0, jugador: 0, fase: "cesta", cuerdasJugadas: 0, cuerdasExtra: 0, accionesJugadas: 0 },
    ronda: 1,
    ultimoEvento: null,
    rondaProtegeDe: [],
    ultimaRonda: false,
    primeroEnLlegar: null,
    registro: [],
    terminada: false,
    final: null,
  };

  for (const tipo of datos.tipos) {
    for (const color of datos.colores) {
      for (let i = 1; i <= tipo.porColor; i++) {
        const id = `${tipo.id}-${color.id}-${i}`;
        p.prendas[id] = { id, tipo: tipo.id, color: color.id, humedad: p.catalogo.tipos[tipo.id].humedad };
        p.bolsa.push(id);
      }
    }
  }
  barajar(p, p.bolsa);

  for (const def of datos.cartas) {
    if (!enJuego(def, ajustes)) continue;
    p.catalogo.cartas[def.id] = def;
    for (let i = 1; i <= def.copias; i++) {
      const id = `${def.id}#${i}`;
      p.cartas[id] = def.id;
      p.mazos[pilaDe(def.mazo)].push(id);
    }
  }
  barajar(p, p.mazos.cuerdas);
  barajar(p, p.mazos.acciones);
  barajar(p, p.mazos.clima);

  const objetivos = datos.objetivos.filter((o) => enJuego(o, ajustes));
  for (const o of objetivos) p.catalogo.objetivos[o.id] = o;
  const comunes = objetivos.filter((o) => o.uso !== "secreto").map((o) => o.id);
  barajar(p, comunes);
  p.objetivosComunes = comunes.slice(0, ajustes.objetivos.comunes);
  const secretos = objetivos.filter((o) => o.uso !== "comun" && !p.objetivosComunes.includes(o.id)).map((o) => o.id);
  barajar(p, secretos);

  for (let i = 0; i < ajustes.jugadores; i++) {
    p.jugadores.push({
      nombre: `Jugador ${i + 1}`,
      lineas: Array.from({ length: ajustes.tendedero.lineas }, () => ({ cartas: [] })),
      mano: [],
      pendientes: [],
      seca: [],
      secadoEn: {},
      objetivosOfrecidos: secretos.splice(0, ajustes.objetivos.secretosRepartidos),
      objetivoSecreto: null,
      puntos: 0,
    });
    robar(p, i, "cuerdas", ajustes.manoInicial.cuerdas);
    robar(p, i, "acciones", ajustes.manoInicial.acciones);
  }

  p.registro.push(`Partida creada con la semilla "${semilla}" para ${ajustes.jugadores} jugadores.`);
  inicioDeRonda(p);
  renovarCestas(p);
  empezarReparto(p);
  return p;
}
