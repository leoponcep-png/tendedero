# Pendientes para mañana (apuntados el 31-10-2026)

## Cartas de cuerda
- [x] Cuerda que asoma por el borde derecho de cada carta: comprobar que ya no asoma (el agente lo dejó a medias). **Hecho:** la cuerda y las pinzas van recortadas al contorno redondeado de dentro del borde; comprobado en la galería y en partida (dos cartas seguidas empalman a la misma altura).
- [x] Tejadillo: mejorar el tejado (tejas pintadas, separado de la cuerda). **Hecho:** tejado nuevo en SVG al estilo del icono: dos filas de tejas curvas rojas con luz y sombra, caballete, borde de tinta marrón y sombra bajo el canto; queda entre el texto y las pinzas, con aire hasta ellas.
- [x] Cuerda vieja: quitar el nudo cuadrado recortado. **Hecho:** sin nudo; esparto desteñido con hebras sueltas finas en SVG (el nudo solo en el medallón).
- [x] Título de las cartas de cuerda con letra distinta según la carta: en unas sale estrecha o achatada (p. ej. «Cuerda básica») y en otras normal («Tejadillo»). Misma tipografía y mismo ancho en todas; si un nombre largo no cabe, bajar el tamaño en vez de estrecharlo. **Hecho:** fuera `textLength`; el nombre se mide con la fuente cargada y, si no cabe, baja de tamaño. Revisado también en alemán.

## Rendimiento
- El juego tiene microcortes y no va fluido: medir y quitar lo que cuesta (filtros SVG vivos, sombras, partículas, re-renderizados). Informe en `informes/rendimiento/microcortes.md`.

## Mesa
- [x] Pinzas de las cuerdas «flotando»: que muerdan la cuerda, con sombra, algo más grandes y rectas. **Hecho:** pinzas un 25 % más grandes, todas derechas y en el mismo sitio en horizontal; la cuerda pasa por la boca (la V de arriba, en su tercio superior) y las puntas asoman por encima; sombra suave sobre la cuerda y el fondo. Abajo las corta el borde de la carta, por donde asoma la prenda.
- [x] La moneda de puntos de la prenda de la primera posición (pegada al poste de la loseta) queda tapada por el poste. Debe verse por encima del palo de tender. **Hecho:** las prendas colgadas van por encima de la loseta (z-index 3 + orden; la loseta tiene 2), y siguen por debajo de su carta de cuerda.

## Portada
- Propuesta del usuario (maqueta en `referencias/portada-propuesta.webp`, sacada de ChatGPT): jardín con valla y césped, cielo medio soleado con tormenta a la derecha, título «Tendedero» con letras de tela colgadas de pinzas en una cuerda, mucha ropa colgada, subtítulo «Tiende la colada antes de que llueva» en un cartel de madera, botón JUGAR grande y verde con relieve, botones secundarios de madera con icono (Aprender a jugar, Online, Perfil y logros), y Ajustes y Salir como iconos redondos en las esquinas.
- Animaciones: cuerda y ropa que se mecen, nubes que se mueven, algún relámpago suave; al pasar el ratón por un botón, una pinza que salta, y sonido de pinza al pulsar.
- Ojo: el 30-10 pidió quitar el cielo y el césped de la portada y dejar la mesa de madera; confirmar con él que ahora sí quiere este escenario.
- Forma de hacerlo: el fondo pintado (jardín, cielo, tendedero y ropa, sin título ni botones) como imagen de ChatGPT; el título como imagen con las letras de tela; los botones y textos, del juego (para traducirlos).

## Mazo de acciones (decidido el 31-10)
- Fuera la táctica «Colocar cuerda extra» (con 2 cuerdas por turno ya no tiene sentido).
- Táctica nueva «Cesto de ropa sucia»: robas 3 prendas de la bolsa.
- «Mover prenda propia» y «Cambiar prendas de sitio» pasan a ser una sola táctica (mover o intercambiar).
- El fastidio «Mover una prenda rival» también puede intercambiar dos prendas del rival.
- Fastidio nuevo «Manguerazo»: +2 de humedad a una prenda rival (máximo 4).
- Táctica nueva «Secador»: −2 de humedad a una prenda tuya (carta aparte; «Reducir humedad» se queda). A prueba.
- Faltan ilustraciones de «Cesto de ropa sucia», «Manguerazo» y «Secador».

## Reglas
- Ajuste fino de los puntos de los objetivos para el final en 40 (o decidir si se baja a 35).
