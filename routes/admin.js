const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { getProducts, saveProducts, getOrders, saveOrders } = require('../utils/db');

const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123';

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
    });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.adminUser = ADMIN_USERNAME;
    return res.json({
      success: true,
      message: 'Đăng nhập quản trị viên thành công',
      user: { username: ADMIN_USERNAME }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Tên đăng nhập hoặc mật khẩu không đúng'
  });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi khi đăng xuất' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Đã đăng xuất thành công' });
  });
});

// GET /api/admin/me - Kiểm tra trạng thái đăng nhập
router.get('/me', (req, res) => {
  if (req.session && req.session.isAdmin === true) {
    return res.json({
      success: true,
      authenticated: true,
      user: { username: req.session.adminUser }
    });
  }
  return res.json({
    success: false,
    authenticated: false
  });
});

// --- CÁC ROUTE YÊU CẦU QUYỀN ADMIN DƯỚI ĐÂY ---

// GET /api/admin/stats - Thống kê KPI Dashboard
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const products = await getProducts();
    const orders = await getOrders();

    const totalProducts = products.length;
    const totalOrders = orders.length;

    // Doanh thu: tính các đơn không bị hủy
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    // 5 đơn hàng mới nhất
    const recentOrders = orders.slice(0, 5);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu thống kê' });
  }
});

// GET /api/admin/products - Lấy tất cả sản phẩm
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const products = await getProducts();
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách sản phẩm' });
  }
});

// POST /api/admin/products - Thêm sản phẩm mới
router.post('/products', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, originalPrice, stock, description, image, badge, featured } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Tên, danh mục và giá bán là thông tin bắt buộc'
      });
    }

    const categoryNames = {
      'ao': 'Áo',
      'quan': 'Quần',
      'ao-khoac': 'Áo khoác',
      'dam': 'Váy đầm',
      'phu-kien': 'Phụ kiện'
    };

    const newProduct = {
      id: 'prod-' + Date.now().toString().slice(-6),
      name: name.trim(),
      category: category.trim(),
      categoryName: categoryNames[category] || category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      stock: Number(stock) || 0,
      rating: 5.0,
      reviewsCount: 0,
      description: (description || '').trim(),
      image: (image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80').trim(),
      badge: badge ? badge.trim() : null,
      featured: featured === true || featured === 'true',
      createdAt: new Date().toISOString()
    };

    const products = await getProducts();
    products.unshift(newProduct);
    await saveProducts(products);

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công',
      data: newProduct
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm sản phẩm mới' });
  }
});

// PUT /api/admin/products/:id - Cập nhật sản phẩm
router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, originalPrice, stock, description, image, badge, featured } = req.body;

    const products = await getProducts();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const categoryNames = {
      'ao': 'Áo',
      'quan': 'Quần',
      'ao-khoac': 'Áo khoác',
      'dam': 'Váy đầm',
      'phu-kien': 'Phụ kiện'
    };

    const existing = products[index];
    const updatedCategory = category ? category.trim() : existing.category;

    products[index] = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      category: updatedCategory,
      categoryName: categoryNames[updatedCategory] || updatedCategory,
      price: price !== undefined ? Number(price) : existing.price,
      originalPrice: originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : existing.originalPrice,
      stock: stock !== undefined ? Number(stock) : existing.stock,
      description: description !== undefined ? description.trim() : existing.description,
      image: image !== undefined ? image.trim() : existing.image,
      badge: badge !== undefined ? (badge ? badge.trim() : null) : existing.badge,
      featured: featured !== undefined ? (featured === true || featured === 'true') : existing.featured,
      updatedAt: new Date().toISOString()
    };

    await saveProducts(products);

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: products[index]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật sản phẩm' });
  }
});

// DELETE /api/admin/products/:id - Xóa sản phẩm
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let products = await getProducts();
    const exists = products.some(p => p.id === id);

    if (!exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm cần xóa' });
    }

    products = products.filter(p => p.id !== id);
    await saveProducts(products);

    res.json({
      success: true,
      message: 'Đã xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm' });
  }
});

// GET /api/admin/orders - Danh sách tất cả đơn hàng
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await getOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách đơn hàng' });
  }
});

// PUT /api/admin/orders/:id - Cập nhật trạng thái đơn hàng
router.put('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    const orders = await getOrders();
    const index = orders.findIndex(o => o.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (status) orders[index].status = status;
    if (note !== undefined) orders[index].adminNote = note;
    orders[index].updatedAt = new Date().toISOString();

    await saveOrders(orders);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: orders[index]
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật đơn hàng' });
  }
});

module.exports = router;
