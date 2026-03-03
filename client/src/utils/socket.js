import { io } from 'socket.io-client';

const SOCKET_BASE_URL = 'http://localhost:5000';

class SocketManager {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.token = null;
        this.baseUrl = SOCKET_BASE_URL;
        this.isConnected = false;
    }

    setBaseUrl(url) {
        this.baseUrl = url;
        console.log('Socket base URL set to:', url);
    }

    connect() {
        console.log('Connecting to socket server...');
        this.socket = io(this.baseUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to signaling server');
            this.isConnected = true;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.isConnected = false;
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.isConnected = false;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
        });
    }

    async createRoom() {
        if (!this.isConnected) {
            this.connect();
            await new Promise(resolve => {
                this.socket.once('connect', resolve);
            });
        }

        try {
            console.log('Creating new room...');
            const response = await fetch(`${this.baseUrl}/api/room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create room');
            }

            const data = await response.json();
            console.log('Room created successfully:', data);
            this.roomId = data.roomId;
            this.token = data.token;
            return data;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    async joinRoom(roomId, token) {
        if (!this.isConnected) {
            this.connect();
            await new Promise(resolve => {
                this.socket.once('connect', resolve);
            });
        }

        try {
            console.log(`Joining room ${roomId}...`);
            const response = await fetch(`${this.baseUrl}/api/room/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to join room');
            }

            const data = await response.json();
            if (data.success) {
                console.log('Successfully joined room:', roomId);
                this.roomId = roomId;
                this.token = token;
                this.socket.emit('join-room', { roomId, token });
            }
            return data;
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    }

    sendOffer(offer) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }
        console.log('Sending offer...');
        this.socket.emit('offer', { ...offer, roomId: this.roomId, token: this.token });
    }

    sendAnswer(answer) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }
        console.log('Sending answer...');
        this.socket.emit('answer', { ...answer, roomId: this.roomId, token: this.token });
    }

    sendIceCandidate(candidate) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }
        console.log('Sending ICE candidate...');
        this.socket.emit('ice-candidate', { ...candidate, roomId: this.roomId, token: this.token });
    }

    onOffer(callback) {
        this.socket.on('offer', callback);
    }

    onAnswer(callback) {
        this.socket.on('answer', callback);
    }

    onIceCandidate(callback) {
        this.socket.on('ice-candidate', callback);
    }

    onRoomJoined(callback) {
        this.socket.on('room-joined', callback);
    }

    onError(callback) {
        this.socket.on('error', callback);
    }

    disconnect() {
        if (this.socket) {
            console.log('Disconnecting socket...');
            this.socket.disconnect();
        }
    }
}

export const socketManager = new SocketManager();