# Inicio Rápido - Gestión de Activos

## Pasos para ejecutar la aplicación

### 1. Instalar dependencias del servidor

```bash
cd server
npm install
```

### 2. Iniciar el servidor backend

```bash
# Desde la carpeta server/
npm start
```

El servidor estará corriendo en `http://localhost:3000`

### 3. Instalar dependencias del frontend

Abre una nueva terminal y desde la raíz del proyecto:

```bash
npm install
```

### 4. Iniciar el frontend Angular

```bash
npm start
```

El frontend estará disponible en `http://localhost:4200`

## Verificar que todo funciona

1. Abre tu navegador en `http://localhost:4200`
2. Deberías ver la página de "Tipos"
3. Intenta crear un tipo de activo
4. Ve a la sección "Activos" y crea un activo
5. Verifica que los datos se guarden correctamente

## Solución de problemas

### Error: "Cannot GET /api/tipos"
- Asegúrate de que el servidor backend esté corriendo
- Verifica que el servidor esté en el puerto 3000

### Error de CORS
- El servidor ya tiene CORS habilitado, pero si tienes problemas, verifica que el servidor esté corriendo

### La base de datos no se crea
- La base de datos SQLite se crea automáticamente al iniciar el servidor por primera vez
- Verifica que tengas permisos de escritura en la carpeta `server/`

## Notas importantes

- **Siempre inicia el servidor backend antes que el frontend**
- Los datos se almacenan en `server/activos.db` (archivo SQLite)
- Todos los usuarios comparten la misma base de datos cuando acceden al mismo servidor

