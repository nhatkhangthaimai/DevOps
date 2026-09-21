/**
 * Fashion Store Mini - Admin Login Script
 */

function fillDemoCredentials() {
  document.getElementById('username').value = 'admin';
  document.getElementById('password').value = 'admin123';
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('login-alert');
  if (!alertBox) return;

  alertBox.style.display = 'block';
  if (type === 'error') {
    alertBox.style.backgroundColor = '#fee2e2';
    alertBox.style.color = '#dc2626';
    alertBox.style.border = '1px solid #fca5a5';
  } else {
    alertBox.style.backgroundColor = '#dcfce7';
    alertBox.style.color = '#15803d';
    alertBox.style.border = '1px solid #86efac';
  }
  alertBox.textContent = message;
}

// Kiểm tra xem đã đăng nhập từ trước chưa
async function checkAuth() {
  try {
    const res = await fetch('/api/admin/me');
    const data = await res.json();
    if (data.authenticated) {
      window.location.href = 'dashboard.html';
    }
  } catch (e) {
    // Không làm gì
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const form = document.getElementById('admin-login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      const btn = document.getElementById('btn-login');

      btn.disabled = true;
      btn.textContent = 'Đang xác thực...';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
          showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 600);
        } else {
          showAlert(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng', 'error');
          btn.disabled = false;
          btn.textContent = 'Đăng Nhập Quản Trị';
        }
      } catch (err) {
        console.error('Login error:', err);
        showAlert('Không thể kết nối đến máy chủ', 'error');
        btn.disabled = false;
        btn.textContent = 'Đăng Nhập Quản Trị';
      }
    });
  }
});
