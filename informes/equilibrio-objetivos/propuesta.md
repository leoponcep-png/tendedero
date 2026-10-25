# Equilibrio de los objetivos: propuesta de ajustes

> **Solo es una propuesta: no se ha cambiado nada del juego.** Los datos (`data/*.json`) y el motor están igual. Todo lo de aquí sale de partidas jugadas por bots con las reglas actuales (prendas 1 / 3 / 6, final a 30, 2 objetivos comunes y 1 secreto elegido entre 2).

## En pocas palabras

- Se han jugado **unas 7300 partidas con bots**: 3800 de referencia con las reglas actuales (1500 a 2 jugadores, 1200 a 3 y 1100 a 4) y unas 3500 más para probar ritmos del Calcetinero (en ellas un jugador lleva siempre el Calcetinero de secreto, para tener muchos datos).
- **Los objetivos están, en general, bien compensados**: casi todos dan entre 4 y 5 puntos de media y quien los tiene de secreto gana más o menos lo justo. Pesan algo más de un cuarto de los puntos de la partida (25 % a 2 jugadores, 28 % a 4).
- **El Calcetinero es más fuerte de lo que parece con bots**, sobre todo **con 4 jugadores** y **con gente que seca mucha ropa**: a quien seca mucho le da el doble de puntos que a la media. Propuesta: **cada 2 → 2**.
- **Tres objetivos se quedan cortos**: Cada oveja con su pareja, A toda prisa y, sobre todo, Regalo envenenado (este no se arregla con puntos).
- **Cuerdas llenas** da pocos puntos pero hace ganar mucho a 2 jugadores; no es cosa de los puntos.

## La tabla

| Objetivo | Ahora | Propuesta | Por qué |
|---|---|---|---|
| **Calcetinero** | cada 1 → 2 | **cada 2 → 2** | Con bots da 4,8 puntos y a 4 jugadores quien lo tiene gana el 32 % (lo justo es el 25 %). A quien seca mucha ropa le da 9 puntos, el doble que a la media, y las personas secan más calcetines que los bots. Además hoy triplica lo que vale un calcetín (1 + 2), mientras que Camisetero y Toallero solo suman 1,5 por prenda. Con cada 2 → 2 un calcetín pasa a valer como 2 y queda parecido a los demás. Con bots queda algo por debajo de lo justo (gana el 47 / 28 / 24 % a 2 / 3 / 4 jugadores), pero los bots secan muy pocos calcetines; con personas debería quedar en la media. Si se queda flojo en la mesa, el paso intermedio es cada 2 → 3. |
| **Cada oveja con su pareja** | cada 1 → 4 | **cada 1 → 5** | Es el más flojo de los de ropa: 2,2 puntos y quien lo tiene gana el 29 % (justo: 34 %). Los bots casi no hacen parejas (0,6 por partida); las personas hacen más, por eso solo propongo subir un punto y no llegar a los 6–7 que pedirían los bots. Con 5, en las cuentas, queda en lo justo (40 / 33 / 25 % a 2 / 3 / 4 jugadores). |
| **A toda prisa** | cada 2 → 3 | **cada 2 → 4** | Da 2,9 puntos y gana el 31 % (justo: 34 %). Con 4 por cada 2 prendas sube a unos 3,8 y queda en lo justo (47 / 32 / 27 %). Sigue valiendo por prenda (2) lo mismo que Bajo techo. |
| **Regalo envenenado** | cada 1 → 4 | **cambiar la regla o quitarlo** | Da menos de 1 punto y quien lo tiene gana el 25 % (justo: 34 %); a 4 jugadores, el 15 %. Ni a 8 puntos por cuerda se arregla (1,8 puntos), porque casi nunca hay cuerdas viejas en tendederos rivales al final (0,2 por jugador). Si se queda, como mucho cada 1 → 6 mientras se piensa otra regla. |
| **Cuerdas llenas** | cada 1 → 2 | **sin cambio de puntos; vigilarlo** | Da solo 3 puntos, pero a 2 jugadores quien lo tiene gana el 68 % (a 3, el 41 %; a 4, el 28 %). No gana por sus puntos: hace que el bot llene bien sus cuerdas, que es jugar mejor. Bajarlo a cada 1 → 1 casi no cambia nada (64 % a 2). Las personas que juegan bien ya llenan las cuerdas, así que con personas probablemente pese menos. Si en la mesa también se nota, mejor que no se use a 2 jugadores. |
| Conjunto completo | cada 1 → 7 | sin cambios (si con personas se dispara: cada 1 → 6) | Con bots está justo (4,2 puntos, gana el 36 %). Pero, como el Calcetinero, crece mucho con quien seca mucho (8,4 puntos). Vigilarlo en las partidas de prueba. |
| Toallero | cada 2 → 3 | sin cambios | 4,1–4,3 puntos, gana lo justo. No crece aunque se seque más ropa (las toallas son pocas). |
| Camisetero | cada 2 → 3 | sin cambios | 4,3–4,6 puntos, gana lo justo. |
| Colección de color | cada 2 → 3 | sin cambios | 5,0 puntos, un pelín alto, pero gana lo justo y es el que menos diferencia hace entre jugadores. |
| Arcoíris | cada 1 → 5 | sin cambios | 4,0 puntos, gana lo justo. |
| Montón de ropa | cada 4 → 2 | sin cambios | 3,7 puntos y gana el 32 % (justo: 34 %): algo bajo, pero cada 3 → 2 lo pasaría a 5,3. Mejor dejarlo. |
| Tendedero completo | cada 1 → 6 | sin cambios | 4,5–4,7 puntos. A 4 jugadores gana algo menos de lo justo (20 % frente a 25 %); vigilarlo. |
| Variedad de cuerdas | cada 2 → 3 | sin cambios | 4,8–4,9 puntos. Igual que el anterior: algo flojo solo a 4 jugadores (19 %). |
| Todo blanco / azul / rojo / amarillo | cada 2 → 5 | sin cambios | 4,3–4,5 puntos, ganan lo justo. |
| Bajo techo | cada 1 → 2 | sin cambios | 4,0–4,2 puntos, gana lo justo. |

