# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [10.0.0] - 2025-01-XX

### 🎉 Versión Mayor - Sistema Completo

#### ✨ Nuevas Funcionalidades

**Sistema de Autenticación y Usuarios**
- Sistema completo de autenticación con JWT
- Gestión de usuarios con roles (Administrador, Usuario)
- Cambio obligatorio de contraseña en primer login
- Importación/Exportación de usuarios en formato Excel
- Protección de rutas con Guards

**Gestión de Activos Mejorada**
- Fecha de alta automática al registrar activos
- Solo Tipo de Activo y Código son campos obligatorios
- Generación automática de códigos según codificación del tipo
- Validación mejorada de formatos de códigos
- Mensajes de error descriptivos del servidor

**Importación/Exportación Excel**
- Reemplazo de CSV por Excel (XLSX) en todas las secciones
- Exportación de Tipos de Activos a Excel
- Importación de Tipos de Activos desde Excel
- Exportación de Activos a Excel
- Importación de Activos desde Excel
- Exportación de Histórico a Excel
- Exportación de Usuarios a Excel (sin contraseñas)
- Importación de Usuarios desde Excel (contraseña por defecto)

**Diseño Corporativo**
- Implementación completa de identidad visual de Órbita Ingeniería
- Colores corporativos PANTONE (426C, 165C, Black 6C, White)
- Tipografía Montserrat para toda la aplicación
- Logo OGA ÓRBITA GESTIÓN DE ACTIVOS
- Diseño responsive con Angular Material
- Animaciones sutiles y transiciones suaves
- Estilos SCSS organizados y modulares

#### 🔧 Mejoras

- Migración de SQLite a PostgreSQL
- Sistema de logging mejorado con Winston
- Documentación de API con Swagger/OpenAPI
- Mejora en manejo de errores y mensajes descriptivos
- Validación de datos mejorada en frontend y backend
- Código mejor comentado y documentado

#### 🐛 Correcciones

- Corrección en validación de códigos de activos
- Mejora en manejo de errores de conexión
- Corrección en exportación de Excel (evita bloqueo del navegador)

#### 📝 Documentación

- README.md completamente actualizado
- Documentación de API con Swagger
- JSDoc para backend
- TypeDoc para frontend
- Guías de despliegue actualizadas

---

## [1.0.0] - Versión Inicial

### Funcionalidades Base
- Gestión de tipos de activos
- Gestión de activos con estados
- Historial de asignaciones
- Importación/Exportación CSV
- Base de datos SQLite



