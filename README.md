# Celler Roig V13

Aplicación móvil/PWA para la vinoteca personal de Pedro.

## Cambios principales de V13

- Sincronización móvil ↔ PC reforzada: Neon pasa a ser la fuente común y la app refresca desde la nube al abrir, volver a la pestaña y cada pocos segundos. Los borrados se propagan entre dispositivos.
- Tipos simplificados a Tinto, Blanco, Rosado y Espumoso; si la búsqueda no está segura, queda como “Sin indicar”.
- Se elimina “Dónde está guardado” y desaparece el aviso para instalar la PWA.
- Uvas, envejecimiento, clasificación oficial, denominación/appellation, región y país pasan a la ficha principal.
- “Más información” queda para precio, contexto de compra/prueba/descubrimiento, graduación, puntuación, recompra y notas.
- El campo cambia según el destino: “Dónde lo compré” (Vinoteca), “Dónde lo probé” (Probados) y “Dónde lo vi” (Por probar).
- “Mejor momento para beber” se sustituye por Maridaje. Primero se intenta obtener de las fichas de tiendas especializadas; si no aparece, se propone una sugerencia prudente según tipo, uva y envejecimiento.
- Se conserva “Abrir pronto” solo como marca manual.

## Variables de Vercel

- `DATABASE_URL` — Neon PostgreSQL.
- `SERPER_API_KEY` — búsquedas web e imágenes por texto.
- `SERPAPI_API_KEY` — búsqueda por foto/Google Lens.

No incluyas estas claves en GitHub.