## 1. Cómo están ahora (3800 partidas de referencia)

Cifras juntando 2, 3 y 4 jugadores. «Puntos» es lo que da de media a cada jugador que lo tiene. «Peso» es qué parte de los puntos totales de ese jugador vienen de ese objetivo. «Gana con él» es cuántas veces gana quien lo tiene de secreto; lo justo es un 34 % de media (50 % a 2, 33 % a 3, 25 % a 4). Con estas partidas, diferencias de 3–4 puntos en ese porcentaje pueden ser azar.

| Objetivo | Ritmo | Puntos (común) | Puntos (secreto) | Peso | Gana con él de secreto | Justo |
|---|---|---|---|---|---|---|
| Calcetinero | 1 → 2 | 4,4 | 4,8 | 10–11 % | 36 % (45 / 36 / **32** %) | 34 % (50 / 33 / 25) |
| Toallero | 2 → 3 | 4,3 | 4,1 | 9–10 % | 35 % | 34 % |
| Camisetero | 2 → 3 | 4,3 | 4,6 | 10 % | 38 % | 34 % |
| Colección de color | 2 → 3 | 5,0 | 5,1 | 11 % | 37 % | 34 % |
| Arcoíris | 1 → 5 | 4,0 | 3,8 | 9 % | 36 % | 35 % |
| Montón de ropa | 4 → 2 | 3,7 | 3,8 | 8–9 % | 32 % | 34 % |
| Tendedero completo | 1 → 6 | 4,7 | 4,5 | 10 % | 33 % (a 4 j: 20 %) | 34 % |
| Variedad de cuerdas | 2 → 3 | 4,9 | 4,8 | 11 % | 33 % (a 4 j: 19 %) | 34 % |
| Todo blanco | 2 → 5 | 4,3 | 4,4 | 10 % | 36 % | 35 % |
| Todo azul | 2 → 5 | 4,3 | 4,5 | 10 % | 37 % | 35 % |
| Todo rojo | 2 → 5 | 4,4 | 4,5 | 10 % | 34 % | 34 % |
| Todo amarillo | 2 → 5 | 4,3 | 4,3 | 10 % | 37 % | 35 % |
| Cada oveja con su pareja | 1 → 4 | **2,2** | **2,3** | 5–6 % | **29 %** | 34 % |
| Bajo techo | 1 → 2 | 4,0 | 4,2 | 9–10 % | 34 % | 34 % |
| A toda prisa | 2 → 3 | **2,9** | **2,8** | 6–7 % | 31 % | 34 % |
| Cuerdas llenas | 1 → 2 | 3,3 | 3,1 | 7 % | **42 %** (**68** / 41 / 28 %) | 34 % |
| Regalo envenenado | 1 → 4 | **0,7** | **0,9** | 2 % | **25 %** (37 / 27 / 15 %) | 34 % |
| Conjunto completo | 1 → 7 | 4,1 | 4,2 | 9–10 % | 36 % | 35 % |

Más cosas que salen de estas partidas:

