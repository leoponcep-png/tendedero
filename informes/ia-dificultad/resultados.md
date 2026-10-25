# Niveles de la IA: resultados con bots

Se han enfrentado los tres niveles en **2400 partidas**: 400 por duelo, con las reglas por defecto (final a 30 puntos). En cada partida los asientos van rotando, para que abrir la ronda no favorezca a ningún nivel. Un empate en el primer puesto cuenta como media victoria para cada uno.

## Qué hace cada nivel

- **Fácil:** es la IA «Normal» de antes, tal cual. Prueba cada jugada y se queda con la que mejor deja la mesa en ese momento. Valora la ropa sin mirar cuánto tarda en secarse ni cuántas rondas quedan. Por eso cuelga sobre todo toallas, que ocupan una cuerda entera y tardan 3 rondas. Además se lleva en el reparto más ropa de la que puede tender.
- **Normal:** hace la misma búsqueda que la fácil, pero optimiza su ropa (`packages/motor/src/iaRopa.ts`).
  - Mide el tendedero en «pinzas × rondas» hasta el final de la partida. Calcula cuántas rondas quedan según lo cerca que está el líder del final y la ropa que queda.
  - Cada prenda colgada gasta sus pinzas durante las rondas que tarda en secarse: su humedad, contando la `extra` de las cartas de Mojar, entre lo que seca su cuerda.
  - La ropa por tender se reparte empezando por la que más puntos da por pinza y por ronda: calcetín 1, camiseta 0,75, toalla 0,67. Solo cuenta la que cabe y se seca a tiempo.
  - La ropa que no cabe resta un poco. Así no se la lleva en el reparto si puede elegir.
  - Las cuerdas valen por el sitio que dan y por lo que aceleran el secado.
  - A los objetivos les da poco peso (la mitad que la fácil).
- **Difícil:** todo lo de la normal (`packages/motor/src/iaDificil.ts`), y además:
  - **Objetivos:** va a por el común y el secreto, tanto en el reparto como al colgar. Los valora con la ropa seca más la que va camino de secarse, y cuenta lo que lleva avanzado hacia el siguiente escalón. Elige el secreto que mejor encaja con los comunes y con las cuerdas de su mano.
  - **Fastidios:** los juega contra el que va ganando. Cuenta con la probabilidad de que se los anulen, calculada solo con lo que se ve en la mesa.
  - **«¡Ni hablar!»:** los guarda y solo los usa si el fastidio le cuesta más que la carta.
  - **Cuerda vieja:** da por perdida la ropa de una cuerda que se romperá antes de secarse. También sabe ponérsela a un rival o salvar la suya.
  - **Tiempo y viento:** tiene en cuenta el tiempo del día y si el viento le tirará los calcetines.
  - **Final de la partida:** en la última ronda no roba cuerdas.
  - **Límite de mano:** al pasarse, suelta la carta que menos falta le hace.
  - No mira la mano ni el objetivo secreto de nadie.

## Porcentaje de victorias

| Duelo | Jugadores | Lo justo | Resultado (% de victorias) | Puntos de media |
|---|---|---|---|---|
| Difícil contra normal | 2 | 50 % | **Difícil 77 %** · Normal 23 % | 57 · 44 |
| Normal contra fácil | 2 | 50 % | **Normal 73 %** · Fácil 27 % | 51 · 39 |
| Difícil contra fácil | 2 | 50 % | **Difícil 85 %** · Fácil 15 % | 59 · 37 |
| Los tres juntos | 3 | 33 % | **Difícil 74 %** · Normal 19 % · Fácil 7 % | 58 · 44 · 34 |
| Una difícil contra tres normales | 4 | 25 % | **La difícil gana el 52 %** | 56 · 44 |
| Una normal contra tres fáciles | 4 | 25 % | **La normal gana el 60 %** | 53 · 40 |

El orden queda claro en todos los duelos: Difícil > Normal > Fácil. Las partidas duran unas 5 rondas en todos los niveles.

## Qué ropa seca cada nivel

Media por jugador y partida, sumando todos los duelos:

| Nivel | Prendas secas | Calcetines | Camisetas | Toallas | Colgadas al acabar | Por tender al acabar | Por tender antes del último reparto |
|---|---|---|---|---|---|---|---|
| Fácil | 7,2 | 1,5 (21 %) | 2,3 (32 %) | **3,4 (47 %)** | 2,4 (1,9 toallas) | **10,7** | 9,3 |
| Normal | 11,1 | 5,1 (46 %) | 3,2 (28 %) | 2,9 (26 %) | 1,7 (0,8 toallas) | 5,3 | 7,0 |
| Difícil | 13,3 | 7,2 (54 %) | 3,7 (27 %) | 2,5 (19 %) | 1,2 (0,5 toallas) | 4,7 | 6,5 |

- **Toallas:** la fácil seca casi la mitad de su ropa en toallas y acaba con 2 toallas a medio secar. La normal y la difícil secan sobre todo calcetines y camisetas, y secan bastante más prendas en total.
- **Ropa por tender:** la fácil acaba con unas 11 prendas sin tender; la normal y la difícil, con unas 5.
- **Por qué no baja a cero:** casi todo lo que les queda viene del reparto de la última ronda, que ya no da tiempo a tender. Además, en el reparto se coge todo un color o todo un tipo de una cesta, así que no siempre se puede coger justo lo que cabe.

## Lo que tarda cada jugada

Medido con 10 partidas en paralelo en el mismo ordenador (con el ordenador libre, tarda menos):

| Nivel | Media | Máximo |
|---|---|---|
| Fácil | 8 ms | 0,1–0,26 s |
| Normal | 9 ms | 0,1–0,37 s (algún pico por la carga del ordenador) |
| Difícil | 10 ms | 0,19 s (tiene un tope de 150 ms para pensar: si se le acaba, juega lo mejor que ha visto) |

## Cómo repetirlo

Desde la raíz del proyecto:

```
npx rolldown informes/ia-dificultad/torneo.ts --file informes/ia-dificultad/torneo.mjs --platform node
bash informes/ia-dificultad/lanzar.sh final '[{"id":"dificil-normal","niveles":["dificil","normal"]}]' 400 10
```

`lanzar.sh` reparte la tanda en procesos de node y deja una línea por partida en `resultados/`. Al final saca el resumen con `resumen.mjs`: victorias, puntos, ropa seca por tipo y ropa por tender. Los resultados de esta tabla están en `resultados/final-*.jsonl`.
