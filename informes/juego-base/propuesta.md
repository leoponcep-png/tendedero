# Juego base: propuesta para llenar el tendedero y usar las cuerdas

> **Aplicado:** la recomendada, pero con la meta en **35** en vez de 40. Ver el último apartado, «Meta 35», con sus números. El modo «Partida larga» se ha quitado. Las partidas y salas guardadas con él se cargan como normales.

## En pocas palabras

- **Hoy** la partida dura unas 5 rondas y **casi nadie llena el tendedero** (0–1 % de los jugadores). Mejorar cuerdas pasa 0,1 veces por jugador y partida. A cada jugador le **sobran unas 5 prendas** al acabar.
- **Alargar la partida no basta.** Con 1 cuerda por turno, el tendedero (8 cartas) no se llena antes del final: subir a 40 puntos, o bajar las prendas a 1/2/3 o a 1/3/5, alarga entre 0,3 y 1,2 rondas, pero el tendedero sigue sin llenarse (1–4 %).
- **La clave es la idea (d), 2 cartas de cuerda por turno.** Con ella el tendedero se llena siempre hacia la **ronda 4,5–5**. Sola acorta la partida (4,3 rondas), así que hay que subir la meta para que, una vez lleno, quede partida por delante.
- **Recomendación: prendas a 1/2/3 + 2 cuerdas por turno + idea (e) + final en 40 puntos + los ritmos de objetivos de la «Partida larga».** Da **6,7 / 6,6 / 6,4 rondas** (2 / 3 / 4 jugadores), el **85–87 % de los jugadores llena el tendedero**, hacia el **73 % de la partida**, y mejorar cuerdas pasa **9 veces más** (0,8–0,9 por jugador; en el 88–96 % de las partidas alguien mejora). No faltan prendas en los turnos.
- **Alternativa con menos cambios en las cartas: prendas como ahora (1/3/6) + 2 cuerdas + idea (e) + final en 55.** Da 6,0 / 6,0 / 5,9 rondas, y el 74–78 % de los jugadores llena el tendedero, hacia el 79 % de la partida. No hay que reimprimir las prendas. A cambio, se llena más tarde y hay que retocar «Conjunto completo».
- **«Partida larga»:** con cualquiera de las dos propuestas sobra. Recomiendo **quitarla**.

> Copia del motor usada: igual al commit `2907ed9` (humedad con tope de 4 gotas y sin `extra`), comprobado archivo a archivo. Solo se le añadió la regla (e) para la simulación (ver «Cómo se ha hecho»). **No se ha tocado nada del repo**: ni el motor ni `data/*.json`.

## 1. Tabla comparativa

300 partidas por casilla, con IA Normal y Difícil en asientos alternos. Las cifras van **a 2 · 3 · 4 jugadores**.

- **Llenan**: % de jugadores que llegan a tener las 8 cartas de cuerda.
- **Se llena en**: ronda media en que se llena el tendedero, entre los que lo llenan, y entre paréntesis qué parte de la partida ha pasado.
- **Mejoras**: cuerdas mejoradas por jugador (una básica pasa a tener habilidad, o, con la idea (e), una con habilidad pasa a ser otra).
- **Mover/cambiar**: cartas «Mover cuerda» y «Cambiar cuerdas» jugadas por jugador.
- **Min.**: duración estimada (ver la nota al final de la tabla).

