# Secure File & Text Sharing Platform

A real-time, peer-to-peer file and text sharing platform built with WebRTC, React, and Node.js. This application allows users to securely share files and text messages directly between devices without storing data on any server.

## Features

- 🔒 End-to-end encryption for secure communication
- 📝 Real-time text messaging
- 📁 File sharing capabilities
- 🚀 Peer-to-peer connection using WebRTC
- 🔑 Token-based room authentication
- 🎨 Modern Material-UI interface
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend:**
  - React.js
  - Material-UI
  - Socket.IO Client
  - WebRTC

- **Backend:**
  - Node.js
  - Express.js
  - Socket.IO
  - WebRTC Signaling Server

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/file-sharing-platform.git
cd file-sharing-platform
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

## Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the client:
```bash
cd client
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Deployment & testing

- **Backend does not store files.** It only handles room creation (code + token) and WebRTC signaling; file and text data is sent peer-to-peer between the two users.
- **Deploy:** Frontend (React) can go on **Vercel**. Backend (Node + Socket.IO) must run on **Render**, **Railway**, or similar (Vercel cannot run long-lived WebSockets). See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step deployment and testing.

## How to Use

1. **Create a Room:**
   - Click "Create Room" on the home page
   - A unique room ID and token will be generated
   - Share these with the person you want to connect with

2. **Join a Room:**
   - Enter the room ID and token provided by the room creator
   - Click "Join Room"

3. **Share Files and Messages:**
   - Once connected, you can send text messages
   - Use the file attachment button to share files
   - Files are transferred directly between peers

## Security Features

- Token-based room authentication
- End-to-end encryption for all communications
- No data storage on the server
- Secure WebRTC connections
- Rate limiting to prevent abuse

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [WebRTC](https://webrtc.org/) for peer-to-peer communication
- [Socket.IO](https://socket.io/) for real-time signaling
- [Material-UI](https://mui.com/) for the beautiful UI components

## Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/yourusername/file-sharing-platform](https://github.com/yourusername/file-sharing-platform) 