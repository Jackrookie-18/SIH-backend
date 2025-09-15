"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketServer = void 0;
const ws_1 = require("ws");
const db_1 = require("./db");
const url_1 = __importDefault(require("url"));
const createWebSocketServer = (server) => {
    const wss = new ws_1.WebSocketServer({ server });
    const db = (0, db_1.getDb)();
    const rooms = new Map();
    console.log('WebSocket server is ready');
    wss.on('connection', (ws, req) => {
        const { pathname } = url_1.default.parse(req.url || '', true);
        const roomId = (pathname === null || pathname === void 0 ? void 0 : pathname.split('/')[2]) || '';
        if (!roomId) {
            console.log('Connection attempt without room ID. Closing connection.');
            ws.close();
            return;
        }
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(ws);
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
            stmt.run(roomId, sender_id, receiver_id, content, function (err) {
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
                        if (client.readyState === ws_1.WebSocket.OPEN) {
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
};
exports.createWebSocketServer = createWebSocketServer;
