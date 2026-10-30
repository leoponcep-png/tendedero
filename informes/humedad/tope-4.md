# Tope de humedad: 4 gotas

**Regla nueva:** una prenda tiene como mucho 4 de humedad (`humedadMaxima` en `data/ajustes-por-defecto.json`, también en la partida larga). Lo que la moje de más, sea una carta de acción o un suceso del día, se pierde. La humedad es un solo número, que sube al mojar la prenda y baja al secarla. Ya no hay `extra` ni cartas de mojar metidas bajo la prenda. La carta de prenda tiene 4 filas de gotas y, al mojarla, baja una fila.

## Cómo se ha medido

Son 900 partidas por versión, todas entre bots:

- 150 partidas por duelo;
- con las mismas semillas y el mismo azar de la IA en las dos versiones;
- los asientos rotan en cada partida.

Se han comparado dos versiones:

- **Antes:** el motor del commit 7428e68, sin tope y con `extra`. Ahí se cuenta como «toque» cada vez que una prenda pasa de 4, que con la regla nueva habría tocado el tope.
- **Después:** con el tope de 4. Cada jugada se repite también sin tope. Lo que la prenda habría ganado de más es lo que se pierde por el tope.

Scripts en esta carpeta:

- `sim.ts` (se empaqueta en `sim.mjs`);
- `lanzar.sh nombre 150 5`;
- `resumen.mjs antes*.jsonl -- despues*.jsonl`.

## Resultados

| Duelo | Rondas (antes → después) | Victorias antes | Victorias después | Toques del tope por partida (antes → después) |
|---|---|---|---|---|
| Difícil contra normal | 4,97 → 4,99 | Difícil 73 % · Normal 27 % | Difícil 75 % · Normal 25 % | 0,03 → 0 |
| Normal contra fácil | 5,27 → 5,27 | Normal 78 % · Fácil 22 % | Normal 78 % · Fácil 22 % | 0,09 → 0,02 |
| Difícil contra fácil | 5,21 → 5,22 | Difícil 90 % · Fácil 10 % | Difícil 90 % · Fácil 10 % | 0,05 → 0 |
| Los tres (3 jugadores) | 4,92 → 4,95 | 72 % · 24 % · 4 % | 71 % · 24 % · 5 % | 0,15 → 0,01 |
| Larga: difícil contra normal | 10,40 → 10,41 | Difícil 64 % · Normal 36 % | Difícil 61 % · Normal 39 % | 0,01 → 0,01 |
| Larga: los tres | 8,99 → 8,99 | 52 % · 26 % · 22 % | 49 % · 28 % · 23 % | 0,07 → 0,01 |

Los puntos de media por nivel no cambian más de 1 punto en ningún duelo. Ninguna partida se ha quedado sin terminar.

## Cuántas veces se toca el tope

- **Antes:** en 59 ocasiones de 900 partidas, alguna prenda pasaba de 4. Llegaban a 5, y alguna vez a 6. Más o menos en 1 de cada 20 partidas.
  - 47 eran cartas que mojan: 25 de Mojar cuerda rival y 22 de Retrasar secado. Casi siempre las jugaba la IA para rematar una toalla recién colgada que ya estaba a 4.
  - 12 eran sucesos del día.
- **Después:** solo 7 veces en 900 partidas. Todas son sucesos del día (tormenta o polvo de la vecina) que pillan una prenda a 4, y en cada una se pierde 1 de humedad.
  - Las cartas que mojan nunca tocan el tope. La IA ya no juega Mojar ni Retrasar sobre prendas que están a 4, porque sabe que no hacen nada. Ha habido 0 jugadas así en balde.

## Conclusión

El tope casi nunca entra en juego:

- ninguna prenda empieza con más de 3 de humedad (la toalla);
- cada carta o suceso suma solo 1;
- llegar a 4 ya cuesta un fastidio.

La duración de la partida y el reparto de victorias por nivel no cambian: las diferencias son de 1 a 3 puntos de porcentaje, dentro del ruido de 150 partidas. Lo que sí cambia es que no se puede «enterrar» una toalla a 5 o 6. Mojar a la misma prenda dos veces seguidas solo vale si estaba a 2 o menos. La IA ya lo tiene en cuenta: busca otra prenda o se guarda la carta.
