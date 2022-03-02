# coderhouse-javascript
Proyecto de javascript para el curso de coderhouse

Para este proyecto usé vanilla javascript, implementando Jquery para el trabajo sobre el DOM, y una pequeña librería liviana y gratuita para generar la grilla.
Intenté aplicar programación orientada a objetos sobre una estructura Modelo-Vista-Controlador.

La aplicación permite crear notas con un título, un cuerpo, etiquetas y una fecha de edición.
Por ser una aplicación sin interacción con bases de datos (client side), éstas se almacenan en el Local Storage.
Además permite filtrar las notas mostradas por etiquetas (se pueden pensar como categorias) y por contenido, a través de la barra de búsqueda.

Por último, si no hay notas creadas, permite cargar un paquete JSON con notas de ejemplo (siempre y cuando esté corriendo en live server o algún otro servidor).
