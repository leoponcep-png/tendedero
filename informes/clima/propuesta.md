# Clima: ¿sale el viento demasiado?

> **Solo es una propuesta: no se ha cambiado `data/dia.json`.**

## En pocas palabras

- **El mazo del día es justo**: las 11 cartas tienen 2 copias cada una (22 cartas). Se barajan al empezar, se roba una cuando se acaba la anterior y, cuando se gasta el mazo, se baraja el descarte. Cada carta sale en el **9 %** de los robos, sea cual sea.
- **Pero no todas pasan el mismo tiempo en la mesa.** Racha de sol, Días de lluvia y **Viento** duran 2 días. Por eso cada una de ellas ocupa el **14 % de las rondas**, el doble que cualquier carta de 1 día (7 %).
- **Además, el viento es lo que más se nota y lo que más se recuerda**:
  - hay dos cartas del día con viento (Viento y Viento traicionero) y una carta de acción (Ráfaga de viento, 3 copias);
  - Viento tira los calcetines **los dos días**, y Viento traicionero tira la prenda más grande de cada uno. Perder ropa duele más que secar un poco más o un poco menos;
  - en una partida normal (unas 5 rondas) sale **alguna carta de viento en 6 de cada 10 partidas**. Si cuentas todo lo que tira ropa (Viento, Viento traicionero y Pinzas viejas), **en 3 de cada 4**.
- **Propuesta:** dejar **una sola copia** de Viento y otra de Viento traicionero (el mazo pasa de 22 a 20 cartas). El viento saldría en 4 de cada 10 partidas en vez de 6, y casi nunca dos veces en la misma partida.

## 1. Cómo se elige la carta del día

En el motor (`packages/motor/src/estado/ronda.ts`, `inicioDeRonda`):

1. Al crear la partida se mete en el mazo del día una carta por cada copia de `data/dia.json` y se baraja (Fisher–Yates con la semilla de la partida, `azar.ts`).
2. Al empezar cada ronda, si la carta en juego ya ha cumplido sus días (`parametros.dias`), va al descarte. Si no queda ninguna en juego, se roba la de arriba.
3. Si el mazo se acaba, se baraja el descarte y se forma uno nuevo.

Nunca hay dos cartas del día a la vez y no hay ningún peso por carta: lo único que cambia la frecuencia es el número de copias, y lo que cambia el tiempo en la mesa son los días que dura.

## 2. Lo que hay en el mazo

| Grupo | Carta | Copias | Días | Qué hace |
|---|---|---|---|---|
| Tiempo | Soleado | 2 | 1 | Todo seca 1 más |
| Tiempo | Racha de sol | 2 | **2** | Todo seca 1 más |
| Tiempo | Chaparrón | 2 | 1 | Lo que no tiene tejadillo seca 1 menos |
| Tiempo | Días de lluvia | 2 | **2** | Igual, salvo el 2.º día |
| Tiempo | **Viento** | 2 | **2** | **Cada día** se caen los calcetines de cuerdas no resistentes; el resto seca 1 más |
| Suceso | Tormenta repentina | 2 | 1 | Lo colgado sin tejadillo gana 1 de humedad |
| Suceso | Ola de calor | 2 | 1 | Lo colgado pierde 1 de humedad |
| Suceso | Vecina sacude alfombra | 2 | 1 | Lo blanco gana 1 de humedad |
| Suceso | Pinzas viejas | 2 | 1 | **A cada uno se le cae** su prenda más húmeda |
| Suceso | Ropa se engancha | 2 | 1 | No se puede tirar ni mover ropa |
| Suceso | **Viento traicionero** | 2 | 1 | **A cada uno se le cae** su prenda más grande |

Si las juntamos por cómo se sienten en la mesa, en un ciclo del mazo (28 «días»):

| Familia | Cartas | Días por ciclo |
|---|---|---|
| Sol | Soleado, Racha de sol, Ola de calor | 8 |
| Lluvia | Chaparrón, Días de lluvia, Tormenta repentina | 8 |
| Viento | Viento, Viento traicionero | 6 |
| Otros | Vecina, Pinzas viejas, Ropa se engancha | 6 |
| *Tira ropa* (se solapa con las demás) | Viento, Viento traicionero, Pinzas viejas | 8 |

Con los números, el viento no sale más que el sol o la lluvia. Pero es la familia que más castiga y la única con tres cartas que llevan «viento» en el nombre.

## 3. Con qué frecuencia sale cada carta

**Partidas de verdad con bots**: 1200 partidas con las reglas actuales (400 a 2, 3 y 4 jugadores; IA normal y difícil mezcladas), 5852 rondas, 4,9 rondas por partida. Script: `informes/modos/sim.ts`, resultados `informes/modos/resultados/ref-*`.

| Carta | % de rondas | Partidas en las que sale |
|---|---|---|
| Racha de sol | 13,8 % | 38 % |
| Días de lluvia | 13,7 % | 32 % |
| **Viento** | **13,6 %** | **36 %** |
| Pinzas viejas | 7,7 % | 34 % |
| Ola de calor | 7,6 % | 34 % |
| Viento traicionero | 7,5 % | 33 % |
| Chaparrón | 7,5 % | 33 % |
| Ropa se engancha | 7,5 % | 33 % |
| Tormenta repentina | 7,1 % | 32 % |
| Soleado | 7,1 % | 32 % |
| Vecina sacude alfombra | 7,0 % | 31 % |

