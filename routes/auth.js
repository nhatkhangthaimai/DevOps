const express = require('express');
const router = express.Router();
const { getUsers, saveUsers, getOrders } = require('../utils/db');

// POST /api/auth/register - Đăng ký tài khoản khách hàng
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên, email và mật khẩu là các trường bắt buộc'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getUsers();

    // Kiểm tra email đã tồn tại chưa
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.'
      });
    }

    const newUser = {
      id: 'user-' + Date.now().toString().slice(-6),
      fullName: fullName.trim(),
      email: cleanEmail,
      password: password.trim(),
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);

    // Tự động đăng nhập sau khi đăng ký
    const sessionUserData = {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      address: newUser.address
    };

    req.session.user = sessionUserData;

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: sessionUserData
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký tài khoản' });
  }
});

// POST /api/auth/login - Đăng nhập khách hàng
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ email và mật khẩu'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password.trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    const sessionUserData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address
    };

    req.session.user = sessionUserData;

    res.json({
      success: true,
      message: `Chào mừng trở lại, ${user.fullName}!`,
      user: sessionUserData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập' });
  }
});

// POST /api/auth/logout - Đăng xuất khách hàng
router.post('/logout', (req, res) => {
  req.session.user = null;
  res.json({
    success: true,
    message: 'Đã đăng xuất tài khoản thành công'
  });
});

// GET /api/auth/me - Kiểm tra phiên đăng nhập khách hàng
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      success: true,
      authenticated: true,
      user: req.session.user
    });
  }
  return res.json({
    success: false,
    authenticated: false
  });
});

// GET /api/auth/my-orders - Lịch sử đơn hàng của khách
router.get('/my-orders', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để xem lịch sử đơn hàng'
      });
    }

    const currentUser = req.session.user;
    const orders = await getOrders();

    // Lọc theo userId hoặc theo email khách hàng
    const userOrders = orders.filter(o =>
      (o.userId && o.userId === currentUser.id) ||
      (o.customer && o.customer.email && o.customer.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (o.customer && o.customer.phone && currentUser.phone && o.customer.phone === currentUser.phone)
    );

    res.json({
      success: true,
      data: userOrders
    });
  } catch (error) {
    console.error('My orders error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải lịch sử đơn hàng' });
  }
});

module.exports = router;
