# Informe de partidas con bots

> Pruebas terminadas. Recoge **unas 43 000 partidas** jugadas por bots con 2, 3 y 4 jugadores (más 6600 de una primera versión de los bots, que no se mezclan aquí).

## Lo que se ha decidido y aplicado al juego

| Tema | Decisión | Resultado con bots (reglas finales, 900 partidas) |
|---|---|---|
| Ritmos de objetivos | Compensados (tabla del apartado 3, con Cuerdas llenas de un color a cada 1 → 2) | Casi todos dan entre 3 y 5 puntos de media |
| Cuerda vieja | No cuenta como tu cuerda del turno; solo se arregla poniéndole encima una básica | Se colocan 2–4 por partida (antes 0,2–0,4) |
| Regalo envenenado | Cuenta las viejas tuyas en tendederos rivales al final, más los trofeos | 1 punto de media; de secreto gana el 28 % (justo: 34 %). Sigue algo flojo |
| Cuerdas llenas | Solo cartas llenas de un mismo color, cada 1 → 2 | 3,2 puntos; de secreto gana el 40 % |
| Cartas de habilidad | Solo mejoran cuerdas básicas | — |
| Se acaba la ropa | La partida acaba al terminar la ronda | Ya no hay partidas que no terminan |
| Robo | Se queda en 3 a elegir (más acciones) | — |
| Reparto | Se queda en el orden de los turnos (ver abajo) | 47 / 53 · 32 / 29 / 39 · 23 / 23 / 24 / 31 |
| Duración | Final a 30, prendas 1 / 3 / 6 | 32 min a 2, 40 a 3, 49 a 4 |

**Por qué el reparto se queda como estaba:** la desventaja de abrir la ronda venía de que los bots atacaban siempre al que iba mejor. Con bots que reparten los ataques, el orden normal ya sale justo (24 / 27 / 24 / 26 a 4 jugadores) y el reparto al revés se pasa. Ver «Orden del reparto según a quién atacan los bots».

Lo que sigue es el análisis completo, escrito antes de esas decisiones.

## En pocas palabras

- **El juego funciona y está bastante equilibrado.** Con las reglas actuales la partida dura unas 5 rondas: **30 minutos a 2 jugadores, 40 a 3 y 47 a 4**, para gente que ya sabe jugar.
- **Hay tres arreglos que mejoran el juego sin complicarlo:**
  1. **El reparto de prendas va al revés que los turnos** (coge primero quien jugará el último). Corrige la desventaja de abrir la ronda a 3 y 4 jugadores.
  2. **Robar 2 cartas en vez de 3** (con como mucho 2 de cuerda). La partida dura lo mismo o algo menos y se descarta muchísimo menos (unas 3–7 cartas por partida en vez de 11–22).
  3. **Reajustar el ritmo de los objetivos** para que todos den parecido (unos 4–5 puntos de media).
- **Para alargar la partida, sube el final o baja los puntos de las prendas** (ver la tabla de duración). El robo, la mano y las cestas casi no cambian lo que dura.
- **Hay dos problemas de diseño que te toca decidir a ti:**
  - La **cuerda vieja** casi no compensa, y por eso **Regalo envenenado** no da puntos.
  - Falta una **regla para cuando se acaba la ropa**.

## 1. Duración

Minutos con personas que ya saben jugar y, entre paréntesis, rondas. Con las reglas recomendadas (los tres arreglos de arriba):

| Jugadores | Final a 30 | 35 | 40 | 45 | 50 |
|---|---|---|---|---|---|
| **Prendas 1 / 3 / 6 (las actuales)** | | | | | |
| 2 | 30 (5,3) | 33 (5,8) | 35 (6,2) | 37 (6,6) | 39 (6,9) |
| 3 | 37 (5,1) | 40 (5,6) | 43 (5,9) | 46 (6,2) | 50 (6,8) |
| 4 | 45 (5,2) | 48 (5,4) | 53 (6,0) | 56 (6,3) | 61 (6,8) |
| **Prendas 1 / 3 / 5** | | | | | |
| 2 | 32 (5,6) | 35 (6,2) | 37 (6,5) | 39 (6,9) | 42 (7,3) |
| 3 | 40 (5,3) | 43 (5,8) | 47 (6,3) | 50 (6,7) | 54 (7,2) |
| 4 | 48 (5,3) | 52 (5,8) | 56 (6,2) | 60 (6,7) | 63 (7,0) |
| **Prendas 1 / 2 / 4** | | | | | |
| 2 | 37 (6,5) | 40 (6,9) | 43 (7,5) | 46 (8,0) | 49 (8,6) |
| 3 | 46 (6,2) | 52 (6,9) | 55 (7,3) | 61 (8,0) | 63 (8,3) |
| 4 | 57 (6,3) | 62 (6,8) | 66 (7,4) | 71 (8,0) | 75 (8,8) |

- **El reparto de los puntos cambia según las prendas:** con 1/3/6, los objetivos dan alrededor de un 25–30 % de los puntos; con 1/3/5, un tercio; con 1/2/4, más del 40 %. Cuanto más pesan los objetivos, más remontadas hay al final.
- **Cómo calculo los minutos** (para una mesa que ya conoce las reglas):
  - preparar: 6 min;
  - cada cogida del reparto: 15 s;
  - cada turno: 20 s, más 10 s por prenda o cuerda colocada y 15 s por cada acción;
  - cada ronda: 45 s, más 3 s por cada prenda a la que bajar la humedad;
  - recuento final: 3 min.
  
  La primera partida, explicando reglas, dura bastante más.

## 2. ¿Tiene ventaja quien empieza?

% de victorias por asiento (el 1 abre la primera ronda). Lo justo sería 50 / 50, 33 / 33 / 33 o 25 / 25 / 25 / 25.

| Jugadores | Reglas actuales (300 partidas) | Con los tres arreglos (1000 partidas) |
|---|---|---|
| 2 | 47 / 53 | 50 / 50 |
| 3 | 31 / 28 / **42** | 34 / 35 / 31 |
| 4 | **18** / 25 / 31 / 25 | 30 / 26 / 22 / 22 |

- **A 2 jugadores nunca ha habido ventaja.**
- **A 3 y 4, abrir la ronda era una desventaja clara.** Lo más probable es que se deba a que el primero cuelga su ropa y luego recibe los fastidios de todos los demás antes del secado.
- **Con el reparto al revés, a 3 jugadores queda justo; a 4 se pasa un poco.** Sumando todas las tandas con esa regla, el asiento 1 gana un 27–28 % en vez del 25 %: ahora tiene una ventaja pequeña, menos de la mitad de la desventaja que había antes.

## 3. Objetivos

Con los ritmos actuales, unos dan 6–8 puntos de media y otros 2–3. Propuesta, probada con 1000 partidas por número de jugadores:

| Objetivo | Ahora | Propuesta | Puntos medios antes → después | Gana con él de secreto (justo: 33 %) |
|---|---|---|---|---|
| A toda prisa | cada 1 → 3 | **cada 2 → 3** | 7,6 → 3,3 | 35 % |
| Variedad de cuerdas | cada 1 → 2 | cada 1 → 1 | 7,3 → 3,4 | 28 % |
| Bajo techo | cada 1 → 3 | **cada 1 → 2** | 6,6 → 4,5 | 33 % |
| Toallero | cada 1 → 2 | cada 2 → 3 | 6,3 → 4,0 | 36 % |
| Montón de ropa | cada 4 → 2 | cada 3 → 2 | 3,7 → 5,1 | 33 % |
| Cuerdas llenas | cada 1 → 2 | cada 1 → 3 | 3,1 → 4,7 | **46 %** |
| Tendedero completo | cada 1 → 4 | cada 1 → 6 | 2,9 → 4,1 | 34 % |
| Conjunto completo | cada 1 → 5 | cada 1 → 7 | 2,9 → 4,0 | 34 % |
| Todo blanco / azul / rojo / amarillo | cada 2 → 3 | cada 2 → 5 | 2,6 → 4,2 | 31–37 % |
| Arcoíris | cada 1 → 3 | cada 1 → 5 | 2,5 → 4,1 | 35 % |
| Cada oveja con su pareja | cada 1 → 4 | cada 1 → 6 | 2,4 → 3,2 | 28 % |
| Calcetinero | cada 2 → 2 | cada 1 → 2 | 2,0 → 4,5 | 37 % |
| Colección de color, Camisetero | sin cambios | sin cambios | 4,9 y 4,2 | 32 % |
| Regalo envenenado | cada 1 → 4 | — | 0,0 | 24 % |

- **Bajo techo sigue valiendo más por prenda que los de un color**, como querías: 2 puntos por prenda, frente a 5 por cada 2 prendas de un color.
- **Afinado posterior** (Cuerdas llenas cada 1 → 2, Parejas cada 1 → 7, Variedad de cuerdas cada 2 → 3; tabla «Objetivos con las reglas afinadas»):
  - **Variedad de cuerdas y Parejas mejoran.**
  - **Cuerdas llenas sigue ganando el 47 % de secreto aunque solo da 3,2 puntos.** No gana por los puntos: premia lo que de todas formas hace quien va ganando, que es tener el tendedero lleno. Quizá sea mejor que puntúe cada carta llena «de un mismo color» o que se quede como común.
  - **Bajo techo, en esta tanda, sube al 43 %.** Sigue dentro de lo que puede ser azar, pero conviene vigilarlo.

## 4. Cartas por turno, mano y cestas

Comparadas con las reglas actuales (100–300 partidas cada una):

| Cambio | Qué pasa |
|---|---|
| **Robar 2** (máx. 2 cuerdas) | Igual de larga o algo más corta; descartes de 11–22 a 3–7 por partida; un 40 % menos de acciones jugadas; la más justa en el orden de turno. |
| Robar 4 | Solo añade descartes (20–40 por partida). |
| Poder robar hasta 3 cuerdas | Más descartes de cuerdas, nada más. |
| Robo fijo de antes (1 cuerda + 2 acciones) | Más acciones jugadas (a 4 jugadores, 17 por partida frente a 10) y la partida un poco más larga. |
| Mano de 5 o de 7 | Casi igual; con 7 se descarta algo menos. |
| Cestas de antes (5/7/9, se renuevan todas) | Casi igual. La regla nueva de cestas no estropea nada y se mantiene mejor en la mesa. |
| Todo como antes a la vez | Algo más larga y con menos puntos por objetivos; nada más. |

