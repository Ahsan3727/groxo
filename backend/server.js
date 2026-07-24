const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// ---- Fail fast on missing/weak required config ----
// Previously JWT_SECRET had no validation anywhere: if it was unset, some
// code paths would throw at request time (confusing 500s) and one code
// path (config/environment.js) silently fell back to the guessable string
// 'dev_secret'. Neither is acceptable for a secret that signs admin auth
// tokens, so the server now refuses to boot at all if this isn't set
// correctly, with a clear message instead of a runtime surprise.
const KNOWN_WEAK_JWT_SECRETS = new Set(['dev_secret', 'superSecretKey123', 'secret', 'changeme']);

function requireEnv() {
  const missing = ['JWT_SECRET', 'MONGO_URI'].filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}. Copy backend/.env.example to backend/.env and fill in real values.`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET is too short (need 32+ random characters). Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
  }
  if (KNOWN_WEAK_JWT_SECRETS.has(process.env.JWT_SECRET)) {
    console.error('JWT_SECRET is set to a known example/placeholder value. Generate a real random secret before starting the server.');
    process.exit(1);
  }
}
requireEnv();

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

  // Admin panel sockets connect with ?role=admin so they can receive the
  // real-time rider_location_update broadcasts emitted by locationController.
  if (socket.handshake.query.role === 'admin') {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  }

  // 👇 NEW: Riders join the global 'riders' room
  socket.on('joinRiderRoom', () => {
    socket.join('riders');
    console.log(`Socket ${socket.id} joined riders room`);
  });

  socket.on('disconnect', () => console.log('Socket disconnected'));
});

const { apiLimiter } = require('./middleware/rateLimiter');

app.use(cors(corsOptions));
app.use(express.json());
// Baseline rate limit on everything under /api — the stricter loginLimiter
// on /login and /register routes applies on top of this for those specific
// endpoints.
app.use('/api', apiLimiter);

connectDB();

// Mount all routes
app.use('/api/auth', require('./routes/authRoutes'));
// NOTE: addressRoutes is mounted at the more specific '/api/users/addresses'
// path BEFORE the generic '/api/users' mount below. userRoutes defines
// GET/PUT/DELETE '/:id', which would otherwise treat "addresses" as a user
// id and swallow every address request before it ever reached addressRoutes.
app.use('/api/users/addresses', require('./routes/addressRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/rider', require('./routes/riderRoutes'));
app.use('/api/wholesalers', require('./routes/wholesalerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/uploads', express.static('uploads'));
app.get('/', (req, res) => res.json({ message: 'Groxo API is running' }));
app.get('/api/rider/dashboard', (req, res) => res.json({ test: true }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));