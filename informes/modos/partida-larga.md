# Modo «Partida larga»

## En pocas palabras

- Hay un **modo de juego** en los ajustes de la partida: `modo: "normal" | "larga"`. El normal no cambia nada.
- **La partida larga** cambia esto (en `data/ajustes-por-defecto.json`, `modos.larga`):
  - **las prendas dan 1, 2 y 3 puntos** (calcetín, camiseta, toalla) en vez de 1, 3 y 6;
  - **el final está en 70 puntos** en vez de 30;
  - **se juegan hasta 2 cartas de cuerda por turno** (en vez de 1), para que dé tiempo a llenar el tendedero;
  - **los objetivos tienen su propio ritmo**: si no, con partidas más largas y prendas más baratas, los objetivos de juegos (Conjunto completo, Parejas, Arcoíris…) se disparaban.
- Resultado con bots (1200 partidas, IA Normal y Difícil mezcladas):

| | Normal | Partida larga |
|---|---|---|
| Rondas (2 / 3 / 4 jugadores) | 5,0 / 4,9 / 4,8 | **10,4 / 9,1 / 7,0** |
| Cartas de cuerda en el tendedero al final (de 8) | 4,8 | **7,9** |
| Jugadores que llenan el tendedero | 0 % | **90–98 %** |
| Mejoras de cuerda básica por jugador | 0,1 | **1,0–1,5** |
| Partidas con alguna mejora | 18–32 % | **95–99 %** |
| Parte de los puntos que viene de objetivos | 34–35 % | 31–32 % |

- **Ojo con 3 y 4 jugadores:** la partida larga no acaba por llegar a 70, sino porque **se acaba la ropa** (100 prendas): pasa en el 89 % de las partidas a 3 y en todas a 4. Aun así dura 9 y 7 rondas, casi el doble y un 45 % más que la normal. El texto de ayuda del menú ya lo dice.

## 1. Qué se ha cambiado

### Motor (`packages/motor`)

- `src/ajustes.ts`
  - `ModoJuego` y `MODOS_JUEGO` (`["normal", "larga"]`).
  - `Ajustes.modo` (opcional). `ajustesIniciales` pone `"normal"` y `normalizarAjustes` lo conserva.
  - `ajustesConModo(ajustes, datos)` aplica lo que cambia el modo: puntos de las prendas, umbral, cartas por turno, mano inicial, robo y límite de mano. En el modo normal devuelve los mismos ajustes sin tocarlos.
  - `objetivoConModo(objetivo, datos, modo)` aplica el ritmo del objetivo en ese modo.
  - `revisarAjustes` avisa si el modo no existe en los datos (entonces se juega con las reglas normales).
- `src/datos/esquemas.ts`: `esquemaModo` y `modos` (opcional) en `ajustes-por-defecto.json`.
- `src/estado/preparar.ts`: `crearPartida` aplica el modo. **La partida guarda los ajustes ya cambiados**: `p.ajustes.umbralFinal`, `p.ajustes.prendas`, `p.catalogo.tipos[…].puntos` y `p.catalogo.objetivos[…]` son los del modo. Todo lo que puntúa (secado, objetivos, final) ya leía de ahí, así que no hace falta tocar nada más.
- **IA**:
  - Los puntos de las prendas ya los leía de la partida (`tipoDe(p, …).puntos`), igual que los objetivos (`p.catalogo.objetivos`).
  - `iaDificil.ts` `rondasRestantes`: la estimación del ritmo de puntos al principio (6 por ronda, mínimo 4) estaba fija. Ahora sale de los puntos por pinza de las prendas de la partida. Con las del modo normal da exactamente 6 y 4, como antes. Con las de la larga, 4 y 2,7.
  - `ia.ts` `cuerdasARobarBase`: con el tendedero lleno, la IA robaba 0 cuerdas, así que nunca tenía con qué mejorar. Ahora roba las que podría usar para mejorar sus básicas (menos las de habilidad que ya tiene en la mano). Solo pasa con el tendedero lleno, algo que en el modo normal no ocurre nunca (0 % de los jugadores en 1200 partidas).
