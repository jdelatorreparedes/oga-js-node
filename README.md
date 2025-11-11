# OGA - ÓRBITA GESTIÓN DE ACTIVOS

Sistema web completo desarrollado en Angular 17 con backend Node.js/Express y PostgreSQL para la gestión integral de activos empresariales. Diseñado con identidad corporativa de Órbita Ingeniería.

## 🎯 Características Principales

### Gestión de Activos
- **Tipos de Activos**: CRUD completo con codificación automática y validación de formato
- **Activos**: Gestión completa con estados (Disponible, Asignado, Baja)
  - Registro automático de fecha de alta
  - Asignación y devolución de activos
  - Baja de activos con motivo
  - Generación automática de códigos según codificación del tipo
- **Histórico**: Visualización completa del historial de asignaciones y devoluciones
- **Importación/Exportación Excel**: Soporte completo para archivos XLSX

### Sistema de Usuarios y Autenticación
- **Autenticación JWT**: Sistema seguro de autenticación con tokens
- **Gestión de Roles**: Administrador y Usuario con permisos diferenciados
- **Cambio de Contraseña Obligatorio**: Los usuarios deben cambiar su contraseña por defecto en el primer acceso
- **Importación/Exportación de Usuarios**: Gestión masiva de usuarios en formato Excel

### Diseño Corporativo
- **Identidad Visual**: Colores corporativos PANTONE (426C, 165C, Black 6C, White)
- **Tipografía**: Montserrat Bold para títulos, Montserrat Medium para texto
- **Logo Corporativo**: Logo OGA con identidad de Órbita Ingeniería
- **Responsive Design**: Diseño adaptativo con Angular Material
- **Animaciones Sutiles**: Transiciones y efectos hover para mejor UX

## 📋 Requisitos

- **Node.js**: Versión 18 o superior
- **PostgreSQL**: Versión 12 o superior
- **npm** o **yarn**

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd oga-js-node
```

### 2. Configurar Base de Datos PostgreSQL

1. Crear una base de datos PostgreSQL:
```sql
CREATE DATABASE gestion_activos;
```

2. Configurar las variables de entorno en `server/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_activos
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_secret_key_segura
JWT_EXPIRES_IN=24h
```

### 3. Instalar Dependencias del Backend

```bash
cd server
npm install
```

### 4. Instalar Dependencias del Frontend

```bash
# Desde la raíz del proyecto
npm install
```

### 5. Iniciar la Aplicación

**Terminal 1 - Backend:**
```bash
cd server
npm start
# O en modo desarrollo:
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm start
```

El backend estará disponible en `http://localhost:3000`  
El frontend estará disponible en `http://localhost:4200`

## 📁 Estructura del Proyecto

```
.
├── server/                      # Backend Node.js/Express
│   ├── server.js               # Servidor principal con API REST
│   ├── db.config.js            # Configuración de PostgreSQL
│   ├── logger.js               # Sistema de logging
│   ├── middleware/             # Middleware de autenticación
│   ├── swagger.config.js       # Configuración Swagger/OpenAPI
│   └── package.json
├── src/                        # Frontend Angular
│   ├── app/
│   │   ├── core/               # Servicios core (Auth, API, Guards)
│   │   ├── shared/             # Componentes compartidos
│   │   │   ├── components/     # Sidebar, Topbar, Dialogs
│   │   │   └── services/       # Snackbar, Excel, etc.
│   │   ├── features/           # Módulos de funcionalidades
│   │   │   ├── login/          # Autenticación
│   │   │   ├── dashboard/      # Panel principal
│   │   │   ├── tipos/          # Gestión de tipos de activos
│   │   │   ├── activos/        # Gestión de activos
│   │   │   ├── historico/      # Historial de asignaciones
│   │   │   └── usuarios/       # Gestión de usuarios
│   │   ├── models/             # Modelos de datos TypeScript
│   │   └── utils/              # Utilidades
│   ├── styles.scss             # Estilos globales corporativos
│   └── assets/                 # Recursos estáticos
├── docs/                       # Documentación generada
│   ├── backend/                # JSDoc del backend
│   └── frontend/               # TypeDoc del frontend
├── package.json                # Dependencias del frontend
└── README.md                   # Este archivo
```

