/**
 * Fashion Store Mini - Client Core Application Script
 */

// Format tiền tệ VNĐ
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Quản lý Giỏ hàng qua localStorage
const CART_STORAGE_KEY = 'fashion_store_cart_v1';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lỗi khi đọc giỏ hàng từ localStorage:', e);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
  } catch (e) {
    console.error('Lỗi khi lưu giỏ hàng vào localStorage:', e);
  }
}

function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const badges = document.querySelectorAll('.cart-count');
  badges.forEach(badge => {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  });
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === product.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += Number(quantity);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      categoryName: product.categoryName,
      quantity: Number(quantity)
    });
  }

  saveCart(cart);
  showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
}

// Hệ thống Toast Notification
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1.1rem;">${iconMap[type] || '✓'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

// Modal Xem nhanh Sản phẩm (Quick View)
let currentModalProduct = null;

function openQuickView(product) {
  currentModalProduct = product;
  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <button class="modal-close-btn" onclick="closeQuickView()">&times;</button>
        <div class="modal-body">
          <div class="modal-img-wrap">
            <img id="modal-img" src="" alt="Product">
          </div>
          <div class="modal-details">
            <span class="modal-cat" id="modal-cat"></span>
            <h3 id="modal-title"></h3>
            <div class="product-rating" id="modal-rating"></div>
            <div class="modal-price" id="modal-price"></div>
            <p class="modal-desc" id="modal-desc"></p>
            
            <div style="margin-bottom: 8px; font-size: 0.85rem; font-weight: 700; color: var(--secondary);">Số lượng:</div>
            <div class="qty-control">
              <button class="qty-btn" onclick="changeModalQty(-1)">-</button>
              <input type="text" id="modal-qty" class="qty-input" value="1" readonly>
              <button class="qty-btn" onclick="changeModalQty(1)">+</button>
            </div>
            
            <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="addCurrentModalToCart()">
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeQuickView();
    });
  }

  document.getElementById('modal-img').src = product.image;
  document.getElementById('modal-cat').textContent = product.categoryName || product.category;
  document.getElementById('modal-title').textContent = product.name;
  document.getElementById('modal-price').textContent = formatVND(product.price);
  document.getElementById('modal-desc').textContent = product.description;
  document.getElementById('modal-qty').value = '1';

  const stars = '★'.repeat(Math.round(product.rating || 5)) + '☆'.repeat(5 - Math.round(product.rating || 5));
  document.getElementById('modal-rating').innerHTML = `<span>${stars}</span> <span>(${product.reviewsCount || 50} đánh giá)</span>`;

  modal.classList.add('active');
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function changeModalQty(delta) {
  const input = document.getElementById('modal-qty');
  let val = parseInt(input.value) || 1;
  val = Math.max(1, Math.min(val + delta, 99));
  input.value = val;
}

function addCurrentModalToCart() {
  if (!currentModalProduct) return;
  const qty = parseInt(document.getElementById('modal-qty').value) || 1;
  addToCart(currentModalProduct, qty);
  closeQuickView();
}

// ==========================================
// QUẢN LÝ TÀI KHOẢN KHÁCH HÀNG (USER AUTH)
// ==========================================

let currentCustomer = null;

async function checkCustomerAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.authenticated) {
      currentCustomer = data.user;
    } else {
      currentCustomer = null;
    }
    renderCustomerAuthButton();
  } catch (error) {
    console.error('Customer auth check failed:', error);
    currentCustomer = null;
    renderCustomerAuthButton();
  }
}

function renderCustomerAuthButton() {
  const actionsContainers = document.querySelectorAll('.nav-actions');
  actionsContainers.forEach(container => {
    let authWrapper = container.querySelector('#customer-auth-container');
    if (!authWrapper) {
      authWrapper = document.createElement('div');
      authWrapper.id = 'customer-auth-container';
      container.insertBefore(authWrapper, container.firstChild);
    }

    if (currentCustomer) {
      authWrapper.innerHTML = `
        <div class="user-dropdown-wrap">
          <button type="button" class="user-dropdown-toggle">
            👤 <span>${currentCustomer.fullName.split(' ').pop() || 'Tài khoản'}</span> ▾
          </button>
          <div class="user-dropdown-menu">
            <div style="padding: 10px 18px; font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">
              <div>Xin chào, <strong>${currentCustomer.fullName}</strong></div>
              <div>${currentCustomer.email}</div>
            </div>
            <button type="button" class="user-dropdown-item" onclick="openMyOrdersModal()">
              📦 Đơn hàng của tôi
            </button>
            <button type="button" class="user-dropdown-item danger" onclick="handleCustomerLogout()">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      `;
    } else {
      authWrapper.innerHTML = `
        <button type="button" class="user-auth-btn" onclick="openUserAuthModal('login')">
          👤 Đăng Nhập
        </button>
      `;
    }
  });
}

