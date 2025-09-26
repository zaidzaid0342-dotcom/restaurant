require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// --- 🔹 Security & Middleware ---
app.use(helmet());
app.use(express.json({ limit: '5mb' }));

// --- 🔹 CORS Setup ---
const allowedOrigins = [
  'http://localhost:3000',
  'https://restaurant-66h1.vercel.app',
  'https://restaurant-1-cyf4.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tab-Id', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Enable CORS with options
app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

// --- 🔹 Serve static uploads if any ---
app.use(
  '/uploads',
  (req, res, next) => {
    // Allow cross-origin resource sharing for images
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'public', 'uploads'))
);

// --- 🔹 Connect MongoDB ---
connectDB(process.env.MONGO_URI);

// --- 🔹 API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));

// --- 🔹 Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- 🔹 Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
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