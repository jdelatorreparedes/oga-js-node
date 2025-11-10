# Documentación del Sistema de Gestión de Activos

Este directorio contiene la documentación generada automáticamente del código fuente.

## Estructura

- `frontend/` - Documentación del frontend (Angular/TypeScript) generada con TypeDoc
- `backend/` - Documentación del backend (Node.js/Express) generada con JSDoc

## Generar Documentación

### Frontend (TypeScript)

```bash
npm run docs
```

Esto generará la documentación HTML en `docs/frontend/`.

Para previsualizar la documentación:

```bash
npm run docs:serve
```

### Backend (JavaScript)

Desde la carpeta `server/`:

```bash
npm run docs
```

Esto generará la documentación HTML en `docs/backend/`.

Para previsualizar la documentación:

```bash
npm run docs:serve
```

## Ver Documentación

Una vez generada, puedes abrir los archivos HTML en tu navegador:

- Frontend: `docs/frontend/index.html`
- Backend: `docs/backend/index.html`

## Actualizar Documentación

Cada vez que modifiques el código y añadas o cambies comentarios de documentación,
ejecuta los comandos de generación para actualizar la documentación HTML.

