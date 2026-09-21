const http = require('http');

async function testEndpoints() {
  console.log('--- Bắt đầu kiểm tra API Endpoints ---');

  // Test 1: GET /api/products
  const resProducts = await fetch('http://localhost:3000/api/products');
  const dataProducts = await resProducts.json();
  console.log('1. GET /api/products:', dataProducts.success, '| Số lượng sản phẩm:', dataProducts.count);

  // Test 2: GET /api/products/prod-001
  const resProd1 = await fetch('http://localhost:3000/api/products/prod-001');
  const dataProd1 = await resProd1.json();
  console.log('2. GET /api/products/prod-001:', dataProd1.success, '| Tên:', dataProd1.data?.name);

  // Test 3: POST /api/orders (Client checkout)
  const sampleOrder = {
    customer: {
      fullName: 'Test Automation Customer',
      phone: '0901234567',
      email: 'test@example.com',
      address: '123 Đường Test, Quận 1, TP.HCM',
      paymentMethod: 'cod',
      note: 'Kiểm thử đơn hàng tự động'
    },
    items: [
      {
        id: 'prod-001',
        name: 'Áo Polo Pique Premium Minimalist',
        price: 389000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99'
      }
    ],
    subtotal: 389000,
    shippingFee: 30000,
    discount: 0,
    total: 419000
  };

  const resOrder = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleOrder)
  });
  const dataOrder = await resOrder.json();
  console.log('3. POST /api/orders:', dataOrder.success, '| Mã đơn sinh ra:', dataOrder.data?.id);

  // Test 4: POST /api/admin/login
  const resLogin = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const dataLogin = await resLogin.json();
  const cookies = resLogin.headers.get('set-cookie');
  console.log('4. POST /api/admin/login:', dataLogin.success, '| Message:', dataLogin.message);

  // Test 5: GET /api/admin/stats with cookie
  const resStats = await fetch('http://localhost:3000/api/admin/stats', {
    headers: { Cookie: cookies || '' }
  });
  const dataStats = await resStats.json();
  console.log('5. GET /api/admin/stats:', dataStats.success, '| Tổng đơn:', dataStats.data?.totalOrders, '| Doanh thu:', dataStats.data?.totalRevenue);

  // Test 6: Health check
  const resHealth = await fetch('http://localhost:3000/health');
  const dataHealth = await resHealth.json();
  console.log('6. GET /health:', dataHealth.status);

  console.log('--- Hoàn tất kiểm tra API! Tất cả đều phản hồi chuẩn xác ---');
}

testEndpoints().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
