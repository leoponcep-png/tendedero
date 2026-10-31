# Microcortes en la mesa: qué pasaba y qué se ha cambiado

## Resumen

El juego se atascaba sobre todo en la **tarjeta gráfica**, no en el código. Apenas había trabajo de JavaScript.
Lo que la saturaba era **volver a pintar (rasterizar) trozos de la pantalla una y otra vez**, por dos motivos:

1. **Texturas de ruido vivas.** El grano del papel, la veta de la madera, el fieltro y las manchas de acuarela eran
   SVG con `feTurbulence` metidos en los CSS. Cada vez que el navegador repintaba un trozo de mesa o de carta,
   **recalculaba el ruido**. Hay uno o dos por carta, otro en cada panel y el de la madera, que ocupa toda la mesa.
2. **Halos que «laten» animando `box-shadow`.** El panel del jugador en turno (siempre hay uno), el aviso de «te
   toca» y la marca de la última ronda animaban la sombra. Así se repintaban, **en cada fotograma**, el panel, sus
   cartitas y la madera de debajo, con todo su ruido. En 20 segundos de partida, el panel en turno se repintaba
   unas 800 veces.

## Cómo se ha medido

- Partida real de 4 jugadores, con la IA jugando todos los asientos (`tendedero-autojugar`) y las animaciones
  puestas.
- **Build de producción** igual que la que carga Electron, servida en local. En modo desarrollo React es 10 veces
  más lento y los números no dicen nada.
- Chrome **sin ventana** (headless), con la gráfica real (RTX 3060 por ANGLE/D3D11), un perfil temporal y una sola
  instancia cada vez.
- El azar va con una semilla fija: siempre es la misma partida. En esa partida el día es «ola de calor», así que
  hay partículas de ambiente.
- Durante 60 s, `requestAnimationFrame` apunta lo que tarda cada fotograma. A la vez, `PerformanceObserver`
  recoge `longtask` y `long-animation-frame`, y una traza de Chrome da el tiempo de raster y de pintado.
- Las mediciones de antes y de después se alternan. No se mide mientras otro agente simula partidas.
- Referencia: una página vacía con una animación da **0 fotogramas lentos por minuto** con este mismo método.

## Números

«Fotograma lento» quiere decir que tarda más de 20 ms. A 60 Hz, cada fotograma debería durar 16,7 ms.

Se ha medido en dos situaciones, porque los números cambian mucho según lo ocupado que esté el ordenador:

| Situación | | Fotogramas lentos/min | p95 del fotograma | p99 | Fotogramas >50 ms/min | fps medios |
|---|---|---|---|---|---|---|
| **Ordenador ocupado** (otros procesos usando la CPU) | Antes | **321** | **50 ms** | 89 ms | 121 | 47 |
| | Después | **228** | **33 ms** | 83 ms | 90 | 51 |
| **Ordenador tranquilo** (sin simulaciones a la vez) | Antes | **125** | 16,8 ms | 50 ms | 29 | 56 |
| | Después | **105** | 16,8 ms | 45 ms | 26 | 57 |

Son medias de 3 mediciones de 60 s, alternando antes y después.
- Con el ordenador ocupado se pierden un **29 %** menos de fotogramas, y el p95 baja de 3 fotogramas (50 ms) a 2
  (33 ms).
- Con el ordenador tranquilo, la mejora es de un **16 %**. Allí el p95 ya estaba en un fotograma justo.

**Ojo:** buena parte de los tirones que se notaban venían de que el ordenador estaba muy ocupado mientras se jugaba
(otros agentes compilando y simulando partidas en la misma máquina). Con la misma partida y la misma build, eso
solo ya **multiplica por 2 o 3** los fotogramas lentos.

En la traza de 20 s, el trabajo de raster de la gráfica bajó de unos **11,4 s a unos 6,4 s**. El repintado del
panel en turno, que antes ocurría en cada fotograma, ya no aparece.

El JavaScript **no** es el problema: unos 0,5–0,9 s de script por minuto y casi ninguna tarea larga. Por eso no he
tocado React (`React.memo`, etc.). No movería la aguja.

### Qué se probó para encontrar al culpable