- **El Calcetinero crece con el número de jugadores**: 3,6 puntos a 2, 4,6 a 3 y 5,3 a 4. A 4 jugadores es también el objetivo común que más separa a unos jugadores de otros (9 puntos entre el que más y el que menos saca).
- **Los objetivos comunes que más cambian quién gana** son los de un color, Bajo techo, Conjunto completo y Calcetinero: con 4 jugadores cambian el ganador en una de cada cinco partidas. Montón de ropa, Variedad de cuerdas y Cuerdas llenas casi nunca, porque dan parecido a todos.
- **Con qué frecuencia lo eligen los bots de secreto**: los bots **eligen su secreto al azar** entre los dos que les ofrecen, así que todos salen elegidos la mitad de las veces (entre el 47 % y el 54 %). No dice nada de cuál es mejor; a cambio, como el reparto es al azar, el «gana con él» mide bien lo que aporta cada objetivo.

## 2. Lo que cambia con personas

Los bots secan menos ropa y hacen menos parejas que las personas, y sobre todo secan **pocos calcetines** (2,4 por partida de media): prefieren las toallas, que dan más puntos. Para estimar qué pasa con gente que seca más, he mirado cuánto le daría cada objetivo al 25 % de jugadores que más prendas seca (13 prendas de media, frente a 9):

| Objetivo | Puntos a un jugador medio | Al que seca mucho | Cuánto crece |
|---|---|---|---|
| Cada oveja con su pareja | 2,4 | 5,7 | × 2,4 |
| Conjunto completo | 4,3 | 8,4 | × 2,0 |
| **Calcetinero** | 4,7 | **9,1** | **× 1,9** |
| Arcoíris | 4,0 | 6,9 | × 1,7 |
| Camisetero | 4,4 | 7,2 | × 1,6 |
| A toda prisa | 3,0 | 4,8 | × 1,6 |
| Todo de un color | 4,3–4,4 | 6,7–6,9 | × 1,6 |
| Montón de ropa | 3,7 | 5,6 | × 1,5 |
| Colección de color | 5,1 | 7,3 | × 1,4 |
| Bajo techo | 4,3 | 6,0 | × 1,4 |
| Tendedero completo | 3,2 | 4,0 | × 1,3 |
| Variedad de cuerdas | 4,5 | 4,7 | × 1,0 |
| Toallero | 4,1 | 4,0 | × 1,0 |
| Cuerdas llenas | 2,6 | 1,8 | × 0,7 |
| Regalo envenenado | 0,9 | 0,8 | × 0,9 |

Qué quiere decir para la propuesta:

- **Con personas, el Calcetinero, Parejas y Conjunto completo valdrán bastante más que con bots.** Por eso el Calcetinero se baja aunque con bots no salga desbocado, Parejas solo se sube un punto y Conjunto completo se deja como está pero hay que vigilarlo.
- **Toallero, Variedad de cuerdas, Tendedero completo y Cuerdas llenas no crecen**: con personas quedarán algo por debajo de los demás. No propongo subirlos todavía: mejor verlo en partidas de prueba.

## 3. Ritmos probados para el Calcetinero

Se ha probado de dos formas:

- **Partidas jugadas de verdad** con cada ritmo, en las que un jugador lleva siempre el Calcetinero de secreto (los bots ajustan su forma de jugar a lo que vale);
- **Cuentas sobre las 3800 partidas de referencia**: lo que habría dado cada ritmo con los calcetines que secó cada uno.

**Partidas jugadas** (con cada ritmo se repiten los mismos repartos iniciales; «±» es el margen de azar):

| Ritmo | Puntos que da (2 / 3 / 4 jugadores) | Gana con él de secreto (2 / 3 / 4 j) | Justo |
|---|---|---|---|
| cada 1 → 2 (ahora) | 3,8 / 4,6 / 5,5 | 54 / 32 / **29** % | 50 / 33 / 25 % |
| cada 2 → 3 | 2,1 / 2,7 / 3,4 | 49 / 30 / 26 % | 50 / 33 / 25 % |
| **cada 2 → 2** | 1,4 / 1,8 / 2,3 | 47 / 28 / 24 % | 50 / 33 / 25 % |
| cada 3 → 3 | 1,1 / 1,4 / 1,9 | 47 / 29 / 23 % | 50 / 33 / 25 % |

300 partidas por casilla a 2 y 3 jugadores y 220 a 4; el margen de azar es de unos ±6 puntos porcentuales. Los bots que llevan el Calcetinero secan solo 2–3 calcetines por partida.

**Cuentas sobre las partidas de referencia:**

