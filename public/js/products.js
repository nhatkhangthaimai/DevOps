/**
 * Fashion Store Mini - Products Catalog Script
 */

let allProducts = [];
let currentCategory = 'all';
let currentSort = 'newest';
let searchKeyword = '';
let minPriceFilter = null;
let maxPriceFilter = null;

async function fetchProducts() {
  const container = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 0; color: var(--text-muted);">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 12px; font-weight: 600;">Đang tải danh sách sản phẩm...</p>
      </div>
    `;
  }

  try {
    const params = new URLSearchParams();
    if (currentCategory && currentCategory !== 'all') params.append('category', currentCategory);
    if (searchKeyword) params.append('search', searchKeyword);
    if (minPriceFilter) params.append('minPrice', minPriceFilter);
    if (maxPriceFilter) params.append('maxPrice', maxPriceFilter);
    if (currentSort) params.append('sort', currentSort);

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      allProducts = data.data;
      renderProducts(allProducts);
      if (countEl) {
        countEl.innerHTML = `Hiển thị <strong>${allProducts.length}</strong> sản phẩm`;
      }
    } else {
      showToast(data.message || 'Không thể tải sản phẩm', 'error');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Không thể kết nối đến máy chủ</h3>
          <p>Vui lòng kiểm tra lại kết nối hoặc thử lại sau.</p>
          <button class="btn-primary" onclick="fetchProducts()">Thử lại</button>
        </div>
      `;
    }
  }
}

function renderProducts(products) {
  const container = document.getElementById('products-grid');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Không tìm thấy sản phẩm nào</h3>
        <p>Thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc giá của bạn.</p>
        <button class="btn-secondary" onclick="resetFilters()">Đặt lại bộ lọc</button>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const origPriceHtml = product.originalPrice && product.originalPrice > product.price
      ? `<span class="product-orig-price">${formatVND(product.originalPrice)}</span>`
      : '';
    
    const badgeHtml = product.badge
      ? `<span class="badge-tag badge-accent">${product.badge}</span>`
      : (product.featured ? `<span class="badge-tag badge-primary">Nổi Bật</span>` : '');

    return `
      <div class="product-card">
        <div class="product-thumb-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <div class="product-badges">
            ${badgeHtml}
          </div>
          <button class="product-quick-btn" onclick='openQuickView(${JSON.stringify(product).replace(/'/g, "&apos;")})'>
            👁 Xem nhanh
          </button>
        </div>
        <div class="product-content">
          <span class="product-cat">${product.categoryName || product.category}</span>
          <h3 class="product-name" title="${product.name}">${product.name}</h3>
          <div class="product-rating">
            <span>★ ${product.rating || 5.0}</span>
            <span>(${product.reviewsCount || 0})</span>
          </div>
          <div class="product-footer">
            <div class="price-wrap">
              <span class="product-price">${formatVND(product.price)}</span>
              ${origPriceHtml}
            </div>
            <button class="btn-add-cart" title="Thêm vào giỏ" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&apos;")})'>
              +
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterByCategory(cat) {
  currentCategory = cat;
  
  // Update sidebar active states
  document.querySelectorAll('.cat-filter-item').forEach(el => {
    if (el.dataset.category === cat) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Update URL search params without reload
  const url = new URL(window.location);
  if (cat === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', cat);
  window.history.pushState({}, '', url);

  fetchProducts();
}

function handleSearch(e) {
  searchKeyword = e.target.value.trim();
  fetchProducts();
}

function handleSortChange(e) {
  currentSort = e.target.value;
  fetchProducts();
}

function applyPriceFilter() {
  const minVal = document.getElementById('min-price-input')?.value;
  const maxVal = document.getElementById('max-price-input')?.value;
  
  minPriceFilter = minVal ? Number(minVal) : null;
  maxPriceFilter = maxVal ? Number(maxVal) : null;

  fetchProducts();
}

function resetFilters() {
  currentCategory = 'all';
  searchKeyword = '';
  minPriceFilter = null;
  maxPriceFilter = null;
  currentSort = 'newest';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const minInput = document.getElementById('min-price-input');
  if (minInput) minInput.value = '';

  const maxInput = document.getElementById('max-price-input');
  if (maxInput) maxInput.value = '';

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'newest';

  document.querySelectorAll('.cat-filter-item').forEach(el => {
    el.classList.toggle('active', el.dataset.category === 'all');
  });

  const url = new URL(window.location);
  url.search = '';
  window.history.pushState({}, '', url);

  fetchProducts();
}

// Lắng nghe sự kiện khi load trang
document.addEventListener('DOMContentLoaded', () => {
  // Đọc params từ URL nếu có
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  const searchParam = urlParams.get('search');

  if (catParam) currentCategory = catParam;
  if (searchParam) {
    searchKeyword = searchParam;
    const sInput = document.getElementById('search-input');
    if (sInput) sInput.value = searchParam;
  }

  // Active đúng danh mục trong sidebar
  document.querySelectorAll('.cat-filter-item').forEach(el => {
    el.classList.toggle('active', el.dataset.category === currentCategory);
  });

  // Gắn event debounce tìm kiếm
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => handleSearch(e), 350);
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSortChange);
  }

  fetchProducts();
});
