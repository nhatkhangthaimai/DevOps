require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware phân tích dữ liệu request
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình Session Authentication
app.use(
  session({
    name: 'fashion_store_sid',
    secret: process.env.SESSION_SECRET || 'devops_fashion_secret_key_2026_secure',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
      maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    }
  })
);

// Phục vụ static files cho Khách hàng
app.use(express.static(path.join(__dirname, 'public')));

// Phục vụ static files cho Admin Portal
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Điều hướng /admin về dashboard hoặc login
app.get('/admin', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard.html');
  }
  return res.redirect('/admin/login.html');
});

// Đăng ký API Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint cho Docker / Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Fallback 404 cho API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint không tồn tại' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra sự cố nội bộ trên máy chủ',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Fashion Store Mini đang hoạt động!`);
  console.log(`🌐 Website khách hàng : http://localhost:${PORT}`);
  console.log(`🛡️ Cổng quản trị Admin: http://localhost:${PORT}/admin`);
  console.log(`👤 Tài khoản Admin demo: admin / admin123`);
  console.log('====================================================');
});
