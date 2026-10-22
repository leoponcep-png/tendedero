# Tendedero

Juego web de *Tendedero*: se juega en un mismo ordenador o online con amigos, y sirve para testear el juego de mesa sin reimprimir.

## Arrancarlo en tu ordenador

Hace falta [Node.js](https://nodejs.org) 20 o superior. La primera vez, en esta carpeta:

```
npm install
```

Después, cada vez:

```
npm run dev
```

y abre http://localhost:5180.

## Modos de juego

- **En este ordenador:** todos juegan desde la misma pantalla; se puede deshacer y se ven todas las manos.
- **Online:** quien crea la sala elige las reglas y recibe un enlace (`…#/sala/código`) para pasárselo a los demás. Cada uno juega desde su navegador y ve solo su mano y su objetivo secreto.
  - La partida vive en el navegador de quien crea la sala, que tiene que tenerla abierta mientras se juega. Si recarga, la sala se recupera sola y los demás se vuelven a conectar.
  - Los jugadores se conectan directamente entre navegadores (WebRTC, con [PeerJS](https://peerjs.com)); el servidor público de PeerJS solo los presenta. En algunas redes muy cerradas (algunas empresas o datos móviles) la conexión directa puede fallar.
  - Quien cierre la pestaña puede recuperar su asiento entrando de nuevo con el mismo nombre.

## Publicarlo en internet (GitHub Pages, gratis)

1. Crea una cuenta en GitHub y un repositorio vacío (por ejemplo, `tendedero`).
2. Sube este proyecto a ese repositorio (rama `main`).
3. En el repositorio: **Settings → Pages → Source: GitHub Actions**.

Cada vez que se sube algo a `main`, `.github/workflows/publicar.yml` pasa los tests, construye la web y la publica en `https://tu-usuario.github.io/tendedero/`.

## Dónde se cambia cada cosa

| Quiero cambiar… | Dónde |
|---|---|
| Prendas, colores, cantidades, espacios, humedad, puntos | `data/prendas.json` |
| Cartas de cuerda, acción y del mazo del día (copias, estado, texto) | `data/cuerdas.json`, `acciones.json`, `dia.json` |
| Objetivos | `data/objetivos.json` |
| Valores por defecto de la pestaña de ajustes | `data/ajustes-por-defecto.json` |
| Configuraciones guardadas con nombre | `configuraciones/` (se crean desde la pestaña de ajustes, solo en local) |
| Ilustraciones | `packages/web/src/arte/` (dibujos en SVG) y `packages/web/src/tema.css` |

Con el juego abierto, al guardar un JSON la página se recarga sola. Si un archivo tiene un error, la página lo dice: archivo, carta y campo.

Cada carta tiene `"estado": "definida"` o `"pendiente"`. Las pendientes no entran en la partida. Para pasar una a definida, su `efecto` tiene que estar programado en `packages/motor/src/efectos/`.

## Estructura

- `packages/motor`: las reglas, en TypeScript puro. Cada jugada se valida y se aplica sobre una copia de la partida; el modo local, el online y los bots usan el mismo código.
- `packages/motor/sim`: bots que juegan partidas enteras y el analizador del informe (`informes/informe-bots.md`).
- `packages/web`: la interfaz (React + Vite, arrastrar y soltar con dnd-kit) y el modo online (`src/online/`).

Tests del motor: `npm test`.