| Variante | Rondas | Min. | Llenan | Se llena en | Mejoras / j | Partidas con mejora | Mover/cambiar / j | Prendas sin tender al acabar / j | Bolsa vacía a 4 j | Puntos de objetivos |
|---|---|---|---|---|---|---|---|---|---|---|
| **Hoy** (1/3/6, final 30, 1 cuerda) | 5,0 · 4,8 · 4,8 | 28 · 36 · 46 | 1 · 0 · 0 % | 7,5 · 7,0 · 5,8 (casi al final) | 0,1 | 17 · 23 · 32 % | 0,1 | 4,9 · 5,1 · 5,1 | 1 % | 31–34 % |
| (a) final 40 | 5,8 · 5,7 · 5,6 | 33 · 44 · 55 | 2 · 1 · 1 % | ~7 (97–100 %) | 0,1 | 23 · 28 · 39 % | 0,2 | 4,6 · 4,5 · 4,7 | 12 % | 32–34 % |
| (b) 1/2/3, final 30 | 6,2 · 6,2 · 6,0 | 36 · 49 · 61 | 4 · 3 · 1 % | ~7 (98–100 %) | 0,1 | 22 · 27 · 37 % | 0,1–0,2 | 3,9 · 3,7 · 3,6 | 24 % | **43–45 %** |
| (b) 1/2/3, final 25 | 5,7 · 5,5 · 5,4 | 32 · 43 · 54 | 2 · 1 · 1 % | ~7 | 0,1 | 21 · 21 · 33 % | 0,1 | 4,1 · 4,5 · 4,6 | 5 % | **43–45 %** |
| (c) 1/3/5, final 30 | 5,3 · 5,1 · 5,1 | 29 · 39 · 49 | 1 · 1 · 0 % | ~6,5 (98–100 %) | 0,1 | 21 · 26 · 31 % | 0,1 | 4,9 · 4,8 · 5,0 | 3 % | 34–36 % |
| (c) 1/3/5, final 35 | 5,6 · 5,6 · 5,5 | 32 · 43 · 54 | 1 · 1 · 1 % | ~7 | 0,1 | 23 · 26 · 36 % | 0,1–0,2 | 4,8 · 4,6 · 4,8 | 6 % | 34–36 % |
| (d) 2 cuerdas | 4,3 · 4,2 · 4,1 | 25 · 34 · 42 | 30 · 29 · 27 % | 4,4 (91–94 %) | 0,3 | 48 · 59 · 72 % | 0,1–0,2 | 1,4 · 1,3 · 1,6 | 0 % | 32–34 % |
| (e) mejorar sobre habilidad | 5,0 · 4,8 · 4,8 | 28 · 37 · 46 | 1 · 0 · 0 % | casi al final | 0,1 + 0,1 | 28 · 36 · 44 % | 0,1 | 4,9 · 5,0 · 5,1 | 1 % | 32–34 % |
| d + e | 4,3 · 4,2 · 4,1 | 25 · 34 · 42 | 29 · 28 · 25 % | 4,4 (92–94 %) | 0,4 | 55 · 68 · 76 % | 0,1–0,2 | 1,4 · 1,3 · 1,5 | 0 % | 32–34 % |
| d + e, final 35 | 4,6 · 4,5 · 4,5 | 27 · 37 · 46 | 40 · 40 · 37 % | 4,5 (91 %) | 0,4 | 57 · 69 · 81 % | 0,2 | 1,3 · 1,2 · 1,5 | 0 % | 32–34 % |
| a + d + e (final 40) | 5,0 · 4,8 · 4,8 | 29 · 40 · 50 | 50 · 51 · 48 % | 4,5 (88 %) | 0,5 | 57 · 72 · 83 % | 0,2 | 1,1 · 1,1 · 1,4 | 1 % | 32–34 % |
| d + e, final 45 | 5,3 · 5,2 · 5,2 | 32 · 43 · 55 | 61 · 61 · 60 % | 4,6 (85 %) | 0,6 | 63 · 78 · 88 % | 0,2 | 1,0 · 0,9 · 1,2 | 4 % | 32–34 % |
| **d + e, final 55 (alternativa)** | **6,0 · 6,0 · 5,9** | **36 · 50 · 62** | **76 · 78 · 74 %** | **4,7 (79 %)** | **0,8** | **78 · 87 · 95 %** | **0,3** | **0,7 · 0,7 · 0,9** | **20 %** | **33–34 %** |
| c + d + e (final 30) | 4,4 · 4,3 · 4,3 | 26 · 35 · 44 | 34 · 32 · 31 % | 4,5 (91–93 %) | 0,4 | 50 · 60 · 77 % | 0,1–0,2 | 1,4 · 1,3 · 1,6 | 0 % | 34–36 % |
| c + d + e, final 35 | 4,8 · 4,7 · 4,7 | 29 · 38 · 48 | 48 · 45 · 44 % | 4,5 (89–90 %) | 0,5 | 55 · 66 · 82 % | 0,1–0,2 | 1,2 · 1,1 · 1,4 | 0 % | 34–36 % |
| c + d + e, final 45 | 5,6 · 5,5 · 5,5 | 33 · 45 · 57 | 71 · 69 · 67 % | 4,7 (83 %) | 0,6 | 68 · 82 · 87 % | 0,2 | 0,9 · 0,9 · 1,1 | 10 % | 34–36 % |
| c + d + e, final 55 | 6,4 · 6,3 · 6,2 | 38 · 53 · 65 | 82 · 83 · 81 % | 4,8 (75 %) | 1,0 | 84 · 95 · 97 % | 0,2 | 0,7 · 0,6 · 0,7 | 35 % | 35–36 % |
| b + d + e, final 25 | 4,9 · 4,7 · 4,7 | 29 · 39 · 48 | 49 · 45 · 45 % | 4,5 (89–90 %) | 0,5 | 53 · 69 · 76 % | 0,1–0,2 | 1,0 · 1,1 · 1,4 | 0 % | **44 %** |
| b + d + e, final 30 | 5,4 · 5,4 · 5,3 | 32 · 44 · 55 | 65 · 66 · 62 % | 4,6 (84–85 %) | 0,6 | 62 · 79 · 85 % | 0,2 | 0,8 · 0,9 · 1,1 | 4 % | **43–44 %** |
| b + d + e, final 35 | 6,0 · 6,0 · 5,8 | 36 · 50 · 61 | 78 · 77 · 76 % | 4,7 (78–80 %) | 0,8 | 78 · 88 · 94 % | 0,2 | 0,6 · 0,8 · 0,9 | 13 % | **43–44 %** |
| b + d + e, final 40 | 6,7 · 6,6 · 6,4 | 40 · 55 · 67 | 87 · 86 · 85 % | 4,7–4,8 (73–75 %) | 1,0 | 84 · 93 · 96 % | 0,2 | 0,6 · 0,5 · 0,6 | 43 % | **44 %** |
| **b + d + e, final 40 + ritmos de la larga (recomendada)** | **6,7 · 6,6 · 6,4** | **40 · 55 · 67** | **87 · 85 · 84 %** | **4,8 (73–75 %)** | **0,9** | **88 · 94 · 96 %** | **0,2** | **0,5 · 0,6 · 0,6** | **45 %** (ronda 7) | **31–32 %** |
| b + d + e, final 45 | 7,3 · 7,1 · 6,8 | 44 · 59 · 71 | 91 · 90 · 89 % | 4,8–4,9 (67–71 %) | 1,2 | 90 · 96 · 99 % | 0,2–0,3 | 0,5 · 0,6 · 0,5 | **79 %**; el 22 % acaba sin ropa | **44 %** |

