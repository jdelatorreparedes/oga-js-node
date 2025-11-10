const pool = require('./db.config');
const bcrypt = require('bcryptjs');

console.log('Verificando base de datos...');

pool.connect((err, client, release) => {
  if (err) {
    console.error('ERROR al conectar con la base de datos:', err.message);
    process.exit(1);
  }
  
  console.log('✓ Conectado a la base de datos');
  release();
  
  (async () => {
    try {
      // Verificar si existe la tabla
      const tableResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'usuarios'
      `);
      
      if (tableResult.rows.length === 0) {
        console.log('⚠ La tabla usuarios no existe. Creándola...');
        await pool.query(`CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          rol VARCHAR(255) NOT NULL,
          activo INTEGER NOT NULL DEFAULT 1
        )`);
        console.log('✓ Tabla usuarios creada');
        await crearUsuario();
      } else {
        console.log('✓ Tabla usuarios existe');
        await verificarUsuario();
      }
    } catch (err) {
      console.error('ERROR al verificar tabla:', err.message);
      await pool.end();
      return;
    }
  })();
});

async function verificarUsuario() {
  try {
    const result = await pool.query('SELECT id, username, rol, activo FROM usuarios WHERE username = $1', ['admin']);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('✓ Usuario admin existe:');
      console.log('  - ID:', row.id);
      console.log('  - Usuario:', row.username);
      console.log('  - Rol:', row.rol);
      console.log('  - Activo:', row.activo === 1 ? 'Sí' : 'No');
    } else {
      console.log('⚠ Usuario admin NO existe. Creándolo...');
      await crearUsuario();
    }
  } catch (err) {
    console.error('ERROR al verificar usuario:', err.message);
  } finally {
    await pool.end();
  }
}

async function crearUsuario() {
  const defaultPassword = 'Orbita2025!';
  console.log('Creando usuario admin con contraseña:', defaultPassword);
  
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
      console.log('========================================');
    } catch (err) {
      console.error('ERROR al crear usuario:', err.message);
    } finally {
      await pool.end();
    }
  });
}
