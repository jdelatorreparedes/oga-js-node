# Inicio Rápido - OGA ÓRBITA GESTIÓN DE ACTIVOS

## Versión: 10.0.0

## Pasos para ejecutar la aplicación

### Prerrequisitos
- Node.js 18+ instalado
- PostgreSQL 12+ instalado y corriendo
- Base de datos creada

### 1. Configurar Base de Datos PostgreSQL

1. Crear la base de datos:
```sql
CREATE DATABASE gestion_activos;
```

2. Crear archivo `server/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_activos
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_secret_key_segura
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### 2. Instalar dependencias del servidor

```bash
cd server
npm install
```

### 3. Iniciar el servidor backend

```bash
# Desde la carpeta server/
npm start
```

El servidor estará corriendo en `http://localhost:3000`

### 4. Instalar dependencias del frontend

Abre una nueva terminal y desde la raíz del proyecto:

```bash
npm install
```

### 5. Iniciar el frontend Angular

```bash
npm start
```

El frontend estará disponible en `http://localhost:4200`

## Verificar que todo funciona

1. Abre tu navegador en `http://localhost:4200`
2. Deberías ver la pantalla de login
3. Usa las credenciales por defecto:
   - Usuario: `admin`
   - Contraseña: `Orbita2025!`
4. Si es el primer login, deberás cambiar la contraseña
5. Navega por las secciones: Dashboard, Tipos, Activos, Histórico, Usuarios
6. Intenta crear un tipo de activo y luego un activo
7. Verifica que los datos se guarden correctamente

## Solución de problemas

### Error: "Cannot GET /api/tipos"
- Asegúrate de que el servidor backend esté corriendo
- Verifica que el servidor esté en el puerto 3000

### Error de CORS
- El servidor ya tiene CORS habilitado, pero si tienes problemas, verifica que el servidor esté corriendo

### La base de datos no se crea
- La base de datos PostgreSQL debe crearse manualmente antes de iniciar el servidor
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `server/.env`
- El servidor creará las tablas automáticamente al iniciar por primera vez

## Notas importantes

- **Siempre inicia el servidor backend antes que el frontend**
- Los datos se almacenan en PostgreSQL (configurado en `server/.env`)
- Todos los usuarios comparten la misma base de datos cuando acceden al mismo servidor
- El usuario administrador por defecto se crea automáticamente si no existe ninguno
- Los usuarios importados tienen la contraseña por defecto `orbita` y deben cambiarla en el primer login