Notas:

- «Mejoras / j» suma las de básica y los cambios de la idea (e). Los bots casi no usan la (e): 0,1 por jugador (ver el apartado 3).
- **Duración estimada.** Es un modelo sencillo, no un cronómetro: 1,5 min por ronda (carta del día, secado y cestas), 10 s por prenda cogida en el reparto, 20 s por turno y 15 s por cada jugada dentro del turno. Con él, la partida de hoy sale en 28 / 36 / 46 min. Si en la mesa real dura otra cosa, escala todo en proporción: la recomendada dura un **40–45 % más que hoy**.
- **Turnos sin prendas.** En ninguna variante hay turnos en que alguien se quede sin prendas teniendo hueco: 0–1 % de los turnos. Las prendas que esperan en la mano después de cada turno bajan de unas 5 hoy a 1,5–2 con 2 cuerdas por turno: ya no sobran tantas.
- **Bolsa vacía a 4 jugadores.** La bolsa se vacía en la ronda 7. Con la recomendada pasa en el 45 % de las partidas, pero solo el 5 % acaba porque se termina la ropa (en las demás, alguien llega a 40 en esa misma ronda). Con final en 45, el 22 % acabaría sin ropa: por eso no lo recomiendo.
- Las tablas completas, con todas las columnas, están en `simulacion/tabla-tanda1.md` y `simulacion/tabla-tanda2.md`.

