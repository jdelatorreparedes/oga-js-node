const jwt = require('jsonwebtoken');

/**
 * Middleware para autenticar tokens JWT
 * Verifica que el token sea válido y agrega la información del usuario a req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware para autorizar roles específicos
 * Debe usarse después de authenticateToken
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado. Rol insuficiente.' });
    }
    next();
  };
};

/**
 * Middleware opcional para rutas que pueden ser accedidas con o sin autenticación
 * Si hay token, lo valida y agrega req.user, si no, continúa sin error
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continuar sin autenticación
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (!err) {
      req.user = user;
    }
    // Continuar en cualquier caso (token válido o inválido, pero no requerido)
    next();
  });
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth
};

