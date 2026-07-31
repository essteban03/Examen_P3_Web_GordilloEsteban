# Proyecto B: Gestión de personajes y misiones

## Propósito
Frontend completo para la evaluación final de Fundamentos Web. La lógica debe implementarse únicamente en `js/app.js`.

## Archivos JSON
- `data/personajes.json`: 30 personajes y entidad principal del CRUD.
- `data/especies.json`: 8 especies relacionadas mediante `especieId`.
- `data/misiones.json`: 30 misiones relacionadas mediante `personajeId`.

## Funcionalidades evaluadas
- Carga de JSON local mediante `fetch`.
- Persistencia con `localStorage`.
- Renderizado dinámico mediante DOM.
- Formulario con creación y edición.
- `push()`, `find()`, `findIndex()`, `filter()`, `map()`, `reduce()`, `sort()` y `some()`.
- Búsqueda en tiempo real, dos filtros y ordenamiento.
- Eliminación confirmada, JSON individual/general y restauración.
- Ocho cálculos y gráfico con Chart.js.
- Consulta de personajes externos con imágenes.
- Segunda consulta externa por ID.
- Transformación de un personaje externo al modelo local.
- Manejo de errores y loader.

## API externa
Rick and Morty API:
- Búsqueda: `https://rickandmortyapi.com/api/character/?name=rick`
- Detalle: `https://rickandmortyapi.com/api/character/1`

La búsqueda devuelve un objeto con el arreglo `results`. Cada resultado incluye directamente `id`, `name`, `status`, `species`, `gender`, `origin` e `image`.

## Ejecución
Debe utilizar Live Server o un servidor local:

```bash
python -m http.server 8000
```

Luego abra `http://localhost:8000`.

## Regla de edición
Se permite modificar únicamente `js/app.js`. No se deben escribir personajes manualmente en `index.html`.