- `test/modos.test.ts` (nuevo, 12 pruebas):
  - el modo normal da exactamente la misma partida que sin modo;
  - la larga lleva sus puntos, su umbral, sus cuerdas por turno y sus objetivos;
  - una toalla seca da 6 en la normal y 3 en la larga, y una camiseta 2;
  - la larga no acaba a los 30, sino a los 70;
  - los ajustes guardados conservan el modo, y uno que no existe avisa;
  - la IA calcula más rondas en la larga y roba cuerdas para mejorar con el tendedero lleno;
  - una partida larga de bots llega al final.

### Datos (`data/ajustes-por-defecto.json`)

```json
"modos": {
  "larga": {
    "umbralFinal": 70,
    "jugablesPorTurno": { "cuerdas": 2, "acciones": 2 },
    "prendas": { "calcetin": { "puntos": 1 }, "camiseta": { "puntos": 2 }, "toalla": { "puntos": 3 } },
    "objetivos": { … ver el apartado 4 … }
  }
}
```

`data/objetivos.json` no se ha tocado: los ritmos de la larga van dentro del modo.

### Web (`packages/web`)

- **Menú de partida** (`prototipos/MenuPartida.tsx`, pestaña Partida): selector «Modo de juego» con «Normal» y «Partida larga» y una frase de ayuda. Se recuerda con el resto de la configuración (`ConfigPartida.modo`, en `localStorage`).
- **Contra la IA** (`prototipos/MesaFinal.tsx` → `juego/ContraIA.tsx`): `PartidaContraIA` recibe `modo` y crea la partida con él. «Nueva partida» repite el modo. Una partida a medias se retoma con su modo (se lee de `partida.ajustes.modo`).
- **Online**: en la pantalla Online (`prototipos/MenuOnline.tsx`), al crear la sala, el anfitrión elige el modo (empieza marcado el último del menú de partida). Va en los ajustes de la sala (`nuevaSala`) y de ahí a `crearPartida`. Los invitados reciben la partida con los puntos ya cambiados. Las invitaciones desde la pestaña Amigos usan el modo del menú de partida.
- **Cartas**:
  - la ficha con los puntos de la prenda (`CartaPrendaHumeda` en `HumedadTaller.tsx` y `CartaPrendaBosque` en `CartasBosque.tsx`) enseña `p.puntos` si viene. `juego/vista.ts` (`prendaDibujo`) lo rellena con los puntos de la partida. El tipo `Prenda` de `Prototipos.tsx` tiene `puntos?` opcional, así que las galerías siguen enseñando los de siempre;
  - la carta de objetivo (`CartaObjetivoBosque`) acepta `ritmo` y `juego/cartas.tsx` le pasa el de la partida.
- **Textos**: `menu.modoJuego`, `menu.modoJuego.normal`, `menu.modoJuego.larga`, `menu.ayudaModoJuego.normal` y `menu.ayudaModoJuego.larga`, en `es.ts` y en los otros 11 idiomas.

## 2. Cómo se ajustó (simulaciones)

Script: `informes/modos/sim.ts` (empaquetado en `sim.mjs`). Juega partidas completas con `siguienteJugadaIA`, IA Normal y Difícil en asientos alternos. Apunta rondas, cuerdas colocadas, mejoras (separando las de básica y los arreglos de cuerda vieja), cuándo se llena el tendedero, la carta del día de cada ronda y cuánto contaría cada objetivo. Se lanza en paralelo con `lanzar.mjs` y se resume con `resumen.mjs`. Tablas en `informes/modos/tabla-*.md`.

### Primera prueba: solo bajar los puntos y subir el umbral

