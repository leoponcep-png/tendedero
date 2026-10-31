# Objetivos para el final en 40 y mazo de acciones nuevo

## En pocas palabras

- **Ritmos nuevos en `data/objetivos.json`.** Con los de la 0.3.0, 6 objetivos se salían mucho: Arcoíris, los cuatro «Todo de un color», Conjunto completo y Colección de color daban demasiado (+9 a +14 puntos de porcentaje de victorias sobre lo justo), y Tendedero completo, Cuerdas llenas y Regalo envenenado se quedaban cortos (−11 a −15). Ahora todos quedan entre −4 y +6, salvo **Regalo envenenado (−16)**: los bots casi no colocan cuerdas viejas y eso no se arregla con el ritmo.
- **Peso de los objetivos: 29–30 %** del total (antes, 32–33 %). Queda un poco por debajo del 31–33 % pedido. Es el precio de dejar justos los objetivos que daban de más con números sencillos. Ver el apartado 3.
- **Mazo nuevo aplicado:** fuera «Colocar cuerda extra» y «Cambiar prendas de sitio». Entran «Cesto de ropa sucia», «Manguerazo» y «Secador». «Mover prenda propia» también intercambia, y «Mover una prenda rival» también. La partida casi no cambia: 6,5 · 6,5 · 6,2 rondas y el 83–85 % de los jugadores llenan el tendedero.
- **Ojo con el Cesto:** quien lo juega gana 13 puntos de porcentaje más de lo normal. Puede ser fuerte. Ver el apartado 4.
- **Final en 35 frente a 40:** no se ha podido volver a medir con el mazo nuevo, porque se pararon las simulaciones. Hay que tomarlo como «sin probar». Los datos de la sesión anterior están en el apartado 5.

Las cifras van siempre **a 2 · 3 · 4 jugadores**. Juegan bots Normal y Difícil en asientos alternos.

## 1. Partida con el final en 40

| | Antes (0.3.0) | Ahora (mazo nuevo) |
|---|---|---|
| Partidas por casilla | 300 | 300 |
| Rondas | 6,6 · 6,6 · 6,5 | 6,5 · 6,5 · 6,2 |
| Jugadores que llenan el tendedero | 82 · 84 · 81 % | 85 · 84 · 83 % |
| Ronda en que se llena | 4,8 · 4,8 · 4,7 | 4,8 · 4,8 · 4,7 |
| Mejoras de cuerda por jugador | 1,0 · 0,9 · 0,9 | 1,1 · 1,1 · 0,9 |
| Partidas con alguna mejora | 85 · 93 · 98 % | 87 · 95 · 97 % |
| Partidas en que se acaba la ropa | 0 · 0 · 5 % | 0 · 0 · 6 % |
| Partidas en que se vacía la bolsa | 0 · 1 · 50 % | 0 · 2 · 52 % |
| Puntos por jugador | 59 · 59 · 57 | 57 · 58 · 55 |
| Parte de los puntos que viene de objetivos | 32 · 33 · 32 % | 29 · 30 · 29 % (*) |
| Victorias Difícil / Normal | 63/37 · 43/24 · 34/16 % | 69/31 · 42/24 · 32/18 % |

(*) La tanda se jugó con «Tendedero completo» a «cada 1 → 4». El peso con el «cada 1 → 3» final se ha recalculado con lo que tenía cada jugador al acabar. Con 1 → 4 era 29 · 30 · 30 %.

## 2. Objetivos: antes y después

Para medir cada objetivo, se le da de secreto a un jugador en todas las partidas. Las columnas «Gana» dicen cuántas partidas gana ese jugador. Lo justo es 50 · 33 · 25 %. «Desvío» es la media de la diferencia con lo justo.

- **Antes:** mazo de la 0.3.0, 100 partidas por objetivo y número de jugadores.
- **Después:** mazo nuevo, 68–100 partidas por casilla. Conjunto completo a 2 jugadores no llegó a jugarse. Los objetivos que solo cambiaron de ritmo en el último paso (Tendedero completo a 3 y 4 jugadores) se han recalculado con lo que tenía el jugador al acabar.

