const fs = require('fs');
const path = require('path');

/**
 * Servicio de logging con rotación de archivos
 * Mantiene un máximo de 100 archivos de log
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.maxFiles = 100;
    this.ensureLogDirectory();
  }

  /**
   * Asegura que el directorio de logs existe
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Obtiene el nombre del archivo de log actual basado en la fecha
   */
  getLogFileName() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `app-${dateStr}.log`);
  }

  /**
   * Formatea un mensaje de log
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      logMessage += ` | Data: ${JSON.stringify(data)}`;
    }
    
    return logMessage + '\n';
  }

  /**
   * Escribe un mensaje en el archivo de log
   */
  writeToFile(message) {
    const logFile = this.getLogFileName();
    
    try {
      fs.appendFileSync(logFile, message, 'utf8');
    } catch (error) {
      console.error('Error al escribir en el archivo de log:', error);
    }
  }

  /**
   * Limpia archivos de log antiguos manteniendo solo los más recientes
   */
  rotateLogs() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          time: fs.statSync(path.join(this.logDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Más recientes primero

      // Si hay más de maxFiles, eliminar los más antiguos
      if (files.length > this.maxFiles) {
        const filesToDelete = files.slice(this.maxFiles);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log(`Archivo de log eliminado: ${file.name}`);
          } catch (error) {
            console.error(`Error al eliminar archivo de log ${file.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error al rotar logs:', error);
    }
  }

  /**
   * Registra un mensaje de información
   */
  info(message, data = null) {
    const logMessage = this.formatMessage('INFO', message, data);
    console.log(logMessage.trim());
    this.writeToFile(logMessage);
    this.rotateLogs();
  }

  /**
   * Registra un mensaje de advertencia
   */
  warn(message, data = null) {
    const logMessage = this.formatMessage('WARN', message, data);
    console.warn(logMessage.trim());
    this.writeToFile(logMessage);
    this.rotateLogs();
  }

  /**
   * Registra un mensaje de error
   */
  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code }),
      ...(error.status && { status: error.status }),
      ...(error.statusCode && { statusCode: error.statusCode })
    } : null;
    
    const logMessage = this.formatMessage('ERROR', message, errorData);
    console.error(logMessage.trim());
    this.writeToFile(logMessage);
    this.rotateLogs();
  }

  /**
   * Registra una petición HTTP
   */
  http(method, path, statusCode, duration = null, userId = null) {
    const data = {
      method,
      path,
      statusCode,
      ...(duration !== null && { duration: `${duration}ms` }),
      ...(userId && { userId })
    };
    
    const logMessage = this.formatMessage('HTTP', `${method} ${path} - ${statusCode}`, data);
    console.log(logMessage.trim());
    this.writeToFile(logMessage);
    this.rotateLogs();
  }

  /**
   * Registra un error de base de datos
   */
  database(operation, error, query = null) {
    const errorData = {
      operation,
      message: error.message,
      ...(query && { query })
    };
    
    const logMessage = this.formatMessage('DATABASE', `Error en ${operation}`, errorData);
    console.error(logMessage.trim());
    this.writeToFile(logMessage);
    this.rotateLogs();
  }
}

// Exportar instancia singleton
module.exports = new Logger();

