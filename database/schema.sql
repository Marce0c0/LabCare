-- ==============================================================================
-- LabCare: Gestión de Mantenimiento de Equipos de Laboratorio
-- Script DDL de Base de Datos Estándar (SQL ANSI / SQLite / PostgreSQL compatible)
-- ==============================================================================

-- 1. Tabla de Catálogo de Equipos
CREATE TABLE IF NOT EXISTS Equipo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'OPERATIVO'
);

-- 2. Tabla de Solicitudes de Mantenimiento
CREATE TABLE IF NOT EXISTS Solicitud (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_solicitud VARCHAR(30) NOT NULL UNIQUE,
    equipo_id INTEGER NOT NULL,
    solicitante VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad VARCHAR(10) NOT NULL CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA')) DEFAULT 'PENDIENTE',
    fecha_registro TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    FOREIGN KEY (equipo_id) REFERENCES Equipo(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3. Índices para acelerar búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_solicitud_activo ON Solicitud(activo);
CREATE INDEX IF NOT EXISTS idx_solicitud_estado ON Solicitud(estado);
CREATE INDEX IF NOT EXISTS idx_solicitud_prioridad ON Solicitud(prioridad);
CREATE INDEX IF NOT EXISTS idx_solicitud_equipo ON Solicitud(equipo_id);
