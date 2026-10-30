# Niveles de la IA: resultados con bots

Se han enfrentado los tres niveles en **2400 partidas**: 400 por duelo, con las reglas por defecto (final a 30 puntos). En cada partida los asientos van rotando, para que abrir la ronda no favorezca a ningún nivel. Un empate en el primer puesto cuenta como media victoria para cada uno.

## Qué hace cada nivel

- **Fácil:** es la IA «Normal» de antes, tal cual. Prueba cada jugada y se queda con la que mejor deja la mesa en ese momento. Valora la ropa sin mirar cuánto tarda en secarse ni cuántas rondas quedan. Por eso cuelga sobre todo toallas, que ocupan una cuerda entera y tardan 3 rondas. Además se lleva en el reparto más ropa de la que puede tender.
- **Normal:** hace la misma búsqueda que la fácil, pero optimiza su ropa (`packages/motor/src/iaRopa.ts`).
  - Mide el tendedero en «pinzas × rondas» hasta el final de la partida. Calcula cuántas rondas quedan según lo cerca que está el líder del final y la ropa que queda.
  - Cada prenda colgada gasta sus pinzas durante las rondas que tarda en secarse: su humedad (como mucho 4) entre lo que seca su cuerda.
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

## La última ronda

La partida acaba al terminar la ronda en la que alguien llega a 30. Antes, la IA calculaba cuántas rondas quedaban solo con el ritmo de puntos del que va primero.

Ahora la normal y la difícil miran también con cuántos puntos puede acabar esta ronda cada jugador, ellas incluidas:
- lo colgado que se seca en el secado de hoy, con el tiempo del día;
- lo que aún pueda tender ya casi seco, si todavía le toca jugar.

Si alguien llega así a 30, juegan como si fuera la última ronda:
- solo vale lo que se seca hoy;
- cuelgan primero los calcetines y lo que tiene poca humedad;
- usan Secar prenda o Mover prenda para hacer sitio o llevar a una cuerda de secado rápido lo que así se seca a tiempo;
- frenan al rival que va a cerrar la partida (p. ej. con Retrasar secado);
- cuentan los puntos de objetivo que suman esas prendas (parejas, colores…).

Los tests de `packages/motor/test/ia-dificultad.test.ts` (apartado «ronda final») prueban una situación así. El rival tiene 15 puntos, pero con lo que se le seca hoy llega a 30. El asiento de la IA tiene 20 puntos, cuerdas ocupadas por toallas empapadas y calcetines por tender.

| Situación | Fácil | Normal y difícil |
|---|---|---|
| Sitio libre para 3 calcetines | Cuelga una toalla que no se seca: acaba con 20 | Cuelga 3 calcetines: acaba con 30 (secado + pareja + objetivo) |
| Toalla a medio secar y una cuerda de secado rápido vacía, con Mover prenda | No hace nada: 20 | Mueve la toalla que así se seca hoy: 26 (antes de este cambio movía la otra y se quedaba en 20) |
| Con Secar prenda y Retrasar secado | También las juega, pero cuelga un calcetín menos: 38 y la partida dura una ronda más | Seca una toalla para hacer sitio, cuelga 4 calcetines y retrasa la toalla del rival: gana 46 a 24 |

## Porcentaje de victorias

| Duelo | Jugadores | Lo justo | Resultado (% de victorias) | Puntos de media |
|---|---|---|---|---|
| Difícil contra normal | 2 | 50 % | **Difícil 71 %** · Normal 29 % | 59 · 48 |
| Normal contra fácil | 2 | 50 % | **Normal 78 %** · Fácil 22 % | 53 · 39 |
| Difícil contra fácil | 2 | 50 % | **Difícil 88 %** · Fácil 12 % | 60 · 37 |
| Los tres juntos | 3 | 33 % | **Difícil 71 %** · Normal 24 % · Fácil 5 % | 60 · 47 · 34 |
| Una difícil contra tres normales | 4 | 25 % | **La difícil gana el 53 %** | 58 · 47 |
| Una normal contra tres fáciles | 4 | 25 % | **La normal gana el 65 %** | 53 · 39 |

El orden queda claro en todos los duelos: Difícil > Normal > Fácil. Las partidas duran unas 5 rondas en todos los niveles.

## Qué ropa seca cada nivel

Media por jugador y partida, sumando todos los duelos:

| Nivel | Prendas secas | Calcetines | Camisetas | Toallas | Colgadas al acabar | Por tender al acabar | Por tender antes del último reparto |
|---|---|---|---|---|---|---|---|
| Fácil | 7,1 | 1,5 (22 %) | 2,2 (31 %) | **3,3 (47 %)** | 2,6 (2,0 toallas) | **11,1** | 9,3 |
| Normal | 11,7 | 5,3 (45 %) | 3,5 (30 %) | 3,0 (25 %) | 1,2 (0,6 toallas) | 4,9 | 7,0 |
| Difícil | 13,7 | 7,5 (55 %) | 3,7 (27 %) | 2,5 (18 %) | 1,1 (0,4 toallas) | 4,2 | 6,6 |

- **Toallas:** la fácil seca casi la mitad de su ropa en toallas y acaba con 2 toallas a medio secar. La normal y la difícil secan sobre todo calcetines y camisetas, y secan bastante más prendas en total.
- **Ropa por tender:** la fácil acaba con unas 11 prendas sin tender; la normal y la difícil, con 4 o 5.
- **Por qué no baja a cero:** casi todo lo que les queda viene del reparto de la última ronda, que ya no da tiempo a tender. Además, en el reparto se coge todo un color o todo un tipo de una cesta, así que no siempre se puede coger justo lo que cabe.

## Lo que tarda cada jugada

Medido con 10 partidas en paralelo en el mismo ordenador (con el ordenador libre, tarda menos):

| Nivel | Media | Máximo |
|---|---|---|
| Fácil | 8 ms | 0,1–0,26 s |
| Normal | 9 ms | 0,1–0,37 s (algún pico por la carga del ordenador) |
| Difícil | 9 ms | 0,18 s (tiene un tope de 150 ms para pensar: si se le acaba, juega lo mejor que ha visto) |

## Cómo repetirlo

Desde la raíz del proyecto:

```
npx rolldown informes/ia-dificultad/torneo.ts --file informes/ia-dificultad/torneo.mjs --platform node
bash informes/ia-dificultad/lanzar.sh final '[{"id":"dificil-normal","niveles":["dificil","normal"]}]' 400 10
```

`lanzar.sh` reparte la tanda en procesos de node y deja una línea por partida en `resultados/`. Al final saca el resumen con `resumen.mjs`: victorias, puntos, ropa seca por tipo y ropa por tender. Los resultados de esta tabla están en `resultados/final-*.jsonl`.