## 2. Qué dice cada idea por separado

- **(a) Final en 40.** La partida dura 0,8 rondas más, pero el tendedero sigue sin llenarse: se coloca 1 cuerda por turno y la partida acaba antes. A 4 jugadores, la bolsa se vacía en el 12 % de las partidas.
- **(b) Prendas a 1/2/3.** Alarga más que (a), unas 1,2 rondas, y deja menos prendas sin tender. Pero **los objetivos pasan a ser el 43–45 % de los puntos** (hoy, el 31–34 %): las prendas valen menos y los objetivos no. «Conjunto completo» y «Todo azul / blanco» se disparan. Si se adopta, hay que usar los ritmos de objetivos de la «Partida larga». Con ellos, los objetivos vuelven al 31–32 %.
- **(c) Prendas a 1/3/5.** Casi no cambia nada: solo la toalla baja un punto, y la partida dura 0,3 rondas más. No arregla el problema por sí sola.
- **(d) 2 cuerdas por turno.** Es la que más cambia el juego. El tendedero se llena en la ronda 4,4, las prendas que sobran bajan de 5 a 1,4 por jugador, y las mejoras se triplican. Pero **acorta la partida** (4,3 rondas): cabe más ropa, se seca antes y se llega antes a 30. Por eso hay que combinarla con una meta más alta.
- **(e) Mejorar una cuerda con habilidad.** Con los bots apenas se nota: 0,1 cambios por jugador. Aun así sube las partidas con alguna mejora de 17–32 % a 28–44 %. Su valor está en dar uso a las cuerdas que robas con el tendedero lleno: sin (e), en cuanto todas tus cuerdas tienen habilidad, una cuerda nueva no sirve de nada. No cuesta nada en duración ni en equilibrio.

**El tendedero se llena casi siempre en la misma ronda (4,4–4,9) en todas las variantes con 2 cuerdas.** Lo que cambia es lo que dura la partida después. Para que se llene «hacia la mitad», la partida tendría que durar 9–10 rondas, y eso es demasiado: a 4 jugadores se acaba la ropa en la ronda 7. Lo realista es que se llene **hacia los dos tercios o tres cuartos de la partida**, con unas 6,5–7 rondas.

## 3. Lo que los bots no reflejan bien

- **Mover e intercambiar cuerdas** casi no cambia: 0,1–0,3 cartas por jugador en todas las variantes. No depende de las reglas, sino del mazo: solo hay **2 copias** de «Mover cuerda» y 2 de «Cambiar cuerdas» entre unas 40 cartas de acción. Con partidas más largas salen algo más: el 50–60 % de las partidas a 4 jugadores tienen alguna, frente al 41 % de hoy. Si quieres verlas a menudo, la palanca es **subir a 3 copias de cada una**. No está simulado.
- **La idea (e)** la valoran mal los bots. Ven igual una cuerda con habilidad que otra, salvo cuando su efecto les da puntos al momento. Una persona la usará más, por ejemplo para cambiar unas pinzas de un color que ya no le sirve, o para poner un tejadillo antes de la lluvia.
- **Las mejoras de los bots** se quedan en 1 por jugador como mucho. Una persona que disfruta mejorando cuerdas robará más cuerdas cuando tenga el tendedero lleno.

