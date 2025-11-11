# Guía de Despliegue - OGA ÓRBITA GESTIÓN DE ACTIVOS

## Configuración para Acceso desde Otros Ordenadores

### Versión: 10.0.0

Esta guía explica cómo desplegar la aplicación para que sea accesible desde otros ordenadores en la red local o desde internet.

### Paso 1: Compilar el Frontend

Desde la raíz del proyecto:

```bash
npm run build
```

Esto generará los archivos compilados en `dist/gestion-activos/`

### Paso 2: Configurar el Firewall

**Windows (PowerShell como Administrador):**

```powershell
# Permitir puerto del backend (3000)
New-NetFirewallRule -DisplayName "Gestión Activos Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Permitir puerto del frontend en desarrollo (4200)
New-NetFirewallRule -DisplayName "Gestión Activos Frontend" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow
```

O manualmente:
1. Abrir "Windows Defender Firewall con seguridad avanzada"
2. Reglas de entrada → Nueva regla
3. Tipo: Puerto → TCP → Puerto específico: 3000 (y luego 4200)
4. Acción: Permitir la conexión
5. Aplicar a todos los perfiles

### Paso 3: Iniciar el Servidor en Modo Producción

**Nota:** La aplicación está configurada para usar la IP fija `192.168.1.133`. Si necesitas cambiarla, edita:
- `server/server.js` (línea con `FIXED_IP`)
- `src/app/core/services/api.service.ts` (URL de la API)

**Importante:** Asegúrate de tener PostgreSQL configurado y las variables de entorno en `server/.env` antes de desplegar.

**Opción A - Usando npm (requiere cross-env):**

```bash
cd server
npm install  # Para instalar cross-env si no está instalado
npm run start:prod
```

**Opción B - Usando el script .bat (Windows):**

```bash
cd server
start-prod.bat
```

**Opción C - Manualmente:**

```bash
cd server
set NODE_ENV=production
node server.js
```

### Paso 4: Acceder a la Aplicación

**Modo Desarrollo (Frontend en puerto 4200, Backend en puerto 3000):**
- **Desde el mismo ordenador:** `http://localhost:4200`
- **Desde otros ordenadores en la red:** `http://192.168.1.133:4200`

**Modo Producción (Todo en puerto 3000):**
- **Desde el mismo ordenador:** `http://localhost:3000`
- **Desde otros ordenadores en la red:** `http://192.168.1.133:3000`

## Configuración Avanzada

### Cambiar la IP del Servidor

Si necesitas cambiar la IP fija, edita dos archivos:

1. **`server/server.js`** - Cambia la constante `FIXED_IP`:
```javascript
const FIXED_IP = 'TU_NUEVA_IP';
```

2. **`src/app/core/services/api.service.ts`** - Cambia la URL de la API:
```typescript
private apiUrl = 'http://TU_NUEVA_IP:3000/api';
```

Luego recompila el frontend:
```bash
npm run build
```

### Usar un Dominio o IP Pública

Si tienes un dominio o IP pública, puedes configurarlo en `environment.prod.ts`:

```typescript
apiUrl: 'https://tu-dominio.com/api'
```

## Solución de Problemas

### No puedo acceder desde otro ordenador

1. Verifica que el firewall permite el puerto 3000
2. Verifica que ambos ordenadores están en la misma red
3. Verifica que el servidor muestra "Accesible desde la red en: http://..."
4. Prueba acceder desde el mismo ordenador con la IP local en lugar de localhost

### Error de CORS

El servidor ya tiene CORS habilitado, pero si tienes problemas, verifica que el servidor esté corriendo.

### El frontend no encuentra el backend

Verifica que la URL en `environment.prod.ts` sea correcta. Si el frontend y backend están en el mismo servidor (puerto 3000), debería funcionar automáticamente.

## Notas Importantes

- Todos los usuarios compartirán la misma base de datos PostgreSQL
- La base de datos debe estar configurada en `server/.env`
- El servidor debe estar corriendo para que otros ordenadores puedan acceder
- Para producción, considera:
  - Usar HTTPS con certificado SSL
  - Configurar un servidor de base de datos dedicado
  - Implementar backups automáticos
  - Configurar un firewall adecuado

