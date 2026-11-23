-- ==============================================================================
-- LabCare: Datos Semilla Obligatorios
-- 4 Equipos iniciales según especificación del examen
-- ==============================================================================

INSERT OR IGNORE INTO Equipo (id, codigo, nombre, ubicacion, estado) VALUES
(1, 'EQ-001', 'Computadora de escritorio', 'Laboratorio 1', 'OPERATIVO'),
(2, 'EQ-002', 'Proyector multimedia', 'Aula 204', 'OPERATIVO'),
(3, 'EQ-003', 'Router de laboratorio', 'Laboratorio de Redes', 'OPERATIVO'),
(4, 'EQ-004', 'Impresora de oficina', 'Secretaría', 'OPERATIVO');
