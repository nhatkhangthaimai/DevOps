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

// Khởi chạy Navbar & Badge khi trang load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
