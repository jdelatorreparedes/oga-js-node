const pool = require('./db.config');
const bcrypt = require('bcryptjs');

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
    process.exit(1);
  } else {
    console.log('Conectado a la base de datos PostgreSQL');
    release();
    createAdmin();
  }
});

async function createAdmin() {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', ['admin']);
    
    if (result.rows.length > 0) {
      console.log('El usuario admin ya existe');
      await pool.end();
      return;
    }
    
    // Crear usuario admin por defecto
    const defaultPassword = 'Orbita2025!';
    bcrypt.hash(defaultPassword, 10, async (err, hash) => {
      if (err) {
        console.error('Error al hashear contraseña:', err);
        await pool.end();
        return;
      }
      
      try {
        await pool.query('INSERT INTO usuarios (username, password, rol, activo) VALUES ($1, $2, $3, $4)',
          ['admin', hash, 'Administrador', 1]);
        console.log('Usuario admin creado correctamente');
        console.log('Usuario: admin');
        console.log('Contraseña: Orbita2025!');
      } catch (err) {
        console.error('Error al crear usuario admin:', err);
      } finally {
        await pool.end();
      }
    });
  } catch (err) {
    console.error('Error al verificar usuario admin:', err);
    await pool.end();
  }
}
