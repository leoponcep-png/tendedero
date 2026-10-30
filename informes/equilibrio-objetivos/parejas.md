# Cada oveja con su pareja: ¿2, 3 o 4 puntos por pareja?

> **Solo es una propuesta: no se ha cambiado `data/objetivos.json`** (sigue en cada 1 → 5).

## En pocas palabras

- **Tienes razón: a 5 puntos por pareja es el objetivo más fuerte del juego.** Las IA Normal y Difícil cuelgan muchos calcetines (rinden más por pinza y por ronda), así que hacen parejas casi sin querer. Quien lo lleva de secreto gana el **59 / 49 / 34 %** (Normal) y el **68 / 53 / 50 %** (Difícil) a 2 / 3 / 4 jugadores, cuando lo justo es 50 / 33 / 25 %.
- **Recomendación: 2 puntos por pareja (cada 1 → 2).** Es el único valor que deja al que lo lleva en lo justo con los dos niveles: 50 / 33 / 20 % (Normal) y 55 / 27 / 22 % (Difícil). Da unos 3–5 puntos, como los demás objetivos.
- **3 puntos** se queda un poco por encima (52 / 38 / 22 % y 57 / 36 / 32 %) y da 5–9 puntos. Es el paso intermedio si en la mesa, con personas, a 2 se queda corto.
- **4 puntos** sigue siendo demasiado (hasta 64 % a 2 jugadores y 45 % a 3).

## Cómo se ha medido

- **7200 partidas con bots** (`informes/modos/sim.ts`, resultados en `informes/modos/resultados/par*`): 300 por casilla, con 2, 3, 4 y 5 puntos por pareja, a 2, 3 y 4 jugadores, y con todos los asientos en IA **Normal** o todos en IA **Difícil**.
- Como en el informe anterior (`propuesta.md`), un asiento (que va rotando) lleva siempre la pareja de secreto. Así hay muchos datos del objetivo y se ve directamente cuánto gana quien lo tiene.
- Con cada valor se repiten los mismos repartos iniciales. Los bots juegan sabiendo lo que vale el objetivo (la IA Difícil va a por él), así que el valor cambia cómo juegan.
- El margen de azar del porcentaje de victorias es de unos ±6 puntos.

## Resultados

### Quien lo lleva de secreto: puntos del objetivo y % de victorias

| Puntos por pareja | IA | 2 jugadores | 3 jugadores | 4 jugadores |
|---|---|---|---|---|
| **2** | Normal | 3,2 pts · **50 %** | 3,6 pts · **33 %** | 3,7 pts · **20 %** |
| **2** | Difícil | 4,8 pts · **55 %** | 4,6 pts · **27 %** | 5,2 pts · **22 %** |
| 3 | Normal | 4,8 pts · 52 % | 5,4 pts · 38 % | 5,5 pts · 22 % |
| 3 | Difícil | 8,1 pts · 57 % | 7,8 pts · 36 % | 9,0 pts · 32 % |
| 4 | Normal | 6,4 pts · 56 % | 7,2 pts · 43 % | 7,4 pts · 29 % |
| 4 | Difícil | 11,7 pts · 64 % | 11,3 pts · 45 % | 12,7 pts · 41 % |
| 5 (ahora) | Normal | 8,0 pts · 59 % | 8,9 pts · 49 % | 9,2 pts · 34 % |
| 5 (ahora) | Difícil | 15,4 pts · 68 % | 15,2 pts · 53 % | 16,9 pts · 50 % |
| **Lo justo** | | **50 %** | **33 %** | **25 %** |

Tabla completa (rondas, puntos totales, calcetines secos…): `informes/equilibrio-objetivos/tabla-parejas.md`.

### Por qué da tantos puntos

| | Calcetines secos (quien lo lleva) | Parejas |
|---|---|---|
| IA Normal | 4,8–5,3 | 1,6–1,9 |
| IA Difícil, con 2 puntos | 6,1–6,7 | 2,3–2,6 |
| IA Difícil, con 5 puntos | 7,5–8,3 | 3,0–3,4 |

- Desde que la IA Normal optimiza la ropa, todos los jugadores secan unos **5 calcetines por partida** (antes, 2,4). El informe anterior subió la pareja de 4 a 5 cuando los bots apenas hacían 0,6 parejas; ahora hacen casi 2 sin buscarlas.
- Un calcetín ya es la prenda que más rinde por pinza (1 punto, 1 hueco, 1 ronda). Con la pareja a 5, cada calcetín de una pareja vale 3,5 puntos: más que una toalla por hueco ocupado.
- Mirando las 1200 partidas de referencia, sin forzar nada (`informes/modos/resultados/ref-*`): si cada jugador cobrara la pareja con los calcetines que secó, a 5 puntos se llevaría **9,4 puntos**, el doble que los demás objetivos (entre 4 y 7). A 2 puntos serían 3,8; a 3, 5,7.

### ¿Rompe algo bajarla?

- Bajar de 5 a 2 quita entre 5 y 12 puntos solo a quien la tiene. El total de la partida apenas cambia (unos 48–52 puntos por jugador).
- El Calcetinero (cada 2 → 2) sigue premiando los calcetines, así que hacer parejas sigue siendo buena idea. Con la pareja a 2 un calcetín emparejado vale 2 puntos: lo mismo que con el Calcetinero.

## Recomendación

En `data/objetivos.json`, en `parejas`, cambiar `"puntos": 5` por `"puntos": 2` (y dejar `"cada": 1`).

- **2** es el valor que queda en lo justo con los dos niveles que juegan bien la ropa.
- Si en partidas con personas se queda flojo, **3** es el siguiente paso: con la IA Normal queda bien, pero con la Difícil ya gana algo de más (32 % a 4 jugadores).

Para repetirlo:

```
npx rolldown informes/modos/sim.ts --file informes/modos/sim.mjs --platform node
node informes/modos/lanzar.mjs par informes/modos/configs/parejas.json 300
node informes/modos/resumen.mjs par
```