| Prueba | Rondas (2 j / 4 j) | Tendedero lleno (2 j / 4 j) | Mejoras / jugador (2 j / 4 j) |
|---|---|---|---|
| Normal (1 / 3 / 6, final 30) | 5,0 / 4,8 | 0 % / 0 % | 0,1 / 0,1 |
| 1 / 2 / 3, final 30 | 6,3 / 6,0 | 6 % / 2 % | 0,1 / 0,1 |
| 1 / 2 / 3, final 40 | 7,5 / – | 27 % / – | 0,1 / – |
| 1 / 2 / 3, final 50 (\*) | 8,4 / 7,0 | 60 % / 6 % | 0,2 / 0,1 |
| 1 / 2 / 3, final 60 (\*) | 9,6 / 7,0 | 79 % / 6 % | 0,4 / 0,1 |
| 1 / 2 / 3, final 70 (\*) | 10,6 / 7,0 | 93 % / 6 % | 0,6 / 0,1 |

(\*) Ya con la IA que roba cuerdas para mejorar. 60 partidas por casilla.

Qué se vio:

1. **Alargar no basta.** Con 1 cuerda por turno, el tendedero (8 cartas) se llena hacia la ronda 8–9. Para entonces la partida casi ha acabado, así que se mejora poco: 0,6 mejoras a 2 jugadores con final en 70.
2. **A 4 jugadores el umbral no importa**: con 50, 60 o 70 la partida dura 7 rondas. Se acaba la ropa (100 prendas) antes de que nadie llegue.
3. **La IA no robaba cuerdas con el tendedero lleno.** Se corrigió (ver arriba).

### Segunda prueba: 2 cartas de cuerda por turno

| Prueba | Rondas (2 / 3 / 4 j) | Tendedero lleno | Mejoras / jugador | Partidas con mejora |
|---|---|---|---|---|
| 2 cuerdas, final 40 | 6,8 / – / 6,3 | 84–89 % | 0,8–0,9 | 85–97 % |
| 2 cuerdas, final 50 | 7,8 / – / 6,9 | 88–93 % | 0,8–1,2 | 95–100 % |
| 2 cuerdas, final 60 | 9,2 / 8,8 / 7,0 | 93–99 % | 1,0–1,4 | 95–100 % |
| **2 cuerdas, final 70** | **10,4 / 9,2 / –** | **98–99 %** | **1,3–1,5** | **95–97 %** |
| 2 cuerdas, final 80 | 11,6 / 9,2 / – | 98–100 % | 1,3–1,6 | 95–97 % |

Con 2 cuerdas por turno el tendedero se llena hacia la mitad de la partida, y a partir de ahí las cuerdas que se roban sirven para mejorar. **Final en 70**: a 2 jugadores la partida dura el doble que la normal (10,4 rondas frente a 5,0). A 3 jugadores, 80 ya no alarga más (se acaba la ropa).

## 3. Resultado final (1200 partidas, 400 por número de jugadores)

| | 2 jugadores | 3 jugadores | 4 jugadores |
|---|---|---|---|
| Rondas (normal → larga) | 5,0 → **10,4** | 4,9 → **9,1** | 4,8 → **7,0** |
| Acaba porque se termina la ropa | 0 % | 89 % | 100 % |
| Puntos de cada jugador al final | 99 | 85 | 62 |
| Cuerdas colocadas por jugador | 7,4 | 7,4 | 7,4 |
| Tendedero lleno | 98 % | 95 % | 90 % |
| Mejoras de básica por jugador (normal → larga) | 0,1 → **1,5** | 0,1 → **1,5** | 0,1 → **1,0** |
| Partidas con alguna mejora (normal → larga) | 18 % → **95 %** | 24 % → **99 %** | 32 % → **99 %** |
| Prendas secas por jugador (calcetín · camiseta · toalla) | 15 · 13 · 8 | 13 · 11 · 7 | 10 · 8 · 5 |
| Puntos de objetivos | 31 % | 31 % | 32 % |

Tabla: `informes/modos/tabla-larga-final.md` (resultados `resultados/larga2-*`).

## 4. Objetivos en la partida larga

**Sin cambiar sus puntos, los objetivos se desequilibran** (300 partidas por número de jugadores, `tabla-larga-sin-ritmos.md`):

- pasan a ser el 45 % de los puntos (34 % en la normal);
- los de juegos de prendas se disparan: con 2 jugadores, Conjunto completo da 50 puntos y quien lo lleva de secreto gana el 71 %; Parejas da 35 puntos y gana el 64 %; Arcoíris da 29;
- los que no crecen con la partida (Variedad de cuerdas, Cuerdas llenas, Regalo envenenado) se quedan en nada: Variedad de cuerdas gana el 23 / 15 / 11 %.

