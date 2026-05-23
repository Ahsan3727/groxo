const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');

const app = express();

// ---- CORS: Allow all origins for development ----
app.use(cors());

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

app.get('/', (req, res) => res.json({ message: 'Groxo API is running' }));
app.get('/api/rider/dashboard', (req, res) => res.json({ test: true }));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));