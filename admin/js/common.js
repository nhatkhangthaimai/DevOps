/**
 * Fashion Store Mini - Admin Common Utilities & Session Guard
 */

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Kiểm tra quyền truy cập admin trên các trang nội bộ
async function verifyAdminAuth() {
  try {
    const res = await fetch('/api/admin/me');
    if (!res.ok) {
      window.location.href = 'login.html';
      return false;
    }
    const data = await res.json();
    if (!data.authenticated) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  } catch (error) {
    console.error('Auth verification failed:', error);
    window.location.href = 'login.html';
    return false;
  }
}

// Đăng xuất Admin
async function handleLogout() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?')) {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = 'login.html';
    } catch (e) {
      console.error('Logout error:', e);
      window.location.href = 'login.html';
    }
  }
}
