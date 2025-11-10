/**
 * @fileoverview Servidor Express para la API de Gestión de Activos
 * @module server
 * @description
 * Servidor backend que proporciona una API REST para la gestión de activos empresariales.
 * Incluye funcionalidades de autenticación JWT, gestión de usuarios, tipos de activos,
 * activos, asignaciones e histórico.
 * 
 * @author Sistema de Gestión de Activos
 * @version 1.0.0
 * @since 1.0.0
 */

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db.config');
const path = require('path');
const bcrypt = require('bcryptjs');
const logger = require('./logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.config');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRoles } = require('./middleware/auth.middleware');

/**
 * Aplicación Express
 * @type {express.Application}
 */
const app = express();

/**
 * Puerto en el que se ejecutará el servidor
 * @type {number}
 * @default 3000
 */
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para logging de peticiones HTTP
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const userId = req.user?.id || null;
    logger.http(req.method, req.path, res.statusCode, duration, userId);
    return originalSend.call(this, data);
  };
  
  next();
});

// Configuración de Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Gestión de Activos - Documentación'
}));

// Servir archivos estáticos del frontend (solo en producción)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/gestion-activos')));
}

// Inicializar base de datos
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error al conectar con la base de datos PostgreSQL', err);
    console.error('Error al conectar con la base de datos PostgreSQL:', err);
    process.exit(1);
  } else {
    logger.info('Conectado a la base de datos PostgreSQL');
    console.log('Conectado a la base de datos PostgreSQL');
    release();
    initDatabase();
  }
});

/**
 * Inicializa las tablas de la base de datos
 * 
 * Crea las tablas necesarias si no existen:
 * - tipos: Tipos de activos
 * - activos: Activos con sus estados y propiedades
 * - historico: Historial de asignaciones y devoluciones
 * - usuarios: Usuarios del sistema con roles y autenticación
 * 
 * @async
 * @function initDatabase
 * @returns {Promise<void>}
 * @throws {Error} Si hay un error al crear las tablas
 */
