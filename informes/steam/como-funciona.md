# Tendedero en Steam: cómo funciona

Este informe explica qué hace falta para sacar Tendedero en Steam, cómo se conecta el juego con Steam y qué cambia
respecto a cómo se juega ahora. El juego ya lleva la interfaz preparada: el día que tengas el App ID, se enciende sola.

## 1. Qué hace falta para publicar en Steam

- **Steam Direct.** Es el programa de Valve para publicar juegos. Te das de alta en <https://partner.steamgames.com>
  como desarrollador (Steamworks).
- **100 USD por juego.** Se pagan una vez por cada juego. Valve te los devuelve cuando el juego haya facturado
  1000 USD en Steam.
- **Cuenta de pago y datos fiscales.** Al darte de alta te piden una cuenta bancaria (donde te pagan) y un formulario
  de impuestos (para España, el de no residente en EE. UU., que evita que te retengan el 30 %). También verifican tu
  identidad.
- **App ID.** Al pagar los 100 USD, Steam te da un número para el juego (por ejemplo, 3456780). Es lo que el juego
  necesita para hablar con Steam.
- **Steamworks.** Es el panel donde se configura todo: la página de la tienda, los logros, las estadísticas, la
  presencia, las builds que se suben, el precio y la fecha de salida. Valve revisa la página y la build antes de
  publicar (suele tardar unos días), y desde que pagas hasta que puedes publicar deben pasar al menos 30 días.

## 2. Cómo se conecta el juego a Steam

La aplicación de escritorio (Electron) usa **steamworks.js**, una librería que habla con el **cliente de Steam abierto en
el ordenador del jugador**. No hace falta ningún servidor nuestro: Steam ya sabe quién es el jugador, quiénes son sus
amigos y cómo conectar a la gente.

```
Pantallas del juego (web)  →  preload (puente seguro)  →  proceso principal de Electron  →  steamworks.js  →  Steam abierto
  src/plataforma/*              escritorio/src/preload.cjs    escritorio/src/steam.cjs
```

- El juego solo enciende Steam si hay **App ID** (variable `TENDEDERO_STEAM_APPID`, la `SteamAppId` que pone Steam al
  lanzar el juego, o un archivo `steam_appid.txt` junto al `.exe`) **y Steam está abierto**.
- Si falta cualquiera de las dos cosas, el juego arranca igual, sin errores ni avisos, y funciona como ahora: amigos
  guardados en el equipo y salas con código. Donde algo solo existe en Steam, la pantalla enseña el hueco con el sello
  «Disponible en la versión de Steam».
- La web nunca toca Steam directamente: el preload solo deja unas pocas funciones (`window.tendederoSteam`), con
  `contextIsolation` activado.
- En Steam, las actualizaciones las pone Steam; el actualizador de GitHub solo funciona en la versión que no es de
  Steam.

## 3. Qué da Steam gratis

| Qué | Para qué en Tendedero | Estado en el juego |
| --- | --- | --- |
| **Amigos y presencia** | Ver a tus amigos y si juegan: «En el menú», «Jugando, ronda 3» | La presencia ya se manda. La lista de amigos dentro del juego, ver la nota de abajo |
| **Invitaciones** | «Invitar amigos» en la sala; al amigo le llega y puede aceptar | Hecho (con el diálogo de invitar de Steam) |
| **Lobbies** | Cada sala online es un lobby de Steam que guarda el código de la sala | Hecho |
| **Emparejamiento** | «Partida rápida»: buscar una sala pública con hueco o abrir una | Hecho |
| **Relay de red (Steam Datagram Relay)** | Conectar a los jugadores aunque estén detrás de routers difíciles, sin enseñar su IP | Propuesto (sección 4) |
| **Logros** | Los 30+ logros del juego salen en Steam | Hecho (ids en `perfil/logros.ts`, campo `steam`) |
| **Estadísticas** | Tus partidas y victorias en tu perfil de Steam | Hecho (hay que crearlas en Steamworks) |
| **Guardado en la nube (Steam Cloud)** | El perfil y las partidas en todos tus ordenadores | Por hacer (se activa en Steamworks; ver pasos) |
| **Actualizaciones** | Subes una build y a todos les llega sola | Lo hace Steam |
| **Overlay** | Mayús+Tab dentro del juego: amigos, chat, invitar | Activado |

**Nota importante sobre la lista de amigos.** La versión actual de steamworks.js (0.4.0) **no trae** la parte de
amigos de Steam (ISteamFriends): no puede leer la lista de amigos, su estado, su avatar ni las estadísticas de otro
jugador. Lo he comprobado en sus tipos y en su código. Por eso, con Steam:

- la pestaña Amigos dice «Aún no podemos enseñar aquí tu lista de amigos de Steam» y tiene el botón **«Abrir amigos
  de Steam»**, que abre la lista de Steam (con su estado y quién está jugando) encima del juego;
