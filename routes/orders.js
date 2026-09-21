const express = require('express');
const router = express.Router();
const { getOrders, saveOrders, getProducts, saveProducts } = require('../utils/db');

// POST /api/orders - Khách hàng đặt hàng (Checkout)
router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, shippingFee = 0, discount = 0, total } = req.body;

    // Validate customer info
    if (!customer || !customer.fullName || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: Họ tên, Số điện thoại và Địa chỉ nhận hàng'
      });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng của bạn đang trống'
      });
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      id: orderId,
      customer: {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        email: (customer.email || '').trim(),
        address: customer.address.trim(),
        paymentMethod: customer.paymentMethod || 'cod',
        note: (customer.note || '').trim()
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image || ''
      })),
      subtotal: Number(subtotal) || 0,
      shippingFee: Number(shippingFee) || 0,
      discount: Number(discount) || 0,
      total: Number(total) || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orders = await getOrders();
    orders.unshift(newOrder);
    await saveOrders(orders);

    // Cập nhật tồn kho sản phẩm (giảm stock)
    try {
      const products = await getProducts();
      let updated = false;
      items.forEach(orderItem => {
        const prod = products.find(p => p.id === orderItem.id);
        if (prod && prod.stock >= orderItem.quantity) {
          prod.stock -= orderItem.quantity;
          updated = true;
        }
      });
      if (updated) {
        await saveProducts(products);
      }
    } catch (err) {
      console.warn('Cập nhật tồn kho thất bại:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công! Cảm ơn bạn đã mua sắm.',
      data: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng'
    });
  }
});

// GET /api/orders/:id - Tra cứu đơn hàng
router.get('/:id', async (req, res) => {
  try {
    const orders = await getOrders();
    const order = orders.find(o => o.id.toUpperCase() === req.params.id.toUpperCase());

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng với mã này'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error finding order:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tra cứu đơn hàng'
    });
  }
});

module.exports = router;