| Objetivo | Ritmo antes | Pts antes | Gana antes | Desvío antes | **Ritmo ahora** | Pts ahora | Gana ahora | Desvío ahora |
|---|---|---|---|---|---|---|---|---|
| Calcetinero | cada 3 → 2 | 6,2 · 7,3 · 6,4 | 50 · 41 · 28 % | +3 | igual | 6,5 · 6,9 · 7,0 | 55 · 35 · 37 % | +6 |
| Toallero | cada 2 → 2 | 5,5 · 4,7 · 5,2 | 53 · 30 · 23 % | −1 | igual | 5,1 · 5,0 · 4,4 | 53 · 29 · 22 % | −2 |
| Camisetero | cada 3 → 2 | 4,8 · 5,1 · 4,9 | 47 · 34 · 25 % | −1 | igual | 5,4 · 4,7 · 4,9 | 48 · 30 · 22 % | −3 |
| Colección de color | cada 1 → 1 | 8,8 · 8,8 · 8,4 | 59 · 44 · 32 % | +9 | **cada 3 → 2** | 5,0 · 4,9 · 4,8 | 47 · 26 · 23 % | −4 |
| Arcoíris | cada 1 → 3 | 9,4 · 10,5 · 9,4 | 57 · 51 · 44 % | +14 | **cada 1 → 2** | 7,1 · 6,3 · 5,9 | 55 · 40 · 24 % | +4 |
| Montón de ropa | cada 6 → 2 | 6,5 · 6,5 · 6,2 | 47 · 39 · 24 % | 0 | igual | 6,6 · 6,3 · 6,3 | 54 · 30 · 32 % | +3 |
| Tendedero completo | cada 1 → 2 | 3,6 · 3,7 · 3,7 | 44 · 24 · 9 % | −11 | **cada 1 → 3** | 5,8 · 5,6 · 5,4 | 49 · 33 · 28 % | +1 |
| Variedad de cuerdas | cada 2 → 3 | 5,4 · 5,5 · 5,4 | 46 · 36 · 16 % | −3 | igual | 5,4 · 5,7 · 5,4 | 47 · 36 · 28 % | +1 |
| Todo blanco | cada 2 → 3 | 10,0 · 9,6 · 9,0 | 55 · 50 · 31 % | +9 | **cada 2 → 2** | 6,3 · 6,0 · 5,8 | 48 · 32 · 21 % | −2 |
| Todo azul | cada 2 → 3 | 9,2 · 9,7 · 10,0 | 52 · 47 · 33 % | +8 | **cada 2 → 2** | 6,3 · 6,3 · 6,0 | 55 · 34 · 27 % | +3 |
| Todo rojo | cada 2 → 3 | 9,1 · 10,2 · 9,4 | 61 · 52 · 36 % | +13 | **cada 2 → 2** | 6,1 · 5,9 · 6,2 | 53 · 36 · 25 % | +2 |
| Todo amarillo | cada 2 → 3 | 9,9 · 9,8 · 8,8 | 64 · 41 · 39 % | +12 | **cada 2 → 2** | 6,0 · 6,6 · 6,3 | 49 · 42 · 25 % | +2 |
| Cada oveja con su pareja | cada 1 → 1 | 3,8 · 4,6 · 3,9 | 36 · 34 · 20 % | −6 | **cada 2 → 3** | 5,6 · 6,4 · 5,8 | 49 · 28 · 25 % | −2 |
| Bajo techo | cada 2 → 3 | 6,8 · 7,2 · 5,7 | 54 · 38 · 31 % | +5 | igual | 7,9 · 5,9 · 5,8 | 58 · 32 · 32 % | +4 |
| A toda prisa | cada 2 → 3 | 5,1 · 6,9 · 5,2 | 52 · 35 · 27 % | +2 | igual | 5,8 · 4,3 · 4,9 | 52 · 23 · 30 % | −1 |
| Cuerdas llenas | cada 1 → 2 | 1,6 · 1,6 · 2,1 | 32 · 22 · 12 % | −15 | **cada 1 → 5** | 3,4 · 6,7 · 6,0 | 50 · 29 · 25 % | −2 |
| Regalo envenenado | cada 1 → 4 | 1,2 · 1,4 · 1,4 | 39 · 22 · 11 % | −12 | **cada 1 → 6** | 2,4 · 2,2 · 3,5 | 20 · 21 · 18 % | −16 |
| Conjunto completo | cada 1 → 3 | 10,3 · 9,3 · 8,9 | 69 · 46 · 30 % | +12 | **cada 1 → 2** | – · 6,1 · 5,8 | – · 23 · 24 % | −5 (3 y 4 j) |