Sobre la build de antes, quité cada cosa por separado con CSS inyectado y medí 30 s cada vez:

- **Sin imágenes de fondo** (es decir, sin las texturas de ruido): el raster bajó a la mitad. Fue lo que más se
  notó.
- **Sin animaciones CSS:** el raster bajó a la mitad y el pintado cayó de 2,8 s a 0,7 s. El culpable eran los
  halos de `box-shadow`.
- **Sin filtros, sin sombras o sin `mix-blend-mode`:** mejoras pequeñas.
- **Sin `backdrop-filter` o sin el ambiente (lluvia, sol…):** ningún cambio claro.

Después de los cambios, quitar también las sombras `drop-shadow` de las ilustraciones o de las cartas de cuerda no da
una mejora clara (108–143 lentos/min, frente a 117 sin quitar nada). Lo que queda ya no depende de un solo efecto.

## Cambios (el aspecto a simple vista es el mismo)

1. **Texturas pre-renderizadas a PNG**, en `packages/web/src/arte/texturas/`. Salen de los mismos SVG, pintados
   una sola vez en un canvas de Chrome, así que se ven igual. Las de grano fino llevan también versión `@2x` para
   pantallas de alta densidad, servida con `image-set()`.
   - `mesa-bosque.css`: `--grano`, `--veta` y `--fieltro`.
   - `carta-prenda.css` (archivo del otro agente; solo he cambiado el valor de tres variables): `--papel-grano`,
     `--grano-papel` y `--acuarela`.
   - Para regenerarlas, por ejemplo si cambias el SVG: `node informes/rendimiento/texturas.mjs`. Dentro están los
     SVG originales.
2. **Halos que laten, con una capa aparte que solo anima `opacity`.** El brillo va en un `::after` con el mismo
   `box-shadow`, y se anima su opacidad, que la gráfica compone sin repintar nada.
   - `mesa-hud.css`: `.mf-panel.turno`.
   - `mesa-final.css`: `.me-reparto-aviso.tu-turno`.
   - `juego.css`: `.me-ronda.mj-ultima`.
3. **Fuera el filtro vacío `#tinta-bosque`** (`estilos-dibujo.css`). Ya no hacía nada (es un `feOffset` de 0), pero
   cada dibujo con `filter="url(#tinta-bosque)"` pagaba una pasada de filtro. En el estilo fusión queda solo la
   sombra de risografía (`drop-shadow`), y en el resto el atributo deja de aplicarse. No se ha añadido ningún filtro
   que deforme contornos.

## Lo que queda (no lo he hecho)

Todavía quedan unos 100 fotogramas lentos por minuto con el ordenador tranquilo, casi todos cuando vuela o aparece una carta. La
gráfica tiene que pintar la carta nueva, con sus sombras y capas de mezcla.

- **Sombras `drop-shadow` en las cartas de cuerda:** `.ccb.ccb-cozy.ccb-borde > svg`, en `carta-prenda.css` (dos
  `drop-shadow`, una con desenfoque). Se podrían cambiar por un `box-shadow` con el mismo radio en `.ccb`, que es
  mucho más barato. No lo he hecho porque es archivo del agente de las cartas, y porque si alguna pieza pintada
  sobresale del rectángulo, perdería su sombra. Hay que mirarlo con la carta delante.
- **Emblemas de los dorsos:** son PNG de 484×484 que se ven a 20–100 px (las cartitas de los paneles y los mazos). Una
  versión de 128 px ahorraría escalado. Están en `CartasBosque.tsx` (archivo del otro agente).
- **`mix-blend-mode: multiply` del grano en cada carta** (`::after` de `.hp-unica`, de los dorsos y de las cuerdas).
  Ahora es barato, porque el grano ya es PNG. Se podría hornear el grano directamente en el color de la carta, pero
  cambia un poco el aspecto.
- **Test:** `npm test` tiene 1 fallo en `ia-dificultad.test.ts` («la difícil hace sitio…», 45 < 46). Es del motor y
  de la IA, que otro agente está cambiando ahora. No tiene que ver con estos cambios, que son solo CSS. El typecheck
  pasa.
