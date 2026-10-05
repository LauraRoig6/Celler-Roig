# Celler Roig · V17

Vinoteca personal mobile-first de Pedro.

## Novedades V17

- **Escáner de código de barras (EAN/UPC)** pensado para Android/Chrome. Al detectar el código, Celler Roig intenta resolver qué vino es y abre la misma búsqueda visual de fichas y botellas. Si el navegador no soporta el escáner, se puede escribir el código manualmente.
- **Confirmación inteligente antes de guardar** los vinos que se hayan autorrellenado: revisa Nombre, Añada, Tipo, Denominación y Uvas, y marca claramente lo que falte o sea dudoso.
- **Mejor gestión de imágenes**: las imágenes elegidas de Internet se descargan, redimensionan y comprimen antes de guardarse con la ficha. Cuando el fondo blanco de catálogo se puede eliminar con seguridad, se conserva transparencia; si no, se guarda una copia WebP ligera. Así dependemos menos de URLs externas.
- **Mejor rendimiento y sincronización**: móvil y PC consultan cada 15 s solo una marca ligera de cambios en Neon. La colección completa (incluidas imágenes) solo se descarga cuando realmente ha cambiado. Las imágenes usan carga diferida.
- El Service Worker ya **no cachea las APIs**, evitando respuestas antiguas de sincronización.
- `Por probar → Consultar vinos` añade **Wine-Searcher, Decanter, Decántalo y Vinissimus** a Vivino, Bodeboca, Guía Peñín, Petit Celler, CellarTracker y Vinatis.
- La búsqueda interna también considera Wine-Searcher, Decanter, Guía Peñín y CellarTracker como fuentes relevantes además de las vinotecas ya priorizadas.

## Variables de entorno en Vercel

- `DATABASE_URL` → Neon PostgreSQL.
- `SERPER_API_KEY` → búsqueda escrita / por código de botellas y fichas.
- `SERPAPI_API_KEY` → búsqueda por foto con Google Lens (opcional si se mantiene esa vía).

## Desarrollo

```bash
npm install
npm run build
```

El proyecto usa Vite + React + TypeScript y está preparado para desplegarse en Vercel.

## V17.2 · escáner universal
El lector de códigos ya no depende de `BarcodeDetector`. Usa `@zxing/browser` para leer EAN/UPC directamente desde la cámara en navegadores móviles modernos (incluidos Safari en iPhone y Chrome en Android) y ofrece además lectura desde una foto y entrada manual como alternativas.