## ⚙️ Configuración

### URL del Backend

La URL del servidor backend se configura en `src/app/core/services/api.service.ts`. Por defecto está configurada para `http://localhost:3000/api`.

### Variables de Entorno del Backend

Crear archivo `server/.env`:
```env
# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_activos
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu_secret_key_muy_segura_cambiar_en_produccion
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
NODE_ENV=development
```

## 🎨 Funcionalidades Detalladas

### Tipos de Activos
- ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
- ✅ Codificación automática para generación de códigos
- ✅ Exportar a Excel (XLSX)
- ✅ Importar desde Excel (XLSX)
- ✅ Atajo de teclado: `Shift + A` para añadir

### Activos
- ✅ CRUD completo
- ✅ **Campos obligatorios**: Solo Tipo de Activo y Código
- ✅ **Fecha de Alta**: Se registra automáticamente al crear el activo
- ✅ Generación automática de códigos según codificación del tipo
- ✅ Validación de formato de códigos (codificación + 4 dígitos)
- ✅ Estados: Disponible, Asignado, Baja
- ✅ Asignación de activos a personas con fecha de devolución prevista
- ✅ Devolución de activos asignados
- ✅ Baja de activos con motivo obligatorio
- ✅ Mostrar/ocultar activos dados de baja
- ✅ Exportar a Excel (XLSX)
- ✅ Importar desde Excel (XLSX)
- ✅ Búsqueda y filtrado avanzado

### Histórico
- ✅ Visualización completa del historial de asignaciones
- ✅ Filtrado por activo
- ✅ Exportar histórico a Excel (XLSX)

### Usuarios
- ✅ Gestión completa de usuarios (CRUD)
- ✅ Roles: Administrador, Usuario
- ✅ Activación/Desactivación de usuarios
- ✅ Cambio de contraseña
- ✅ **Cambio obligatorio de contraseña por defecto** en primer login
- ✅ Exportar usuarios a Excel (sin contraseñas)
- ✅ Importar usuarios desde Excel (contraseña por defecto: "orbita")

### Autenticación
- ✅ Login con JWT
- ✅ Protección de rutas con Guards
- ✅ Detección de contraseña por defecto
- ✅ Diálogo obligatorio de cambio de contraseña en primer login
- ✅ Logout seguro

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión (frontend)

### Tipos de Activos
- `GET /api/tipos` - Obtener todos los tipos
- `POST /api/tipos` - Crear nuevo tipo
- `PUT /api/tipos/:id` - Actualizar tipo
- `DELETE /api/tipos/:id` - Eliminar tipo
- `GET /api/tipos/:id/siguiente-codigo` - Obtener siguiente código disponible

### Activos
- `GET /api/activos?mostrarBajas=true/false` - Obtener todos los activos
- `GET /api/activos/:id` - Obtener un activo
- `POST /api/activos` - Crear nuevo activo
- `PUT /api/activos/:id` - Actualizar activo
- `DELETE /api/activos/:id` - Eliminar activo
- `POST /api/activos/:id/asignar` - Asignar activo
- `POST /api/activos/:id/devolver` - Devolver activo
- `POST /api/activos/:id/baja` - Dar de baja activo
- `GET /api/activos/areas` - Obtener áreas disponibles

### Histórico
- `GET /api/historico` - Obtener todo el histórico
- `GET /api/historico/activo/:id` - Obtener histórico de un activo