## 5. La cuerda vieja y Regalo envenenado: a decidir

- **Los bots casi no colocan cuerdas viejas al rival:** la tienen en la mano en 5–10 turnos por partida y la colocan 0,2–0,4 veces.
- **La razón: le cuesta a quien la pone.** Gasta tu cuerda del turno (que podrías usar en tu tendedero) y tarda en hacer daño.
- **Cuando se coloca, casi nunca llega a romperse:** el rival tiene un turno entero para mejorarla, y los «¡Ni hablar!» la anulan.
- **Que se rompa ya al final de la ronda en que se pone apenas cambia nada** (0,1–0,2 trofeos por partida).
- **Por eso Regalo envenenado no da puntos**, y quien lo tiene de secreto gana el 24 % de las veces (lo justo: 33 %).

Opciones para arreglarlo:
- que colocar una vieja al rival **no cuente como tu cuerda del turno**;
- que Regalo envenenado puntúe por **viejas colocadas a rivales**, se rompan o no;
- que la vieja **no se pueda mejorar**;
- o **quitar Regalo envenenado** del montón.

**Primera prueba, que paré a medias** (291 partidas, casi todas con 2 jugadores; tabla «Opciones para la cuerda vieja»):
- **Si colocarla no gasta tu cuerda del turno**, los bots pasan a poner unas 2 por partida con 2 jugadores y más de 3 con 3. Pero el rival mejora la mayoría antes de que se rompan, así que siguen saliendo muy pocos trofeos (0,1–0,3 por partida).
- **Si además se rompe al acabar la ronda en que se pone**, salen unos 1,1 trofeos por partida (solo 21 partidas, muy poco para fiarse).
- **Contar las colocadas en vez de las rotas apenas cambia nada mientras se puedan mejorar**, porque al mejorarla deja de ser tuya.

Si quieres que la vieja funcione, lo que más prometía era combinar que **sea gratis** con que **no se pueda mejorar** o que **se rompa antes**. Faltaría jugar la tanda completa.

Los bots no planifican a varios turnos, así que una persona quizá la use más. Aun así, los datos apuntan a que, tal como está, compensa poco.

## 6. Otros hallazgos

- **Si se acaba la ropa, la partida no termina.** Con las reglas actuales no pasa (toda la ropa vale 292 puntos). Con prendas muy baratas (1/2/3), final a 50 y 4 jugadores, la ropa vale menos de lo que hace falta y algunas partidas pasaron de 60 rondas. Convendría una regla del estilo «si no queda ropa en la bolsa ni en las cestas, la partida acaba al terminar la ronda».
- **A 2 jugadores, quien llega primero al final gana casi siempre (88 %).** Los objetivos dan la vuelta a pocas partidas (12–19 %). A 4 jugadores hay remontadas en un tercio de las partidas. Si quieres finales más abiertos a 2, dale más peso a los objetivos con prendas más baratas.
- **Las acciones más jugadas** son Mojar cuerda rival, Retrasar secado, Ráfaga de viento, Secar prenda y Reducir humedad. Mover cuerda y Mover prenda rival casi no se juegan, y Buscar cuerda, Proteger cuerda, Colocar cuerda extra y los intercambios prácticamente nunca. En parte es porque los bots no saben valorarlas, pero también puede indicar que hacen poco.

## Cómo leer las cifras

- Los bots juegan razonablemente, pero no planifican a varios turnos ni ven la mano del rival: valen más las comparaciones entre reglas que las cifras exactas.
- Con 1000 partidas, diferencias de 2–3 puntos porcentuales pueden ser azar; con 300, de 3–5; con 40 (la tabla grande de variantes de puntuación), hasta 15.

---

# Informe de partidas con bots

Partidas jugadas: **42171** (6 abortadas por pasar de 60 rondas).
- 2 jugadores: 14230
- 3 jugadores: 13981
- 4 jugadores: 13960

Los bots juegan con una valoración sencilla: en cada paso prueban todas las jugadas válidas y se quedan con la que mejor deja la mesa para ellos frente al mejor rival. No planifican a varios turnos ni ven la mano del rival. Juegan razonablemente, pero peor que una persona con experiencia: las conclusiones sobre equilibrio valen más que las cifras exactas.

**Cómo se calcula el tiempo de personas.** A partir de lo que pasa en cada partida (repartos, turnos, prendas colgadas, cartas jugadas y prendas a las que bajar la humedad) con estos tiempos, para una mesa que ya conoce las reglas:
preparar 6 min · cada cogida en el reparto 15 s · cada turno 20 s · cada prenda o cuerda 10 s · cada acción 15 s más · cada ronda 45 s (carta del día, cestas) · cada prenda al secar 3 s · recuento final 3 min.
La primera partida, explicando reglas, dura bastante más.

## Las reglas actuales (calcetín 1, camiseta 3, toalla 6 · objetivos como están · final a 30)

| Jugadores | Partidas | Rondas (mín–máx) | Minutos (rango habitual) | Puntos medios | % por objetivos | Diferencia 1.º–2.º | Empates |
|---|---|---|---|---|---|---|---|
| 2 | 300 | 5,3 (4–10) | 31 (26–36) | 44,8 | 24 % | 13,1 | 0 % |
| 3 | 300 | 5,3 (4–8) | 40 (32–46) | 43,6 | 26 % | 10,0 | 0 % |
| 4 | 300 | 5,2 (4–7) | 47 (37–55) | 42,1 | 27 % | 7,9 | 0 % |

### ¿Tiene ventaja el que empieza?

Porcentaje de victorias según el asiento (asiento 1 = quien abre la primera ronda). Si no hubiera ventaja, cada asiento ganaría 1 de cada n partidas.

| Jugadores | Esperado | Asiento 1 | Asiento 2 | Asiento 3 | Asiento 4 |
|---|---|---|---|---|---|
| 2 | 50 % | 47 % | 53 % | — | — |
| 3 | 33 % | 31 % | 28 % | 42 % | — |
| 4 | 25 % | 18 % | 25 % | 31 % | 25 % |

Con pocas partidas, diferencias de unos 5 puntos porcentuales pueden ser azar. Con 200 partidas por número de jugadores, el margen de error es de unos ±7 puntos a 2 jugadores y ±6 a 4.

| Jugadores | El primero en llegar al umbral gana | Gana quien no iba primero antes de contar objetivos |
|---|---|---|
| 2 | 88 % | 12 % |
| 3 | 72 % | 27 % |
| 4 | 60 % | 36 % |

### Qué se juega

| Jugadores | Acciones por partida | Turnos con una vieja en la mano | Viejas puestas al rival | Mejoras | Trofeos | Anulaciones | Prendas perdidas | Descartes | Robo 2/1/0 cuerdas |
|---|---|---|---|---|---|---|---|---|---|
| 2 | 5,1 | 5,1 | 0,2 | 0,1 | 0,0 | 0,9 | 0,0 | 11,4 | 70 % / 20 % / 10 % |
| 3 | 7,5 | 7,8 | 0,3 | 0,2 | 0,0 | 1,3 | 0,0 | 17,4 | 70 % / 19 % / 11 % |
| 4 | 9,7 | 9,8 | 0,4 | 0,2 | 0,0 | 1,5 | 0,0 | 22,4 | 72 % / 19 % / 9 % |

Cartas de acción jugadas (todas las partidas con las reglas actuales): mojar-cuerda-rival 1842, retrasar-secado 1390, rafaga-de-viento 1318, secar-prenda 995, reducir-humedad 984, mover-cuerda 81, mover-prenda-rival 75.

### Objetivos

Puntos medios que da cada objetivo cuando está en juego (común o secreto), y cuánto gana quien lo tiene de secreto frente a lo esperado.

| Objetivo | Veces en juego | Puntos medios | Veces de secreto | Gana con él de secreto |
|---|---|---|---|---|
| a-toda-prisa | 468 | 7,6 | 155 | 39 % (esperado 33 %) |
| variedad-de-cuerdas | 414 | 7,3 | 142 | 33 % (esperado 33 %) |
| bajo-techo | 452 | 6,6 | 162 | 45 % (esperado 35 %) |
| toallero | 529 | 6,3 | 158 | 39 % (esperado 34 %) |
| coleccion-color | 449 | 5,0 | 175 | 40 % (esperado 34 %) |
| camisetero | 423 | 4,0 | 132 | 36 % (esperado 33 %) |
| monton-de-ropa | 461 | 3,7 | 159 | 30 % (esperado 33 %) |
| cuerdas-llenas | 435 | 3,1 | 156 | 40 % (esperado 33 %) |
| conjunto-completo | 471 | 2,9 | 149 | 34 % (esperado 32 %) |
| tendedero-completo | 442 | 2,9 | 146 | 30 % (esperado 33 %) |
| todo-amarillo | 454 | 2,7 | 149 | 32 % (esperado 34 %) |
| todo-rojo | 396 | 2,6 | 148 | 28 % (esperado 33 %) |
| todo-blanco | 447 | 2,6 | 145 | 32 % (esperado 33 %) |
| todo-azul | 481 | 2,6 | 131 | 29 % (esperado 33 %) |
| arcoiris | 459 | 2,5 | 134 | 28 % (esperado 33 %) |
| parejas | 462 | 2,4 | 178 | 31 % (esperado 34 %) |
| calcetinero | 447 | 2,0 | 156 | 26 % (esperado 34 %) |
| regalo-envenenado | 410 | 0,0 | 125 | 24 % (esperado 34 %) |

## Objetivos equilibrados

Mismas reglas, pero con el ritmo de los objetivos reajustado para que cada uno dé de media unos 4–5 puntos (ver la propuesta en las conclusiones).

