
import 'dotenv/config';

// backend/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { getDb } from './db';
import url from 'url';

const wss = new WebSocketServer({ port: 8083 });
const db = getDb();
const rooms = new Map<string, Set<WebSocket>>();

console.log('WebSocket server started on port 8082');

wss.on('connection', (ws, req) => {
    const { pathname } = url.parse(req.url || '', true);
    const roomId = pathname?.split('/')[2] || '';

    if (!roomId) {
        console.log('Connection attempt without room ID. Closing connection.');
        ws.close();
        return;
    }

    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(ws);

    console.log(`Client connected to room ${roomId}`);

    // Send existing messages to the newly connected client
    db.all("SELECT * FROM messages WHERE room_id = ? ORDER BY createdAt ASC", [roomId], (err, rows) => {
        if (err) {
            console.error('Failed to retrieve messages:', err.message);
            return;
        }
        ws.send(JSON.stringify({ type: 'history', data: rows }));
    });

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message.toString());
        const { sender_id, receiver_id, message: content } = parsedMessage;

        // Save the message to the database
        const stmt = db.prepare("INSERT INTO messages (room_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)");
        stmt.run(roomId, sender_id, receiver_id, content, function(err) {
            if (err) {
                console.error('Failed to save message:', err.message);
                return;
            }
            const newMessage = {
                id: this.lastID,
                room_id: roomId,
                sender_id,
                receiver_id,
                message: content,
                createdAt: new Date().toISOString()
            };

            // Broadcast the new message to all clients in the room
            const room = rooms.get(roomId);
            if (room) {
                room.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'message', data: newMessage }));
                    }
                });
            }
        });
    });

    ws.on('close', () => {
        console.log(`Client disconnected from room ${roomId}`);
        const room = rooms.get(roomId);
        if (room) {
            room.delete(ws);
            if (room.size === 0) {
                rooms.delete(roomId);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    wss.close(() => {
        console.log('WebSocket server shut down.');
        process.exit(0);
    });
});
