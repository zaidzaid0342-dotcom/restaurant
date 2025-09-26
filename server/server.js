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

const allowedOrigins = [
  'http://localhost:3000',
  'https://restaurant-66h1-qbmbu1eiq-mohammed-zaids-projects-e928b713.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
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
  express.static(path.join(__dirname, 'public', 'uploads')),
  (req, res, next) => {
    // Allow cross-origin image loading
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // COEP
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS
    next();
  }
);


// --- 🔹 Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- 🔹 Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('joinOrder', (orderId) => {
    socket.join(orderId);
    console.log(`📦 Client ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// --- 🔹 Global Error Handling ---
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// --- 🔹 Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Backend server running on port ${PORT}`));

