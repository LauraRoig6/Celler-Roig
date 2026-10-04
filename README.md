# Celler Roig · V8

Aplicación móvil/PWA para la vinoteca personal de Pedro Roig.

## Novedades V8

- **Corrección importante del tipo de vino**: Celler Roig ya no deduce Rosado/Tinto/Blanco a partir de cualquier mención encontrada en Internet. Solo lo autorellena cuando la coincidencia es suficientemente clara. Si no está seguro, deja **Sin indicar / revisar**.
- Al elegir una foto cuyo título indica claramente el tipo, esa evidencia sí se usa.
- Búsqueda local tolerante a pequeñas erratas (por ejemplo, `criensa`, `bordaux`, etc.).
- Instalación guiada como app/PWA desde el móvil.
- Mejor funcionamiento sin cobertura: los cambios se conservan localmente y se reintentan con Neon al recuperar conexión.
- Campo opcional **Mejor momento para beber: desde / hasta** y bloque de **Para abrir pronto** en Inicio.
- **Parecidos en tu colección** dentro de la ficha, usando denominación, uvas, tipo, país y envejecimiento.
- Estadísticas sencillas en Ajustes: nota media, países, denominación y uva más repetidas.
- Exportación CSV y **copia completa JSON** con posibilidad de restaurarla.
- Las imágenes elegidas de Internet se intentan descargar, comprimir y guardar como datos de la propia ficha; cuando el servidor de origen lo permite, dejan de depender de la URL externa.
- Se mantiene el flujo móvil: **Vinoteca / Probados / Por probar**, regalos recibidos, foto, estanterías automáticas, historial de catas, ubicación, favoritos y “¿Qué abrimos hoy?”.

No se ha añadido PIN, historial de compras, vinos regalados a otras personas ni “con quién lo probé”, para mantener la app sencilla.

## Variables de entorno en Vercel

- `DATABASE_URL`: conexión de Neon PostgreSQL.
- `SERPER_API_KEY`: búsqueda visual y de datos del vino.

## Despliegue

- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

## Añadir por foto

La app intenta preparar la foto, limpiar fondos claros y leer pistas de la etiqueta cuando el navegador lo permite. Después muestra coincidencias visuales para elegir la botella correcta y rellenar los datos. Para fondos complejos, el recorte automático sigue siendo aproximado; no se ha añadido un servicio de visión de pago.