Notas:

- Con 70–100 partidas por casilla, cada porcentaje tiene un margen de unos ±5 puntos. Las diferencias de ±5 no son de fiar.
- **Regalo envenenado** sigue corto, aunque ahora da 6 puntos por cuerda. Los bots casi nunca colocan cuerdas viejas a un rival, ni lo llevando de secreto. Una persona que vaya a por él sacará más. Lo dejo en 6, que es más atractivo sin pasarse. Si en la mesa real se queda corto, conviene cambiarle la regla, no el número.
- **Calcetinero** queda algo alto a 4 jugadores (+12), pero a 2 y 3 está bien.
- **Conjunto completo** queda algo bajo a 3 jugadores (−10), pero a 4 está justo.

## 3. Por qué los objetivos pesan un 29–30 % y no un 31–33 %

Los objetivos que daban de más eran los que subían el peso. Al bajarlos a números sencillos, cada jugador suma unos 2 puntos menos de objetivos. Para volver al 31 % habría que subir todos un poco por igual. Con ritmos de números enteros, eso descompensa unos frente a otros. He preferido que cada objetivo sea justo. Si se quiere llegar al 31 %, es mejor subir todos los objetivos a la vez y en la misma medida que tocarlos uno a uno. **No está probado.**

## 4. Mazo de acciones nuevo

Cambios aplicados:

| Carta | Grupo | Copias | Qué hace |
|---|---|---|---|
| ~~Colocar cuerda extra~~ | táctica | ~~2~~ → 0 | Quitada. |
| ~~Cambiar prendas de sitio~~ | táctica | ~~2~~ → 0 | Va dentro de «Mover prenda propia». |
| Cesto de ropa sucia | táctica | 2 | Roba 3 prendas de la bolsa a tus prendas por tender. Si quedan menos, las que haya. No se puede jugar con la bolsa vacía. |
| Secador | táctica | 2 | −2 de humedad a una prenda tuya. Si llega a 0, se seca y puntúa. |
| Mover prenda propia | táctica | 2 → **3** | Mueve una prenda tuya a otro hueco libre, o intercambia el sitio de dos prendas tuyas. |
| Mover una prenda rival | fastidio | 3 | Ahora también puede intercambiar el sitio de dos prendas del rival. Si una de las dos está en una cuerda resistente, protegida o con otro escudo, no se puede. |
| Manguerazo | fastidio | 3 | +2 de humedad a una prenda rival (máximo 4). El tejadillo lo para, y se puede anular con «¡Ni hablar!». |

El mazo de acciones pasa de 35 a 39 cartas en juego: 16 de fastidio y 23 de táctica. Con «Pinza rota», que está pendiente, serían 38 y 42.

**Cuánto se usa cada carta.** Datos de 300 partidas por casilla. «Gana si la juega / si no» compara las victorias de quien la jugó alguna vez con las de quien no, en puntos de porcentaje frente a lo justo. Es orientativo: quien va ganando suele jugar más cartas.

