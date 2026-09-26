/**
 * Fashion Store Mini - Admin Products Management Script
 */

let productsList = [];

async function loadAdminProducts() {
  try {
    const res = await fetch('/api/admin/products');
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      productsList = data.data;
      renderAdminProducts(productsList);
    }
  } catch (err) {
    console.error('Error fetching admin products:', err);
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">
          Không có sản phẩm nào phù hợp.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const origPriceStr = p.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.8rem;">${formatVND(p.originalPrice)}</span>` : '--';
    const badgeStr = p.badge ? `<span class="status-pill status-shipped">${p.badge}</span>` : '--';
    const stockClass = p.stock < 10 ? 'style="color: var(--danger); font-weight: 700;"' : '';

    return `
      <tr>
        <td>
          <img src="${p.image}" alt="${p.name}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${p.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Mã: ${p.id}</div>
        </td>
        <td>
          <span class="status-pill status-processing">${p.categoryName || p.category}</span>
        </td>
        <td style="font-weight: 800; color: var(--primary);">${formatVND(p.price)}</td>
        <td>${origPriceStr}</td>
        <td ${stockClass}>${p.stock}</td>
        <td>${badgeStr}</td>
        <td style="text-align: right;">
          <div class="btn-action-group" style="justify-content: flex-end;">
            <button class="btn-sm btn-sm-edit" onclick="editProductById('${p.id}')">
              ✏️ Sửa
            </button>
            <button class="btn-sm btn-sm-danger" onclick="deleteProductById('${p.id}')">
              🗑️ Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(product = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('modal-form-title');
  const form = document.getElementById('product-form');

  form.reset();

  if (product) {
    title.textContent = 'Chỉnh Sửa Sản Phẩm';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-orig-price').value = product.originalPrice || '';
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-desc').value = product.description || '';
    document.getElementById('product-badge').value = product.badge || '';
    document.getElementById('product-featured').checked = product.featured === true;
  } else {
    title.textContent = 'Thêm Sản Phẩm Mới';
    document.getElementById('product-id').value = '';
  }

  modal.classList.add('active');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
}

function editProduct(product) {
  openProductModal(product);
}

function editProductById(id) {
  const product = productsList.find(p => p.id === id);
  if (product) {
    openProductModal(product);
  }
}

async function deleteProductById(id) {
  const product = productsList.find(p => p.id === id);
  const name = product ? product.name : id;
  deleteProduct(id, name);
}

async function deleteProduct(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?\nThao tác này không thể khôi phục!`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (data.success) {
      alert('Đã xóa sản phẩm thành công!');
      loadAdminProducts();
    } else {
      alert(data.message || 'Lỗi khi xóa sản phẩm');
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Không thể kết nối đến máy chủ');
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const isEdit = Boolean(id);

  const payload = {
    name: document.getElementById('product-name').value.trim(),
    category: document.getElementById('product-category').value,
    price: Number(document.getElementById('product-price').value),
    originalPrice: document.getElementById('product-orig-price').value ? Number(document.getElementById('product-orig-price').value) : null,
    stock: Number(document.getElementById('product-stock').value) || 0,
    image: document.getElementById('product-image').value.trim(),
    description: document.getElementById('product-desc').value.trim(),
    badge: document.getElementById('product-badge').value.trim() || null,
    featured: document.getElementById('product-featured').checked
  };

  const btn = document.getElementById('btn-save-product');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  try {
    const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      alert(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm mới thành công!');
      closeProductModal();
      loadAdminProducts();
    } else {
      alert(data.message || 'Lỗi khi lưu sản phẩm');
    }
  } catch (err) {
    console.error('Save product error:', err);
    alert('Lỗi máy chủ khi lưu sản phẩm');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lưu Sản Phẩm';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await verifyAdminAuth();
  if (isAuthed) {
    loadAdminProducts();

    const searchInput = document.getElementById('admin-product-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = productsList.filter(p => p.name.toLowerCase().includes(q));
        renderAdminProducts(filtered);
      });
    }

    const form = document.getElementById('product-form');
    if (form) {
      form.addEventListener('submit', handleProductSubmit);
    }
  }
});