| Jugadores | Reglas | Partidas | Rondas | Minutos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas |
|---|---|---|---|---|---|---|---|---|
| 2 | Actuales | 300 | 5,3 | 31 | 24 % | 13,1 | 47 / 53 | 12 % |
| 2 | Objetivos equilibrados | 300 | 5,3 | 31 | 26 % | 14,3 | 53 / 47 | 13 % |
| 2 | Equilibrados + reparto inverso | 300 | 5,3 | 31 | 27 % | 15,5 | 53 / 47 | 13 % |
| 3 | Actuales | 300 | 5,3 | 40 | 26 % | 10,0 | 31 / 28 / 42 | 27 % |
| 3 | Objetivos equilibrados | 300 | 5,3 | 39 | 28 % | 10,8 | 35 / 25 / 40 | 30 % |
| 3 | Equilibrados + reparto inverso | 300 | 5,2 | 39 | 27 % | 10,4 | 30 / 35 / 35 | 24 % |
| 4 | Actuales | 300 | 5,2 | 47 | 27 % | 7,9 | 18 / 25 / 31 / 25 | 36 % |
| 4 | Objetivos equilibrados | 300 | 5,1 | 46 | 29 % | 9,4 | 20 / 26 / 32 / 22 | 34 % |
| 4 | Equilibrados + reparto inverso | 300 | 5,1 | 46 | 29 % | 10,1 | 25 / 25 / 28 / 23 | 33 % |

| Objetivo | Veces en juego | Puntos medios | Veces de secreto | Gana con él de secreto |
|---|---|---|---|---|
| a-toda-prisa | 466 | 5,1 | 165 | 44 % (esperado 35 %) |
| coleccion-color | 471 | 5,0 | 157 | 38 % (esperado 34 %) |
| monton-de-ropa | 465 | 5,0 | 137 | 31 % (esperado 33 %) |
| cuerdas-llenas | 382 | 4,6 | 139 | 40 % (esperado 32 %) |
| todo-rojo | 427 | 4,6 | 152 | 38 % (esperado 33 %) |
| todo-azul | 384 | 4,5 | 128 | 32 % (esperado 33 %) |
| calcetinero | 469 | 4,4 | 142 | 31 % (esperado 33 %) |
| camisetero | 479 | 4,3 | 134 | 35 % (esperado 35 %) |
| bajo-techo | 473 | 4,3 | 159 | 29 % (esperado 33 %) |
| todo-blanco | 491 | 4,2 | 159 | 40 % (esperado 34 %) |
| tendedero-completo | 520 | 4,1 | 171 | 34 % (esperado 33 %) |
| arcoiris | 410 | 4,0 | 154 | 33 % (esperado 34 %) |
| conjunto-completo | 434 | 3,9 | 152 | 29 % (esperado 34 %) |
| todo-amarillo | 372 | 3,9 | 143 | 31 % (esperado 32 %) |
| toallero | 468 | 3,8 | 167 | 36 % (esperado 34 %) |
| variedad-de-cuerdas | 458 | 3,5 | 135 | 27 % (esperado 32 %) |
| parejas | 507 | 3,2 | 160 | 33 % (esperado 33 %) |
| regalo-envenenado | 424 | 0,0 | 146 | 18 % (esperado 32 %) |

## Variantes de puntuación

Puntos de calcetín / camiseta / toalla, multiplicador de los puntos de los objetivos (×0,5, ×1, ×1,5) y umbral de final. «Ventaja asiento 1» es cuánto gana de más (o de menos) quien abre la primera ronda frente a lo esperado.

### 2 jugadores

| Prendas | Objetivos | Final a | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Ventaja asiento 1 | Remontadas |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 / 3 / 6 | ×0,5 | 30 | 40 | 5,4 | 32 | 42,5 | 18 % | 9,3 | -8 | 13 % |
| 1 / 3 / 6 | ×0,5 | 40 | 40 | 6,0 | 35 | 51,9 | 18 % | 14,7 | +5 | 10 % |
| 1 / 3 / 6 | ×0,5 | 50 | 40 | 6,8 | 40 | 64,3 | 17 % | 15,7 | +0 | 3 % |
| 1 / 3 / 6 | ×1 | 30 | 300 | 5,3 | 31 | 44,8 | 24 % | 13,1 | -3 | 12 % |
| 1 / 3 / 6 | ×1 | 40 | 40 | 6,1 | 36 | 57,7 | 25 % | 14,8 | -6 | 5 % |
| 1 / 3 / 6 | ×1 | 50 | 40 | 7,0 | 41 | 74,6 | 27 % | 18,4 | -3 | 10 % |
| 1 / 3 / 6 | ×1,5 | 30 | 40 | 5,2 | 30 | 48,6 | 33 % | 15,6 | +5 | 30 % |
| 1 / 3 / 6 | ×1,5 | 40 | 40 | 6,0 | 35 | 64,7 | 34 % | 15,6 | -5 | 18 % |
| 1 / 3 / 6 | ×1,5 | 50 | 40 | 7,0 | 40 | 83,6 | 37 % | 23,2 | +3 | 13 % |
| 1 / 2 / 4 | ×0,5 | 30 | 40 | 6,3 | 37 | 41,8 | 25 % | 13,3 | +4 | 13 % |
| 1 / 2 / 4 | ×0,5 | 40 | 40 | 7,5 | 44 | 57,4 | 25 % | 15,1 | +7 | 5 % |
| 1 / 2 / 4 | ×0,5 | 50 | 40 | 8,5 | 50 | 72,8 | 29 % | 17,4 | -5 | 15 % |
| 1 / 2 / 4 | ×1 | 30 | 40 | 6,4 | 38 | 49,8 | 37 % | 19,4 | -10 | 18 % |
| 1 / 2 / 4 | ×1 | 40 | 40 | 7,6 | 45 | 67,0 | 38 % | 19,4 | -10 | 23 % |
| 1 / 2 / 4 | ×1 | 50 | 40 | 8,5 | 50 | 81,2 | 36 % | 24,1 | +7 | 25 % |
| 1 / 2 / 4 | ×1,5 | 30 | 40 | 6,4 | 38 | 66,8 | 53 % | 24,9 | +0 | 20 % |
| 1 / 2 / 4 | ×1,5 | 40 | 40 | 7,4 | 44 | 83,9 | 51 % | 25,8 | +3 | 23 % |
| 1 / 2 / 4 | ×1,5 | 50 | 40 | 8,4 | 50 | 104,3 | 51 % | 29,4 | -5 | 35 % |
| 1 / 3 / 5 | ×0,5 | 30 | 40 | 5,4 | 32 | 40,9 | 22 % | 11,9 | +20 | 10 % |
| 1 / 3 / 5 | ×0,5 | 40 | 40 | 6,3 | 37 | 53,5 | 20 % | 11,6 | -5 | 18 % |
| 1 / 3 / 5 | ×0,5 | 50 | 40 | 7,3 | 42 | 67,8 | 22 % | 14,7 | +5 | 10 % |
| 1 / 3 / 5 | ×1 | 30 | 40 | 5,6 | 33 | 47,4 | 27 % | 12,2 | +7 | 15 % |
| 1 / 3 / 5 | ×1 | 40 | 40 | 6,8 | 39 | 61,7 | 29 % | 13,7 | -8 | 15 % |
| 1 / 3 / 5 | ×1 | 50 | 40 | 7,0 | 42 | 77,5 | 31 % | 18,9 | +7 | 20 % |
| 1 / 3 / 5 | ×1,5 | 30 | 40 | 5,3 | 32 | 55,1 | 39 % | 14,1 | -1 | 20 % |
| 1 / 3 / 5 | ×1,5 | 40 | 40 | 6,5 | 38 | 73,6 | 41 % | 23,4 | -13 | 15 % |
| 1 / 3 / 5 | ×1,5 | 50 | 40 | 7,4 | 43 | 90,9 | 41 % | 28,1 | -1 | 25 % |
| 2 / 3 / 5 | ×0,5 | 30 | 40 | 5,0 | 31 | 42,1 | 21 % | 12,2 | +7 | 5 % |
| 2 / 3 / 5 | ×0,5 | 40 | 40 | 5,9 | 36 | 54,4 | 21 % | 14,8 | +3 | 8 % |
| 2 / 3 / 5 | ×0,5 | 50 | 40 | 6,6 | 40 | 67,5 | 20 % | 16,0 | +14 | 13 % |
| 2 / 3 / 5 | ×1 | 30 | 40 | 5,0 | 31 | 46,6 | 32 % | 17,9 | -4 | 13 % |
| 2 / 3 / 5 | ×1 | 40 | 40 | 5,8 | 36 | 60,5 | 29 % | 17,3 | +7 | 8 % |
| 2 / 3 / 5 | ×1 | 50 | 40 | 6,5 | 39 | 74,2 | 30 % | 19,1 | -10 | 10 % |
| 2 / 3 / 5 | ×1,5 | 30 | 40 | 5,0 | 32 | 58,6 | 44 % | 20,4 | -15 | 18 % |
| 2 / 3 / 5 | ×1,5 | 40 | 40 | 5,9 | 36 | 71,1 | 40 % | 21,2 | -13 | 15 % |
| 2 / 3 / 5 | ×1,5 | 50 | 40 | 6,6 | 41 | 91,1 | 41 % | 27,2 | -10 | 13 % |
| 1 / 2 / 3 | ×0,5 | 30 | 40 | 6,8 | 41 | 44,0 | 30 % | 12,3 | -20 | 10 % |
| 1 / 2 / 3 | ×0,5 | 40 | 40 | 8,2 | 48 | 57,7 | 31 % | 17,5 | -3 | 13 % |
| 1 / 2 / 3 | ×0,5 | 50 | 40 | 9,3 | 54 | 75,0 | 34 % | 22,6 | -3 | 8 % |
| 1 / 2 / 3 | ×1 | 30 | 40 | 6,9 | 40 | 53,8 | 43 % | 20,3 | +3 | 28 % |
| 1 / 2 / 3 | ×1 | 40 | 40 | 8,0 | 47 | 72,0 | 45 % | 22,5 | -8 | 25 % |
| 1 / 2 / 3 | ×1 | 50 | 40 | 9,3 | 55 | 88,0 | 42 % | 25,5 | -10 | 20 % |
| 1 / 2 / 3 | ×1,5 | 30 | 40 | 6,8 | 40 | 66,0 | 53 % | 22,6 | +3 | 23 % |
| 1 / 2 / 3 | ×1,5 | 40 | 40 | 7,8 | 47 | 85,8 | 54 % | 27,1 | +3 | 20 % |
| 1 / 2 / 3 | ×1,5 | 50 | 40 | 9,2 | 54 | 106,8 | 52 % | 24,6 | +5 | 38 % |

