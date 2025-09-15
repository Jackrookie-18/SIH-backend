"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const ai_1 = require("./ai");
const http_1 = __importDefault(require("http"));
const server_1 = require("./server");
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
const db = (0, db_1.getDb)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/athletes', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const countQuery = 'SELECT COUNT(*) as count FROM athletes';
    const dataQuery = `
        SELECT 
            a.id, a.name, a.height, a.weight, a.strength, a.category,
            GROUP_CONCAT(DISTINCT i.interest) as interests,
            GROUP_CONCAT(DISTINCT v.url) as videos
        FROM athletes a
        LEFT JOIN interests i ON a.id = i.athlete_id
        LEFT JOIN videos v ON a.id = v.athlete_id
        GROUP BY a.id
        ORDER BY a.createdAt DESC
        LIMIT ? OFFSET ?
    `;
    db.get(countQuery, [], (err, countRow) => {
        if (err) {
            console.error('Failed to count athletes:', err.message);
            return res.status(500).json({ error: 'Failed to fetch athletes' });
        }
        const totalAthletes = countRow.count;
        db.all(dataQuery, [pageSize, offset], (err, rows) => {
            if (err) {
                console.error('Failed to fetch athletes:', err.message);
                res.status(500).json({ error: 'Failed to fetch athletes' });
                return;
            }
            const athletes = rows.map((row) => (Object.assign(Object.assign({}, row), { interests: row.interests ? row.interests.split(',') : [], videos: row.videos ? row.videos.split(',') : [] })));
            res.json({
                data: athletes,
                totalPages: Math.ceil(totalAthletes / pageSize),
                currentPage: page,
            });
        });
    });
});
app.post('/athletes', (req, res) => {
    const { name, height, weight, strength, interests, videos } = req.body;
    if (!name || !height || !weight || !strength || !interests || !videos) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const category = (0, ai_1.categorizeAthlete)(height, weight, strength);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const athleteStmt = db.prepare("INSERT INTO athletes (name, height, weight, strength, category) VALUES (?, ?, ?, ?, ?)");
        athleteStmt.run(name, height, weight, strength, category, function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to create athlete' });
            }
            const athleteId = this.lastID;
            const interestStmt = db.prepare("INSERT INTO interests (athlete_id, interest) VALUES (?, ?)");
            for (const interest of interests) {
                interestStmt.run(athleteId, interest);
            }
            interestStmt.finalize();
            const videoStmt = db.prepare("INSERT INTO videos (athlete_id, url) VALUES (?, ?)");
            for (const url of videos) {
                videoStmt.run(athleteId, url);
            }
            videoStmt.finalize();
            db.run('COMMIT', (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to commit transaction' });
                }
                res.status(201).json({ message: 'Athlete created successfully', athleteId });
            });
        });
        athleteStmt.finalize();
    });
});
const server = http_1.default.createServer(app);
(0, server_1.createWebSocketServer)(server);
server.listen(port, () => {
    console.log(`API and WebSocket server listening on port ${port}`);
});