function openUserAuthModal(initialTab = 'login') {
  let modal = document.getElementById('user-auth-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'user-auth-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 460px; padding: 28px;">
        <button class="modal-close-btn" onclick="closeUserAuthModal()">&times;</button>
        
        <div class="auth-tabs">
          <button type="button" class="auth-tab-btn" id="tab-btn-login" onclick="switchAuthTab('login')">Đăng Nhập</button>
          <button type="button" class="auth-tab-btn" id="tab-btn-register" onclick="switchAuthTab('register')">Đăng Ký</button>
        </div>

        <!-- Login Form -->
        <div id="auth-form-login-wrap">
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.82rem; color: var(--text-muted);">
            <div>🔑 <strong>Tài khoản khách hàng demo:</strong></div>
            <div>Email: <strong>khachhang@gmail.com</strong> | Mật khẩu: <strong>123</strong></div>
            <button type="button" onclick="fillDemoUserCredentials()" style="margin-top: 6px; background: #e0e7ff; color: #4338ca; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
              Điền nhanh tài khoản demo ➔
            </button>
          </div>

          <form id="customer-login-form" onsubmit="handleCustomerLoginSubmit(event)">
            <div class="auth-form-group">
              <label>Email *</label>
              <input type="email" id="login-email" required placeholder="nhap@email.com">
            </div>
            <div class="auth-form-group">
              <label>Mật khẩu *</label>
              <input type="password" id="login-password" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 8px;" id="btn-customer-login">
              Đăng Nhập
            </button>
          </form>
        </div>

        <!-- Register Form -->
        <div id="auth-form-register-wrap" style="display: none;">
          <form id="customer-register-form" onsubmit="handleCustomerRegisterSubmit(event)">
            <div class="auth-form-group">
              <label>Họ và tên *</label>
              <input type="text" id="reg-fullname" required placeholder="Nguyễn Văn A">
            </div>
            <div class="auth-form-group">
              <label>Email *</label>
              <input type="email" id="reg-email" required placeholder="nhap@email.com">
            </div>
            <div class="auth-form-group">
              <label>Mật khẩu *</label>
              <input type="password" id="reg-password" required placeholder="Tối thiểu 3 ký tự">
            </div>
            <div class="auth-form-group">
              <label>Số điện thoại</label>
              <input type="tel" id="reg-phone" placeholder="0988xxxxxx">
            </div>
            <div class="auth-form-group">
              <label>Địa chỉ nhận hàng</label>
              <input type="text" id="reg-address" placeholder="Số nhà, đường, quận/huyện...">
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 8px;" id="btn-customer-register">
              Đăng Ký Tài Khoản
            </button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeUserAuthModal();
    });
  }

  switchAuthTab(initialTab);
  modal.classList.add('active');
}

function closeUserAuthModal() {
  const modal = document.getElementById('user-auth-modal');
  if (modal) modal.classList.remove('active');
}

function switchAuthTab(tab) {
  const loginWrap = document.getElementById('auth-form-login-wrap');
  const regWrap = document.getElementById('auth-form-register-wrap');
  const tabLoginBtn = document.getElementById('tab-btn-login');
  const tabRegBtn = document.getElementById('tab-btn-register');

  if (tab === 'login') {
    if (loginWrap) loginWrap.style.display = 'block';
    if (regWrap) regWrap.style.display = 'none';
    if (tabLoginBtn) tabLoginBtn.classList.add('active');
    if (tabRegBtn) tabRegBtn.classList.remove('active');
  } else {
    if (loginWrap) loginWrap.style.display = 'none';
    if (regWrap) regWrap.style.display = 'block';
    if (tabLoginBtn) tabLoginBtn.classList.remove('active');
    if (tabRegBtn) tabRegBtn.classList.add('active');
  }
}

function fillDemoUserCredentials() {
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  if (emailInput) emailInput.value = 'khachhang@gmail.com';
  if (passInput) passInput.value = '123';
}

async function handleCustomerLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const btn = document.getElementById('btn-customer-login');

  btn.disabled = true;
  btn.textContent = 'Đang đăng nhập...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
      currentCustomer = data.user;
      showToast(`Chào mừng bạn quay lại, ${data.user.fullName}!`, 'success');
      closeUserAuthModal();
      renderCustomerAuthButton();
      // Nếu đang ở trang giỏ hàng, autofill
      autofillCheckoutIfPossible();
    } else {
      showToast(data.message || 'Đăng nhập thất bại', 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Lỗi máy chủ khi đăng nhập', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Đăng Nhập';
  }
}

