-- database/schema.sql

CREATE TABLE IF NOT EXISTS athletes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    height REAL NOT NULL,
    weight REAL NOT NULL,
    strength REAL NOT NULL,
    category TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interests (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL,
    interest TEXT NOT NULL,
    FOREIGN KEY (athlete_id) REFERENCES athletes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (athlete_id) REFERENCES athletes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
