# Celler Roig v20

PWA móvil para la vinoteca de Pedro.

## V20

- Alta con IA mediante 3 fotos: etiqueta delantera, etiqueta trasera y botella entera.
- `OPENAI_API_KEY` analiza las etiquetas y completa la ficha.
- `SERPER_API_KEY` enriquece los huecos con fuentes de vino y compara precios online.
- El precio se guarda como media online cuando hay coincidencias suficientes, con rango y número de tiendas.
- El maridaje solo aparece cuando ya hay tipo + uva; prioriza información web y, si falta, genera una sugerencia prudente.
- Barreras adicionales para evitar que tintos terminen clasificados como espumosos por texto irrelevante de tiendas.
- Foto de botella: la IA intenta quitar manos, apoyo y fondo, corregir luz y dejar una imagen de producto transparente. Si falla, se usa una imagen de catálogo encontrada para el vino exacto.
- Los datos personales (dónde lo compraste/probaste/viste, puntuación, notas, regalo, volver a comprar) siguen siendo manuales.

Variables de entorno: `DATABASE_URL`, `SERPER_API_KEY`, `SERPAPI_API_KEY` (para Lens/compatibilidad antigua) y `OPENAI_API_KEY`.