async function initDatabase() {
  try {
    // Tabla de tipos
    await pool.query(`CREATE TABLE IF NOT EXISTS tipos (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL
    )`);

    // Tabla de activos
    await pool.query(`CREATE TABLE IF NOT EXISTS activos (
      id SERIAL PRIMARY KEY,
      "tipoId" INTEGER NOT NULL,
      codigo VARCHAR(255) NOT NULL UNIQUE,
      referencia VARCHAR(255) NOT NULL,
      descripcion TEXT,
      marca VARCHAR(255),
      detalles TEXT,
      area VARCHAR(255),
      responsable VARCHAR(255),
      "fechaRevision" VARCHAR(255),
      estado VARCHAR(255) NOT NULL DEFAULT 'Disponible',
      "motivoBaja" TEXT,
      FOREIGN KEY ("tipoId") REFERENCES tipos(id)
    )`);

    // Migración: Añadir campos marca y detalles si no existen
    try {
      await pool.query(`ALTER TABLE activos ADD COLUMN IF NOT EXISTS marca VARCHAR(255)`);
      await pool.query(`ALTER TABLE activos ADD COLUMN IF NOT EXISTS detalles TEXT`);
    } catch (err) {
      // Ignorar errores si las columnas ya existen
      if (!err.message.includes('duplicate column')) {
        console.warn('Advertencia al añadir columnas marca/detalles:', err.message);
      }
    }

    // Tabla de histórico
    await pool.query(`CREATE TABLE IF NOT EXISTS historico (
      id SERIAL PRIMARY KEY,
      "activoId" INTEGER NOT NULL,
      "activoCodigo" VARCHAR(255),
      "activoReferencia" VARCHAR(255),
      persona VARCHAR(255) NOT NULL,
      "fechaAsignacion" VARCHAR(255) NOT NULL,
      "fechaDevolucionPrevista" VARCHAR(255) NOT NULL,
      "fechaDevolucion" VARCHAR(255),
      FOREIGN KEY ("activoId") REFERENCES activos(id)
    )`);

    // Tabla de usuarios
    await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      rol VARCHAR(255) NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1
    )`);

    // Tabla de áreas
    await pool.query(`CREATE TABLE IF NOT EXISTS areas (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(10) NOT NULL UNIQUE,
      nombre VARCHAR(255) NOT NULL
    )`);

    // Insertar áreas por defecto si no existen
    const areasDefault = [
      { codigo: 'SEI', nombre: 'SEI' },
      { codigo: 'PRC', nombre: 'PRC' },
      { codigo: 'MEC', nombre: 'MEC' },
      { codigo: 'PAUT', nombre: 'PAUT' },
      { codigo: 'FAUT', nombre: 'FAUT' },
      { codigo: 'TIC', nombre: 'TIC' },
      { codigo: 'TIA', nombre: 'TIA' },
      { codigo: 'SIS', nombre: 'SIS' },
      { codigo: 'FNZ', nombre: 'FNZ' },
      { codigo: 'TE', nombre: 'TE' },
      { codigo: 'TM', nombre: 'TM' },
      { codigo: 'TI', nombre: 'TI' },
      { codigo: 'ADM', nombre: 'ADM' },
      { codigo: 'COM', nombre: 'COM' },
      { codigo: 'DIG', nombre: 'DIG' },
      { codigo: 'AUT', nombre: 'AUT' }
    ];

    for (const area of areasDefault) {
      await pool.query(
        'INSERT INTO areas (codigo, nombre) VALUES ($1, $2) ON CONFLICT (codigo) DO NOTHING',
        [area.codigo, area.nombre]
      );
    }

    // Crear usuario por defecto si no existe
    createDefaultUser();
  } catch (err) {
    console.error('Error al inicializar base de datos:', err);
    logger.error('Error al inicializar base de datos', err);
  }
}

/**
 * Crea el usuario administrador por defecto si no existe
 * 
 * Crea un usuario 'admin' con contraseña 'Orbita2025!' si no existe
 * ningún usuario en la base de datos. Este usuario tiene rol de Administrador.
 * 
 * @async
 * @function createDefaultUser
 * @returns {Promise<void>}
 * @throws {Error} Si hay un error al crear el usuario
 */
async function createDefaultUser() {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', ['admin']);
    
    if (result.rows.length === 0) {
      // Crear usuario admin por defecto
      const defaultPassword = 'Orbita2025!';
      bcrypt.hash(defaultPassword, 10, async (err, hash) => {
        if (err) {
          console.error('Error al hashear contraseña:', err);
          return;
        }
        
        try {
          await pool.query('INSERT INTO usuarios (username, password, rol, activo) VALUES ($1, $2, $3, $4)',
            ['admin', hash, 'Administrador', 1]);
          console.log('========================================');
          console.log('Usuario admin creado por defecto');
          console.log('Usuario: admin');
          console.log('Contraseña: Orbita2025!');
          console.log('========================================');
        } catch (err) {
          console.error('Error al crear usuario admin:', err);
        }
      });
    } else {
      console.log('Usuario admin ya existe en la base de datos');
    }
  } catch (err) {
    console.error('Error al verificar usuario admin:', err);
  }
}

// ========== TIPOS ==========

/**
 * @swagger
 * /api/tipos:
 *   get:
 *     summary: Obtener todos los tipos de activos
 *     tags: [Tipos]
 *     responses:
 *       200:
 *         description: Lista de tipos de activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tipo'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/tipos', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    logger.database('GET tipos', err, 'SELECT * FROM tipos ORDER BY id');
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/tipos:
 *   post:
 *     summary: Crear un nuevo tipo de activo
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop
 *     responses:
 *       200:
 *         description: Tipo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tipo'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/tipos', authenticateToken, authorizeRoles('Administrador', 'Usuario'), async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  
  try {
    const result = await pool.query('INSERT INTO tipos (nombre) VALUES ($1) RETURNING id', [nombre]);
    const id = result.rows[0].id;
    logger.info('Tipo de activo creado', { id, nombre });
    res.json({ id, nombre });
  } catch (err) {
    logger.database('POST tipos - INSERT', err, `INSERT INTO tipos (nombre) VALUES ($1)`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/tipos/{id}:
 *   put:
 *     summary: Actualizar un tipo de activo
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop Actualizado
 *     responses:
 *       200:
 *         description: Tipo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tipo'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Tipo no encontrado
 *       500:
 *         description: Error del servidor
 */
app.put('/api/tipos/:id', authenticateToken, authorizeRoles('Administrador', 'Usuario'), async (req, res) => {
  const { nombre } = req.body;
  const { id } = req.params;
  
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  
  try {
    const result = await pool.query('UPDATE tipos SET nombre = $1 WHERE id = $2', [nombre, id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Tipo no encontrado' });
    } else {
      res.json({ id: parseInt(id), nombre });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/tipos/{id}:
 *   delete:
 *     summary: Eliminar un tipo de activo
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo a eliminar
 *     responses:
 *       200:
 *         description: Tipo eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tipo eliminado correctamente
 *       400:
 *         description: No se puede eliminar un tipo que está siendo usado
 *       404:
 *         description: Tipo no encontrado
 *       500:
 *         description: Error del servidor
 */
app.delete('/api/tipos/:id', authenticateToken, authorizeRoles('Administrador'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar si el tipo está siendo usado
    const countResult = await pool.query('SELECT COUNT(*) as count FROM activos WHERE "tipoId" = $1', [id]);
    
    if (parseInt(countResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un tipo que está siendo usado por activos' });
    }
    
    const result = await pool.query('DELETE FROM tipos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Tipo no encontrado' });
    } else {
      res.json({ message: 'Tipo eliminado correctamente' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ACTIVOS ==========

/**
 * @swagger
 * /api/activos:
 *   get:
 *     summary: Obtener todos los activos
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mostrarBajas
 *         schema:
 *           type: boolean
 *         description: Incluir activos dados de baja
 *         example: false
 *     responses:
 *       200:
 *         description: Lista de activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activo'
 *       500:
 *         description: Error del servidor
 */
app.get('/api/activos', authenticateToken, async (req, res) => {
  const mostrarBajas = req.query.mostrarBajas === 'true';
  
  let query = `
    SELECT a.*, t.nombre as "tipoNombre" 
    FROM activos a 
    LEFT JOIN tipos t ON a."tipoId" = t.id
  `;
  
  if (!mostrarBajas) {
    query += " WHERE a.estado != 'Baja'";
  }
  
  query += ' ORDER BY a.id';
  
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    logger.database('GET activos', err, query);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/activos/{id}:
 *   get:
 *     summary: Obtener un activo por ID
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo
 *     responses:
 *       200:
 *         description: Activo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activo'
 *       404:
 *         description: Activo no encontrado
 *       500:
 *         description: Error del servidor
 */
app.get('/api/activos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT a.*, t.nombre as "tipoNombre" 
      FROM activos a 
      LEFT JOIN tipos t ON a."tipoId" = t.id
      WHERE a.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Activo no encontrado' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/activos:
 *   post:
 *     summary: Crear un nuevo activo
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipoId
 *               - codigo
 *               - referencia
 *             properties:
 *               tipoId:
 *                 type: integer
 *                 example: 1
 *               codigo:
 *                 type: string
 *                 example: LAP-001
 *               referencia:
 *                 type: string
 *                 example: REF-001
 *               descripcion:
 *                 type: string
 *                 example: Laptop Dell Inspiron
 *               area:
 *                 type: string
 *                 example: IT
 *               responsable:
 *                 type: string
 *                 example: Juan Pérez
 *               fechaRevision:
 *                 type: string
 *                 example: 2025-12-31
 *     responses:
 *       200:
 *         description: Activo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activo'
 *       400:
 *         description: Error de validación o código duplicado
 *       500:
 *         description: Error del servidor
 */
app.post('/api/activos', authenticateToken, authorizeRoles('Administrador', 'Usuario'), async (req, res) => {
  const { tipoId, codigo, referencia, descripcion, marca, detalles, area, responsable, fechaRevision } = req.body;
  
  if (!tipoId || !codigo || !referencia) {
    return res.status(400).json({ error: 'Los campos tipoId, codigo y referencia son requeridos' });
  }
  
  try {
    const insertResult = await pool.query(
      `INSERT INTO activos ("tipoId", codigo, referencia, descripcion, marca, detalles, area, responsable, "fechaRevision", estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Disponible') RETURNING id`,
      [tipoId, codigo, referencia, descripcion || '', marca || '', detalles || '', area || '', responsable || '', fechaRevision || '']
    );
    
    const id = insertResult.rows[0].id;
    
    // Obtener el activo creado con el nombre del tipo
    const selectResult = await pool.query(`
      SELECT a.*, t.nombre as "tipoNombre" 
      FROM activos a 
      LEFT JOIN tipos t ON a."tipoId" = t.id
      WHERE a.id = $1
    `, [id]);
    
    res.json(selectResult.rows[0]);
  } catch (err) {
    if (err.code === '23505' || err.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'El código ya existe' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * @swagger
 * /api/activos/{id}:
 *   put:
 *     summary: Actualizar un activo
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activo'
 *     responses:
 *       200:
 *         description: Activo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activo'
 *       400:
 *         description: Error de validación o código duplicado
 *       404:
 *         description: Activo no encontrado
 *       500:
 *         description: Error del servidor
 */
app.put('/api/activos/:id', authenticateToken, authorizeRoles('Administrador', 'Usuario'), async (req, res) => {
  const { id } = req.params;
  const { tipoId, codigo, referencia, descripcion, marca, detalles, area, responsable, fechaRevision, estado, motivoBaja } = req.body;
  
  try {
    const updateResult = await pool.query(
      `UPDATE activos 
       SET "tipoId" = $1, codigo = $2, referencia = $3, descripcion = $4, marca = $5, detalles = $6, area = $7, responsable = $8, "fechaRevision" = $9, estado = $10, "motivoBaja" = $11
       WHERE id = $12`,
      [tipoId, codigo, referencia, descripcion || '', marca || '', detalles || '', area || '', responsable || '', fechaRevision || '', estado || 'Disponible', motivoBaja || null, id]
    );
    
    if (updateResult.rowCount === 0) {
      res.status(404).json({ error: 'Activo no encontrado' });
    } else {
      // Obtener el activo actualizado
      const selectResult = await pool.query(`
        SELECT a.*, t.nombre as "tipoNombre" 
        FROM activos a 
        LEFT JOIN tipos t ON a."tipoId" = t.id
        WHERE a.id = $1
      `, [id]);
      
      res.json(selectResult.rows[0]);
    }
  } catch (err) {
    if (err.code === '23505' || err.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'El código ya existe' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * @swagger
 * /api/activos/{id}:
 *   delete:
 *     summary: Eliminar un activo
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo a eliminar
 *     responses:
 *       200:
 *         description: Activo eliminado exitosamente
 *       404:
 *         description: Activo no encontrado
 *       500:
 *         description: Error del servidor
 */
app.delete('/api/activos/:id', authenticateToken, authorizeRoles('Administrador'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar si el activo existe
    const activoResult = await pool.query('SELECT * FROM activos WHERE id = $1', [id]);
    
    if (activoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    // Verificar si el activo está asignado
    if (activoResult.rows[0].estado === 'Asignado') {
      return res.status(400).json({ error: 'No se puede eliminar un activo que está asignado. Primero debe devolverse.' });
    }
    
    // Eliminar primero los registros relacionados en histórico
    await pool.query('DELETE FROM historico WHERE "activoId" = $1', [id]);
    
    // Luego eliminar el activo
    const result = await pool.query('DELETE FROM activos WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Activo no encontrado' });
    } else {
      res.json({ message: 'Activo eliminado correctamente' });
    }
  } catch (err) {
    logger.database('DELETE activos', err, `DELETE FROM activos WHERE id = $1`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/activos/{id}/asignar:
 *   post:
 *     summary: Asignar un activo a una persona
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo a asignar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - persona
 *               - fechaDevolucionPrevista
 *             properties:
 *               persona:
 *                 type: string
 *                 example: Juan Pérez
 *               fechaDevolucionPrevista:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-31
 *     responses:
 *       200:
 *         description: Activo asignado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Activo asignado correctamente
 *                 historicoId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Error de validación o activo no disponible
 *       404:
 *         description: Activo no encontrado
 *       500:
 *         description: Error del servidor
 */
app.post('/api/activos/:id/asignar', authenticateToken, authorizeRoles('Administrador', 'Usuario'), async (req, res) => {
  const { id } = req.params;
  const { persona, fechaDevolucionPrevista } = req.body;
  
  if (!persona || !fechaDevolucionPrevista) {
    return res.status(400).json({ error: 'Persona y fecha de devolución prevista son requeridos' });
  }
  
  try {
    // Obtener el activo
    const activoResult = await pool.query('SELECT * FROM activos WHERE id = $1', [id]);
    
    if (activoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    const activo = activoResult.rows[0];
    
    if (activo.estado !== 'Disponible') {
      return res.status(400).json({ error: 'Solo se pueden asignar activos disponibles' });
    }
    
    // Actualizar estado del activo
    await pool.query('UPDATE activos SET estado = $1 WHERE id = $2', ['Asignado', id]);
    
    // Crear registro en histórico
    const fechaAsignacion = new Date().toISOString().split('T')[0];
    const historicoResult = await pool.query(
      `INSERT INTO historico ("activoId", "activoCodigo", "activoReferencia", persona, "fechaAsignacion", "fechaDevolucionPrevista") 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [id, activo.codigo, activo.referencia, persona, fechaAsignacion, fechaDevolucionPrevista]
    );
    
    res.json({ 
      message: 'Activo asignado correctamente',
      historicoId: historicoResult.rows[0].id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/activos/{id}/devolver:
 *   post:
 *     summary: Devolver un activo asignado
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo a devolver
 *     responses:
 *       200:
 *         description: Activo devuelto exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Activo devuelto correctamente
 *       400:
 *         description: Error de validación o activo no asignado
 *       404:
 *         description: Activo o asignación no encontrada
 *       500:
 *         description: Error del servidor
 */
app.post('/api/activos/:id/devolver', authenticateToken, authorizeRoles('Administrador', 'Usuario'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Obtener el activo
    const activoResult = await pool.query('SELECT * FROM activos WHERE id = $1', [id]);
    
    if (activoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    const activo = activoResult.rows[0];
    
    if (activo.estado !== 'Asignado') {
      return res.status(400).json({ error: 'Solo se pueden devolver activos asignados' });
    }
    
    // Obtener la asignación activa más reciente
    const historicoResult = await pool.query(
      'SELECT * FROM historico WHERE "activoId" = $1 AND "fechaDevolucion" IS NULL ORDER BY "fechaAsignacion" DESC LIMIT 1',
      [id]
    );
    
    if (historicoResult.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró asignación activa' });
    }
    
    const historico = historicoResult.rows[0];
    
    // Actualizar estado del activo
    await pool.query('UPDATE activos SET estado = $1 WHERE id = $2', ['Disponible', id]);
    
    // Actualizar histórico con fecha de devolución
    const fechaDevolucion = new Date().toISOString().split('T')[0];
    await pool.query(
      'UPDATE historico SET "fechaDevolucion" = $1 WHERE id = $2',
      [fechaDevolucion, historico.id]
    );
    
    res.json({ message: 'Activo devuelto correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/activos/{id}/baja:
 *   post:
 *     summary: Dar de baja un activo
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo a dar de baja
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *                 example: Obsoleto
 *     responses:
 *       200:
 *         description: Activo dado de baja exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Activo dado de baja correctamente
 *       400:
 *         description: Error de validación o activo asignado
 *       404:
 *         description: Activo no encontrado
 *       500:
 *         description: Error del servidor
 */
app.post('/api/activos/:id/baja', authenticateToken, authorizeRoles('Administrador'), async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  
  if (!motivo) {
    return res.status(400).json({ error: 'El motivo de la baja es requerido' });
  }
  
  try {
    // Obtener el activo
    const activoResult = await pool.query('SELECT * FROM activos WHERE id = $1', [id]);
    
    if (activoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    const activo = activoResult.rows[0];
    
    if (activo.estado === 'Asignado') {
      return res.status(400).json({ error: 'No se puede dar de baja un activo asignado' });
    }
    
    // Actualizar estado y motivo
    await pool.query(
      'UPDATE activos SET estado = $1, "motivoBaja" = $2 WHERE id = $3',
      ['Baja', motivo, id]
    );
    
    res.json({ message: 'Activo dado de baja correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== HISTÓRICO ==========

/**
 * @swagger
 * /api/historico:
 *   get:
 *     summary: Obtener todo el histórico de asignaciones
 *     tags: [Histórico]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista del histórico de asignaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Historico'
 *       500:
 *         description: Error del servidor
 */
app.get('/api/historico', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, a.codigo as "activoCodigo", a.referencia as "activoReferencia", t.nombre as "tipoNombre"
      FROM historico h
      LEFT JOIN activos a ON h."activoId" = a.id
      LEFT JOIN tipos t ON a."tipoId" = t.id
      ORDER BY h."fechaAsignacion" DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/historico/activo/{id}:
 *   get:
 *     summary: Obtener el histórico de un activo específico
 *     tags: [Histórico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo
 *     responses:
 *       200:
 *         description: Histórico del activo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Historico'
 *       500:
 *         description: Error del servidor
 */
app.get('/api/historico/activo/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT h.*, a.codigo as "activoCodigo", a.referencia as "activoReferencia"
      FROM historico h
      LEFT JOIN activos a ON h."activoId" = a.id
      WHERE h."activoId" = $1
      ORDER BY h."fechaAsignacion" DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ÁREAS ==========

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: Obtener todas las áreas
 *     tags: [Áreas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de áreas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   codigo:
 *                     type: string
 *                   nombre:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
app.get('/api/areas', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM areas ORDER BY codigo');
    res.json(result.rows);
  } catch (err) {
    logger.database('GET areas', err, 'SELECT * FROM areas ORDER BY codigo');
    res.status(500).json({ error: err.message });
  }
});

// ========== USUARIOS ==========

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       500:
 *         description: Error del servidor
 */
app.get('/api/usuarios', authenticateToken, authorizeRoles('Administrador'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, rol, activo FROM usuarios ORDER BY id');
    logger.info('Usuarios obtenidos', { count: result.rows.length });
    res.json(result.rows.map(row => ({ ...row, activo: row.activo === 1 })));
  } catch (err) {
    logger.database('GET usuarios', err, 'SELECT id, username, rol, activo FROM usuarios ORDER BY id');
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       200:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error de validación o usuario ya existe
 *       500:
 *         description: Error del servidor
 */
app.post('/api/usuarios', authenticateToken, authorizeRoles('Administrador'), async (req, res) => {
  const { username, password, rol, activo } = req.body;
  
  if (!username || !password || !rol) {
    return res.status(400).json({ error: 'Usuario, contraseña y rol son requeridos' });
  }
  
  // Validar rol
  const rolesValidos = ['Administrador', 'Usuario', 'Visor'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  
  try {
    // Verificar si el usuario ya existe
    const existingResult = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    // Hashear contraseña
    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Error al hashear contraseña' });
      }
      
      try {
        const result = await pool.query('INSERT INTO usuarios (username, password, rol, activo) VALUES ($1, $2, $3, $4) RETURNING id',
          [username, hash, rol, activo !== undefined ? (activo ? 1 : 0) : 1]);
        
        res.json({
          id: result.rows[0].id,
          username,
          rol,
          activo: activo !== undefined ? activo : true
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - rol
 *             properties:
 *               username:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [Administrador, Usuario, Visor]
 *               password:
 *                 type: string
 *                 description: Nueva contraseña (opcional)
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error de validación o usuario ya existe
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
app.put('/api/usuarios/:id', authenticateToken, authorizeRoles('Administrador'), async (req, res) => {
  const { id } = req.params;
  const { username, password, rol, activo } = req.body;
  
  if (!username || !rol) {
    return res.status(400).json({ error: 'Usuario y rol son requeridos' });
  }
  
  // Validar rol
  const rolesValidos = ['Administrador', 'Usuario', 'Visor'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  
  try {
    // Verificar si el usuario existe
    const userResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Verificar si el nuevo username ya existe (y no es el mismo usuario)
    const existingResult = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND id != $2', [username, id]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({ error: 'Error al hashear contraseña' });
        }
        
        try {
          await pool.query('UPDATE usuarios SET username = $1, password = $2, rol = $3, activo = $4 WHERE id = $5',
            [username, hash, rol, activo !== undefined ? (activo ? 1 : 0) : user.activo, id]);
          
          res.json({
            id: parseInt(id),
            username,
            rol,
            activo: activo !== undefined ? activo : (user.activo === 1)
          });
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
    } else {
      // No cambiar la contraseña
      try {
        await pool.query('UPDATE usuarios SET username = $1, rol = $2, activo = $3 WHERE id = $4',
          [username, rol, activo !== undefined ? (activo ? 1 : 0) : user.activo, id]);
        
        res.json({
          id: parseInt(id),
          username,
          rol,
          activo: activo !== undefined ? activo : (user.activo === 1)
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}/change-password:
 *   post:
 *     summary: Cambiar la contraseña de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: password123
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contraseña cambiada correctamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Contraseña actual incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
app.post('/api/usuarios/:id/change-password', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  console.log('Cambio de contraseña solicitado para usuario ID:', id);
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'La contraseña actual y la nueva contraseña son requeridas' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }
  
  try {
    // Verificar si el usuario existe
    const userResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      console.log('Usuario no encontrado con ID:', id);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Verificar la contraseña actual
    bcrypt.compare(currentPassword, user.password, async (err, match) => {
      if (err) {
        console.error('Error al comparar contraseña:', err);
        return res.status(500).json({ error: 'Error al verificar contraseña' });
      }
      
      if (!match) {
        console.log('Contraseña actual incorrecta para usuario:', user.username);
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }
      
      // Hashear la nueva contraseña
      bcrypt.hash(newPassword, 10, async (err, hash) => {
        if (err) {
          console.error('Error al hashear contraseña:', err);
          return res.status(500).json({ error: 'Error al hashear contraseña' });
        }
        
        try {
          // Actualizar la contraseña
          await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, id]);
          console.log('Contraseña actualizada correctamente para usuario ID:', id);
          res.json({ message: 'Contraseña cambiada correctamente' });
        } catch (err) {
          console.error('Error al actualizar contraseña:', err);
          res.status(500).json({ error: err.message });
        }
      });
    });
  } catch (err) {
    console.error('Error al buscar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado correctamente
 *       400:
 *         description: No se puede eliminar el usuario administrador por defecto
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
app.delete('/api/usuarios/:id', authenticateToken, authorizeRoles('Administrador'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar si el usuario existe
    const userResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // No permitir eliminar el usuario admin por defecto
    if (user.username === 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar el usuario administrador por defecto' });
    }
    
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta catch-all para servir el frontend (solo en producción)
// Debe ir ANTES de iniciar el servidor pero DESPUÉS de todas las rutas API
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Solo servir index.html si no es una ruta de API
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/gestion-activos/index.html'));
    } else {
      res.status(404).json({ error: 'Ruta no encontrada' });
    }
  });
}

// Middleware para logging de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', error);
  console.error('Excepción no capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada', { reason, promise });
  console.error('Promesa rechazada no manejada:', reason);
});

/**
 * Detecta automáticamente la IP de la red local
 * 
 * Busca la primera IP IPv4 no localhost disponible en las interfaces de red.
 * Prioriza IPs que no sean de rango APIPA (169.254.x.x).
 * 
 * @function getLocalNetworkIP
 * @returns {string} La IP de la red local o '127.0.0.1' como fallback
 * 
 * @example
 * const ip = getLocalNetworkIP();
 * console.log(`Servidor accesible en: http://${ip}:3000`);
 */
function getLocalNetworkIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  // Prioridad: variable de entorno > IP fija en código > detección automática
  if (process.env.SERVER_IP) {
    return process.env.SERVER_IP;
  }
  
  // Buscar la primera IP IPv4 que no sea localhost
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorar direcciones internas y no IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        // Preferir IPs que no sean 169.254.x.x (APIPA)
        if (!iface.address.startsWith('169.254.')) {
          return iface.address;
        }
      }
    }
  }
  
  // Si no se encuentra ninguna, buscar cualquier IP no localhost
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Fallback: usar localhost
  return '127.0.0.1';
}

// Iniciar servidor
const HOST = process.env.HOST || '0.0.0.0';
const SERVER_IP = getLocalNetworkIP();
app.listen(PORT, HOST, () => {
  logger.info('Servidor iniciado', { host: HOST, port: PORT, serverIP: SERVER_IP });
  console.log('='.repeat(60));
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`Accesible localmente en: http://localhost:${PORT}`);
  console.log(`Accesible desde la red en: http://${SERVER_IP}:${PORT}`);
  console.log('');
  console.log('📚 Documentación Swagger disponible en:');
  console.log(`   http://localhost:${PORT}/api-docs`);
  console.log(`   http://${SERVER_IP}:${PORT}/api-docs`);
  console.log('');
  console.log('NOTA: Para usar una IP específica, configura la variable de entorno:');
  console.log('  set SERVER_IP=tu.ip.aqui');
  console.log('='.repeat(60));
});

// ========== AUTENTICACIÓN ==========

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Usuario y contraseña son requeridos
 *       401:
 *         description: Usuario o contraseña incorrectos
 *       500:
 *         description: Error del servidor
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    logger.warn('Intento de login sin credenciales', { username: username || 'no proporcionado' });
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND activo = 1', [username]);
    
    if (result.rows.length === 0) {
      logger.warn('Intento de login con usuario inexistente o inactivo', { username });
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const user = result.rows[0];
    
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        logger.error('Error al comparar contraseña en login', err);
        return res.status(500).json({ error: 'Error al verificar contraseña' });
      }
      
      if (!match) {
        logger.warn('Intento de login con contraseña incorrecta', { username, userId: user.id });
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
      
      // Generar JWT
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
      
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          rol: user.rol 
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );
      
      // Retornar usuario sin contraseña
      const { password: _, ...userWithoutPassword } = user;
      logger.info('Login exitoso', { username, userId: user.id, rol: user.rol });
      res.json({
        usuario: {
          ...userWithoutPassword,
          activo: userWithoutPassword.activo === 1
        },
        token
      });
    });
  } catch (err) {
    logger.database('LOGIN - SELECT usuario', err, `SELECT * FROM usuarios WHERE username = $1 AND activo = 1`);
    res.status(500).json({ error: err.message });
  }
});

// Cerrar pool de conexiones al terminar
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Pool de conexiones PostgreSQL cerrado.');
    process.exit(0);
  } catch (err) {
    console.error('Error al cerrar pool de conexiones:', err.message);
    process.exit(1);
  }
});

