import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb } from './db';
import { categorizeAthlete } from './ai';
import http from 'http';
import { createWebSocketServer } from './server';

const app = express();
const port = process.env.PORT || 3002;
const db = getDb();

app.use(cors());
app.use(express.json());

app.get('/athletes', (req, res) => {
    const query = `
        SELECT 
            a.id, a.name, a.height, a.weight, a.strength, a.category,
            GROUP_CONCAT(DISTINCT i.interest) as interests,
            GROUP_CONCAT(DISTINCT v.url) as videos
        FROM athletes a
        LEFT JOIN interests i ON a.id = i.athlete_id
        LEFT JOIN videos v ON a.id = v.athlete_id
        GROUP BY a.id
        ORDER BY a.createdAt DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Failed to fetch athletes:', err.message);
            res.status(500).json({ error: 'Failed to fetch athletes' });
            return;
        }
        const athletes = rows.map((row: any) => ({
            ...row,
            interests: row.interests ? row.interests.split(',') : [],
            videos: row.videos ? row.videos.split(',') : []
        }));
        res.json(athletes);
    });
});

app.post('/athletes', (req, res) => {
    const { name, height, weight, strength, interests, videos } = req.body;

    if (!name || !height || !weight || !strength || !interests || !videos) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const category = categorizeAthlete(height, weight, strength);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const athleteStmt = db.prepare("INSERT INTO athletes (name, height, weight, strength, category) VALUES (?, ?, ?, ?, ?)");
        athleteStmt.run(name, height, weight, strength, category, function(err) {
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

const server = http.createServer(app);

createWebSocketServer(server);

server.listen(port, () => {
    console.log(`API and WebSocket server listening on port ${port}`);
});
