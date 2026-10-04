# Celler Roig · V9

App móvil/PWA para la vinoteca de Pedro.

## Novedades V9

- Rediseño compacto de la ficha de alta/edición: menos cajas grandes y controles más cómodos en móvil.
- `Ya lo he probado` y `Me lo regalaron` son ahora interruptores compactos y legibles.
- El contador de botellas ocupa menos espacio.
- La información del regalo se despliega solo cuando se activa.
- `Mejor momento para beber` se intenta obtener automáticamente al buscar el vino.
- El buscador realiza una búsqueda adicional orientada a *drinking window / ventana de consumo / potencial de guarda*.
- Solo se rellena la ventana de consumo cuando aparece una referencia razonablemente clara; si no, se deja vacía.
- La ficha marca el rango como `Autorrellenado` cuando procede de Internet. Si el usuario lo modifica manualmente, desaparece esa marca.
- Se ha endurecido de nuevo la detección del tipo de vino: elegir una foto ya no puede cambiar por sí sola un tinto a rosado/blanco por el texto de una imagen.
- La visualización de la ventana usa `Ahora–2030` cuando el periodo ya ha comenzado.
- Caché PWA actualizada a V9.

## Variables de entorno en Vercel

- `SERPER_API_KEY`: búsqueda de botellas y datos en Internet.
- `DATABASE_URL`: conexión a Neon para guardar la colección en la nube.

No es necesario cambiar estas variables al actualizar desde V8.

## Despliegue

Sube el contenido de esta carpeta a la raíz del repositorio conectado a Vercel. Vercel detectará el cambio y desplegará la nueva versión automáticamente.