## 4. ¿Se mantiene Difícil > Normal > Fácil?

Partidas a 3 jugadores con un bot de cada nivel (300 por variante), victorias de cada uno:

| Variante | Difícil | Normal | Fácil |
|---|---|---|---|
| Hoy | 71 % | 25 % | 4 % |
| Recomendada (b + d + e, final 40, ritmos de la larga) | 46 % | 28 % | 26 % |
| c + d + e, final 45 | 49 % | 28 % | 23 % |
| Alternativa (d + e, final 55) | 51 % | 27 % | 23 % |

**El orden se mantiene en todas, pero los niveles se acercan.** El Fácil coge más ropa de la que puede tender, y eso deja de castigar cuando hay sitio de sobra y las partidas son más largas. Normal y Fácil quedan casi empatados. Si se adopta el cambio, convendría revisar el nivel Fácil (por ejemplo, que no mejore cuerdas o que robe peor) para que vuelva a notarse la diferencia. En las partidas Normal contra Difícil, el Difícil gana igual o algo menos que hoy (a 2 jugadores, 67 % frente a 71 %).

## 5. Objetivos

- **Con prendas a 1/2/3 sin tocar los objetivos**, pesan el 44 % de los puntos y se descompensan: quien lleva de secreto «Conjunto completo» gana 17 puntos de porcentaje más de lo justo (20 puntos de media), y «Todo azul» o «Todo blanco», 13–17 más.
- **Con los ritmos de la «Partida larga»** (ya están en `ajustes-por-defecto.json`, `modos.larga.objetivos`), vuelven al 31–32 %, como hoy. Quedan algo altos «Todo blanco» y «Colección de color» (+13–18) y algo bajo «Parejas» (−16). Son ritmos pensados para 70 puntos: para 40 merecería la pena un ajuste fino con `informes/modos/ajustar-objetivos.mjs`.
- **Con 1/3/6 o 1/3/5 y metas de 45–55**, los objetivos siguen en el 33–36 %, pero **«Conjunto completo» se dispara** (+13 a +16 puntos de porcentaje; 15–20 puntos de media). Habría que bajarlo, por ejemplo de 7 a 5 puntos por conjunto.
- En todas las variantes, también hoy, **«Cuerdas llenas» y «Regalo envenenado» se quedan cortos**: quien los lleva gana 15–25 puntos de porcentaje menos de lo justo. No es cosa de este cambio, pero sigue pendiente.

## 6. Recomendación

### Principal: prendas 1/2/3, 2 cuerdas por turno, idea (e), final en 40 y los ritmos de objetivos de la larga

**Por qué:**

- Es la que mejor cumple el objetivo sin pasarse de largo. Dura 6,4–6,7 rondas, y **el 85 % de los jugadores llena el tendedero, hacia la ronda 4,8**. Quedan unas 2 rondas con el tendedero lleno para mejorar, cambiar y mover cuerdas.
- Mejorar cuerdas pasa de 0,1 a 0,9 veces por jugador, y en el 88–96 % de las partidas alguien mejora.
- No faltan prendas en los turnos, y casi no sobran (0,5 sin tender al final).
- Los objetivos pesan lo mismo que hoy (31–32 %).
- El orden de dificultad se mantiene.
- Es la «Partida larga» que ya existe, pero acabando en 40 en vez de 70. El motor, la IA y los textos ya lo saben hacer.

**Qué se pierde:**

- Dura un 40–45 % más: unos 40 / 55 / 67 min según el modelo, frente a 28 / 36 / 46.
- A 4 jugadores se va justo de ropa: la bolsa se vacía en la ronda 7 en el 45 % de las partidas, y un 5 % acaba porque se termina la ropa.
- Las toallas pierden protagonismo: valen la mitad (3 en vez de 6) y se nota menos el golpe de secar una.
- Hay que reimprimir la ficha de puntos de todas las prendas y las cartas de objetivo.
- Normal y Fácil se parecen más.