### 3 jugadores

| Prendas | Objetivos | Final a | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Ventaja asiento 1 | Remontadas |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 / 3 / 6 | ×0,5 | 30 | 40 | 4,9 | 37 | 36,6 | 17 % | 8,7 | +3 | 18 % |
| 1 / 3 / 6 | ×0,5 | 40 | 40 | 6,2 | 46 | 50,8 | 18 % | 8,0 | +2 | 30 % |
| 1 / 3 / 6 | ×0,5 | 50 | 40 | 7,1 | 54 | 63,4 | 19 % | 9,6 | -1 | 15 % |
| 1 / 3 / 6 | ×1 | 30 | 300 | 5,3 | 40 | 43,6 | 26 % | 10,0 | -2 | 27 % |
| 1 / 3 / 6 | ×1 | 40 | 40 | 6,1 | 46 | 58,9 | 28 % | 10,8 | +2 | 33 % |
| 1 / 3 / 6 | ×1 | 50 | 40 | 6,7 | 51 | 72,7 | 28 % | 12,1 | +9 | 38 % |
| 1 / 3 / 6 | ×1,5 | 30 | 40 | 5,1 | 38 | 47,0 | 31 % | 13,8 | +4 | 28 % |
| 1 / 3 / 6 | ×1,5 | 40 | 40 | 6,0 | 45 | 67,1 | 36 % | 15,1 | -8 | 48 % |
| 1 / 3 / 6 | ×1,5 | 50 | 40 | 6,5 | 49 | 80,0 | 37 % | 15,3 | +4 | 38 % |
| 1 / 2 / 4 | ×0,5 | 30 | 40 | 6,2 | 47 | 42,0 | 27 % | 8,2 | -8 | 23 % |
| 1 / 2 / 4 | ×0,5 | 40 | 40 | 7,4 | 57 | 56,6 | 28 % | 8,6 | -8 | 35 % |
| 1 / 2 / 4 | ×0,5 | 50 | 40 | 8,6 | 67 | 68,9 | 28 % | 8,7 | -3 | 35 % |
| 1 / 2 / 4 | ×1 | 30 | 40 | 6,5 | 50 | 50,8 | 39 % | 10,7 | +15 | 28 % |
| 1 / 2 / 4 | ×1 | 40 | 40 | 7,3 | 57 | 65,4 | 40 % | 12,9 | -13 | 33 % |
| 1 / 2 / 4 | ×1 | 50 | 40 | 8,2 | 65 | 81,2 | 39 % | 14,2 | +2 | 38 % |
| 1 / 2 / 4 | ×1,5 | 30 | 40 | 6,1 | 48 | 58,6 | 48 % | 16,2 | +19 | 35 % |
| 1 / 2 / 4 | ×1,5 | 40 | 40 | 7,2 | 55 | 77,7 | 51 % | 23,4 | -1 | 30 % |
| 1 / 2 / 4 | ×1,5 | 50 | 40 | 8,4 | 66 | 101,0 | 49 % | 17,6 | +7 | 45 % |
| 1 / 3 / 5 | ×0,5 | 30 | 40 | 5,6 | 43 | 41,7 | 22 % | 9,1 | +2 | 10 % |
| 1 / 3 / 5 | ×0,5 | 40 | 40 | 6,3 | 48 | 53,6 | 21 % | 11,7 | +2 | 20 % |
| 1 / 3 / 5 | ×0,5 | 50 | 40 | 7,0 | 54 | 63,2 | 20 % | 10,6 | -2 | 8 % |
| 1 / 3 / 5 | ×1 | 30 | 40 | 5,5 | 42 | 46,5 | 29 % | 9,6 | -6 | 48 % |
| 1 / 3 / 5 | ×1 | 40 | 40 | 6,6 | 50 | 61,1 | 30 % | 13,6 | +17 | 30 % |
| 1 / 3 / 5 | ×1 | 50 | 40 | 7,3 | 56 | 75,0 | 29 % | 8,2 | -6 | 45 % |
| 1 / 3 / 5 | ×1,5 | 30 | 40 | 5,4 | 41 | 53,7 | 41 % | 15,4 | -6 | 28 % |
| 1 / 3 / 5 | ×1,5 | 40 | 40 | 6,5 | 50 | 69,3 | 39 % | 15,8 | +2 | 33 % |
| 1 / 3 / 5 | ×1,5 | 50 | 40 | 7,0 | 54 | 85,7 | 39 % | 16,7 | -11 | 40 % |
| 2 / 3 / 5 | ×0,5 | 30 | 40 | 4,9 | 39 | 39,5 | 20 % | 10,6 | +7 | 10 % |
| 2 / 3 / 5 | ×0,5 | 40 | 40 | 5,7 | 46 | 51,4 | 20 % | 10,2 | -3 | 18 % |
| 2 / 3 / 5 | ×0,5 | 50 | 40 | 6,5 | 52 | 65,9 | 21 % | 9,8 | -7 | 23 % |
| 2 / 3 / 5 | ×1 | 30 | 40 | 4,8 | 38 | 43,4 | 29 % | 12,3 | +12 | 18 % |
| 2 / 3 / 5 | ×1 | 40 | 40 | 5,7 | 45 | 59,7 | 31 % | 15,1 | -3 | 25 % |
| 2 / 3 / 5 | ×1 | 50 | 40 | 6,5 | 52 | 74,0 | 30 % | 12,6 | +2 | 23 % |
| 2 / 3 / 5 | ×1,5 | 30 | 40 | 4,7 | 38 | 49,0 | 40 % | 14,1 | +2 | 18 % |
| 2 / 3 / 5 | ×1,5 | 40 | 40 | 5,9 | 47 | 72,4 | 41 % | 19,5 | -1 | 30 % |
| 2 / 3 / 5 | ×1,5 | 50 | 40 | 6,3 | 50 | 83,1 | 39 % | 13,9 | -8 | 28 % |
| 1 / 2 / 3 | ×0,5 | 30 | 40 | 6,8 | 54 | 45,5 | 33 % | 9,5 | -13 | 30 % |
| 1 / 2 / 3 | ×0,5 | 40 | 40 | 7,8 | 62 | 58,9 | 31 % | 12,3 | +10 | 35 % |
| 1 / 2 / 3 | ×0,5 | 50 | 40 | 8,9 | 70 | 70,9 | 29 % | 10,2 | +2 | 25 % |
| 1 / 2 / 3 | ×1 | 30 | 40 | 6,6 | 52 | 52,3 | 44 % | 14,6 | -3 | 28 % |
| 1 / 2 / 3 | ×1 | 40 | 40 | 7,6 | 60 | 67,4 | 43 % | 18,5 | -21 | 33 % |
| 1 / 2 / 3 | ×1 | 50 | 40 | 8,8 | 70 | 86,2 | 44 % | 18,3 | +2 | 38 % |
| 1 / 2 / 3 | ×1,5 | 30 | 40 | 6,8 | 54 | 68,9 | 57 % | 20,4 | -3 | 50 % |
| 1 / 2 / 3 | ×1,5 | 40 | 40 | 7,9 | 63 | 89,4 | 56 % | 20,9 | -1 | 43 % |
| 1 / 2 / 3 | ×1,5 | 50 | 40 | 9,1 | 71 | 106,3 | 53 % | 21,9 | +12 | 55 % |

### 4 jugadores

