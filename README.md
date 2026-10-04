# Celler Roig — V3

App móvil/PWA para gestionar la vinoteca personal de Pedro.

## Qué incluye
- Vista de estantería con botellas
- Balda automática cada 3 vinos; se crean tantas como hagan falta
- Orden manual mediante arrastrar y soltar
- Orden automático por tipo, uva, añada, envejecimiento, DOP/IGP, denominación, puntuación y nombre
- Filtro DOP / IGP
- Mi bodega, favoritos y lista «Me gustaría probar»
- Stock de botellas y acción «He bebido una»
- Alta y edición de vinos con foto desde cámara/galería
- Búsqueda web de vinos desde la propia app
- Importación de una ficha de vino pegando su URL
- Autorrelleno de nombre, bodega, añada, tipo, uvas, envejecimiento, DOP/IGP, denominación, región, país, graduación, precio e imagen cuando la página publica esos datos
- PWA instalable en el móvil
- Guardado local en esta fase

## Búsqueda web V3
La búsqueda ya no depende únicamente de un catálogo genérico. Vercel usa funciones en `/api` para localizar páginas web y leer la ficha elegida. Si la búsqueda web no responde, hay un catálogo de respaldo.

También puedes pegar directamente la URL de la ficha del vino (por ejemplo, la web oficial de la bodega o una tienda) y pulsar **Importar ficha**.

## Desplegar en Vercel desde GitHub
1. Sube **el contenido de esta carpeta a la raíz del repositorio**.
2. Deben verse directamente `package.json`, `index.html`, `src/`, `public/`, `api/` y `vercel.json`.
3. En Vercel importa el repositorio.
4. Framework Preset: **Vite**.
5. Root Directory: vacío / `.`.
6. Build Command: `npm run build`.
7. Output Directory: `dist`.
8. Deploy.

No necesita ninguna variable de entorno para esta versión.

## Desarrollo local
```bash
npm install
npm run dev
```
