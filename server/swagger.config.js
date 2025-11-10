const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestión de Activos',
      version: '1.0.0',
      description: 'API REST para la gestión de activos, tipos, histórico y usuarios',
      contact: {
        name: 'Soporte API',
        email: 'soporte@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'http://0.0.0.0:3000',
        description: 'Servidor de producción'
      }
    ],
    components: {
      schemas: {
        Tipo: {
          type: 'object',
          required: ['nombre'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del tipo',
              example: 1
            },
            nombre: {
              type: 'string',
              description: 'Nombre del tipo de activo',
              example: 'Laptop'
            }
          }
        },
        Activo: {
          type: 'object',
          required: ['tipoId', 'codigo', 'referencia'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del activo',
              example: 1
            },
            tipoId: {
              type: 'integer',
              description: 'ID del tipo de activo',
              example: 1
            },
            tipoNombre: {
              type: 'string',
              description: 'Nombre del tipo de activo',
              example: 'Laptop'
            },
            codigo: {
              type: 'string',
              description: 'Código único del activo',
              example: 'LAP-001'
            },
            referencia: {
              type: 'string',
              description: 'Referencia del activo',
              example: 'REF-001'
            },
            descripcion: {
              type: 'string',
              description: 'Descripción del activo',
              example: 'Laptop Dell Inspiron'
            },
            area: {
              type: 'string',
              description: 'Área del activo',
              example: 'IT'
            },
            responsable: {
              type: 'string',
              description: 'Responsable del activo',
              example: 'Juan Pérez'
            },
            fechaRevision: {
              type: 'string',
              description: 'Fecha de revisión',
              example: '2025-12-31'
            },
            estado: {
              type: 'string',
              enum: ['Disponible', 'Asignado', 'Baja'],
              description: 'Estado del activo',
              example: 'Disponible'
            },
            motivoBaja: {
              type: 'string',
              description: 'Motivo de la baja (si aplica)',
              example: 'Obsoleto'
            }
          }
        },
        Historico: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del registro histórico',
              example: 1
            },
            activoId: {
              type: 'integer',
              description: 'ID del activo',
              example: 1
            },
            activoCodigo: {
              type: 'string',
              description: 'Código del activo',
              example: 'LAP-001'
            },
            activoReferencia: {
              type: 'string',
              description: 'Referencia del activo',
              example: 'REF-001'
            },
            persona: {
              type: 'string',
              description: 'Persona asignada',
              example: 'Juan Pérez'
            },
            fechaAsignacion: {
              type: 'string',
              description: 'Fecha de asignación',
              example: '2025-01-15'
            },
            fechaDevolucionPrevista: {
              type: 'string',
              description: 'Fecha de devolución prevista',
              example: '2025-12-31'
            },
            fechaDevolucion: {
              type: 'string',
              nullable: true,
              description: 'Fecha de devolución real',
              example: '2025-06-30'
            }
          }
        },
        Usuario: {
          type: 'object',
          required: ['username', 'password', 'rol'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del usuario',
              example: 1
            },
            username: {
              type: 'string',
              description: 'Nombre de usuario',
              example: 'admin'
            },
            password: {
              type: 'string',
              description: 'Contraseña (solo en creación/actualización)',
              example: 'password123'
            },
            rol: {
              type: 'string',
              enum: ['Administrador', 'Usuario', 'Visor'],
              description: 'Rol del usuario',
              example: 'Administrador'
            },
            activo: {
              type: 'boolean',
              description: 'Estado del usuario',
              example: true
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error',
              example: 'Error message'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Nombre de usuario',
              example: 'admin'
            },
            password: {
              type: 'string',
              description: 'Contraseña',
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            usuario: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1
                },
                username: {
                  type: 'string',
                  example: 'admin'
                },
                rol: {
                  type: 'string',
                  example: 'Administrador'
                },
                activo: {
                  type: 'boolean',
                  example: true
                }
              }
            },
            token: {
              type: 'string',
              description: 'Token JWT para autenticación',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido del endpoint de login'
        }
      }
    },
    tags: [
      {
        name: 'Tipos',
        description: 'Endpoints para gestión de tipos de activos'
      },
      {
        name: 'Activos',
        description: 'Endpoints para gestión de activos'
      },
      {
        name: 'Histórico',
        description: 'Endpoints para consulta del histórico de asignaciones'
      },
      {
        name: 'Usuarios',
        description: 'Endpoints para gestión de usuarios'
      },
      {
        name: 'Autenticación',
        description: 'Endpoints para autenticación'
      }
    ]
  },
  apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

