const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const seedRoutes = require('./routes/seedRoutes');
const loanRoutes = require('./routes/loanRoutes');
const invoiceLoanRoutes = require('./routes/invoiceLoanRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());        // JSON body parse karne ke liye

// Request logging disabled
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// Database Connection
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/invoice-loans', invoiceLoanRoutes);

// 404 handler - place at end
app.use((req, res) => {
  if (req.url.startsWith('/api/')) {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
  }
  res.status(404).send('Not Found');
});

// Basic Route (Test ke liye)
app.get('/', (req, res) => {
  res.send('MEAN Stack Backend is Running! 🚀');
});

// Server Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});