### Alternativa: prendas como ahora (1/3/6), 2 cuerdas por turno, idea (e) y final en 55

**Por qué:**

- **No hay que tocar las cartas de prenda.** Lo que cambia es la meta, dos reglas y un objetivo.
- Dura unas 6 rondas, el 74–78 % de los jugadores llena el tendedero, hay 0,8 mejoras por jugador y en el 78–95 % de las partidas alguien mejora.
- Los objetivos se quedan en el 33–34 %.

**Qué se pierde:**

- El tendedero se llena más tarde (79 % de la partida), así que queda algo más de 1 ronda para disfrutarlo, no 2.
- «Conjunto completo» se dispara y habría que bajarlo.
- A 4 jugadores, la bolsa se vacía en el 20 % de las partidas, aunque ninguna acaba sin ropa.
- «55» es un número de meta raro. Con «50» saldría algo entre la columna de 45 y la de 55: unas 5,6 rondas y el 70 % de los jugadores llenando.

**Intermedia, por si te gusta la toalla a 5:** 1/3/5 + 2 cuerdas + (e) + final en 55. Da 6,3 rondas y el 82 % llena el tendedero, hacia el 75 % de la partida. Pero a 4 jugadores la bolsa se vacía en el 35 % de las partidas, y «Conjunto completo» también se dispara.

**Descartadas:**

- (a), (b), (c) y (e) por separado, y (b) o (c) con la meta ajustada: no llenan el tendedero.
- d + e, a + d + e y c + d + e con metas de 30–40: la partida se queda en 4–5 rondas y el tendedero se llena justo al final.
- b + d + e con final en 45: es el que más se acerca a «llenar hacia los dos tercios», pero a 4 jugadores el 22 % de las partidas acaba porque se termina la ropa.

## 7. Qué cambiar en las cartas y el reglamento

**Con la recomendada:**

- **Ficha de puntos de las prendas:** calcetín 1, camiseta **2** (antes 3) y toalla **3** (antes 6).
- **Meta:** «La partida acaba al terminar la ronda en que alguien llega a **40** puntos». Va en el reglamento y en el marcador, si lo tiene marcado.
- **Reglamento, turno:** «Puedes jugar hasta **2 cartas de cuerda** por turno (colocar o mejorar)».
- **Carta «Colocar cuerda extra»** («Este turno puedes jugar 1 cuerda más»): el texto sigue valiendo, ahora serían 3. Si se ve demasiado fuerte, se puede cambiar por «Roba 2 cartas de cuerda» o quitar una copia.
- **Idea (e), regla de mejora.** Hoy dice: «Las cuerdas con habilidad van sobre una básica». Pasaría a decir: «**Puedes poner una cuerda con habilidad encima de otra cuerda tuya, básica o con habilidad.** Las prendas se quedan donde están y la de debajo se descarta. La cuerda vieja solo se arregla con una básica, y no sirve para mejorar». Como afecta a todas las cuerdas con habilidad, es mejor ponerlo en el reglamento y en la ayuda que reimprimir cada carta. Si las cartas de habilidad llevan un recordatorio de «va sobre una básica», cámbialo por «va sobre una básica o sobre otra cuerda con habilidad».
- **Cartas de objetivo:** los ritmos nuevos («cada X → Y puntos»), los de `modos.larga.objetivos`, con un repaso para 40 puntos.

**Con la alternativa:**

- Meta en 55 (o 50).
- Las mismas reglas de 2 cuerdas, (e) y «Colocar cuerda extra».
- Bajar «Conjunto completo», por ejemplo a 5 puntos por conjunto.
- Las prendas no cambian.

