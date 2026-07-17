const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');

const app = express();
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);

// ---- CORS allowlist ----
// ALLOWED_ORIGINS is a comma-separated list of origins allowed to call this
// API from a browser (the admin panel web app). Native mobile clients
// (CustomerApp/RiderApp/WholesalerApp) aren't affected — CORS is a
// browser-enforced restriction and doesn't apply to their HTTP requests,
// which typically send no Origin header at all (allowed below).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin "${origin}" is not allowed`));
  },
  credentials: true,
};

const io = socketIo(server, { cors: corsOptions });

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Join the user to a private room based on their userId (from client query)
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  }

  // 👇 NEW: Riders join the global 'riders' room
  socket.on('joinRiderRoom', () => {
    socket.join('riders');
    console.log(`Socket ${socket.id} joined riders room`);
  });

  socket.on('disconnect', () => console.log('Socket disconnected'));
});

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

// Mount all routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/rider', require('./routes/riderRoutes'));
app.use('/api/wholesalers', require('./routes/wholesalerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/uploads', express.static('uploads'));
app.get('/', (req, res) => res.json({ message: 'Groxo API is running' }));
app.get('/api/rider/dashboard', (req, res) => res.json({ test: true }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));