### Usuarios
- `GET /api/usuarios` - Obtener todos los usuarios (requiere Admin)
- `POST /api/usuarios` - Crear nuevo usuario (requiere Admin)
- `PUT /api/usuarios/:id` - Actualizar usuario (requiere Admin)
- `DELETE /api/usuarios/:id` - Eliminar usuario (requiere Admin)
- `POST /api/usuarios/:id/change-password` - Cambiar contraseña

### Áreas
- `GET /api/areas` - Obtener todas las áreas

## 🎨 Identidad Corporativa

### Colores PANTONE
- **PANTONE 426C**: Gris oscuro (color principal)
- **PANTONE 165C**: Naranja (color de acento)
- **PANTONE Black 6C**: Negro
- **PANTONE 000 C WHITE**: Blanco

### Tipografía
- **Montserrat Bold**: Títulos principales
- **Montserrat Medium**: Texto general y subtítulos
- **Oswald Medium**: Alternativa para claims (no disponible, se usa Montserrat)

## ⌨️ Atajos de Teclado

- `Shift + A`: Añadir nuevo elemento (en pantallas de gestión)
- `Enter`: Guardar en formularios
- `Escape`: Cancelar operación o cerrar diálogos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular 17**: Framework principal
- **Angular Material**: Componentes UI
- **TypeScript**: Lenguaje de programación
- **SCSS**: Estilos con variables y mixins
- **RxJS**: Programación reactiva
- **XLSX**: Importación/Exportación Excel

### Backend
- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **PostgreSQL**: Base de datos relacional
- **JWT**: Autenticación con tokens
- **bcryptjs**: Hash de contraseñas
- **Swagger/OpenAPI**: Documentación de API
- **Winston**: Sistema de logging

## 📚 Documentación

### Documentación de Código
- **Backend**: JSDoc disponible en `docs/backend/`
- **Frontend**: TypeDoc disponible en `docs/frontend/`

### Generar Documentación

```bash
# Backend (JSDoc)
cd server
npm run docs

# Frontend (TypeDoc)
npm run docs
```

### Documentación de API
La documentación interactiva de la API está disponible en:
- `http://localhost:3000/api-docs` (cuando el servidor está corriendo)

## 🔒 Seguridad

- ✅ Autenticación JWT con tokens seguros
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Protección de rutas con Guards
- ✅ Validación de roles y permisos
- ✅ Cambio obligatorio de contraseña por defecto
- ✅ CORS configurado
- ✅ Validación de datos en frontend y backend

## 📝 Notas Importantes

- **Base de Datos**: PostgreSQL (no SQLite). La base de datos se inicializa automáticamente al iniciar el servidor por primera vez.
- **Usuario por Defecto**: Se crea automáticamente un usuario administrador si no existe ninguno:
  - Usuario: `admin`
  - Contraseña: `Orbita2025!`
- **Contraseña por Defecto**: Los usuarios importados tienen la contraseña `orbita` y deben cambiarla en el primer login.
- **Producción**: Para producción, considera:
  - Usar variables de entorno seguras
  - Configurar HTTPS
  - Usar un servidor de base de datos dedicado
  - Implementar backups regulares

## 🐛 Solución de Problemas

### Error de Conexión a la Base de Datos
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `server/.env`
- Verifica que la base de datos exista

### Error de CORS
- El servidor tiene CORS habilitado por defecto
- Verifica que el backend esté corriendo en el puerto 3000

### El frontend no encuentra el backend
- Verifica que la URL en `api.service.ts` sea correcta
- Verifica que el backend esté corriendo

### Error al importar Excel
- Verifica que el archivo sea formato XLSX o XLS
- Verifica que las columnas coincidan con el formato esperado

## 📄 Licencia

Este proyecto es propiedad de ÓRBITA GESTIÓN DE ACTIVOS.

## 👥 Versión

**v10.0.0** - Sistema completo de gestión de activos con autenticación, roles, Excel y diseño corporativo.

---

Desarrollado con ❤️ por Órbita Ingeniería
