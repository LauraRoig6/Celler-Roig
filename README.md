# Celler Roig — V5

Aplicación móvil/PWA para la vinoteca personal de Pedro Roig.

## Despliegue en Vercel

1. Sube **el contenido de esta carpeta** a la raíz del repositorio de GitHub.
2. En Vercel importa el repositorio con preset **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.

## Activar búsqueda fiable de vinos

La V5 ya no usa Bing RSS ni Open Food Facts como buscador general. Usa **Serper (Google Search API)** desde una función del servidor para evitar resultados irrelevantes.

1. Crea una cuenta en https://serper.dev/ y copia tu API key.
2. En Vercel: **Project → Settings → Environment Variables**.
3. Crea `SERPER_API_KEY` y pega la clave como valor.
4. Actívala para Production (y Preview si quieres probar ramas).
5. Haz **Redeploy** del último deployment.

La clave queda solo en Vercel y nunca se envía al navegador ni se guarda en GitHub.

## Búsqueda de fotos

Cada búsqueda consulta también Google Images mediante Serper. Celler Roig muestra una galería de botellas. Al pulsar una foto, usa esa imagen y, cuando es posible, intenta además importar los datos desde la página de origen.

## Datos

Esta versión sigue guardando la colección en `localStorage` del dispositivo. Para uso definitivo conviene conectar Supabase en la siguiente fase.


## V5: búsqueda visual
La búsqueda de vinos ahora es image-first: al buscar se muestran primero fotos de botellas. Al tocar una imagen se aplica directamente la foto y los metadatos inferidos desde resultados de búsqueda, sin depender de que una tienda permita leer su página.