async function handleCustomerRegisterSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('reg-fullname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const address = document.getElementById('reg-address').value.trim();
  const btn = document.getElementById('btn-customer-register');

  btn.disabled = true;
  btn.textContent = 'Đang tạo tài khoản...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, phone, address })
    });

    const data = await res.json();
    if (data.success) {
      currentCustomer = data.user;
      showToast('Đăng ký tài khoản thành công!', 'success');
      closeUserAuthModal();
      renderCustomerAuthButton();
      autofillCheckoutIfPossible();
    } else {
      showToast(data.message || 'Đăng ký thất bại', 'error');
    }
  } catch (err) {
    console.error('Register error:', err);
    showToast('Lỗi máy chủ khi đăng ký', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Đăng Ký Tài Khoản';
  }
}

async function handleCustomerLogout() {
  if (confirm('Bạn có muốn đăng xuất khỏi tài khoản mua sắm?')) {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      currentCustomer = null;
      renderCustomerAuthButton();
      showToast('Đã đăng xuất tài khoản', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
}

// Modal Lịch sử đơn hàng của khách
async function openMyOrdersModal() {
  let modal = document.getElementById('my-orders-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'my-orders-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 700px; padding: 24px;">
        <button class="modal-close-btn" onclick="closeMyOrdersModal()">&times;</button>
        <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 6px;">📦 Đơn Hàng Của Tôi</h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 20px;">
          Theo dõi trạng thái và lịch sử các món đồ bạn đã đặt mua.
        </p>
        <div id="my-orders-list-content" style="max-height: 60vh; overflow-y: auto;">
          <div style="text-align: center; padding: 30px;">Đang tải đơn hàng...</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeMyOrdersModal();
    });
  }

  modal.classList.add('active');
  const contentEl = document.getElementById('my-orders-list-content');

  try {
    const res = await fetch('/api/auth/my-orders');
    const data = await res.json();

    if (data.success) {
      const orders = data.data;
      if (!orders || orders.length === 0) {
        contentEl.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 10px;">🛍️</div>
            <h4>Bạn chưa có đơn hàng nào</h4>
            <p style="font-size: 0.88rem; margin-top: 4px;">Hãy khám phá cửa hàng và chọn cho mình bộ trang phục ưng ý nhé!</p>
          </div>
        `;
        return;
      }

      const statusBadge = (st) => {
        const map = {
          pending: '<span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">Chờ xác nhận</span>',
          processing: '<span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">Đang xử lý</span>',
          shipped: '<span style="background: #ede9fe; color: #6d28d9; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">Đang giao</span>',
          delivered: '<span style="background: #d1fae5; color: #047857; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">Đã giao</span>',
          cancelled: '<span style="background: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">Đã hủy</span>'
        };
        return map[st] || st;
      };

      contentEl.innerHTML = orders.map(order => `
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 14px; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
            <div>
              <strong>Mã đơn: #${order.id}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
            <div>${statusBadge(order.status)}</div>
          </div>
          <div style="font-size: 0.88rem; margin-bottom: 8px;">
            ${(order.items || []).map(item => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>${item.name} x${item.quantity}</span>
                <strong>${formatVND(item.price * item.quantity)}</strong>
              </div>
            `).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 8px; font-size: 0.95rem;">
            <span>Tổng thanh toán:</span>
            <strong style="color: var(--primary); font-size: 1.05rem;">${formatVND(order.total)}</strong>
          </div>
        </div>
      `).join('');
    } else {
      contentEl.innerHTML = `<div style="color: red; text-align: center;">${data.message || 'Lỗi tải đơn hàng'}</div>`;
    }
  } catch (err) {
    contentEl.innerHTML = '<div style="color: red; text-align: center;">Không thể tải dữ liệu đơn hàng</div>';
  }
}

function closeMyOrdersModal() {
  const modal = document.getElementById('my-orders-modal');
  if (modal) modal.classList.remove('active');
}

function autofillCheckoutIfPossible() {
  if (!currentCustomer) return;
  const nameEl = document.getElementById('order-fullname');
  const phoneEl = document.getElementById('order-phone');
  const emailEl = document.getElementById('order-email');
  const addrEl = document.getElementById('order-address');

  if (nameEl && !nameEl.value) nameEl.value = currentCustomer.fullName;
  if (phoneEl && !phoneEl.value) phoneEl.value = currentCustomer.phone || '';
  if (emailEl && !emailEl.value) emailEl.value = currentCustomer.email || '';
  if (addrEl && !addrEl.value) addrEl.value = currentCustomer.address || '';
}

// Khởi chạy Navbar, Badge & Kiểm tra Auth User khi trang load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  checkCustomerAuth();
});