**Ritmos propuestos para la larga** (ya están en `modos.larga.objetivos`). Se calcularon para que cada objetivo pese frente a la ropa lo mismo que en la normal (`ajustar-objetivos.mjs`), y luego se redondearon a ritmos sencillos. Para Parejas se tomó como referencia la propuesta de 2 puntos por pareja de `informes/equilibrio-objetivos/parejas.md`.

| Objetivo | Normal | Larga |
|---|---|---|
| Calcetinero | cada 2 → 2 | cada 3 → 2 |
| Toallero | cada 2 → 3 | cada 2 → 2 |
| Camisetero | cada 2 → 3 | cada 3 → 2 |
| Colección de color | cada 2 → 3 | cada 1 → 1 |
| Arcoíris | cada 1 → 5 | cada 1 → 2 |
| Montón de ropa | cada 4 → 2 | cada 6 → 2 |
| Tendedero completo | cada 1 → 6 | cada 1 → 3 |
| Variedad de cuerdas | cada 2 → 3 | cada 1 → 2 |
| Todo blanco / azul / rojo / amarillo | cada 2 → 5 | cada 2 → 3 |
| Cada oveja con su pareja | cada 1 → 5 | cada 1 → 1 |
| Bajo techo | cada 1 → 2 | cada 2 → 3 |
| A toda prisa | cada 2 → 4 | cada 2 → 3 |
| Conjunto completo | cada 1 → 7 | cada 1 → 2 |
| Cuerdas llenas | cada 1 → 2 | sin cambios |
| Regalo envenenado | cada 1 → 4 | sin cambios |

**Con estos ritmos** (las 1200 partidas del apartado 3). Puntos que da de secreto y % de victorias de quien lo lleva, a 2 / 3 / 4 jugadores (lo justo: 50 / 33 / 25 %). Cada casilla son unas 40–90 partidas, así que el margen de azar es de ±10–15 puntos.