| Prendas | Objetivos | Final a | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Ventaja asiento 1 | Remontadas |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 / 3 / 6 | ×0,5 | 30 | 40 | 5,2 | 46 | 36,9 | 17 % | 5,6 | -2 | 15 % |
| 1 / 3 / 6 | ×0,5 | 40 | 40 | 5,9 | 54 | 50,9 | 18 % | 7,7 | -4 | 28 % |
| 1 / 3 / 6 | ×0,5 | 50 | 40 | 6,7 | 63 | 63,4 | 20 % | 8,0 | -5 | 35 % |
| 1 / 3 / 6 | ×1 | 30 | 300 | 5,2 | 47 | 42,1 | 27 % | 7,9 | -7 | 36 % |
| 1 / 3 / 6 | ×1 | 40 | 40 | 6,2 | 56 | 56,1 | 28 % | 8,3 | +3 | 38 % |
| 1 / 3 / 6 | ×1 | 50 | 40 | 6,6 | 62 | 71,1 | 28 % | 9,7 | +18 | 30 % |
| 1 / 3 / 6 | ×1,5 | 30 | 40 | 5,3 | 48 | 49,4 | 37 % | 13,4 | -18 | 38 % |
| 1 / 3 / 6 | ×1,5 | 40 | 40 | 6,0 | 54 | 62,9 | 36 % | 13,9 | +5 | 53 % |
| 1 / 3 / 6 | ×1,5 | 50 | 40 | 7,0 | 64 | 81,5 | 39 % | 18,9 | +8 | 45 % |
| 1 / 2 / 4 | ×0,5 | 30 | 40 | 6,0 | 57 | 39,5 | 26 % | 8,3 | -19 | 35 % |
| 1 / 2 / 4 | ×0,5 | 40 | 40 | 7,1 | 67 | 53,7 | 28 % | 6,9 | +6 | 40 % |
| 1 / 2 / 4 | ×0,5 | 50 | 40 | 8,6 | 77 | 64,5 | 28 % | 8,1 | +1 | 33 % |
| 1 / 2 / 4 | ×1 | 30 | 40 | 6,5 | 60 | 49,9 | 38 % | 9,8 | -5 | 53 % |
| 1 / 2 / 4 | ×1 | 40 | 40 | 7,4 | 69 | 64,0 | 39 % | 13,3 | +4 | 48 % |
| 1 / 2 / 4 | ×1 | 50 | 40 | 8,3 | 76 | 76,3 | 39 % | 15,7 | +1 | 53 % |
| 1 / 2 / 4 | ×1,5 | 30 | 40 | 6,2 | 58 | 56,4 | 51 % | 18,4 | -5 | 45 % |
| 1 / 2 / 4 | ×1,5 | 40 | 40 | 7,5 | 70 | 80,6 | 50 % | 14,8 | +8 | 70 % |
| 1 / 2 / 4 | ×1,5 | 50 | 40 | 8,9 | 79 | 93,5 | 49 % | 17,9 | -5 | 68 % |
| 1 / 3 / 5 | ×0,5 | 30 | 40 | 5,6 | 51 | 38,3 | 22 % | 5,0 | +15 | 20 % |
| 1 / 3 / 5 | ×0,5 | 40 | 40 | 6,1 | 57 | 50,8 | 20 % | 6,0 | +3 | 28 % |
| 1 / 3 / 5 | ×0,5 | 50 | 40 | 7,1 | 67 | 65,7 | 23 % | 9,1 | +5 | 38 % |
| 1 / 3 / 5 | ×1 | 30 | 40 | 5,6 | 52 | 43,5 | 29 % | 8,0 | -5 | 30 % |
| 1 / 3 / 5 | ×1 | 40 | 40 | 6,3 | 59 | 60,6 | 32 % | 11,8 | +1 | 38 % |
| 1 / 3 / 5 | ×1 | 50 | 40 | 7,3 | 68 | 72,7 | 31 % | 11,8 | +10 | 45 % |
| 1 / 3 / 5 | ×1,5 | 30 | 40 | 5,4 | 50 | 53,1 | 40 % | 10,8 | -2 | 53 % |
| 1 / 3 / 5 | ×1,5 | 40 | 40 | 6,3 | 59 | 70,0 | 41 % | 14,4 | +13 | 45 % |
| 1 / 3 / 5 | ×1,5 | 50 | 40 | 7,2 | 67 | 86,8 | 44 % | 12,1 | -6 | 38 % |
| 2 / 3 / 5 | ×0,5 | 30 | 40 | 4,7 | 46 | 37,1 | 20 % | 9,3 | -10 | 15 % |
| 2 / 3 / 5 | ×0,5 | 40 | 40 | 5,7 | 55 | 50,8 | 21 % | 8,6 | +5 | 18 % |
| 2 / 3 / 5 | ×0,5 | 50 | 40 | 6,5 | 63 | 63,4 | 20 % | 9,6 | +3 | 23 % |
| 2 / 3 / 5 | ×1 | 30 | 40 | 4,6 | 46 | 42,2 | 31 % | 9,9 | +5 | 38 % |
| 2 / 3 / 5 | ×1 | 40 | 40 | 5,7 | 56 | 59,1 | 31 % | 10,0 | +5 | 40 % |
| 2 / 3 / 5 | ×1 | 50 | 40 | 6,5 | 63 | 68,9 | 30 % | 14,1 | -8 | 33 % |
| 2 / 3 / 5 | ×1,5 | 30 | 40 | 4,6 | 45 | 53,0 | 45 % | 13,1 | +0 | 50 % |
| 2 / 3 / 5 | ×1,5 | 40 | 40 | 5,5 | 54 | 67,3 | 41 % | 14,5 | +0 | 45 % |
| 2 / 3 / 5 | ×1,5 | 50 | 40 | 6,5 | 63 | 85,8 | 43 % | 19,9 | +15 | 33 % |
| 1 / 2 / 3 | ×0,5 | 30 | 40 | 6,5 | 62 | 41,9 | 33 % | 8,6 | -2 | 33 % |
| 1 / 2 / 3 | ×0,5 | 40 | 40 | 8,0 | 73 | 53,5 | 29 % | 8,6 | +0 | 40 % |
| 1 / 2 / 3 | ×0,5 | 50 | 39 | 10,0 | 84 | 64,9 | 30 % | 10,4 | -10 | 38 % |
| 1 / 2 / 3 | ×1 | 30 | 40 | 6,6 | 63 | 51,1 | 44 % | 10,0 | +15 | 53 % |
| 1 / 2 / 3 | ×1 | 40 | 40 | 8,1 | 74 | 65,2 | 41 % | 11,2 | +3 | 35 % |
| 1 / 2 / 3 | ×1 | 50 | 38 | 10,7 | 86 | 76,8 | 42 % | 12,9 | -7 | 45 % |
| 1 / 2 / 3 | ×1,5 | 30 | 40 | 6,6 | 62 | 60,8 | 54 % | 13,0 | +10 | 53 % |
| 1 / 2 / 3 | ×1,5 | 40 | 40 | 7,9 | 73 | 82,4 | 53 % | 17,8 | -2 | 60 % |
| 1 / 2 / 3 | ×1,5 | 50 | 37 | 10,0 | 83 | 95,4 | 53 % | 17,4 | +2 | 43 % |

## Sistemas de robo, mano y cestas

Todas con la puntuación actual (1 / 3 / 6, objetivos ×1, final a 30). Solo cambia lo que dice cada fila.

### 2 jugadores

| Sistema | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas | Acciones por partida | Descartes |
|---|---|---|---|---|---|---|---|---|---|---|
| Reglas actuales (robo 3 a elegir, máx. 2 cuerdas · mano 6 · 4 cestas, se rellenan las usadas) | 300 | 5,3 | 31 | 44,8 | 24 % | 13,1 | 47 / 53 | 12 % | 5,1 | 11,4 |
| Robo 2 a elegir (máx. 2 cuerdas) | 100 | 5,2 | 30 | 44,0 | 24 % | 14,4 | 53 / 47 | 10 % | 3,2 | 3,0 |
| Robo 4 a elegir (máx. 2 cuerdas) | 100 | 5,3 | 32 | 44,5 | 25 % | 15,2 | 57 / 43 | 8 % | 6,7 | 19,9 |
| Robo 4 a elegir (máx. 3 cuerdas) | 100 | 5,0 | 30 | 43,1 | 25 % | 14,1 | 49 / 52 | 12 % | 4,7 | 20,4 |
| Robo 3 a elegir (máx. 3 cuerdas) | 100 | 5,3 | 31 | 43,4 | 26 % | 15,0 | 52 / 48 | 15 % | 4,2 | 12,5 |
| Robo fijo 1 cuerda + 2 acciones (antes) | 100 | 5,4 | 32 | 43,5 | 25 % | 14,3 | 46 / 54 | 9 % | 7,6 | 8,6 |
| Mano de 5 | 100 | 5,2 | 30 | 43,3 | 23 % | 13,9 | 55 / 46 | 10 % | 4,4 | 13,6 |
| Mano de 7 | 100 | 5,1 | 31 | 43,9 | 25 % | 14,9 | 45 / 55 | 13 % | 5,3 | 8,6 |
| Cestas de antes (5/7/9 según jugadores, se renuevan todas) | 100 | 5,1 | 30 | 42,0 | 22 % | 13,8 | 48 / 52 | 10 % | 4,6 | 11,2 |
| 4 cestas que se renuevan todas | 100 | 5,2 | 30 | 42,7 | 23 % | 14,2 | 53 / 47 | 7 % | 4,9 | 11,0 |
| 5/7/9 cestas, se rellenan solo las usadas | 100 | 5,3 | 31 | 42,4 | 22 % | 14,2 | 53 / 47 | 12 % | 5,3 | 11,3 |
| Todo como antes (robo fijo, mano 5, cestas 5/7/9 renovando todas) | 100 | 5,5 | 32 | 40,2 | 20 % | 15,5 | 52 / 48 | 7 % | 7,0 | 12,4 |
| Reparto inverso: en el reparto coge primero quien juega el último | 300 | 5,2 | 31 | 43,0 | 23 % | 13,8 | 51 / 49 | 11 % | 4,8 | 11,4 |

### 3 jugadores

| Sistema | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas | Acciones por partida | Descartes |
|---|---|---|---|---|---|---|---|---|---|---|
| Reglas actuales (robo 3 a elegir, máx. 2 cuerdas · mano 6 · 4 cestas, se rellenan las usadas) | 300 | 5,3 | 40 | 43,6 | 26 % | 10,0 | 31 / 28 / 42 | 27 % | 7,5 | 17,4 |
| Robo 2 a elegir (máx. 2 cuerdas) | 100 | 5,3 | 38 | 42,8 | 25 % | 10,8 | 38 / 38 / 24 | 25 % | 4,6 | 5,0 |
| Robo 4 a elegir (máx. 2 cuerdas) | 100 | 5,2 | 40 | 41,8 | 24 % | 9,9 | 39 / 27 / 35 | 22 % | 10,0 | 29,6 |
| Robo 4 a elegir (máx. 3 cuerdas) | 100 | 5,2 | 39 | 44,0 | 26 % | 9,5 | 31 / 40 / 29 | 32 % | 7,8 | 31,8 |
| Robo 3 a elegir (máx. 3 cuerdas) | 100 | 5,3 | 39 | 42,6 | 26 % | 9,4 | 28 / 34 / 39 | 24 % | 6,0 | 18,9 |
| Robo fijo 1 cuerda + 2 acciones (antes) | 100 | 5,4 | 41 | 41,0 | 25 % | 10,2 | 29 / 29 / 42 | 24 % | 11,8 | 13,3 |
| Mano de 5 | 100 | 5,1 | 38 | 42,1 | 26 % | 10,1 | 30 / 29 / 41 | 25 % | 6,0 | 20,6 |
| Mano de 7 | 100 | 5,1 | 38 | 41,6 | 27 % | 10,0 | 33 / 39 / 28 | 22 % | 7,7 | 12,7 |
| Cestas de antes (5/7/9 según jugadores, se renuevan todas) | 100 | 5,2 | 38 | 40,6 | 23 % | 8,9 | 27 / 35 / 38 | 24 % | 7,3 | 17,0 |
| 4 cestas que se renuevan todas | 100 | 5,2 | 39 | 43,0 | 26 % | 11,4 | 34 / 33 / 34 | 28 % | 7,3 | 16,6 |
| 5/7/9 cestas, se rellenan solo las usadas | 100 | 5,1 | 38 | 41,7 | 23 % | 8,5 | 33 / 30 / 38 | 14 % | 7,0 | 16,5 |
| Todo como antes (robo fijo, mano 5, cestas 5/7/9 renovando todas) | 100 | 5,5 | 40 | 39,3 | 21 % | 11,0 | 33 / 38 / 30 | 15 % | 10,8 | 19,1 |
| Reparto inverso: en el reparto coge primero quien juega el último | 300 | 5,2 | 39 | 42,9 | 26 % | 9,9 | 35 / 39 / 26 | 25 % | 7,4 | 17,1 |

