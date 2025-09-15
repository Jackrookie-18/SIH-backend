"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs")); // Import fs for existsSync
// Path to the SQLite database file
const dbPath = path_1.default.join(process.cwd(), 'database', 'sih.db');
let db;
const getDb = () => {
    if (!db) {
        console.log('DB Debug: process.cwd() =', process.cwd());
        console.log('DB Debug: dbPath =', dbPath);
        console.log('DB Debug: dbPath exists =', fs_1.default.existsSync(dbPath));
        db = new (sqlite3_1.default.verbose().Database)(dbPath, (err) => {
            if (err) {
                console.error('Error opening database', err.message);
            }
            else {
                console.log('Connected to the SQLite database.');
            }
        });
    }
    return db;
};
exports.getDb = getDb;
