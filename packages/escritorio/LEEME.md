# Tendedero para Windows

Esta carpeta convierte el juego en una aplicación de escritorio para Windows (con Electron).
La aplicación abre directamente el menú del juego, funciona sin servidor y se actualiza sola.

## Probarlo en tu ordenador

Desde la carpeta principal del proyecto:

- `npm run escritorio` construye la web y abre la aplicación (sin instalar nada).
- `npm run escritorio:instalador` crea el instalador en `packages/escritorio/dist/Tendedero-Setup-X.Y.Z.exe`.
  En `packages/escritorio/dist/win-unpacked/Tendedero.exe` tienes la aplicación ya preparada, para probarla sin instalar.

El icono sale de `build/icono.svg`. Si lo cambias, vuelve a generar el `.ico` con `npm run icono -w @tendedero/escritorio`.

## Pasar el juego a tus amigos

1. Entra en la página de releases del proyecto: <https://github.com/leoponcep-png/tendedero/releases>.
2. Pásales el enlace del archivo `Tendedero-Setup-X.Y.Z.exe` de la última versión (o el archivo directamente).
3. Al abrirlo, se instala solo, sin pedir contraseña de administrador, y crea un acceso directo en el escritorio y en el menú Inicio.

**Aviso de Windows (SmartScreen).** Como el instalador no está firmado con un certificado de pago, Windows puede mostrar
una pantalla azul que dice «Windows protegió su PC». Es normal. Para seguir:

1. Pulsa **«Más información»**.
2. Pulsa **«Ejecutar de todas formas»**.

Solo pasa la primera vez. Después, las actualizaciones se instalan solas.

Las partidas guardadas, el perfil y los logros se conservan al actualizar. Se guardan en `%APPDATA%\Tendedero`.

**Jugar online.** Funciona igual que en la web: uno crea la sala y le pasa el código a los demás, que entran con «Online: unirse».
El enlace de la sala que copia la aplicación empieza por `tendedero://`, así que no se abre en el navegador: mejor pasar el código.

## Publicar una versión nueva

1. Sube el número de versión de la aplicación (por ejemplo, de 0.1.0 a 0.2.0):

   ```
   npm version 0.2.0 -w @tendedero/escritorio --no-git-tag-version
   ```

2. Guarda el cambio en git y súbelo:

   ```
   git commit -am "Versión 0.2.0 de la aplicación"
   git push
   ```

3. Crea el tag con la misma versión, con una «v» delante, y súbelo:

   ```
   git tag v0.2.0
   git push origin v0.2.0
   ```

Ya está. GitHub construye el instalador y publica la release solo (lo puedes seguir en la pestaña **Actions** del repositorio,
en «Aplicación de escritorio»; tarda unos minutos). Las aplicaciones que tus amigos ya tienen instaladas lo notan al abrirse,
descargan la versión nueva en segundo plano y preguntan: «Hay una versión nueva de Tendedero. ¿Reiniciar para actualizar?».
Si eligen «Más tarde», se instala al cerrar el juego.

El tag tiene que coincidir con la versión de `packages/escritorio/package.json`; si no, GitHub para y avisa.

## Qué hace falta en GitHub

- **El repositorio tiene que ser público.** El actualizador lee las releases de GitHub sin contraseña, y eso solo es posible
  si el repositorio es público. No hace falta crear ningún secreto: GitHub da al proceso de publicación el permiso que necesita.
- **Si prefieres que el repositorio sea privado**, el actualizador no podrá ver las releases. Lo más sencillo es publicar las
  versiones en otro repositorio público, vacío y solo para eso (por ejemplo `leoponcep-png/tendedero-versiones`):
  1. Crea ese repositorio público.
  2. Crea un token personal en GitHub (Settings → Developer settings → Personal access tokens) con permiso para escribir
     en ese repositorio, y guárdalo en el repositorio privado como secreto `RELEASES_TOKEN`.
  3. En `packages/escritorio/package.json`, en `build.publish`, cambia `"repo": "tendedero"` por `"repo": "tendedero-versiones"`.
  4. En `.github/workflows/escritorio.yml`, cambia `secrets.GITHUB_TOKEN` por `secrets.RELEASES_TOKEN`.

  (Meter un token dentro de la aplicación para leer un repositorio privado no es buena idea: cualquiera podría sacarlo.)
