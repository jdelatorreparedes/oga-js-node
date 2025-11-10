# Migración de SQLite a PostgreSQL

Este proyecto ha sido migrado de SQLite a PostgreSQL.

## Requisitos Previos

1. **PostgreSQL instalado** en tu sistema
2. **Base de datos creada** en PostgreSQL

## Configuración

### 1. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE gestion_activos;
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y ajusta los valores según tu configuración:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de PostgreSQL:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_activos
DB_USER=postgres
DB_PASSWORD=tu_contraseña
```

### 3. Instalar dependencias

```bash
npm install
```

Esto instalará el paquete `pg` (node-postgres) y removerá `sqlite3`.

## Cambios Realizados

### Archivos Modificados

1. **server.js**: Migrado completamente a PostgreSQL
   - Cambio de `sqlite3` a `pg` (node-postgres)
   - Todas las consultas SQL adaptadas a PostgreSQL
   - Uso de parámetros `$1, $2, ...` en lugar de `?`
   - Uso de `RETURNING` para obtener IDs después de INSERT
   - Nombres de columnas con camelCase entrecomillados para PostgreSQL

2. **db.config.js**: Nuevo archivo de configuración de conexión PostgreSQL

3. **create-admin.js**: Migrado a PostgreSQL

4. **fix-admin.js**: Migrado a PostgreSQL

5. **verificar-usuario.js**: Migrado a PostgreSQL

6. **package.json**: Actualizado para usar `pg` en lugar de `sqlite3`

### Diferencias Principales SQLite vs PostgreSQL

- **AUTOINCREMENT** → **SERIAL**
- **INTEGER PRIMARY KEY AUTOINCREMENT** → **SERIAL PRIMARY KEY**
- **TEXT** → **VARCHAR(255)** o **TEXT**
- Parámetros: `?` → `$1, $2, $3...`
- `this.lastID` → `RETURNING id` + `result.rows[0].id`
- `db.serialize()` → Eliminado (no necesario en PostgreSQL)
- `db.all()` → `pool.query()` con `result.rows`
- `db.get()` → `pool.query()` con `result.rows[0]`
- `db.run()` → `pool.query()` con `result.rowCount`

## Inicialización

Al iniciar el servidor por primera vez, las tablas se crearán automáticamente:

- `tipos`
- `activos`
- `historico`
- `usuarios`

El usuario administrador por defecto se creará automáticamente:
- Usuario: `admin`
- Contraseña: `Orbita2025!`

## Scripts Útiles

- `node create-admin.js` - Crear usuario admin
- `node fix-admin.js` - Verificar y crear usuario admin si no existe
- `node verificar-usuario.js` - Verificar estado de la base de datos y usuario admin

## Notas Importantes

- El archivo `activos.db` (SQLite) ya no se utiliza
- Todas las consultas ahora usan el pool de conexiones de PostgreSQL
- Los nombres de columnas con camelCase deben estar entrecomillados en PostgreSQL (ej: `"tipoId"`)




