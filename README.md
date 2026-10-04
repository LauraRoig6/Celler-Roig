# Celler Roig · V7

Aplicación móvil/PWA para la colección de vinos de Pedro Roig.

## Novedades de V7

- Navegación principal: **Vinoteca**, **Probados** y **Por probar**.
- Un mismo vino puede seguir en Vinoteca y aparecer también en Probados.
- Botellas regaladas: marca de regalo, quién la regaló y fecha.
- Ficha internacional: país, región, **Denominación / Appellation** y clasificación libre (AOC, DOCG, AVA, etc.).
- Envejecimiento internacional con opción **Otro** y texto libre.
- Ubicación física de la botella en casa.
- Detección de duplicados.
- Acción **He bebido una** con botón **Deshacer**.
- Historial de catas y registro de nuevas catas.
- Dictado de notas cuando el navegador lo permite.
- Buscador global desde Inicio.
- “¿Qué abrimos hoy?” con sugerencias según ocasión.
- Exportación CSV.
- Flujo **Añadir con foto**: prepara la imagen, intenta hacer transparente un fondo claro y, en navegadores compatibles, intenta leer texto/código de la etiqueta para lanzar la búsqueda.
- Al elegir una botella de Internet, Celler Roig intenta limpiar el fondo antes de guardarla.
- Búsqueda internacional mejorada: Francia, Italia, Portugal, EE. UU., Argentina, Chile, Alemania, Australia, Nueva Zelanda, etc.

## Variables de entorno en Vercel

### `DATABASE_URL`
Connection string de Neon PostgreSQL. Guarda la colección en la nube.

### `SERPER_API_KEY`
Clave de Serper para buscar botellas e información en Internet.

## Despliegue

Framework: `Vite`

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

## Nota sobre “Añadir con foto”

Sin contratar un servicio externo de visión artificial, la identificación solo puede aprovechar las capacidades disponibles en el navegador (lectura de texto/códigos cuando existen). La limpieza automática de fondo incluida en V7 funciona especialmente bien con fotos de producto sobre fondo blanco o muy claro; no sustituye todavía a un recorte de IA para fondos complejos.
