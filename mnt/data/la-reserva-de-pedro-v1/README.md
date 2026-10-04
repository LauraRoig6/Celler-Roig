# La Reserva de Pedro — V1

App móvil/PWA para registrar vinos, verlos en una estantería visual y gestionar la colección de forma sencilla.

## Incluye
- Diseño mobile-first en borgoña + blanco roto.
- Inicio con resumen.
- Vinoteca con vista estantería y lista.
- Orden automático por tipo, uva, añada, envejecimiento, DOP/IGP, denominación, puntuación o nombre.
- Orden manual arrastrando botellas en modo "Ordenar estantería".
- Filtros por tipo y DOP/IGP.
- Alta/edición de vino.
- Foto desde cámara/galería.
- Botón para buscar una imagen de botella en internet.
- Wishlist "Me gustaría probar".
- Favoritos, nota, stock, precio, bodega, uvas y notas.
- PWA instalable en pantalla de inicio.
- Persistencia local en el dispositivo (localStorage).

## Ejecutar
```bash
npm install
npm run dev
```

## Publicar en Vercel
1. Sube esta carpeta a GitHub.
2. En Vercel: New Project → importa el repositorio.
3. Framework: Vite (normalmente se detecta solo).
4. Build command: `npm run build`
5. Output directory: `dist`

## Próxima fase recomendada
Conectar Supabase para:
- guardar la colección en la nube;
- usar Supabase Storage para las imágenes;
- copia de seguridad al cambiar de móvil;
- login muy simple o acceso privado;
- historial de catas;
- exportación CSV/PDF;
- integración opcional con un servicio para quitar fondos automáticamente.
