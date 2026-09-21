/**
 * Fashion Store Mini - Cart & Checkout Script
 */

let appliedDiscount = 0;
let appliedDiscountCode = '';

function renderCart() {
  const cart = getCart();
  const listEl = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('cart-empty-view');
  const contentEl = document.getElementById('cart-content-view');
  const countBadge = document.getElementById('cart-items-count');

  if (!listEl) return;

  if (countBadge) {
    countBadge.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  if (cart.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'grid';

  listEl.innerHTML = cart.map((item, index) => {
    const itemTotal = item.price * item.quantity;
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="item-unit-price">${formatVND(item.price)}</div>
        </div>
        <div class="qty-control" style="margin-bottom: 0;">
          <button class="qty-btn" onclick="updateItemQuantity(${index}, -1)">-</button>
          <input type="text" class="qty-input" value="${item.quantity}" readonly>
          <button class="qty-btn" onclick="updateItemQuantity(${index}, 1)">+</button>
        </div>
        <div class="cart-item-total">
          ${formatVND(itemTotal)}
        </div>
        <button class="cart-item-remove" title="Xóa món này" onclick="removeItem(${index})">
          &times;
        </button>
      </div>
    `;
  }).join('');

  calculateSummary();
}

function updateItemQuantity(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;

  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
    showToast('Đã xóa sản phẩm khỏi giỏ', 'info');
  }

  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  const cart = getCart();
  if (!cart[index]) return;

  const removed = cart.splice(index, 1);
  saveCart(cart);
  renderCart();
  showToast(`Đã xóa "${removed[0].name}"`, 'info');
}

function clearAllCart() {
  if (confirm('Bạn có chắc muốn làm trống toàn bộ giỏ hàng?')) {
    saveCart([]);
    appliedDiscount = 0;
    appliedDiscountCode = '';
    renderCart();
    showToast('Đã làm trống giỏ hàng', 'info');
  }
}

function calculateSummary() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Miễn phí vận chuyển cho đơn trên 500.000₫, dưới 500k phí ship 30.000₫
  let shippingFee = subtotal > 500000 || subtotal === 0 ? 0 : 30000;
  if (appliedDiscountCode === 'FREESHIP') {
    shippingFee = 0;
  }

  const finalTotal = Math.max(0, subtotal + shippingFee - appliedDiscount);

  document.getElementById('summary-subtotal').textContent = formatVND(subtotal);
  document.getElementById('summary-shipping').textContent = shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee);
  document.getElementById('summary-discount').textContent = appliedDiscount > 0 ? `-${formatVND(appliedDiscount)}` : '0₫';
  document.getElementById('summary-total').textContent = formatVND(finalTotal);

  return { subtotal, shippingFee, discount: appliedDiscount, total: finalTotal };
}

function applyPromoCode() {
  const input = document.getElementById('promo-input');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (code === 'GIAM10') {
    appliedDiscount = Math.round(subtotal * 0.1);
    appliedDiscountCode = 'GIAM10';
    showToast('Áp dụng mã GIAM10 thành công! Giảm 10%', 'success');
  } else if (code === 'FREESHIP') {
    appliedDiscount = 0;
    appliedDiscountCode = 'FREESHIP';
    showToast('Áp dụng mã FREESHIP thành công! Miễn phí vận chuyển', 'success');
  } else if (code === '') {
    appliedDiscount = 0;
    appliedDiscountCode = '';
  } else {
    showToast('Mã khuyến mãi không hợp lệ hoặc đã hết hạn', 'error');
    return;
  }

  calculateSummary();
}

// Checkout Modal
function openCheckoutModal() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Giỏ hàng trống, vui lòng chọn sản phẩm trước', 'info');
    return;
  }

  const modal = document.getElementById('checkout-modal');
  if (modal) {
    const { total } = calculateSummary();
    const modalTotal = document.getElementById('modal-checkout-total');
    if (modalTotal) modalTotal.textContent = formatVND(total);
    if (typeof autofillCheckoutIfPossible === 'function') {
      autofillCheckoutIfPossible();
    }
    modal.classList.add('active');
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('active');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-order');
  const cart = getCart();

  if (cart.length === 0) {
    showToast('Giỏ hàng trống!', 'error');
    return;
  }

  const fullName = document.getElementById('order-fullname').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  const email = document.getElementById('order-email').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const note = document.getElementById('order-note').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';

  if (!fullName || !phone || !address) {
    showToast('Vui lòng điền đủ Tên, Số điện thoại và Địa chỉ!', 'error');
    return;
  }

  const summary = calculateSummary();

  const payload = {
    customer: {
      fullName,
      phone,
      email,
      address,
      paymentMethod,
      note
    },
    items: cart,
    subtotal: summary.subtotal,
    shippingFee: summary.shippingFee,
    discount: summary.discount,
    total: summary.total
  };

  btn.disabled = true;
  btn.innerHTML = 'Đang xử lý đặt hàng...';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      // Xóa sạch giỏ hàng
      saveCart([]);
      closeCheckoutModal();
      showOrderSuccess(data.data);
    } else {
      showToast(data.message || 'Lỗi khi gửi đơn hàng', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Xác nhận đặt hàng';
    }
  } catch (error) {
    console.error('Checkout error:', error);
    showToast('Lỗi máy chủ khi xử lý đơn hàng', 'error');
    btn.disabled = false;
    btn.innerHTML = 'Xác nhận đặt hàng';
  }
}

function showOrderSuccess(order) {
  const mainView = document.getElementById('cart-container-wrap');
  if (!mainView) return;

  mainView.innerHTML = `
    <div class="cart-card order-success-card" style="max-width: 650px; margin: 40px auto;">
      <div class="success-icon-circle">✓</div>
      <h3>Đặt Hàng Thành Công!</h3>
      <p style="color: var(--text-muted); margin-bottom: 8px;">
        Cảm ơn bạn đã tin tưởng mua sắm tại <strong>Fashion Store</strong>.
      </p>
      <p style="color: var(--text-muted);">Mã đơn hàng của bạn là:</p>
      <div class="order-code-badge">${order.id}</div>
      <div style="background: var(--bg-body); border-radius: var(--radius-md); padding: 18px; text-align: left; margin: 20px 0; font-size: 0.9rem;">
        <div style="margin-bottom: 6px;"><strong>Người nhận:</strong> ${order.customer.fullName} (${order.customer.phone})</div>
        <div style="margin-bottom: 6px;"><strong>Địa chỉ:</strong> ${order.customer.address}</div>
        <div style="margin-bottom: 6px;"><strong>Thanh toán:</strong> ${order.customer.paymentMethod === 'cod' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản qua ngân hàng (QR Code)'}</div>
        <div><strong>Tổng thanh toán:</strong> <span style="color: var(--primary); font-weight: 800; font-size: 1.05rem;">${formatVND(order.total)}</span></div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <a href="products.html" class="btn-primary">Tiếp tục mua sắm</a>
        <a href="index.html" class="btn-secondary">Về trang chủ</a>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }
});