| Carta | Veces por jugador | Partidas en que sale | Gana si la juega / si no |
|---|---|---|---|
| Cesto de ropa sucia | 0,41 · 0,38 · 0,35 | 66 · 84 · 93 % | **+13 / −7** |
| Secador | 0,46 · 0,40 · 0,40 | 71 · 84 · 95 % | 0 / 0 |
| Manguerazo | 0,51 · 0,54 · 0,48 | 70 · 89 · 93 % | −1 / +1 |
| Mover prenda propia (mover) | 0,07 · 0,06 · 0,07 | 12 · 16 · 24 % | +5 / 0 |
| Mover prenda propia (intercambiar) | 0,12 · 0,17 · 0,13 | 23 · 40 · 43 % | −1 / 0 |
| Mover una prenda rival (mover) | 0,24 · 0,26 · 0,27 | 42 · 59 · 71 % | 0 / 0 |
| Mover una prenda rival (intercambiar) | 0,09 · 0,16 · 0,17 | 16 · 40 · 52 % | −1 / 0 |
| Secar prenda inmediatamente (para comparar) | 0,45 · 0,42 · 0,38 | 69 · 85 · 93 % | +2 / −1 |
| Reducir humedad (para comparar) | 0,40 · 0,39 · 0,37 | 63 · 80 · 91 % | 0 / 0 |

- **Secador:** se usa tanto como «Secar prenda inmediatamente», y no desequilibra: quien lo juega gana lo mismo que quien no.
- **Manguerazo:** es el fastidio que más se juega, junto con «Mojar cuerda rival» y «Ráfaga». Tampoco desequilibra.
- **Mover / intercambiar:** los bots intercambian más de lo que mueven. Con 3 copias, «Mover prenda propia» sale en el 23–43 % de las partidas. Antes, mover e intercambiar eran 4 cartas en total.
- **Cesto de ropa sucia:** es lo único que destaca. Quien lo juega gana bastante más (+13 frente a −7): son 3 prendas gratis, unos 6 puntos si caben. Hay dos matices. Quien tiene sitio libre es quien más lo juega. Y el bot «ve» qué prendas va a robar al decidir si juega la carta, cosa que una persona no puede. Si en la mesa se nota fuerte, lo sencillo es dejarlo en **2 prendas** o en 1 copia. No está probado.

## 5. Final en 35 frente a 40 (solo informativo, sin aplicar)

**Sin probar con el mazo nuevo ni con los ritmos nuevos:** se pararon las simulaciones antes de llegar a esta tanda. Lo único que hay son los datos de la sesión anterior, con el mazo y los ritmos de entonces y 200–300 partidas por casilla (de `propuesta.md`):

| | Final en 40 | Final en 35 |
|---|---|---|
| Rondas | 6,7 · 6,6 · 6,4 | 6,2 · 6,0 · 5,8 |
| Jugadores que llenan el tendedero | 87 · 85 · 84 % | 78 · 76 · 73 % |
| Partidas en que se acaba la ropa | 0 · 0 · 5 % | 0 · 0 · 1 % |

Con el mazo nuevo, el final en 40 ha dado casi lo mismo que entonces: 6,5 · 6,5 · 6,2 rondas, el 83–85 % llena el tendedero y el 6 % de las partidas a 4 jugadores acaba sin ropa. Lo esperable con 35 es lo mismo que en la tabla: media ronda menos, un 10 % menos de jugadores que llenan el tendedero y casi nunca sin ropa. El Cesto saca 3 prendas de la bolsa cada vez, así que a 4 jugadores puede adelantar algo el fin de la ropa.

## 6. Niveles de la IA

