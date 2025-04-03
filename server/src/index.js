const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));

// Body parser middleware
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Room management
const rooms = new Map();

// Generate a unique token
const generateToken = () => {
    return crypto.randomBytes(16).toString('hex');
};

// Create a new room
app.post('/api/room', (req, res) => {
    try {
        const roomId = crypto.randomBytes(4).toString('hex');
        const token = crypto.randomBytes(32).toString('hex');
        
        rooms.set(roomId, {
            token,
            connections: new Set(),
            createdAt: Date.now()
        });

        console.log(`Room created: ${roomId}`);
        res.json({ roomId, token });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Join a room
app.post('/api/room/:roomId/join', (req, res) => {
    try {
        const { roomId } = req.params;
        const { token } = req.body;

        if (!roomId || !token) {
            return res.status(400).json({ error: 'Room ID and token are required' });
        }

        const room = rooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (room.token !== token) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        if (room.connections.size >= 2) {
            return res.status(403).json({ error: 'Room is full' });
        }

        console.log(`User joined room: ${roomId}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join-room', ({ roomId, token }) => {
        const room = rooms.get(roomId);
        if (!room || room.token !== token) {
            socket.emit('error', { message: 'Invalid room or token' });
            return;
        }

        if (room.connections.size >= 2) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }

        room.connections.add(socket.id);
        socket.join(roomId);
        socket.emit('room-joined', { roomId });
    });

    socket.on('offer', (data) => {
        const room = rooms.get(data.roomId);
        if (!room || room.token !== data.token) {
            socket.emit('error', { message: 'Invalid room or token' });
            return;
        }
        socket.broadcast.to(data.roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
        const room = rooms.get(data.roomId);
        if (!room || room.token !== data.token) {
            socket.emit('error', { message: 'Invalid room or token' });
            return;
        }
        socket.broadcast.to(data.roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        const room = rooms.get(data.roomId);
        if (!room || room.token !== data.token) {
            socket.emit('error', { message: 'Invalid room or token' });
            return;
        }
        socket.broadcast.to(data.roomId).emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        for (const [roomId, room] of rooms.entries()) {
            if (room.connections.has(socket.id)) {
                room.connections.delete(socket.id);
                if (room.connections.size === 0) {
                    // Remove room if empty and older than 1 hour
                    if (Date.now() - room.createdAt > 3600000) {
                        rooms.delete(roomId);
                    }
                }
            }
        }
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/build/index.html'));
    });
}

const PORT = process.env.PORT || 5000;

// Function to find an available port
const findAvailablePort = async (startPort) => {
    const net = require('net');
    return new Promise((resolve) => {
        const server = net.createServer();
        server.unref();
        server.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
        server.listen(startPort, () => {
            server.close(() => {
                resolve(startPort);
            });
        });
    });
};

// Start server on available port
findAvailablePort(PORT).then(port => {
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`CORS enabled for: http://localhost:3000`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
}); 