| Ritmo | Puntos (secreto) con bots | Al que seca mucho (unos 4–5 calcetines) | Gana con él de secreto (2 / 3 / 4 j) |
|---|---|---|---|
| cada 1 → 2 (ahora) | 4,8 | 9,1 | 45 / 36 / 32 % |
| cada 2 → 3 | 2,9 | unos 6 | 42 / 33 / 24 % |
| **cada 2 → 2** | 1,9 | unos 4 | 42 / 31 / 22 % |
| cada 3 → 3 | 1,6 | unos 4 | 41 / 30 / 21 % |
| cada 3 → 4 | 2,1 | unos 5 | 42 / 31 / 23 % |
| cada 3 → 2 | 1,0 | unos 3 | 41 / 28 / 20 % |

Por qué **cada 2 → 2**:

- Con bots se queda algo por debajo de lo justo, pero es porque los bots secan muy pocos calcetines. Para alguien que seca 4–5 calcetines da unos 4 puntos, justo lo que dan de media los demás objetivos.
- Un calcetín pasa a valer como 2 puntos (1 por secarlo y 1 del objetivo): sigue siendo buena idea secarlos, pero ya no son la mejor prenda por espacio de cuerda.
- **Cada 3 → 3 vale lo mismo por calcetín pero se pierde más por los que sobran** (con 5 calcetines da 3 en vez de 4); **cada 3 → 2 se queda corto** incluso para quien seca mucho.
- Si en las partidas de prueba se queda flojo, el paso intermedio es **cada 2 → 3**, que con bots ya queda en lo justo.

## 4. Otras variantes probadas (solo con cuentas)

| Objetivo | Ritmo | Puntos (secreto) | Gana con él (2 / 3 / 4 j) |
|---|---|---|---|
| Parejas | 1 → 4 (ahora) | 2,3 | 38 / 30 / 22 % |
| Parejas | **1 → 5** | 2,9 | 40 / 33 / 25 % |
| Parejas | 1 → 6 | 3,5 | 41 / 34 / 27 % |
| Parejas | 1 → 7 | 4,1 | 41 / 35 / 27 % |
| A toda prisa | 2 → 3 (ahora) | 2,8 | 44 / 30 / 23 % |
| A toda prisa | **2 → 4** | 3,7 | 47 / 32 / 27 % |
| A toda prisa | 1 → 2 | 4,5 | 48 / 34 / 28 % |
| Cuerdas llenas | 1 → 2 (ahora) | 3,1 | 68 / 41 / 28 % |
| Cuerdas llenas | 1 → 1 | 1,6 | 64 / 36 / 25 % |
| Regalo envenenado | 1 → 4 (ahora) | 0,9 | 37 / 27 / 15 % |
| Regalo envenenado | 1 → 6 | 1,3 | 37 / 29 / 16 % |
| Regalo envenenado | 1 → 8 | 1,8 | 38 / 34 / 18 % |
| Conjunto completo | 1 → 6 | 3,6 | 52 / 33 / 26 % |
| Tendedero completo | 1 → 7 | 5,3 | 55 / 34 / 23 % |
| Montón de ropa | 3 → 2 | 5,4 | 53 / 28 / 33 % |

Estas cuentas no tienen en cuenta que los bots cambiarían algo su forma de jugar si el objetivo valiera más o menos; para cambios de un punto, la diferencia es pequeña.

**¿Rompen otros objetivos?** Cada cambio solo toca un objetivo y mueve como mucho 2–3 puntos la media de quien lo tiene; el total de una partida (unos 44 puntos por jugador) apenas cambia, así que los demás objetivos quedan igual. Subir Parejas y A toda prisa y bajar el Calcetinero casi se compensan entre sí.

## Cómo leer las cifras

- Los bots juegan razonablemente pero no planifican a varios turnos, eligen el secreto al azar, secan menos ropa y hacen menos parejas que las personas. Valen más las comparaciones entre objetivos que las cifras exactas.
- Todo esto conviene confirmarlo en partidas de prueba con personas, sobre todo el Calcetinero, Parejas y Conjunto completo.

## Archivos de trabajo

En esta misma carpeta: `sim-objetivos.ts` (copia del simulador que apunta los puntos por jugador y permite fijar un secreto), `lanzar.ps1` (juega tandas en paralelo), `analizar.mjs` y `analizar-forzadas.mjs` (tablas), `tabla-referencia.md`, `tabla-forzadas.md` y `tabla-estatica.md` (tablas completas), `variantes-estaticas.json`, y las carpetas `tandas/` y `resultados/` (una línea por partida).
