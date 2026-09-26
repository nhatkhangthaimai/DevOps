/**
 * Fashion Store Mini - Admin Orders Management Script
 */

let ordersList = [];
let currentViewingOrderId = null;

function getStatusBadge(status) {
  const statusMap = {
    pending: { label: 'Chờ xác nhận', class: 'status-pending' },
    processing: { label: 'Đang xử lý', class: 'status-processing' },
    shipped: { label: 'Đang giao', class: 'status-shipped' },
    delivered: { label: 'Đã giao', class: 'status-delivered' },
    cancelled: { label: 'Đã hủy', class: 'status-cancelled' }
  };

  const s = statusMap[status] || { label: status, class: 'status-pending' };
  return `<span class="status-pill ${s.class}">● ${s.label}</span>`;
}

function formatDate(isoString) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadAdminOrders() {
  try {
    const res = await fetch('/api/admin/orders');
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      ordersList = data.data;
      filterAndRenderOrders();

      // Kiểm tra nếu có param orderId trên URL
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('orderId');
      if (targetId) {
        const found = ordersList.find(o => o.id.toUpperCase() === targetId.toUpperCase());
        if (found) {
          openOrderModal(found);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching admin orders:', err);
  }
}

function filterAndRenderOrders() {
  const searchQ = document.getElementById('admin-order-search')?.value.toLowerCase().trim() || '';
  const statusVal = document.getElementById('status-filter')?.value || 'all';

  let filtered = [...ordersList];

  if (statusVal !== 'all') {
    filtered = filtered.filter(o => o.status === statusVal);
  }

  if (searchQ) {
    filtered = filtered.filter(o =>
      o.id.toLowerCase().includes(searchQ) ||
      (o.customer.fullName && o.customer.fullName.toLowerCase().includes(searchQ)) ||
      (o.customer.phone && o.customer.phone.includes(searchQ))
    );
  }

  const countEl = document.getElementById('orders-total-count');
  if (countEl) countEl.textContent = filtered.length;

  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
          Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const paymentStr = order.customer.paymentMethod === 'cod' ? '💵 Tiền mặt (COD)' : '📱 Chuyển khoản QR';
    return `
      <tr>
        <td><strong>${order.id}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${order.customer.fullName}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${order.customer.phone}</div>
        </td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">
          ${formatDate(order.createdAt)}
        </td>
        <td style="font-size: 0.85rem;">${paymentStr}</td>
        <td style="font-weight: 800; color: var(--primary);">
          ${formatVND(order.total)}
        </td>
        <td>${getStatusBadge(order.status)}</td>
        <td style="text-align: right;">
          <button class="btn-sm btn-sm-primary" onclick="openOrderModalById('${order.id}')">
            👁 Xem & Cập nhật
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openOrderModalById(id) {
  const order = ordersList.find(o => o.id === id);
  if (order) {
    openOrderModal(order);
  }
}

function openOrderModal(order) {
  currentViewingOrderId = order.id;
  const modal = document.getElementById('order-detail-modal');

  document.getElementById('modal-order-id').textContent = `Chi Tiết Đơn Hàng #${order.id}`;
  document.getElementById('modal-cust-name').textContent = order.customer.fullName;
  document.getElementById('modal-cust-phone').textContent = order.customer.phone;
  document.getElementById('modal-cust-address').textContent = order.customer.address;
  document.getElementById('modal-cust-note').textContent = order.customer.note || 'Không có';
  document.getElementById('modal-order-total').textContent = formatVND(order.total);

  document.getElementById('modal-update-status').value = order.status;
  document.getElementById('modal-admin-note').value = order.adminNote || '';

  const itemsTbody = document.getElementById('modal-items-tbody');
  itemsTbody.innerHTML = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 14px; display: flex; align-items: center; gap: 10px;">
        <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
        <span style="font-weight: 600;">${item.name}</span>
        ${item.size ? `<span style="margin-left: 6px; padding: 2px 6px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">Size: ${item.size}</span>` : ''}
      </td>
      <td style="padding: 10px 14px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 14px; text-align: right;">${formatVND(item.price)}</td>
      <td style="padding: 10px 14px; text-align: right; font-weight: 700;">${formatVND(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  modal.classList.add('active');
}

function closeOrderModal() {
  const modal = document.getElementById('order-detail-modal');
  if (modal) modal.classList.remove('active');
  currentViewingOrderId = null;
}

async function saveOrderStatus() {
  if (!currentViewingOrderId) return;

  const status = document.getElementById('modal-update-status').value;
  const note = document.getElementById('modal-admin-note').value.trim();
  const btn = document.getElementById('btn-save-order-status');

  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  try {
    const res = await fetch(`/api/admin/orders/${currentViewingOrderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    });

    const data = await res.json();
    if (data.success) {
      alert('Đã cập nhật trạng thái đơn hàng thành công!');
      closeOrderModal();
      loadAdminOrders();
    } else {
      alert(data.message || 'Lỗi khi cập nhật đơn hàng');
    }
  } catch (err) {
    console.error('Update order error:', err);
    alert('Không thể kết nối đến máy chủ');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lưu Cập Nhật';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await verifyAdminAuth();
  if (isAuthed) {
    loadAdminOrders();

    const searchInput = document.getElementById('admin-order-search');
    if (searchInput) {
      searchInput.addEventListener('input', filterAndRenderOrders);
    }

    const statusSelect = document.getElementById('status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', filterAndRenderOrders);
    }
  }
});
