import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/labcare.db');
const schemaPath = path.resolve(__dirname, '../database/schema.sql');
const seedsPath = path.resolve(__dirname, '../database/seeds.sql');

// Asegurar que exista la carpeta database
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Activar llaves foráneas y modo WAL para concurrencia limpia
db.exec('PRAGMA foreign_keys = ON;');

// Inicializar tablas y semillas si es la primera ejecución
const initDatabase = () => {
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  // Verificar si hay equipos cargados
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM Equipo');
  const result = countStmt.get();
  if (result && result.count === 0 && fs.existsSync(seedsPath)) {
    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    db.exec(seedsSql);
  }
};

initDatabase();
