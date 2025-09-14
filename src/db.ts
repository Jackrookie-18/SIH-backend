
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs'; // Import fs for existsSync

// Path to the SQLite database file
const dbPath = path.join(process.cwd(), 'database', 'sih.db');

let db: sqlite3.Database;

export const getDb = () => {
  if (!db) {
    console.log('DB Debug: process.cwd() =', process.cwd());
    console.log('DB Debug: dbPath =', dbPath);
    console.log('DB Debug: dbPath exists =', fs.existsSync(dbPath));

    db = new (sqlite3.verbose().Database)(dbPath, (err) => {
      if (err) {
        console.error('Error opening database', err.message);
      } else {
        console.log('Connected to the SQLite database.');
      }
    });
  }
  return db;
};
