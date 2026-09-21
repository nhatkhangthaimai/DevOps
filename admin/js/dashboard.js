/**
 * Fashion Store Mini - Admin Dashboard Logic
 */

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

async function loadDashboardStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (!data.success) return;

    const stats = data.data;

    document.getElementById('kpi-revenue').textContent = formatVND(stats.totalRevenue || 0);
    document.getElementById('kpi-orders').textContent = stats.totalOrders || 0;
    document.getElementById('kpi-products').textContent = stats.totalProducts || 0;
    document.getElementById('kpi-pending').textContent = stats.pendingOrders || 0;

    const tbody = document.getElementById('recent-orders-tbody');
    if (!stats.recentOrders || stats.recentOrders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
            Chưa có đơn hàng nào phát sinh.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = stats.recentOrders.map(order => {
      const itemsCount = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
      return `
        <tr>
          <td><strong>${order.id}</strong></td>
          <td>
            <div style="font-weight: 700;">${order.customer.fullName}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${order.customer.phone}</div>
          </td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">
            ${formatDate(order.createdAt)}
          </td>
          <td>${itemsCount} món</td>
          <td style="font-weight: 800; color: var(--primary);">
            ${formatVND(order.total)}
          </td>
          <td>${getStatusBadge(order.status)}</td>
          <td>
            <a href="orders.html?orderId=${order.id}" class="btn-sm btn-sm-edit">
              Chi tiết
            </a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await verifyAdminAuth();
  if (isAuthed) {
    loadDashboardStats();
  }
});
