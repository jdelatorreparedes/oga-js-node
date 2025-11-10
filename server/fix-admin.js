const pool = require('./db.config');
const bcrypt = require('bcryptjs');

console.log('=== VERIFICACIÓN Y CREACIÓN DE USUARIO ADMIN ===\n');

pool.connect((err, client, release) => {
  if (err) {
    console.error('ERROR: No se pudo conectar a la base de datos');
    console.error(err.message);
    process.exit(1);
  }
  
  console.log('✓ Conectado a la base de datos\n');
  release();
  
  (async () => {
    try {
      // Primero crear la tabla si no existe
      await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(255) NOT NULL,
        activo INTEGER NOT NULL DEFAULT 1
      )`);
      
      console.log('✓ Tabla usuarios verificada\n');
      
      // Verificar si existe el usuario admin
      const result = await pool.query('SELECT id, username, rol, activo FROM usuarios WHERE username = $1', ['admin']);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log('✓ Usuario admin ya existe:');
        console.log('  - ID:', row.id);
        console.log('  - Usuario:', row.username);
        console.log('  - Rol:', row.rol);
        console.log('  - Activo:', row.activo === 1 ? 'Sí' : 'No');
        console.log('\nPuedes iniciar sesión con:');
        console.log('  Usuario: admin');
        console.log('  Contraseña: Orbita2025!');
      } else {
        console.log('⚠ Usuario admin NO existe. Creándolo...\n');
        
        const defaultPassword = 'Orbita2025!';
        bcrypt.hash(defaultPassword, 10, async (err, hash) => {
          if (err) {
            console.error('ERROR al hashear contraseña:', err.message);
            await pool.end();
            return;
          }
          
          try {
            await pool.query('INSERT INTO usuarios (username, password, rol, activo) VALUES ($1, $2, $3, $4)',
              ['admin', hash, 'Administrador', 1]);
            
            console.log('========================================');
            console.log('✓ USUARIO ADMIN CREADO CORRECTAMENTE');
            console.log('========================================');
            console.log('Usuario: admin');
            console.log('Contraseña: Orbita2025!');
            console.log('========================================\n');
            console.log('Ahora puedes iniciar sesión en la aplicación.');
          } catch (err) {
            console.error('ERROR al crear usuario:', err.message);
          } finally {
            await pool.end();
          }
        });
      }
    } catch (err) {
      console.error('ERROR:', err.message);
      await pool.end();
      process.exit(1);
    }
  })();
});
