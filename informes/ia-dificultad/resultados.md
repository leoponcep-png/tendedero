# Niveles de la IA: resultados con bots

Se han enfrentado los tres niveles en **2400 partidas**: 400 por duelo, con las reglas por defecto (final a 30 puntos). En cada partida los asientos van rotando, para que abrir la ronda no favorezca a ningún nivel. Un empate en el primer puesto cuenta como media victoria para cada uno.

## Porcentaje de victorias

| Duelo | Jugadores | Lo justo | Resultado (% de victorias) | Puntos de media |
|---|---|---|---|---|
| Difícil contra normal | 2 | 50 % | **Difícil 74 %** · Normal 26 % | 56 · 39 |
| Normal contra fácil | 2 | 50 % | **Normal 89 %** · Fácil 11 % | 49 · 30 |
| Difícil contra fácil | 2 | 50 % | **Difícil 94 %** · Fácil 6 % | 60 · 27 |
| Los tres juntos | 3 | 33 % | **Difícil 75 %** · Normal 21 % · Fácil 4 % | 58 · 40 · 27 |
| Una difícil contra tres normales | 4 | 25 % | **La difícil gana el 70 %** | 58 · 39 |
| Una normal contra tres fáciles | 4 | 25 % | **La normal gana el 65 %** | 47 · 31 |

Las partidas duran lo mismo en todos los niveles: unas 5 rondas.

## Lo que tarda cada jugada

Medido con 8 partidas en paralelo en el mismo ordenador (con el ordenador libre, tarda menos):

| Nivel | Media | Máximo |
|---|---|---|
| Fácil | 3 ms | algún pico suelto de 0,5 s (pausas del recolector de memoria con 8 procesos a la vez) |
| Normal | 7 ms | 0,1–0,3 s; algún pico de 0,6 s por lo mismo |
| Difícil | 9 ms | 0,19 s (tiene un tope de 150 ms para pensar: si se le acaba, juega lo mejor que ha visto) |

## Qué hace cada nivel

- **Fácil.** Igual que la normal, pero decide con mucho azar (en el reparto y en cada jugada), el 15 % de las veces se planta y termina el turno sin acabar lo que tenía, casi nunca fastidia (descarta el 80 % de los fastidios que se le ocurren), apenas se fija en cómo van los rivales, la mitad de las veces no usa su «¡Ni hablar!», descarta al azar y roba un número de cuerdas al azar.
- **Normal.** La IA de siempre, sin cambios: prueba cada jugada válida y se queda con la que mejor deja la mesa ahora mismo frente al rival que va mejor. Es la que se usa si no se dice nada.
- **Difícil** (`packages/motor/src/iaDificil.ts`). También prueba cada jugada con el motor, pero puntúa la mesa resultante mirando hacia delante:
  - Calcula **cuántas rondas quedan** (según lo cerca que está el líder del final y la ropa que queda) y cuándo se secará cada prenda según su humedad (la `extra` de las cartas de Mojar incluida), su cuerda y el tiempo del día. Lo que no se va a secar antes del final casi no vale, y lo que está en una cuerda vieja que se romperá antes se da por perdido.
  - Valora sus **objetivos (comunes y secreto)** con la ropa seca más la que va camino de secarse, contando también lo que lleva avanzado hacia el siguiente escalón. Elige el secreto que mejor encaja con los comunes y con las cuerdas de su mano.
  - En el **reparto de prendas** elige según todo lo anterior, así que coge lo que cabe en su tendedero y le sirve para sus objetivos.
  - **Cuerdas**: valora el sitio que dan, las habilidades (secado rápido, tejadillo, resistente, pinzas) y lo que les queda a las viejas; en la última ronda no roba cuerdas.
  - **Fastidios** contra quien va ganando (compara con el mejor rival), contando con la probabilidad de que se los anulen, calculada solo con lo que se ve en la mesa (cartas descartadas y número de cartas de acción del rival).
  - **Guarda sus respuestas**: un «¡Ni hablar!» en la mano vale más o menos un punto, así que solo lo usa si el fastidio le cuesta más que eso.
  - Al pasarse del límite de mano, suelta la carta que menos falta le hace.
  - No mira la mano ni el objetivo secreto de nadie.

## Cómo repetirlo

Desde la raíz del proyecto:

```
npx rolldown informes/ia-dificultad/torneo.ts --file informes/ia-dificultad/torneo.mjs --platform node
bash informes/ia-dificultad/lanzar.sh final '[{"id":"dificil-normal","niveles":["dificil","normal"]}]' 400 8
```

`lanzar.sh` reparte la tanda en procesos de node, deja una línea por partida en `resultados/` y al final saca el resumen (`resumen.mjs`). Los resultados de esta tabla están en `resultados/final-*.jsonl`.
