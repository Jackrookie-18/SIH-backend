"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/init-db.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.join(process.cwd(), 'database', 'sih.db');
// Ensure the database directory exists
const dbDir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
    initializeDb();
});
function initializeDb() {
    const schemaPath = path_1.default.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error executing schema:', err.message);
        }
        else {
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
