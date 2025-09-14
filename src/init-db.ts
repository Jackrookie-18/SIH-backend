// backend/init-db.ts
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), '..', 'database', 'sih.db');

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
    initializeDb();
});

function initializeDb() {
    const schemaPath = path.join(process.cwd(), '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema, (err) => {
        if (err) {
            console.error('Error executing schema:', err.message);
        } else {
            console.log('Database tables created or already exist.');
        }
        
        // Close the database connection after initialization
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            console.log('Closed the database connection.');
        });
    });
}
