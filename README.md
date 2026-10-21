# Tendedero · simulador

Simulador web para testear el juego de mesa *Tendedero* sin reimprimir.

## Arrancarlo

Hace falta [Node.js](https://nodejs.org) 20 o superior. La primera vez, en esta carpeta:

```
npm install
```

Después, cada vez:

```
npm run dev
```

y abre http://localhost:5180.

## Dónde se cambia cada cosa

| Quiero cambiar… | Dónde |
|---|---|
| Prendas, colores, cantidades, espacios, humedad, puntos | `data/prendas.json` |
| Cartas de cuerda, acción, clima y evento (copias, estado, texto) | `data/cuerdas.json`, `acciones.json`, `climas.json`, `eventos.json` |
| Objetivos | `data/objetivos.json` |
| Valores por defecto de la pestaña de ajustes | `data/ajustes-por-defecto.json` |
| Configuraciones guardadas con nombre | `configuraciones/` (se crean desde la pestaña de ajustes) |

Con el simulador abierto, al guardar un JSON la página se recarga sola. Si un archivo tiene un error, la página lo dice: archivo, carta y campo.

Cada carta tiene `"estado": "definida"` o `"pendiente"`. Las pendientes no entran en la partida. Para pasar una a definida, su `efecto` tiene que estar programado en `packages/motor/src/efectos/`.

## Estructura

- `packages/motor`: las reglas, en TypeScript puro. Cada jugada se valida y se aplica sobre una copia de la partida, así que deshacer, repetir con la misma semilla y el futuro servidor online usan el mismo código.
- `packages/web`: la interfaz (React + Vite, arrastrar y soltar con dnd-kit).
- `packages/servidor`: vacío hasta el modo online.

Tests del motor: `npm test`.
