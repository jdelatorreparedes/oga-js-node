# Servidor Backend - Gestión de Activos

Servidor Express con SQLite para la gestión de activos.

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Endpoints API

### Tipos
- `GET /api/tipos` - Obtener todos los tipos
- `POST /api/tipos` - Crear nuevo tipo
- `PUT /api/tipos/:id` - Actualizar tipo
- `DELETE /api/tipos/:id` - Eliminar tipo

### Activos
- `GET /api/activos?mostrarBajas=true/false` - Obtener todos los activos
- `GET /api/activos/:id` - Obtener un activo
- `POST /api/activos` - Crear nuevo activo
- `PUT /api/activos/:id` - Actualizar activo
- `DELETE /api/activos/:id` - Eliminar activo
- `POST /api/activos/:id/asignar` - Asignar activo
- `POST /api/activos/:id/devolver` - Devolver activo
- `POST /api/activos/:id/baja` - Dar de baja activo

### Histórico
- `GET /api/historico` - Obtener todo el histórico
- `GET /api/historico/activo/:id` - Obtener histórico de un activo

