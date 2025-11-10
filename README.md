# Sistema de Gestión de Activos

Aplicación web desarrollada en Angular con backend Node.js/Express para la gestión de activos empresariales con almacenamiento compartido en servidor.

## Características

- **Tipos de Activos**: Gestión completa de tipos de activos con CRUD, importación y exportación CSV
- **Activos**: Gestión de activos con estados (Disponible, Asignado, Baja), asignaciones y devoluciones
- **Histórico**: Visualización del historial completo de asignaciones y devoluciones
- **Almacenamiento en Servidor**: Todos los datos se almacenan en SQLite en el servidor, permitiendo que todos los usuarios vean los mismos datos
- **Atajos de Teclado**: 
  - `Shift + A`: Añadir nuevo elemento
  - `Enter`: Guardar en formularios
  - `Escape`: Cancelar operación

## Requisitos

- Node.js (versión 18 o superior)
- npm o yarn

## Instalación

### Backend (Servidor)

1. Navegar a la carpeta del servidor:
```bash
cd server
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor:
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

### Frontend (Angular)

1. En la raíz del proyecto, instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
npm start
```

3. Abrir el navegador en `http://localhost:4200`

**Importante**: Asegúrate de que el servidor backend esté corriendo antes de iniciar el frontend.

## Estructura del Proyecto

```
.
├── server/                 # Backend Node.js/Express
│   ├── server.js          # Servidor principal
│   ├── package.json
│   └── activos.db         # Base de datos SQLite (se crea automáticamente)
├── src/                   # Frontend Angular
│   ├── app/
│   │   ├── components/
│   │   │   ├── tipos/     # Componente de tipos de activos
│   │   │   ├── activos/   # Componente de activos
│   │   │   └── historico/ # Componente de histórico
│   │   ├── models/        # Modelos de datos
│   │   ├── services/      # Servicios (HTTP, CSV, Activos)
│   │   ├── config/        # Configuración (URL API)
│   │   └── app.module.ts  # Módulo principal
│   └── styles.css         # Estilos globales
└── package.json           # Dependencias del frontend
```

## Configuración

La URL del servidor backend se configura en `src/app/config/api.config.ts`. Por defecto está configurada para `http://localhost:3000/api`.

Si necesitas cambiar la URL del servidor, edita el archivo:

```typescript
export const API_CONFIG = {
  baseUrl: 'http://tu-servidor:3000/api'
};
```

## Funcionalidades por Sección

### Tipos
- Añadir, editar y eliminar tipos de activos
- Exportar e importar CSV
- Atajo de teclado: Shift + A para añadir

### Activos
- Añadir activos con todos sus campos
- Estados: Disponible, Asignado, Baja
- Asignar activos a personas
- Devolver activos asignados
- Dar de baja activos (con motivo)
- Editar y eliminar activos
- Mostrar/ocultar activos dados de baja
- Exportar e importar CSV

### Histórico
- Visualizar todos los activos con historial
- Ver detalle de asignaciones y devoluciones por activo
- Exportar histórico a CSV

## API Endpoints

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

## Tecnologías Utilizadas

### Frontend
- Angular 17
- TypeScript
- CSS3

### Backend
- Node.js
- Express
- SQLite3

## Notas

- Los datos se almacenan en SQLite en el servidor
- Todos los usuarios comparten la misma base de datos
- La base de datos se crea automáticamente al iniciar el servidor por primera vez
- Para producción, considera usar PostgreSQL o MySQL en lugar de SQLite
