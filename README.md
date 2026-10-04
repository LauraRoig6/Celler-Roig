# Celler Roig V12

Aplicación móvil/PWA para la vinoteca personal de Pedro.

## Cambios principales de V12

- La foto ya no depende de que Google Lens encuentre una coincidencia visual exacta.
- Se sube la foto a la Image API de SerpApi y Lens intenta extraer el texto de la etiqueta.
- Si reconoce nombre/gama/añada, ese texto se usa automáticamente para buscar la ficha y las fotos en fuentes especializadas.
- Las búsquedas escritas priorizan Bodeboca, Vivino, Petit Celler, Vinoselección, Vinatis, Decántalo, Vinissimus, Lavinia, Millesima e iDealwine.
- Al elegir una foto de una ficha real, Celler Roig intenta importar también los datos de esa página.
- Las fotos con fondo blanco se integran visualmente en la estantería mediante `mix-blend-mode: multiply`; no se promete un recorte falso cuando el fondo no puede eliminarse de forma fiable.
- Se ha aumentado la resolución/calidad de la foto enviada a Lens (siempre por debajo del límite de 500 KB).

## Variables de Vercel

- `DATABASE_URL` — Neon PostgreSQL.
- `SERPER_API_KEY` — búsquedas web e imágenes por texto.
- `SERPAPI_API_KEY` — búsqueda por foto/Google Lens.

No incluyas estas claves en GitHub.