### 4 jugadores

| Sistema | Partidas | Rondas | Minutos | Puntos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas | Acciones por partida | Descartes |
|---|---|---|---|---|---|---|---|---|---|---|
| Reglas actuales (robo 3 a elegir, máx. 2 cuerdas · mano 6 · 4 cestas, se rellenan las usadas) | 300 | 5,2 | 47 | 42,1 | 27 % | 7,9 | 18 / 25 / 31 / 25 | 36 % | 9,7 | 22,4 |
| Robo 2 a elegir (máx. 2 cuerdas) | 100 | 5,2 | 45 | 41,4 | 27 % | 9,3 | 18 / 26 / 34 / 21 | 38 % | 6,0 | 6,6 |
| Robo 4 a elegir (máx. 2 cuerdas) | 100 | 5,2 | 48 | 41,0 | 27 % | 8,3 | 17 / 21 / 39 / 24 | 27 % | 13,2 | 39,5 |
| Robo 4 a elegir (máx. 3 cuerdas) | 100 | 5,1 | 46 | 41,0 | 25 % | 9,5 | 11 / 24 / 41 / 24 | 26 % | 10,2 | 41,2 |
| Robo 3 a elegir (máx. 3 cuerdas) | 100 | 4,9 | 44 | 40,8 | 26 % | 7,8 | 27 / 24 / 26 / 24 | 26 % | 7,2 | 23,5 |
| Robo fijo 1 cuerda + 2 acciones (antes) | 100 | 5,5 | 51 | 42,8 | 27 % | 8,9 | 17 / 27 / 25 / 31 | 30 % | 17,0 | 17,2 |
| Mano de 5 | 100 | 5,2 | 46 | 41,6 | 27 % | 7,9 | 30 / 22 / 28 / 20 | 28 % | 8,2 | 28,1 |
| Mano de 7 | 100 | 5,2 | 47 | 41,9 | 27 % | 8,1 | 16 / 26 / 31 / 28 | 31 % | 10,8 | 17,4 |
| Cestas de antes (5/7/9 según jugadores, se renuevan todas) | 100 | 5,2 | 46 | 42,3 | 24 % | 6,6 | 18 / 23 / 29 / 30 | 35 % | 9,8 | 22,2 |
| 4 cestas que se renuevan todas | 100 | 5,1 | 46 | 40,5 | 28 % | 9,9 | 20 / 29 / 26 / 25 | 31 % | 9,3 | 22,3 |
| 5/7/9 cestas, se rellenan solo las usadas | 100 | 5,2 | 46 | 41,1 | 26 % | 8,5 | 17 / 22 / 31 / 30 | 31 % | 10,2 | 22,3 |
| Todo como antes (robo fijo, mano 5, cestas 5/7/9 renovando todas) | 100 | 5,5 | 49 | 38,7 | 22 % | 7,1 | 22 / 29 / 19 / 30 | 29 % | 15,4 | 23,6 |
| Reparto inverso: en el reparto coge primero quien juega el último | 300 | 5,2 | 47 | 41,8 | 26 % | 8,2 | 28 / 25 / 24 / 22 | 29 % | 9,4 | 23,0 |

## Combinaciones candidatas

Todas llevan los objetivos equilibrados y el reparto inverso, salvo la primera fila (las reglas actuales, para comparar).

