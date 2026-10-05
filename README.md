# Celler Roig · V15

Vinoteca personal mobile-first de Pedro.

## Novedades V15

- **¿Qué abrimos hoy?** ahora acepta el nombre de un plato (por ejemplo, `paella mixta` o `cordero al horno con patatas panadera`) y compara ese plato con los maridajes de las botellas disponibles en la Vinoteca. El botón ✨ mantiene el modo **Sorpréndeme**.
- Cabeceras **fijas (sticky)** para que la navegación se sienta más como una app móvil:
  - Inicio: logo + buscador.
  - Vinoteca: cabecera, buscador, filtros, orden y título `Mi estantería`.
  - Probados: cabecera + buscador.
  - Por probar: cabecera + texto explicativo.
- En `Mi orden`, el modo para reorganizar la estantería se activa con el icono de puntos/agarre junto al selector. El icono desaparece con los demás criterios de ordenación.
- La Vinoteca ya no muestra el número de baldas; solo el total de botellas.
- Branding: `CELLER ROIG` en una sola línea y subtítulo `La vinoteca de Pedro`.
- Nueva colección demo de **5 vinos ficticios con fichas completas**:
  - 3 en Vinoteca (uno regalado, uno pendiente de probar y uno probado),
  - 1 solo en Probados,
  - 1 en Por probar.
- V15 elimina los vinos de ejemplo antiguos y los sustituye por los nuevos, conservando cualquier vino real añadido por el usuario.

## Variables de entorno en Vercel

- `DATABASE_URL` → Neon PostgreSQL.
- `SERPER_API_KEY` → búsqueda escrita de botellas/fichas.
- `SERPAPI_API_KEY` → búsqueda por foto con Google Lens, si se sigue utilizando.

## Desarrollo

```bash
npm install
npm run build
```

El proyecto usa Vite + React + TypeScript y está preparado para desplegarse en Vercel.
