const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());        // JSON body parse karne ke liye

// Database Connection
connectDB();

// Routes
app.use('/api/users', userRoutes);

// Basic Route (Test ke liye)
app.get('/', (req, res) => {
  res.send('MEAN Stack Backend is Running! 🚀');
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});