| Jugadores | Reglas | Partidas | Rondas (mín–máx) | Minutos (rango habitual) | Puntos | % por objetivos | Diferencia 1.º–2.º | Victorias por asiento | Remontadas | Acciones | Descartes | Viejas al rival | Trofeos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | Reglas actuales | 300 | 5,3 (4–10) | 31 (26–36) | 44,8 | 24 % | 13,1 | 47 / 53 | 12 % | 5,1 | 11,4 | 0,2 | 0,0 |
| 2 | Objetivos equilibrados + reparto inverso (la base de las candidatas) | 300 | 5,3 (4–9) | 31 (25–37) | 45,0 | 27 % | 15,5 | 53 / 47 | 13 % | 4,7 | 11,9 | 0,2 | 0,0 |
| 2 | Base + robo de 2 | 300 | 5,3 (3–8) | 30 (25–35) | 44,9 | 26 % | 13,0 | 52 / 48 | 19 % | 3,1 | 3,4 | 0,2 | 0,0 |
| 2 | Base + final a 40 | 300 | 6,0 (4–8) | 35 (30–41) | 59,8 | 27 % | 16,5 | 51 / 49 | 15 % | 5,9 | 13,5 | 0,3 | 0,0 |
| 2 | Base + prendas 1/2/4 | 300 | 6,4 (5–9) | 37 (31–44) | 53,2 | 41 % | 19,0 | 51 / 49 | 18 % | 6,1 | 14,4 | 1,0 | 0,0 |
| 2 | Base + prendas 1/3/5 + final a 40 | 300 | 6,4 (4–9) | 38 (32–45) | 63,1 | 32 % | 17,0 | 48 / 52 | 15 % | 6,6 | 14,2 | 0,4 | 0,0 |
| 2 | Base + prendas 1/2/4 + final a 40 | 300 | 7,5 (5–10) | 44 (38–50) | 71,6 | 42 % | 21,7 | 51 / 49 | 20 % | 7,9 | 16,8 | 1,3 | 0,0 |
| 2 | Base + la cuerda vieja se rompe al acabar la ronda en que se pone | 300 | 5,4 (4–8) | 31 (26–38) | 45,5 | 26 % | 14,4 | 53 / 47 | 15 % | 4,9 | 11,8 | 0,2 | 0,1 |
| 2 | Base + robo de 2 + final a 40 | 300 | 6,0 (4–9) | 34 (29–40) | 60,0 | 28 % | 16,5 | 51 / 49 | 15 % | 3,9 | 4,1 | 0,3 | 0,0 |
| 2 | Base + robo de 2 + prendas 1/3/5 + final a 40 | 300 | 6,5 (5–9) | 37 (31–43) | 64,6 | 32 % | 16,0 | 48 / 52 | 14 % | 4,5 | 4,3 | 0,5 | 0,0 |
| 2 | Base + robo de 2 + vieja de 1 ronda | 300 | 5,3 (3–10) | 30 (24–36) | 46,3 | 27 % | 13,5 | 46 / 55 | 16 % | 3,3 | 3,3 | 0,2 | 0,1 |
| 2 | Base + robo de 2 + vieja de 1 ronda + final a 40 | 300 | 6,1 (4–9) | 35 (29–40) | 60,7 | 27 % | 16,1 | 47 / 53 | 13 % | 3,9 | 4,2 | 0,4 | 0,1 |
| 2 | Recomendada: base + robo de 2 + A toda prisa cada 2 → 3 | 1000 | 5,3 (3–9) | 30 (25–35) | 45,3 | 26 % | 13,3 | 50 / 50 | 14 % | 3,1 | 3,4 | 0,1 | 0,0 |
| 2 | Afinada: la recomendada + Cuerdas llenas 1 → 2, Parejas 1 → 7, Variedad 2 → 3 | 1000 | 5,3 (3–9) | 30 (24–36) | 45,2 | 25 % | 13,5 | 50 / 50 | 13 % | 3,2 | 3,4 | 0,2 | 0,0 |
| 3 | Reglas actuales | 300 | 5,3 (4–8) | 40 (32–46) | 43,6 | 26 % | 10,0 | 31 / 28 / 42 | 27 % | 7,5 | 17,4 | 0,3 | 0,0 |
| 3 | Objetivos equilibrados + reparto inverso (la base de las candidatas) | 300 | 5,2 (3–8) | 39 (32–47) | 44,4 | 27 % | 10,4 | 30 / 35 / 35 | 24 % | 7,5 | 17,0 | 0,3 | 0,0 |
| 3 | Base + robo de 2 | 300 | 5,1 (4–8) | 37 (30–44) | 43,7 | 27 % | 9,0 | 32 / 34 / 34 | 27 % | 4,3 | 4,9 | 0,3 | 0,0 |
| 3 | Base + final a 40 | 300 | 6,1 (4–9) | 46 (38–53) | 60,0 | 29 % | 12,1 | 31 / 37 / 33 | 29 % | 9,0 | 20,2 | 0,5 | 0,0 |
| 3 | Base + prendas 1/2/4 | 300 | 6,3 (4–9) | 48 (40–55) | 52,3 | 43 % | 13,8 | 37 / 28 / 35 | 35 % | 9,0 | 21,2 | 1,3 | 0,0 |
| 3 | Base + prendas 1/3/5 + final a 40 | 300 | 6,3 (4–9) | 48 (40–55) | 62,4 | 34 % | 13,5 | 33 / 34 / 33 | 29 % | 9,5 | 21,4 | 0,7 | 0,0 |
| 3 | Base + prendas 1/2/4 + final a 40 | 300 | 7,4 (5–10) | 57 (49–66) | 71,9 | 44 % | 15,7 | 35 / 35 / 30 | 41 % | 11,8 | 24,9 | 1,7 | 0,1 |
| 3 | Base + la cuerda vieja se rompe al acabar la ronda en que se pone | 300 | 5,2 (3–7) | 39 (31–46) | 43,8 | 28 % | 10,5 | 36 / 38 / 26 | 22 % | 7,0 | 17,0 | 0,3 | 0,1 |
| 3 | Base + robo de 2 + final a 40 | 300 | 6,0 (4–9) | 44 (36–52) | 59,1 | 30 % | 13,5 | 30 / 36 / 34 | 22 % | 5,8 | 6,2 | 0,5 | 0,0 |
| 3 | Base + robo de 2 + prendas 1/3/5 + final a 40 | 300 | 6,2 (5–8) | 46 (39–53) | 62,4 | 33 % | 13,5 | 35 / 33 / 32 | 25 % | 6,2 | 6,5 | 0,6 | 0,0 |
| 3 | Base + robo de 2 + vieja de 1 ronda | 300 | 5,2 (4–8) | 38 (30–44) | 44,0 | 27 % | 9,3 | 33 / 38 / 30 | 29 % | 4,4 | 5,1 | 0,2 | 0,1 |
| 3 | Base + robo de 2 + vieja de 1 ronda + final a 40 | 300 | 6,1 (4–8) | 44 (36–51) | 58,9 | 29 % | 12,0 | 33 / 33 / 34 | 25 % | 5,9 | 6,2 | 0,5 | 0,2 |
| 3 | Recomendada: base + robo de 2 + A toda prisa cada 2 → 3 | 1000 | 5,2 (3–8) | 38 (30–44) | 43,6 | 27 % | 10,2 | 34 / 35 / 31 | 24 % | 4,5 | 5,1 | 0,3 | 0,0 |
| 3 | Afinada: la recomendada + Cuerdas llenas 1 → 2, Parejas 1 → 7, Variedad 2 → 3 | 1000 | 5,2 (4–8) | 38 (30–44) | 43,2 | 27 % | 10,2 | 33 / 36 / 31 | 26 % | 4,5 | 5,0 | 0,3 | 0,0 |
| 4 | Reglas actuales | 300 | 5,2 (4–7) | 47 (37–55) | 42,1 | 27 % | 7,9 | 18 / 25 / 31 / 25 | 36 % | 9,7 | 22,4 | 0,4 | 0,0 |
| 4 | Objetivos equilibrados + reparto inverso (la base de las candidatas) | 300 | 5,1 (3–8) | 46 (37–55) | 43,1 | 29 % | 10,1 | 25 / 25 / 28 / 23 | 33 % | 9,5 | 22,3 | 0,4 | 0,0 |
| 4 | Base + robo de 2 | 300 | 5,1 (3–7) | 44 (36–53) | 42,2 | 29 % | 9,7 | 25 / 24 / 24 / 27 | 34 % | 5,7 | 6,5 | 0,3 | 0,0 |
| 4 | Base + final a 40 | 300 | 5,9 (4–9) | 55 (46–63) | 58,4 | 31 % | 11,5 | 20 / 29 / 28 / 23 | 40 % | 11,7 | 26,4 | 0,8 | 0,0 |
| 4 | Base + prendas 1/2/4 | 300 | 6,2 (4–8) | 58 (48–66) | 52,5 | 43 % | 11,1 | 21 / 25 / 23 / 31 | 50 % | 12,1 | 27,8 | 1,6 | 0,0 |
| 4 | Base + prendas 1/3/5 + final a 40 | 300 | 6,2 (4–9) | 58 (48–67) | 61,4 | 35 % | 10,0 | 24 / 23 / 28 / 25 | 41 % | 12,4 | 27,5 | 0,9 | 0,0 |
| 4 | Base + prendas 1/2/4 + final a 40 | 300 | 7,4 (5–11) | 69 (59–79) | 67,6 | 43 % | 11,1 | 30 / 21 / 21 / 28 | 49 % | 16,8 | 32,6 | 2,3 | 0,1 |
| 4 | Base + la cuerda vieja se rompe al acabar la ronda en que se pone | 300 | 5,1 (3–8) | 46 (37–55) | 42,8 | 29 % | 8,7 | 28 / 25 / 25 / 22 | 34 % | 9,5 | 22,2 | 0,4 | 0,2 |
| 4 | Base + robo de 2 + final a 40 | 300 | 5,9 (4–9) | 53 (44–62) | 58,3 | 31 % | 11,2 | 23 / 22 / 28 / 27 | 33 % | 7,5 | 8,2 | 0,8 | 0,0 |
| 4 | Base + robo de 2 + prendas 1/3/5 + final a 40 | 300 | 6,3 (5–8) | 57 (47–65) | 62,0 | 35 % | 11,6 | 24 / 26 / 28 / 23 | 34 % | 8,5 | 8,5 | 1,1 | 0,0 |
| 4 | Base + robo de 2 + vieja de 1 ronda | 300 | 5,2 (3–8) | 45 (35–53) | 42,9 | 29 % | 9,2 | 28 / 26 / 24 / 22 | 34 % | 5,8 | 6,7 | 0,4 | 0,1 |
| 4 | Base + robo de 2 + vieja de 1 ronda + final a 40 | 300 | 5,9 (4–8) | 52 (44–61) | 59,3 | 31 % | 11,1 | 24 / 23 / 28 / 24 | 42 % | 7,4 | 8,0 | 0,8 | 0,3 |
| 4 | Recomendada: base + robo de 2 + A toda prisa cada 2 → 3 | 1000 | 5,1 (3–8) | 44 (35–52) | 42,5 | 28 % | 9,3 | 30 / 26 / 22 / 22 | 32 % | 5,5 | 6,7 | 0,3 | 0,0 |
| 4 | Afinada: la recomendada + Cuerdas llenas 1 → 2, Parejas 1 → 7, Variedad 2 → 3 | 1000 | 5,1 (3–8) | 45 (36–53) | 43,0 | 28 % | 8,7 | 27 / 25 / 24 / 25 | 35 % | 5,8 | 6,7 | 0,4 | 0,0 |

## Objetivos con las reglas afinadas

| Objetivo | Veces en juego | Puntos medios | Veces de secreto | Gana con él de secreto |
|---|---|---|---|---|
| monton-de-ropa | 1519 | 5,1 | 494 | 33 % (esperado 34 %) |
| coleccion-color | 1604 | 5,0 | 499 | 33 % (esperado 33 %) |
| camisetero | 1474 | 4,6 | 475 | 33 % (esperado 34 %) |
| variedad-de-cuerdas | 1558 | 4,5 | 481 | 31 % (esperado 33 %) |
| bajo-techo | 1448 | 4,5 | 514 | 40 % (esperado 33 %) |
| calcetinero | 1509 | 4,3 | 515 | 31 % (esperado 32 %) |
| todo-amarillo | 1498 | 4,3 | 486 | 34 % (esperado 34 %) |
| todo-rojo | 1543 | 4,2 | 506 | 35 % (esperado 34 %) |
| todo-azul | 1439 | 4,2 | 483 | 33 % (esperado 33 %) |
| tendedero-completo | 1481 | 4,2 | 541 | 35 % (esperado 33 %) |
| todo-blanco | 1545 | 4,1 | 509 | 33 % (esperado 33 %) |
| conjunto-completo | 1448 | 4,1 | 491 | 33 % (esperado 34 %) |
| toallero | 1415 | 4,1 | 503 | 35 % (esperado 33 %) |
| arcoiris | 1395 | 3,9 | 465 | 33 % (esperado 33 %) |
| parejas | 1591 | 3,6 | 512 | 31 % (esperado 33 %) |
| a-toda-prisa | 1544 | 3,1 | 525 | 31 % (esperado 33 %) |
| cuerdas-llenas | 1493 | 3,1 | 501 | 45 % (esperado 33 %) |
| regalo-envenenado | 1496 | 0,0 | 500 | 23 % (esperado 34 %) |

## Objetivos con las reglas recomendadas

| Objetivo | Veces en juego | Puntos medios | Veces de secreto | Gana con él de secreto |
|---|---|---|---|---|
| monton-de-ropa | 1407 | 5,1 | 482 | 33 % (esperado 33 %) |
| coleccion-color | 1495 | 4,9 | 509 | 32 % (esperado 33 %) |
| cuerdas-llenas | 1458 | 4,7 | 488 | 46 % (esperado 33 %) |
| calcetinero | 1436 | 4,5 | 504 | 37 % (esperado 33 %) |
| bajo-techo | 1500 | 4,5 | 465 | 33 % (esperado 34 %) |
| todo-rojo | 1528 | 4,3 | 500 | 33 % (esperado 34 %) |
| todo-amarillo | 1552 | 4,2 | 523 | 31 % (esperado 33 %) |
| todo-azul | 1431 | 4,2 | 522 | 35 % (esperado 34 %) |
| camisetero | 1594 | 4,2 | 497 | 32 % (esperado 33 %) |
| todo-blanco | 1466 | 4,2 | 484 | 37 % (esperado 33 %) |
| tendedero-completo | 1490 | 4,1 | 489 | 34 % (esperado 33 %) |
| arcoiris | 1461 | 4,1 | 487 | 35 % (esperado 33 %) |
| conjunto-completo | 1581 | 4,0 | 513 | 34 % (esperado 33 %) |
| toallero | 1579 | 4,0 | 503 | 36 % (esperado 33 %) |
| variedad-de-cuerdas | 1543 | 3,4 | 483 | 28 % (esperado 33 %) |
| a-toda-prisa | 1512 | 3,3 | 523 | 35 % (esperado 34 %) |
| parejas | 1530 | 3,2 | 498 | 28 % (esperado 34 %) |
| regalo-envenenado | 1437 | 0,0 | 530 | 24 % (esperado 34 %) |