- **Difícil frente a Normal**, con el mazo nuevo y 300 partidas por casilla: la Difícil gana el 69 % a 2 jugadores. A 3 y 4 jugadores, la Difícil gana 42 % y 32 %, y la Normal, 24 % y 18 %. Lo justo es 33 % y 25 %. El margen se mantiene, igual que con la 0.3.0.
- **Fácil:** el torneo con los tres niveles no llegó a jugarse con el mazo nuevo, así que está **sin probar**. Con la 0.3.0, la Difícil ganaba el 57 %, la Normal el 39 % y la Fácil el 4 %. Las cartas nuevas las usan los tres niveles igual que las demás, porque la IA prueba cada jugada válida con el motor. No hay nada que haga más fuerte a la Fácil. Los tests de `ia-dificultad.test.ts` pasan.

## 7. Qué se ha cambiado en el repo

- **Datos.**
  - `data/objetivos.json`: los ritmos de la tabla del apartado 2.
  - `data/acciones.json`: el mazo del apartado 4.
  - `data/cuerdas.json`: el texto del tejadillo nombra también el Manguerazo.
- **Motor.**
  - En `efectos/acciones.ts`:
    - efectos nuevos: `cesto-ropa-sucia`, `manguerazo` y `secador`;
    - el mover de prendas intercambia si se suelta sobre otra prenda del mismo tendedero;
    - `colocar-cuerda-extra` y `cambiar-prendas` se quedan solo para las partidas guardadas que aún tengan esas cartas.
  - En `jugadas/jugarAccion.ts`: el intercambio valida que quepan las dos prendas. Si es un fastidio, valida también los escudos de la cuerda de la segunda prenda.
- **IA:** sin cambios de código. Los tres niveles prueban las jugadas nuevas con el motor, también los destinos de intercambio.
- **Mesa** (`juego/`):
  - Al mover, se puede pulsar un hueco libre o una prenda: si es una prenda, se ilumina y se intercambian. El segundo paso es pulsar, como antes, no arrastrar.
  - En `animar.ts`, el Manguerazo suena a chaparrón y enseña «+2», y el Secador evapora 2.
  - El tutorial usa una semilla nueva, `aprende-a-tender-4442`, porque con el mazo nuevo la 833 ya no daba las cartas que enseña. La nueva da básica, resistente, «Reducir humedad» y «¡Ni hablar!» para ti; al rival, «Retrasar secado»; y racha de sol. No se ha jugado entero en el navegador.
- **Iconos SVG** de Cesto, Manguerazo y Secador, en `prototipos/ArteBosque.tsx` y `arte/Iconos.tsx`. Se han visto en el navegador.
- **12 idiomas:**
  - nombres y textos de las tres cartas nuevas;
  - textos nuevos de «Mover prenda propia» y «Mover una prenda rival»;
  - el tejadillo;
  - el registro «roba N prendas de la bolsa»;
  - el motivo «no quedan prendas en la bolsa»;
  - la ayuda del segundo paso al mover.
- **Tests.** Se han actualizado los que dependían de las cartas quitadas o de los ritmos. Hay tests nuevos de Cesto, Manguerazo, Secador, intercambiar con «Mover prenda propia» y el intercambio rival con la cuerda resistente. El typecheck y `npm test` pasan: 110 tests.
- **`Lista de cartas.xlsx`:** se han rehecho las hojas Fastidio, Táctica, Objetivos y Resumen. Se conserva por id lo que había en «Ilustración hecha» y en «Imagen actual». Las cartas nuevas llevan «(carta nueva: aún sin imagen)». Hay una copia del archivo anterior en la carpeta temporal de la sesión.

## Cómo se ha hecho

En `simulacion/` están las herramientas:
- `sim-40.ts`: copia de `sim.ts`. El asiento con el secreto forzado va alternando Normal y Difícil, y se apunta el uso de cada carta de acción.
- `lanzar-40.mjs`: lanza la tanda con 2 procesos y prioridad baja.
- `resumen-40.mjs`: saca las tablas. Con un archivo de ritmos, también recalcula los puntos con otro ritmo, a partir de lo que tenía cada jugador al acabar.

En total se jugaron unas 13 000 partidas.
