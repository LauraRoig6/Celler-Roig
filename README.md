# Celler Roig · V11

Vinoteca móvil personal para Pedro, desplegada con Vercel y Neon.

## Variables de entorno en Vercel

- `DATABASE_URL`: conexión PostgreSQL de Neon.
- `SERPER_API_KEY`: búsqueda escrita y de imágenes, priorizando tiendas/vinotecas especializadas.
- `SERPAPI_API_KEY`: reconocimiento por foto mediante Google Lens (SerpApi).

## Qué cambia en V11

- La cámara ya no intenta hacer OCR local ni eliminar el fondo de una foto doméstica.
- La foto funciona como **escáner visual**: se envía a Google Lens y se muestran coincidencias de botellas.
- La búsqueda escrita prioriza Bodeboca, Vivino, Petit Celler, Vinoselección, Vinatis, Decántalo, Vinissimus, Lavinia, Millesima e iDealwine.
- Al elegir una botella, se busca la ficha técnica en esas fuentes y se intenta completar añada, tipo, uva, envejecimiento, denominación/appellation, país, graduación y ventana de consumo.
- La imagen final se toma del catálogo online. Si tiene fondo blanco, Celler Roig intenta quitar sólo el blanco exterior; en la estantería se aplica además una integración visual para evitar rectángulos blancos.
- Se han eliminado Tesseract, ONNX y el modelo local de eliminación de fondo, por lo que el build y el móvil Android son mucho más ligeros.

## Google Lens

SerpApi permite subir una imagen temporal y usarla con Google Lens. La foto se comprime en el móvil antes de enviarse. `SERPAPI_API_KEY` debe guardarse sólo en Vercel, nunca en GitHub.