**En el juego digital**, para la recomendada, bastaría con pasar los valores de `modos.larga` al juego base en `data/ajustes-por-defecto.json` y `data/prendas.json`, con `umbralFinal: 40`, y añadir la regla (e) en `mejorarCuerda` de `packages/motor/src/jugadas/colocarCuerda.ts`. Para que la IA use la (e), `cuerdasARobarBase` (`packages/motor/src/ia.ts`) debería robar alguna cuerda aunque no le queden básicas. En la simulación robaba 1 de más con el tendedero lleno.

## 8. Qué hacer con la «Partida larga»

**Quitarla.**

- Con la recomendada, el juego base ya es la larga, pero acabando en 40: mismas prendas, mismas 2 cuerdas, mismos ritmos de objetivos. Una larga a 70 volvería a ser «una locura» (10 rondas a 2 jugadores), y a 3 y 4 jugadores acabaría siempre porque se termina la ropa, como ya pasaba (89–100 %).
- Si se quiere conservar un modo más largo, la única versión con sentido sería **«Partida larga» solo a 2 jugadores, con final en 50**. Según la tendencia de la tabla, durarían unas 8 rondas. No está simulada: a 3 y 4 jugadores no da más de sí por la ropa.
- Con la alternativa (1/3/6 y final en 55), la larga tampoco aporta: sus prendas 1/2/3 serían una regla distinta, no una partida más larga.

## Cómo se ha hecho

- **Simulador:** el de `informes/modos/sim.ts`, con más medidas:
  - cambios de cuerda de la idea (e);
  - cartas «Mover cuerda» y «Cambiar cuerdas» jugadas;
  - turnos sin prendas;
  - prendas que esperan tras cada turno y las que quedan sin tender al final;
  - ronda en que se vacía la bolsa;
  - partidas que acaban por falta de ropa;
  - jugadas por tipo, para estimar los minutos.

  Está copiado en `simulacion/sim.ts`, con las configuraciones (`configs-jb.json` y `configs-jb2.json`) y el resumen (`resumen-jb.mjs`).
- **Regla (e) y robo de la IA:** se probaron en una copia del motor en una carpeta temporal, no en el repo. Los cambios están en `simulacion/motor-idea-e.patch` (8 líneas):
  - en `mejorarCuerda`, una cuerda con habilidad se acepta encima de otra con habilidad;
  - en `cuerdasARobarBase`, con el tendedero lleno, la IA quiere tener 1 cuerda con habilidad de más en la mano.
- **Partidas:** 45 + 28 configuraciones × 300 partidas (unas 22 000 partidas).

## Meta 35 (lo que se ha aplicado)

El usuario aprobó la recomendada, pero con la **meta en 35 puntos con cualquier número de jugadores**, para que no falte ropa a 4 y que no haya ninguna regla distinta según cuántos jueguen. Es lo que ya está en el repo:
- prendas a 1/2/3;
- 2 cartas de cuerda por turno;
- regla (e);
- final en 35;
- ritmos de objetivos nuevos.

Simulado con el motor ya cambiado: 200 partidas por casilla, IA Normal y Difícil alternas.

| | 2 jugadores | 3 jugadores | 4 jugadores |
|---|---|---|---|
| Rondas | 6,2 | 6,0 | 5,8 |
| Duración estimada | 37 min | 49 min | 62 min |
| Jugadores que llenan el tendedero | 78 % | 76 % | 73 % |
| Ronda en que se llena (parte de la partida) | 4,8 (78 %) | 4,7 (79 %) | 4,7 (80 %) |
| Mejoras de cuerda por jugador | 0,7 | 0,6 | 0,6 |
| Partidas con alguna mejora | 78 % | 84 % | 92 % |
| Partidas con «Mover cuerda» o «Cambiar cuerdas» | 36 % | 47 % | 63 % |
| Acaba porque se termina la ropa | 0 % | 0 % | **1 %** |
| La bolsa se vacía (ronda) | 0 % | 0 % | 15 % (ronda 7) |
| Turnos sin prendas teniendo hueco | 0 % | 0 % | 0 % |
| Puntos por jugador | 53 | 52 | 51 |
| Parte de los puntos que viene de objetivos | 32 % | 33 % | 32 % |

