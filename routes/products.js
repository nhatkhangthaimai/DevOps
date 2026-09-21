const express = require('express');
const router = express.Router();
const { getProducts } = require('../utils/db');

// GET /api/products - Danh sách sản phẩm kèm lọc & tìm kiếm
router.get('/', async (req, res) => {
  try {
    let products = await getProducts();
    const { category, search, minPrice, maxPrice, sort, featured } = req.query;

    // Lọc theo danh mục
    if (category && category !== 'all') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Tìm kiếm theo tên hoặc mô tả
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Lọc theo khoảng giá
    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        products = products.filter(p => p.price >= min);
      }
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        products = products.filter(p => p.price <= max);
      }
    }

    // Lọc nổi bật
    if (featured === 'true') {
      products = products.filter(p => p.featured === true);
    }

    // Sắp xếp
    if (sort) {
      if (sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else if (sort === 'rating') {
        products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
    } else {
      // Mặc định sản phẩm mới nhất lên đầu
      products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách sản phẩm' });
  }
});

// GET /api/products/:id - Chi tiết 1 sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product by id:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm' });
  }
});

module.exports = router;
