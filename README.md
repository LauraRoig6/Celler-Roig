# Celler Roig v18

Vinoteca personal mobile-first de Pedro.

## Cambios principales

- **Buscador de vino más completo:** la foto y los datos ya no dependen de la misma tienda. Celler Roig busca resultados y después intenta completar la ficha combinando varias fuentes especializadas (especialmente Decántalo, Bodeboca, Vinissimus, Vinatis, Petit Celler, Vila Viniteca, Vivino, Wine-Searcher y Verema).
- **Lista de deseos independiente:** un vino puede estar en `Probados` y, a la vez, en `Lista de deseos` si Pedro quiere volver a comprarlo. En la ficha aparece un botón de marcador para añadirlo o quitarlo de deseos.
- **Sin zoom accidental:** se bloquea el zoom general de la interfaz para evitar pellizcos involuntarios en móvil.
- **Imagen ampliable:** al tocar la botella dentro de su ficha, la foto se abre a pantalla grande.
- **Fuentes de consulta:** se añaden Vila Viniteca y Verema a la pestaña `Lista de deseos → Consultar vinos`.
- Se mantiene el escáner de códigos ZXing compatible con iPhone/Safari y Android/Chrome.

## Variables de Vercel

No cambia ninguna variable:

- `DATABASE_URL`
- `SERPER_API_KEY`
- `SERPAPI_API_KEY` (solo para búsqueda por foto/Lens)

## Despliegue

Sube el contenido de este ZIP a la raíz del repositorio de GitHub. Vercel detectará el cambio y desplegará automáticamente.