**Frente a 40 puntos:**
- se juega media ronda menos (6,2 / 6,0 / 5,8 en vez de 6,7 / 6,6 / 6,4);
- llena el tendedero algo menos gente (73–78 % en vez de 84–87 %);
- se llena un poco más tarde (79 % de la partida en vez de 74 %);
- **a 4 jugadores casi nunca se acaba la ropa**: el 1 % de las partidas, frente al 5 % con 40 y al 22 % con 45.

### Ritmos de los objetivos

Están en `data/objetivos.json`. Se calcularon con `ajustar-objetivos.mjs` para que cada objetivo pese frente a la ropa lo mismo que en el juego anterior. Después se redondearon a ritmos sencillos y se comprobaron con la tanda de arriba: los objetivos pesan el **32–33 % de los puntos**.

| Objetivo | Antes | Ahora |
|---|---|---|
| Calcetinero | cada 2 → 2 | cada 3 → 2 |
| Toallero | cada 2 → 3 | cada 2 → 2 |
| Camisetero | cada 2 → 3 | cada 3 → 2 |
| Colección de color | cada 2 → 3 | cada 1 → 1 |
| Arcoíris | cada 1 → 5 | cada 1 → 3 |
| Montón de ropa | cada 4 → 2 | cada 6 → 2 |
| Tendedero completo | cada 1 → 6 | cada 1 → 2 |
| Variedad de cuerdas | cada 2 → 3 | igual |
| Todo blanco / azul / rojo / amarillo | cada 2 → 5 | cada 2 → 3 |
| Cada oveja con su pareja | cada 1 → 2 | cada 1 → 1 |
| Bajo techo | cada 1 → 2 | cada 2 → 3 |
| A toda prisa | cada 2 → 4 | cada 2 → 3 |
| Cuerdas llenas | cada 1 → 2 | igual |
| Regalo envenenado | cada 1 → 4 | igual |
| Conjunto completo | cada 1 → 7 | cada 1 → 3 |

**Queda algo descompensado:**
- **«Conjunto completo»**: quien lo lleva de secreto gana 13 puntos de porcentaje más de lo justo, con unos 8 puntos de media. Si molesta, se puede bajar a «cada 1 → 2».
- **«Cuerdas llenas» y «Regalo envenenado»**: siguen cortos (−16 a −18 puntos de porcentaje), como antes del cambio.

### Niveles de la IA

La IA Fácil ahora juega **como mucho 1 carta de cuerda por turno**: no aprovecha la segunda. Sin este cambio, con las reglas nuevas la Fácil quedaba casi empatada con la Normal (26 % frente a 28 % a 3 jugadores). Con él:

| Duelo | Victorias |
|---|---|
| Los tres juntos (3 jugadores) | Difícil 57 % · Normal 39 % · Fácil 4 % |
| Normal contra Fácil (2 jugadores) | Normal 89 % · Fácil 11 % |
| Difícil contra Normal (2 jugadores) | Difícil 63 % · Normal 38 % |

Las tres IA saben usar la regla (e). Con el tendedero lleno, roban 1 cuerda más para poder cambiar una por otra. Detalle en `informes/ia-dificultad/resultados.md`.

### «Colocar cuerda extra» con 2 cuerdas por turno

Se queda como está: «Este turno puedes jugar 1 cuerda más», así que ese turno son 3.
- **Al principio de la partida** es algo más fuerte que antes: con 3 cuerdas en un turno se llenan 3 de los 8 huecos de golpe.
- **Con el tendedero lleno** sirve para hacer una mejora más.

En las simulaciones no destaca, pero conviene vigilarla. Si se nota demasiado fuerte, la opción más sencilla es dejarla en 1 copia.
