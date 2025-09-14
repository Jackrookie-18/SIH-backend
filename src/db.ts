
import sqlite3 from 'sqlite3';
import path from 'path';

// Path to the SQLite database file
const dbPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname, '../database/sih.db') 
    : path.resolve(__dirname, '../../database/sih.db');

let db: sqlite3.Database;

export const getDb = () => {
  if (!db) {
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

// No query function needed for sqlite3 in this format