- invitar funciona con el diálogo de invitar de Steam, que ya enseña a tus amigos con su estado;
- la trayectoria de un amigo enseña lo que habéis jugado juntos y el botón **«Ver en Steam»**, que abre sus
  estadísticas en Steam.

La interfaz ya está hecha para la lista completa (avatar, estado, «Jugando, ronda 3»): en cuanto steamworks.js (u otra
librería) dé esas funciones, basta con rellenar la función `amigos()` de `packages/escritorio/src/steam.cjs`.

## 4. Qué cambia respecto a ahora (PeerJS)

**Ahora:** el anfitrión abre una sala y PeerJS da un código. Los demás entran con ese código. La conexión
entre jugadores es directa (WebRTC), y para encontrarse usa el servidor público gratuito de PeerJS.

**Con Steam, ya hecho:** se sigue jugando por PeerJS, pero Steam se encarga de encontrarse:

- al invitar a un amigo, se crea un lobby de Steam con el código de la sala dentro; el amigo acepta y entra solo, sin
  copiar nada;
- la partida rápida busca lobbies públicos de Tendedero con hueco (o abre uno) y entra con el código que lleva;
- si en la sala de una partida rápida no llega nadie en 30 segundos, sale «Rellenar con IA».

**Con Steam, propuesto para después: Steam Networking en vez de PeerJS.** Mandar los mensajes de la partida por la
red de Steam (P2P con relay de Steam) tiene ventajas claras:

- no depende del servidor público de PeerJS (que a veces va lento o se cae);
- conecta siempre, también detrás de routers que bloquean WebRTC, porque Steam hace de relay;
- nadie ve la IP de los demás;
- quién está en la sala lo sabe Steam (el lobby), sin códigos.

Cómo hacerlo: la partida ya va por mensajes (`online/protocolo.ts`). Habría que poner, junto a PeerJS, un segundo
transporte que mande esos mismos mensajes por el puente: en el proceso principal, `networking.sendP2PPacket(steamId,
SendType.Reliable, datos)` para enviar, y `isP2PPacketAvailable` / `readP2PPacket` (con `acceptP2PSession` al recibir
`P2PSessionRequest`) para recibir. Los miembros del lobby (`lobby.getMembers()`) dicen a quién mandar. Esa API es la
«P2P» antigua de Steam, que también usa el relay de Steam; steamworks.js 0.4.0 no trae todavía la de Networking
Sockets nueva, pero para un juego por turnos como Tendedero la antigua basta. Las salas guardadas, la reconexión y la
IA del anfitrión no cambian.

## 5. Lo que tendrás que hacer el día que tengas el App ID

1. **Escribe el App ID** en un archivo `packages/escritorio/steam_appid.txt` (solo el número) para probar en tu
   ordenador. Abre Steam, inicia sesión con una cuenta que tenga el juego (la tuya de desarrollador) y ejecuta
   `npm run escritorio`. La pestaña Amigos debe decir «Conectado a Steam como …».
2. **En Steamworks, crea los logros** con los mismos ids que el campo `steam` de cada logro en
   `packages/web/src/prototipos/perfil/logros.ts` (con su nombre, descripción e icono).
3. **Crea las estadísticas** (tipo INT): `partidas`, `ganadas`, `prendas_secas`, `mejor_racha` y `mejor_puntuacion`.
4. **Sube los textos de presencia**: en Steamworks → Community → Rich Presence, sube
   `packages/escritorio/steam/presencia.vdf` (y, si quieres, una copia por idioma con «english», «french»…). Así tus
   amigos ven «Jugando, ronda 3».
5. **Activa Steam Cloud** (Steamworks → Steam Cloud) con «Auto-Cloud» apuntando a la carpeta
   `%APPDATA%\Tendedero` del juego, para que el perfil y las partidas viajen entre ordenadores. (Más adelante sería mejor guardar el
   perfil en un archivo propio y sincronizar solo ese con `cloud.writeFile` / `cloud.readFile` de steamworks.js.)
6. **Construye la build** con `npm run escritorio:instalador` y sube la carpeta
   `packages/escritorio/dist/win-unpacked` con SteamPipe (la herramienta de subida de Steamworks). El ejecutable es
   `Tendedero.exe`. No subas el `steam_appid.txt`: Steam ya le dice al juego su App ID al lanzarlo.
7. **Prueba con un amigo** (o con otra cuenta en otro ordenador) usando una clave de Steam de las que te da
   Steamworks: invitar, aceptar, partida rápida y que salgan los logros.
8. Cuando todo vaya bien, rellena la página de la tienda y mándala a revisión.

Archivos que tocan Steam, por si hay que cambiar algo:

- `packages/escritorio/src/steam.cjs`: todo lo de steamworks.js (el único sitio que habla con Steam).
- `packages/escritorio/src/preload.cjs`: el puente `window.tendederoSteam`.
- `packages/web/src/plataforma/`: la capa de plataforma (local y Steam) y las pantallas de invitar, el aviso de
  invitación y la partida rápida.
- `packages/web/src/prototipos/perfil/PanelAmigos.tsx`: la pestaña Amigos.
