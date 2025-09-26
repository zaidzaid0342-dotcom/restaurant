require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// --- 🔹 Security & Middleware ---
app.use(helmet());
app.use(express.json({ limit: '5mb' }));

// --- 🔹 CORS ---
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// --- 🔹 Connect MongoDB ---
connectDB(process.env.MONGO_URI);

// --- 🔹 API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));

// --- 🔹 Serve uploads with CORS headers ---
app.use(
  '/uploads',
  cors(corsOptions),
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'public', 'uploads'))
);

// --- 🔹 Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- 🔹 Serve React frontend (for single deployment) ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

// --- 🔹 Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
});

// Make io accessible inside controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Client joins a room for specific order tracking
  socket.on('joinOrder', (orderId) => {
    socket.join(orderId);
    console.log(`📦 Client ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// --- 🔹 Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
