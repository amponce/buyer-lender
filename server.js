const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const chatRooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join_chat', ({ requestId, userId }) => {
    console.log(`User ${userId} joined chat for request ${requestId}`);
    socket.join(requestId);
    
    const chatHistory = chatRooms.get(requestId) || [];
    socket.emit('chat_history', chatHistory);
  });

  socket.on('send_message', (messageData) => {
    const { requestId, senderId, receiverId, content } = messageData;
    console.log(`New message in request ${requestId} from ${senderId} to ${receiverId}`);
    
    const message = { 
      id: Date.now().toString(), 
      senderId, 
      content, 
      timestamp: new Date() 
    };

    if (!chatRooms.has(requestId)) {
      chatRooms.set(requestId, []);
    }
    chatRooms.get(requestId).push(message);

    io.to(requestId).emit('new_message', message);
    io.to(receiverId).emit('new_message_alert', { requestId: parseInt(requestId) });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
