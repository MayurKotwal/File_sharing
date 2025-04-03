import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import { socketManager } from '../utils/socket';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    try {
      socketManager.connect();
    } catch (error) {
      setError('Failed to connect to server. Please try again.');
      console.error('Connection error:', error);
    }
    return () => {
      socketManager.disconnect();
    };
  }, []);

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setError('');
      const { roomId, token } = await socketManager.createRoom();
      navigate(`/room/${roomId}`, { state: { token } });
    } catch (error) {
      console.error('Create room error:', error);
      setError(error.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId || !token) {
      setError('Please enter both room ID and token');
      return;
    }

    try {
      setIsJoining(true);
      setError('');
      const result = await socketManager.joinRoom(roomId, token);
      if (result.success) {
        navigate(`/room/${roomId}`, { state: { token } });
      } else {
        setError(result.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Join room error:', error);
      setError(error.message || 'Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Secure File & Text Sharing
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Share files and text directly between devices using end-to-end encryption
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Create a New Room
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCreateRoom}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Join Existing Room
              </Typography>
              <TextField
                fullWidth
                label="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                margin="normal"
                error={!!error && !roomId}
                helperText={!!error && !roomId ? 'Room ID is required' : ''}
              />
              <TextField
                fullWidth
                label="Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                margin="normal"
                error={!!error && !token}
                helperText={!!error && !token ? 'Token is required' : ''}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleJoinRoom}
                disabled={isJoining}
                sx={{ mt: 2 }}
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            onClose={() => setError('')}
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Home; 