**Modelo del mazo** (`informes/clima/mazo.mjs`): baraja y roba igual que el motor, sin jugar la partida, porque el mazo del día no depende de cómo se juega. 200 000 partidas de 5 rondas. Coincide con las partidas de verdad:

| Carta | % de cartas robadas | % de rondas | Sale al menos una vez |
|---|---|---|---|
| Cartas de 1 día (cada una) | 9,0 % | 7,3 % | 34 % |
| Racha de sol, Días de lluvia, Viento (cada una) | 9,3 % | 13,7 % | 36 % |

| Familia | % de rondas | Sale al menos una vez | Sale 2 o más veces |
|---|---|---|---|
| Sol | 28,4 % | 76 % | 30 % |
| Lluvia | 28,5 % | 76 % | 30 % |
| **Viento** | 21,1 % | **60 %** | 14 % |
| Otros | 22,1 % | 73 % | 30 % |
| **Tira ropa** | 28,4 % | **76 %** | 30 % |

Tablas completas: `informes/clima/tabla-mazo-5-rondas.md` y `tabla-mazo-10-rondas.md` (para la partida larga).

## 4. Por qué parece que sale tanto

1. **Viento dura 2 días y castiga los dos.** Cuando sale, se queda en la mesa casi la mitad de una partida de 5 rondas y tira calcetines dos veces. Es la carta del día que más rondas está en la mesa (empatada con Racha de sol y Días de lluvia, que molestan mucho menos).
2. **Hay mucho «viento» en el juego**: Viento, Viento traicionero y Ráfaga de viento (una carta de acción que juegan los rivales). Para quien juega, todo eso es «el viento».
3. **Lo que tira ropa se recuerda más.** Un día de sol o de lluvia cambia el secado en 1. Viento, Viento traicionero y Pinzas viejas te quitan prendas. Entre las tres están en el 28 % de las rondas y salen en 3 de cada 4 partidas.

O sea: no es que la baraja esté mal hecha, es que el viento está en la mesa mucho tiempo y es lo que más duele.

## 5. Repartos probados

Cambios sobre `data/dia.json`, con el modelo del mazo (200 000 partidas de 5 rondas; entre paréntesis, partidas de 10 rondas, como la partida larga):

| Variante | Cartas | Viento: % de rondas | Viento: sale en | Viento: 2 o más veces | Tira ropa: % de rondas | Tira ropa: sale en | Sol / Lluvia: % de rondas |
|---|---|---|---|---|---|---|---|
| Ahora | 22 | 21 % | 60 % (87 %) | 14 % (47 %) | 28 % | 76 % (96 %) | 28 / 28 % |
| A · Viento 1 copia | 21 | 15 % | 51 % (79 %) | 9 % (33 %) | 23 % | 71 % (94 %) | 30 / 30 % |
| B · Viento 1 día | 22 | 16 % | 60 % (87 %) | 17 % (50 %) | 23 % | 76 % (96 %) | 30 / 30 % |
| C · Viento 1 día + V. traicionero 1 copia | 21 | 12 % | 51 % (80 %) | 10 % (35 %) | 20 % | 70 % (94 %) | 32 / 32 % |
| **D · Viento 1 copia + V. traicionero 1 copia** | **20** | **12 %** | **38 % (67 %)** | **3 % (15 %)** | **20 %** | **63 % (90 %)** | **32 / 32 %** |

- **B (Viento de 1 día) no arregla la sensación**: sale igual de a menudo, solo dura menos.
- **A** es el cambio más pequeño: el viento sale en 1 de cada 2 partidas.
- **D** es el que más se nota: el viento sale en 4 de cada 10 partidas y casi nunca repite. Lo que tira ropa baja del 28 % al 20 % de las rondas. Sol y lluvia ganan un poco de peso por igual, así que el ritmo de secado medio apenas cambia.

## 6. Propuesta

**Variante D**:

| Carta | Ahora | Propuesta |
|---|---|---|
| Viento | 2 copias, 2 días | **1 copia**, 2 días |
| Viento traicionero | 2 copias, 1 día | **1 copia**, 1 día |
| Resto | 2 copias | sin cambios |

En `data/dia.json`, cambiar `"copias": 2` por `"copias": 1` en `viento` y en `viento-traicionero`.

- Viento sigue siendo especial (2 días, tira calcetines) pero aparece menos.
- El mazo queda con 20 cartas: un ciclo de 24 días, que en la partida larga (unas 9–10 rondas) casi se ve entero.
- Si después de probarlo el viento se echa de menos, el paso intermedio es la variante A (volver a 2 copias de Viento traicionero).

Cómo repetir las cuentas:

```
node informes/clima/mazo.mjs 5 200000 informes/clima/variantes.json
node informes/modos/resumen.mjs ref --dias
```
