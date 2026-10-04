# Celler Roig — V1

App móvil/PWA para gestionar la vinoteca personal de Pedro.

## Qué incluye
- Vista de estantería con botellas
- Orden manual mediante arrastrar y soltar
- Orden automático por tipo, uva, añada, envejecimiento, DOP/IGP, denominación, puntuación y nombre
- Filtro DOP / IGP
- Mi bodega, favoritos y lista «Me gustaría probar»
- Stock de botellas y acción «He bebido una»
- Alta y edición de vinos con foto desde cámara/galería
- PWA instalable en el móvil
- Guardado local en esta primera versión

## Desplegar en Vercel desde GitHub
1. Crea un repositorio nuevo en GitHub.
2. Sube **el contenido de esta carpeta a la raíz del repositorio**. `package.json`, `index.html`, `src/`, `public/` y `vercel.json` deben verse directamente al abrir el repositorio.
3. En Vercel, pulsa **Add New > Project** e importa ese repositorio.
4. Framework Preset: **Vite**.
5. Root Directory: déjalo vacío / `.`.
6. Build Command: `npm run build`.
7. Output Directory: `dist`.
8. Pulsa **Deploy**.

> Importante: no subas una carpeta contenedora tipo `mnt/data/celler-roig-v1/` dentro del repositorio. Los archivos del proyecto deben estar en la raíz.

## Desarrollo local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