## Orden del reparto según a quién atacan los bots

Con las reglas actuales del juego (vieja gratis, objetivos compensados, robo de 3). «Atacan al que va mejor»: cada bot se compara con el rival que va mejor y le lanza a él los fastidios. «Reparten los ataques»: se compara con la media de los rivales, así que le da igual a quién atacar.

| Jugadores | Reparto | Bots | Partidas | Victorias por asiento | Minutos | Viejas al rival | Regalo: puntos | Cuerdas llenas: puntos |
|---|---|---|---|---|---|---|---|---|
| 2 | Orden de los turnos | Atacan al que va mejor | 400 | 51 / 49 | 31 | 2,1 | 0,6 | 5,2 |
| 2 | Orden de los turnos | Reparten los ataques | 400 | 48 / 52 | 31 | 2,0 | 0,4 | 4,2 |
| 2 | Al revés | Atacan al que va mejor | 400 | 47 / 53 | 32 | 2,1 | 0,5 | 4,2 |
| 2 | Al revés | Reparten los ataques | 400 | 48 / 52 | 32 | 2,1 | 0,5 | 4,6 |
| 2 | Reglas finales (orden de los turnos) | Atacan al que va mejor | 300 | 47 / 53 | 32 | 2,1 | 1,0 | 3,4 |
| 3 | Orden de los turnos | Atacan al que va mejor | 400 | 31 / 33 / 36 | 39 | 3,0 | 0,5 | 4,5 |
| 3 | Orden de los turnos | Reparten los ataques | 400 | 34 / 30 / 36 | 40 | 3,3 | 0,6 | 5,0 |
| 3 | Al revés | Atacan al que va mejor | 400 | 33 / 39 / 28 | 40 | 3,1 | 0,6 | 4,7 |
| 3 | Al revés | Reparten los ataques | 400 | 34 / 40 / 26 | 39 | 3,2 | 0,7 | 4,8 |
| 3 | Reglas finales (orden de los turnos) | Atacan al que va mejor | 300 | 32 / 29 / 39 | 40 | 3,0 | 0,9 | 2,8 |
| 4 | Orden de los turnos | Atacan al que va mejor | 400 | 18 / 25 / 28 / 30 | 48 | 4,1 | 0,8 | 4,8 |
| 4 | Orden de los turnos | Reparten los ataques | 400 | 24 / 27 / 24 / 26 | 47 | 4,3 | 0,3 | 5,0 |
| 4 | Al revés | Atacan al que va mejor | 400 | 26 / 29 / 24 / 20 | 48 | 4,1 | 0,6 | 5,0 |
| 4 | Al revés | Reparten los ataques | 400 | 28 / 28 / 22 / 22 | 48 | 4,2 | 0,3 | 4,2 |
| 4 | Reglas finales (orden de los turnos) | Atacan al que va mejor | 300 | 23 / 23 / 24 / 31 | 49 | 4,2 | 1,1 | 3,3 |

### Objetivos con las reglas finales

| Objetivo | Veces en juego | Puntos medios | Veces de secreto | Gana con él de secreto |
|---|---|---|---|---|
| monton-de-ropa | 369 | 5,3 | 147 | 37 % (esperado 32 %) |
| coleccion-color | 464 | 5,1 | 144 | 38 % (esperado 32 %) |
| tendedero-completo | 526 | 4,9 | 146 | 30 % (esperado 34 %) |
| variedad-de-cuerdas | 491 | 4,8 | 152 | 38 % (esperado 33 %) |
| todo-rojo | 399 | 4,8 | 125 | 36 % (esperado 34 %) |
| calcetinero | 418 | 4,7 | 137 | 31 % (esperado 33 %) |
| camisetero | 474 | 4,6 | 165 | 28 % (esperado 33 %) |
| todo-amarillo | 405 | 4,6 | 155 | 30 % (esperado 32 %) |
| conjunto-completo | 494 | 4,6 | 168 | 36 % (esperado 34 %) |
| todo-blanco | 439 | 4,6 | 138 | 39 % (esperado 34 %) |
| bajo-techo | 492 | 4,4 | 166 | 32 % (esperado 34 %) |
| todo-azul | 453 | 4,1 | 153 | 37 % (esperado 33 %) |
| arcoiris | 455 | 4,1 | 149 | 30 % (esperado 32 %) |
| toallero | 410 | 4,1 | 138 | 23 % (esperado 33 %) |
| parejas | 508 | 3,5 | 161 | 37 % (esperado 34 %) |
| cuerdas-llenas | 459 | 3,2 | 154 | 40 % (esperado 34 %) |
| a-toda-prisa | 420 | 2,9 | 142 | 31 % (esperado 33 %) |
| regalo-envenenado | 424 | 1,0 | 160 | 28 % (esperado 34 %) |

## Opciones para la cuerda vieja

Sobre las reglas afinadas. «Regalo: puntos» es lo que da de media Regalo envenenado cuando está en juego; «gana de secreto», cuánto gana quien lo tiene de secreto (lo justo es 1 entre el número de jugadores).

| Jugadores | Opción | Partidas | Minutos | Viejas al rival | Mejoradas por el rival | Trofeos | Prendas perdidas | Regalo: puntos | Regalo: gana de secreto | Victorias por asiento |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | Reglas afinadas (sin cambios en la vieja) | 1000 | 30 | 0,2 | 0,1 | 0,0 | 0,0 | 0,0 | 42 % de 113 | 50 / 50 |
| 2 | La vieja al rival no gasta tu cuerda del turno | 85 | 30 | 1,9 | 1,4 | 0,1 | 0,0 | 0,3 | 29 % de 7 | 51 / 49 |
| 2 | Regalo envenenado cuenta viejas colocadas (no solo rotas) | 79 | 29 | 0,5 | 0,4 | 0,0 | 0,0 | 0,3 | 9 % de 11 | 51 / 49 |
| 2 | Las dos cosas a la vez | 85 | 30 | 2,2 | 1,6 | 0,2 | 0,0 | 0,3 | 60 % de 5 | 58 / 42 |
| 2 | Gratis y se rompe al acabar la ronda en que se pone | 21 | 30 | 2,2 | 0,8 | 1,1 | 0,0 | 1,3 | 100 % de 1 | 43 / 57 |
| 3 | Reglas afinadas (sin cambios en la vieja) | 1000 | 38 | 0,3 | 0,1 | 0,0 | 0,0 | 0,0 | 21 % de 175 | 33 / 36 / 31 |
| 3 | La vieja al rival no gasta tu cuerda del turno | 14 | 37 | 3,4 | 2,2 | 0,3 | 0,0 | 0,0 | 25 % de 4 | 21 / 50 / 29 |
| 3 | Las dos cosas a la vez | 7 | 35 | 3,0 | 2,1 | 0,1 | 0,0 | 0,0 | 0 % de 1 | 43 / 29 / 29 |
| 4 | Reglas afinadas (sin cambios en la vieja) | 1000 | 45 | 0,4 | 0,2 | 0,0 | 0,0 | 0,0 | 16 % de 212 | 27 / 25 / 24 / 25 |

## Duración según el final y los puntos de las prendas (reglas recomendadas)

Reglas recomendadas (objetivos reajustados, reparto inverso, robo de 2). Cada casilla: minutos de personas (rondas). 200 partidas por casilla.

### Prendas 1 / 3 / 6

| Jugadores | Final a 30 | 35 | 40 | 45 | 50 |
|---|---|---|---|---|---|
| 2 | 30 min (5,3) · objetivos 25 % | 33 min (5,8) · objetivos 27 % | 35 min (6,2) · objetivos 28 % | 37 min (6,6) · objetivos 27 % | 39 min (6,9) · objetivos 28 % |
| 3 | 37 min (5,1) · objetivos 26 % | 40 min (5,6) · objetivos 28 % | 43 min (5,9) · objetivos 28 % | 46 min (6,2) · objetivos 29 % | 50 min (6,8) · objetivos 29 % |
| 4 | 45 min (5,2) · objetivos 29 % | 48 min (5,4) · objetivos 29 % | 53 min (6,0) · objetivos 31 % | 56 min (6,3) · objetivos 31 % | 61 min (6,8) · objetivos 31 % |

### Prendas 1 / 3 / 5

| Jugadores | Final a 30 | 35 | 40 | 45 | 50 |
|---|---|---|---|---|---|
| 2 | 32 min (5,6) · objetivos 32 % | 35 min (6,2) · objetivos 33 % | 37 min (6,5) · objetivos 31 % | 39 min (6,9) · objetivos 33 % | 42 min (7,3) · objetivos 32 % |
| 3 | 40 min (5,3) · objetivos 31 % | 43 min (5,8) · objetivos 32 % | 47 min (6,3) · objetivos 33 % | 50 min (6,7) · objetivos 32 % | 54 min (7,2) · objetivos 33 % |
| 4 | 48 min (5,3) · objetivos 32 % | 52 min (5,8) · objetivos 33 % | 56 min (6,2) · objetivos 34 % | 60 min (6,7) · objetivos 34 % | 63 min (7,0) · objetivos 35 % |

### Prendas 1 / 2 / 4

| Jugadores | Final a 30 | 35 | 40 | 45 | 50 |
|---|---|---|---|---|---|
| 2 | 37 min (6,5) · objetivos 41 % | 40 min (6,9) · objetivos 41 % | 43 min (7,5) · objetivos 42 % | 46 min (8,0) · objetivos 43 % | 49 min (8,6) · objetivos 43 % |
| 3 | 46 min (6,2) · objetivos 42 % | 52 min (6,9) · objetivos 45 % | 55 min (7,3) · objetivos 44 % | 61 min (8,0) · objetivos 44 % | 63 min (8,3) · objetivos 43 % |
| 4 | 57 min (6,3) · objetivos 42 % | 62 min (6,8) · objetivos 44 % | 66 min (7,4) · objetivos 43 % | 71 min (8,0) · objetivos 43 % | 75 min (8,8) · objetivos 44 % |

