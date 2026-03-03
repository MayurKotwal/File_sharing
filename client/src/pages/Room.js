import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Delete as DeleteIcon,
    ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { socketManager } from '../utils/socket';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [isConnecting, setIsConnecting] = useState(true);
    const [peerConnection, setPeerConnection] = useState(null);
    const [dataChannel, setDataChannel] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const token = location.state?.token;
        if (!token) {
            navigate('/');
            return;
        }

        let pc;
        let dc;
        let isOfferer = false;

        const setupWebRTC = async () => {
            try {
                pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                });

                setPeerConnection(pc);

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketManager.sendIceCandidate({ candidate: event.candidate });
                    }
                };

                // Listen for offer/answer/ice
                socketManager.onOffer(async (data) => {
                    // This peer is the answerer
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socketManager.sendAnswer({ sdp: pc.localDescription });
                });

                socketManager.onAnswer(async (data) => {
                    // This peer is the offerer
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                });

                socketManager.onIceCandidate(async (data) => {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                });

                // Join the room via socket
                socketManager.socket.emit('join-room', { roomId, token });

                socketManager.onRoomJoined(async () => {
                    // If this is the first peer, create offer and data channel
                    isOfferer = true;
                    dc = pc.createDataChannel('fileTransfer', { ordered: true });
                    setDataChannel(dc);

                    dc.onopen = () => {
                        setIsConnecting(false);
                        console.log('Data channel opened');
                    };
                    dc.onclose = () => console.log('Data channel closed');
                    dc.onmessage = (event) => handleDataChannelMessage(event);

                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketManager.sendOffer({ sdp: pc.localDescription });
                });

                // If this is the answerer, listen for data channel
                pc.ondatachannel = (event) => {
                    dc = event.channel;
                    setDataChannel(dc);
                    dc.onopen = () => {
                        setIsConnecting(false);
                        console.log('Data channel opened');
                    };
                    dc.onclose = () => console.log('Data channel closed');
                    dc.onmessage = (event) => handleDataChannelMessage(event);
                };
            } catch (error) {
                setError('Failed to establish connection. Please try again.');
            }
        };

        function handleDataChannelMessage(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message') {
                    setMessages(prev => [...prev, {
                        type: 'received',
                        content: data.content,
                        timestamp: new Date()
                    }]);
                } else if (data.type === 'file') {
                    setFiles(prev => [...prev, {
                        name: data.name,
                        size: data.size,
                        type: data.fileType,
                        data: data.data
                    }]);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        }

        setupWebRTC();

        return () => {
            if (pc) pc.close();
            socketManager.disconnect();
        };
    }, [roomId, location.state?.token, navigate]);

    const handleSendMessage = () => {
        if (!message.trim() || !dataChannel) return;

        const messageData = {
            type: 'message',
            content: message.trim()
        };

        dataChannel.send(JSON.stringify(messageData));
        setMessages(prev => [...prev, {
            type: 'sent',
            content: message.trim(),
            timestamp: new Date()
        }]);
        setMessage('');
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file || !dataChannel) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                type: 'file',
                name: file.name,
                size: file.size,
                fileType: file.type,
                data: e.target.result
            };

            dataChannel.send(JSON.stringify(fileData));
            setFiles(prev => [...prev, {
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result
            }]);
        };
        reader.readAsDataURL(file);
    };

    const handleDownloadFile = (file) => {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Room: {roomId}
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopyRoomId}
                    >
                        Copy Room ID
                    </Button>
                </Box>

                {isConnecting ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                        <Typography variant="body1" sx={{ ml: 2 }}>
                            Connecting to peer...
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2, height: '60vh', overflow: 'auto' }}>
                                <List>
                                    {messages.map((msg, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{
                                                justifyContent: msg.type === 'sent' ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <Paper
                                                sx={{
                                                    p: 2,
                                                    bgcolor: msg.type === 'sent' ? 'primary.main' : 'grey.100',
                                                    color: msg.type === 'sent' ? 'white' : 'text.primary'
                                                }}
                                            >
                                                <Typography variant="body1">{msg.content}</Typography>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                    {msg.timestamp.toLocaleTimeString()}
                                                </Typography>
                                            </Paper>
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <TextField
                                    fullWidth
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />
                                <IconButton
                                    color="primary"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <AttachFileIcon />
                                </IconButton>
                                <Button
                                    variant="contained"
                                    endIcon={<SendIcon />}
                                    onClick={handleSendMessage}
                                    disabled={!message.trim()}
                                >
                                    Send
                                </Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Shared Files
                                </Typography>
                                <List>
                                    {files.map((file, index) => (
                                        <ListItem
                                            key={index}
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleDownloadFile(file)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemIcon>
                                                <AttachFileIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={`${(file.size / 1024).toFixed(2)} KB`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                >
                    <Alert severity="error" onClose={() => setError('')}>
                        {error}
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
};

export default Room;