| Objetivo | Normal | Larga sin cambiar ritmos | **Larga con ritmos** |
|---|---|---|---|
| Calcetinero | 6,8·61 % / 6,0·36 % / 5,9·19 % | 17,6·40 % / 15,7·30 % / 12,0·26 % | 11,0·38 % / 9,9·25 % / 7,7·20 % |
| Toallero | 3,9·56 % / 3,7·26 % / 3,5·19 % | 13,6·49 % / 11,8·16 % / 8,2·11 % | 8,9·51 % / 8,1·24 % / 5,8·22 % |
| Camisetero | 5,4·54 % / 4,7·31 % / 5,6·26 % | 21,7·50 % / 20,0·34 % / 13,9·19 % | 9,1·52 % / 8,0·29 % / 6,0·13 % |
| Colección de color | 8,0·57 % / 7,7·36 % / 7,7·30 % | 20,0·52 % / 17,4·39 % / 12,7·29 % | 13,6·57 % / 12,3·49 % / 8,9·33 % |
| Arcoíris | 6,3·50 % / 5,6·34 % / 6,1·17 % | 29,3·57 % / 25,0·38 % / 17,5·39 % | 11,6·45 % / 9,1·23 % / 6,8·22 % |
| Montón de ropa | 5,2·56 % / 4,7·28 % / 5,0·20 % | 17,2·50 % / 15,3·36 % / 10,6·18 % | 11,4·69 % / 9,8·38 % / 7,0·27 % |
| Tendedero completo | 4,3·45 % / 3,3·31 % / 3,1·16 % | 12,0·46 % / 11,9·20 % / 11,6·20 % | 5,9·39 % / 5,8·32 % / 5,6·14 % |
| Variedad de cuerdas | 4,7·57 % / 4,9·35 % / 4,7·23 % | 5,5·23 % / 5,8·15 % / 5,3·11 % | 8,3·46 % / 8,6·26 % / 8,0·23 % |
| Todo blanco | 8,4·42 % / 8,0·35 % / 8,5·35 % | 27,6·67 % / 23,6·42 % / 18,1·29 % | 16,0·61 % / 14,6·35 % / 10,7·32 % |
| Todo azul | 8,5·50 % / 8,9·41 % / 9,5·33 % | 26,6·61 % / 26,4·58 % / 19,0·44 % | 15,9·50 % / 14,4·46 % / 11,0·41 % |
| Todo rojo | 10,1·61 % / 8,9·32 % / 9,2·37 % | 26,7·51 % / 24,8·40 % / 17,8·28 % | 16,1·56 % / 15,3·50 % / 10,7·34 % |
| Todo amarillo | 8,6·62 % / 10,5·43 % / 9,3·30 % | 28,2·68 % / 23,9·36 % / 19,4·36 % | 16,5·63 % / 14,3·39 % / 11,1·31 % |
| Cada oveja con su pareja | 8,9·51 % / 12,5·45 % / 12,0·34 % | 34,8·64 % / 31,9·56 % / 24,0·42 % | 7,3·41 % / 6,5·30 % / 4,1·19 % |
| Bajo techo | 6,2·36 % / 5,8·33 % / 7,0·30 % | 21,7·53 % / 18,6·28 % / 14,7·27 % | 15,2·57 % / 12,2·44 % / 10,4·38 % |
| A toda prisa | 5,4·33 % / 7,3·44 % / 6,5·30 % | 15,4·38 % / 18,6·26 % / 9,0·28 % | 12,4·42 % / 12,2·50 % / 7,3·37 % |
| Cuerdas llenas | 1,2·24 % / 1,5·24 % / 1,7·10 % | 1,8·33 % / 1,9·11 % / 1,7·2 % | 1,0·31 % / 2,6·6 % / 1,5·7 % |
| Regalo envenenado | 1,1·32 % / 1,3·14 % / 1,3·10 % | 1,9·20 % / 2,3·9 % / 2,0·0 % | 1,2·17 % / 2,2·5 % / 2,0·4 % |
| Conjunto completo | 8,7·46 % / 6,4·28 % / 6,3·26 % | 49,7·71 % / 38,2·68 % / 22,8·50 % | 14,1·59 % / 10,8·38 % / 6,4·21 % |

(La columna «Normal» es con los ritmos actuales de `data/objetivos.json`, Parejas a 5.)

Qué queda:

- Los objetivos vuelven a pesar lo mismo que en la normal (31–32 % de los puntos) y **ninguno se dispara**. Conjunto completo y Parejas, que eran los peores, quedan en lo justo.
- **Algo por encima, para vigilar**: Bajo techo (57 / 44 / 38 %), A toda prisa (42 / 50 / 37 %) y los de un color. Con este margen de azar todavía no es seguro. Si se confirma, el siguiente paso sería **Bajo techo y A toda prisa a cada 2 → 2**.
- **Cuerdas llenas y Regalo envenenado** siguen flojos, igual que en la normal: es cosa de la regla, no de los puntos (ver `informes/equilibrio-objetivos/propuesta.md`).

## 5. Lo que queda por decidir

- **Con 3 y 4 jugadores la partida larga acaba por la ropa.** Si se quiere que dure más a 4 jugadores, hacen falta más prendas (otro mazo de ropa) o rellenar menos cestas por ronda. Son cambios de componentes, así que no los he tocado.
- **2 cartas de cuerda por turno** es lo que hace que se usen las mejoras. Sin eso, la partida tendría que durar unas 13–14 rondas.
- Las pruebas son con bots. Las personas secan más calcetines y hacen más juegos de prendas: vale la pena mirar Parejas, Conjunto completo y Arcoíris en las primeras partidas de prueba.

Para repetirlo:

```
npx rolldown informes/modos/sim.ts --file informes/modos/sim.mjs --platform node
node informes/modos/lanzar.mjs larga2 informes/modos/configs/larga2.json 400
node informes/modos/resumen.mjs larga2 ref --objetivos
node informes/modos/ajustar-objetivos.mjs larga ref informes/modos/configs/ritmos-normal-propuestos.json
```
