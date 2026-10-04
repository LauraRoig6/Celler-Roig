# Celler Roig — V6

Aplicación móvil/PWA para la vinoteca personal de Pedro Roig.

## Cambios de esta versión

- El formulario nuevo ya no pone el año actual automáticamente.
- Al abrir **Buscar botella y datos** la barra queda vacía salvo que ya hayas escrito el nombre del vino.
- Se elimina **DOP / IGP** como filtro de la vinoteca.
- Se elimina **DOP / IGP** como criterio de ordenación; **Denominación** permanece.
- La colección se puede guardar en **Neon PostgreSQL** además de conservar una copia local en el móvil.
- La tabla de Neon se crea automáticamente en el primer acceso: no hay que ejecutar SQL manualmente.

## Despliegue en Vercel

1. Sube **el contenido de esta carpeta** a la raíz del repositorio de GitHub.
2. En Vercel importa el repositorio con preset **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.

## Base de datos en Neon

1. Crea un proyecto nuevo en Neon para Celler Roig.
2. Copia la cadena de conexión de PostgreSQL del proyecto.
3. En Vercel abre **Project → Settings → Environment Variables**.
4. Crea una variable llamada exactamente `DATABASE_URL` y pega la cadena de conexión.
5. Actívala para **Production** (y Preview si usas previews).
6. El siguiente deployment conectará Celler Roig automáticamente con Neon.

Celler Roig usa la tabla `celler_roig_wines`. La API `/api/wines` crea la tabla automáticamente y sincroniza altas, cambios, borrados y el orden manual.

La app mantiene además `localStorage` como copia local. Si Neon está vacío al conectarse por primera vez, la colección que ya hubiera en el móvil se copia a la nube.

## Búsqueda de vinos

La búsqueda visual sigue usando Serper mediante `SERPER_API_KEY` en Vercel. Al buscar se muestran primero fotos de botellas y se intentan completar los datos disponibles.

Variables de entorno usadas:

- `DATABASE_URL` — conexión a Neon.
- `SERPER_API_KEY` — búsqueda de vinos e imágenes.
