/**
 * Fashion Store Mini - Admin Users Management Script
 */

let usersList = [];

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

// Tải danh sách người dùng từ API
async function loadAdminUsers() {
  try {
    const res = await fetch('/api/admin/users');
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      usersList = data.data;
      filterAndRenderUsers();
    } else {
      alert(data.message || 'Không thể tải danh sách người dùng');
    }
  } catch (error) {
    console.error('Lỗi khi tải danh sách người dùng:', error);
  }
}

// Lọc & hiển thị danh sách người dùng
function filterAndRenderUsers() {
  const query = (document.getElementById('admin-user-search')?.value || '').toLowerCase().trim();
  const tbody = document.getElementById('users-tbody');
  const countEl = document.getElementById('users-total-count');

  if (countEl) {
    countEl.textContent = usersList.length;
  }

  const filtered = usersList.filter(user => {
    return (
      (user.fullName && user.fullName.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone.includes(query)) ||
      (user.address && user.address.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 36px;">
          ${query ? 'Không tìm thấy người dùng nào phù hợp với từ khóa.' : 'Chưa có tài khoản người dùng nào.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(user => {
    const initials = getInitials(user.fullName);
    const ordersCount = user.ordersCount || 0;
    const spentText = user.totalSpent ? formatVND(user.totalSpent) : '0₫';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;">
              ${initials}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(user.fullName)}</div>
              <div style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(user.email)}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size: 0.88rem; font-weight: 600;">${user.phone ? escapeHtml(user.phone) : '<span style="color: var(--text-muted);">Chưa cập nhật</span>'}</span>
        </td>
        <td style="max-width: 220px; font-size: 0.85rem; color: var(--text-muted); word-break: break-word;">
          ${user.address ? escapeHtml(user.address) : 'Chưa cập nhật'}
        </td>
        <td>
          <span class="status-pill status-processing" style="font-size: 0.76rem;">📦 ${ordersCount} đơn</span>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-top: 4px;">
            ${spentText}
          </div>
        </td>
        <td style="font-size: 0.82rem; color: var(--text-muted);">
          ${formatDate(user.createdAt)}
        </td>
        <td style="text-align: right;">
          <div class="btn-action-group" style="justify-content: flex-end;">
            <button class="btn-sm btn-sm-edit" onclick="viewUserDetail('${user.id}')" title="Xem chi tiết & Đơn hàng">
              👁️ Chi tiết
            </button>
            <button class="btn-sm btn-sm-edit" onclick="openEditUserModal('${user.id}')" title="Chỉnh sửa thông tin">
              ✏️ Sửa
            </button>
            <button class="btn-sm btn-sm-danger" onclick="deleteUser('${user.id}', '${escapeAttr(user.fullName)}')" title="Xóa tài khoản">
              🗑️ Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Mở Modal Thêm Người Dùng
function openAddUserModal() {
  document.getElementById('user-id').value = '';
  document.getElementById('user-fullname').value = '';
  document.getElementById('user-email').value = '';
  document.getElementById('user-phone').value = '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-address').value = '';

  document.getElementById('user-modal-title').textContent = 'Thêm Người Dùng Mới';
  document.getElementById('user-password-label').textContent = 'Mật khẩu *';
  document.getElementById('user-password').setAttribute('required', 'required');
  document.getElementById('user-password-hint').textContent = 'Mật khẩu để khách đăng nhập tài khoản.';

  document.getElementById('user-modal').classList.add('active');
}

// Mở Modal Chỉnh Sửa Người Dùng
function openEditUserModal(userId) {
  const user = usersList.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('user-id').value = user.id;
  document.getElementById('user-fullname').value = user.fullName || '';
  document.getElementById('user-email').value = user.email || '';
  document.getElementById('user-phone').value = user.phone || '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-address').value = user.address || '';

  document.getElementById('user-modal-title').textContent = 'Cập Nhật Người Dùng';
  document.getElementById('user-password-label').textContent = 'Mật khẩu mới (Tùy chọn)';
  document.getElementById('user-password').removeAttribute('required');
  document.getElementById('user-password-hint').textContent = 'Để trống nếu muốn giữ nguyên mật khẩu hiện tại.';

  document.getElementById('user-modal').classList.add('active');
}

// Đóng Modal Thêm/Sửa
function closeUserModal() {
  document.getElementById('user-modal').classList.remove('active');
}

// Xem chi tiết hồ sơ & đơn hàng của khách
async function viewUserDetail(userId) {
  try {
    const res = await fetch(`/api/admin/users/${userId}`);
    if (!res.ok) {
      alert('Không thể tải thông tin người dùng');
      return;
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      alert(json.message || 'Lỗi dữ liệu');
      return;
    }

    const user = json.data;
    document.getElementById('modal-detail-avatar').textContent = getInitials(user.fullName);
    document.getElementById('modal-detail-fullname').textContent = user.fullName || 'Khách hàng';
    document.getElementById('modal-detail-email').textContent = user.email || '--';
    document.getElementById('modal-detail-phone').textContent = user.phone || 'Chưa có';
    document.getElementById('modal-detail-address').textContent = user.address || 'Chưa có';
    document.getElementById('modal-detail-created').textContent = formatDate(user.createdAt);
    document.getElementById('modal-detail-spent').textContent = formatVND(user.totalSpent || 0);
    document.getElementById('modal-detail-orders-count').textContent = `${user.ordersCount || 0} đơn`;

    const ordersTbody = document.getElementById('modal-user-orders-tbody');
    const orders = user.orders || [];

    if (orders.length === 0) {
      ordersTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
            Người dùng này chưa phát sinh đơn hàng nào.
          </td>
        </tr>
      `;
    } else {
      ordersTbody.innerHTML = orders.map(o => {
        const itemsCount = (o.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
        return `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 10px 14px; font-weight: 700;">${o.id}</td>
            <td style="padding: 10px 14px; color: var(--text-muted);">${formatDate(o.createdAt)}</td>
            <td style="padding: 10px 14px;">${itemsCount} món</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: var(--primary);">
              ${formatVND(o.total)}
            </td>
            <td style="padding: 10px 14px;">${getStatusBadge(o.status)}</td>
            <td style="padding: 10px 14px; text-align: center;">
              <a href="orders.html?orderId=${o.id}" class="btn-sm btn-sm-edit" style="font-size: 0.78rem;">
                Xem đơn
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }

    document.getElementById('user-detail-modal').classList.add('active');
  } catch (error) {
    console.error('Lỗi khi xem chi tiết khách hàng:', error);
    alert('Không thể tải chi tiết người dùng');
  }
}

// Đóng modal chi tiết
function closeUserDetailModal() {
  document.getElementById('user-detail-modal').classList.remove('active');
}

// Xử lý gửi form Thêm / Sửa
document.getElementById('user-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userId = document.getElementById('user-id').value;
  const fullName = document.getElementById('user-fullname').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const phone = document.getElementById('user-phone').value.trim();
  const password = document.getElementById('user-password').value;
  const address = document.getElementById('user-address').value.trim();

  const btnSave = document.getElementById('btn-save-user');
  btnSave.disabled = true;
  btnSave.textContent = 'Đang lưu...';

  try {
    const isEdit = Boolean(userId);
    const url = isEdit ? `/api/admin/users/${userId}` : '/api/admin/users';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = { fullName, email, phone, address };
    if (password) {
      payload.password = password;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm người dùng thành công!'));
      closeUserModal();
      await loadAdminUsers();
    } else {
      alert(data.message || 'Thao tác không thành công');
    }
  } catch (error) {
    console.error('Lỗi khi lưu người dùng:', error);
    alert('Đã xảy ra lỗi mạng khi lưu người dùng');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Lưu Tài Khoản';
  }
});

// Xóa Người Dùng
async function deleteUser(userId, fullName) {
  if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${fullName}" không? Hành động này không thể hoàn tác.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message || 'Đã xóa người dùng thành công');
      await loadAdminUsers();
    } else {
      alert(data.message || 'Không thể xóa người dùng');
    }
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    alert('Đã xảy ra lỗi mạng khi xóa người dùng');
  }
}

// Thoát HTML để tránh XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await verifyAdminAuth();
  if (isAuthed) {
    await loadAdminUsers();

    const searchInput = document.getElementById('admin-user-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        filterAndRenderUsers();
      });
    }
  }
});
