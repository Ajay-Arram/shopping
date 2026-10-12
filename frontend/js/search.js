/**
 * Shopping Cart - Search & Filtering Page Logic
 */

let currentQuery = '';
let currentCategory = '';
let currentSort = '-created_at';
let currentMinPrice = '';
let currentMaxPrice = '';
let currentInStock = false;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentQuery = urlParams.get('search') || '';
  currentCategory = urlParams.get('category') || '';

  // Update UI inputs with current params
  const headerSearchInput = document.getElementById('header-search-input');
  if (headerSearchInput && currentQuery) {
    headerSearchInput.value = currentQuery;
  }

  const searchKeywordHeading = document.getElementById('search-keyword-heading');
  if (searchKeywordHeading) {
    if (currentQuery) {
      searchKeywordHeading.textContent = `Results for "${currentQuery}"`;
    } else if (currentCategory) {
      searchKeywordHeading.textContent = `Browsing Category: "${currentCategory}"`;
    } else {
      searchKeywordHeading.textContent = 'All Products';
    }
  }

  // Setup Sidebar Categories
  loadSidebarCategories();

  // Setup Sort Dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      executeSearch();
    });
  }

  // Setup In-stock filter checkbox
  const inStockCheckbox = document.getElementById('filter-in-stock');
  if (inStockCheckbox) {
    inStockCheckbox.addEventListener('change', (e) => {
      currentInStock = e.target.checked;
      executeSearch();
    });
  }

  // Setup Price Filter Button
  const priceFilterBtn = document.getElementById('apply-price-filter-btn');
  if (priceFilterBtn) {
    priceFilterBtn.addEventListener('click', () => {
      const minInput = document.getElementById('filter-min-price');
      const maxInput = document.getElementById('filter-max-price');
      currentMinPrice = minInput ? minInput.value.trim() : '';
      currentMaxPrice = maxInput ? maxInput.value.trim() : '';
      executeSearch();
    });
  }

  executeSearch();
});

async function loadSidebarCategories() {
  const container = document.getElementById('sidebar-categories-list');
  if (!container) return;

  try {
    const categories = await fetchAPI('/categories/');
    container.innerHTML = categories.map(cat => {
      const isActive = cat.name.toLowerCase() === currentCategory.toLowerCase();
      return `
        <li class="filter-item">
          <a 
            href="#" 
            class="filter-link ${isActive ? 'active' : ''}" 
            onclick="selectCategoryFilter('${escapeHTML(cat.name)}', event)"
          >
            <span>${escapeHTML(cat.name)}</span>
            <span class="filter-count">(${cat.product_count || 0})</span>
          </a>
        </li>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load sidebar categories:', err);
  }
}

function selectCategoryFilter(categoryName, event) {
  if (event) event.preventDefault();
  currentCategory = categoryName;

  const searchKeywordHeading = document.getElementById('search-keyword-heading');
  if (searchKeywordHeading) {
    searchKeywordHeading.textContent = currentQuery ? `"${currentQuery}" in ${categoryName}` : `Category: ${categoryName}`;
  }

  // Highlight active
  document.querySelectorAll('#sidebar-categories-list .filter-link').forEach(el => {
    el.classList.remove('active');
    if (el.textContent.includes(categoryName)) {
      el.classList.add('active');
    }
  });

  executeSearch();
}

async function executeSearch() {
  const container = document.getElementById('search-results-grid');
  const countDisplay = document.getElementById('search-results-count');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <p>Searching authorized product catalog...</p>
    </div>
  `;

  const params = new URLSearchParams();
  if (currentQuery) params.set('search', currentQuery);
  if (currentCategory) params.set('category', currentCategory);
  if (currentSort) params.set('sort', currentSort);
  if (currentMinPrice) params.set('min_price', currentMinPrice);
  if (currentMaxPrice) params.set('max_price', currentMaxPrice);
  if (currentInStock) params.set('in_stock', 'true');

  try {
    const products = await fetchAPI(`/products/?${params.toString()}`);

    if (countDisplay) {
      countDisplay.innerHTML = `Showing <strong>${products.length}</strong> matching results`;
    }

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <h3>No matching products found</h3>
          <p>Try checking your spelling or use more general terms like "gaming", "apple", "headphones".</p>
          <a href="index.html" class="btn btn-outline">Explore All Products</a>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(createProductCardHTML).join('');
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>Search Error</h3>
        <p>${escapeHTML(err.message || 'An error occurred while querying products.')}</p>
        <button class="btn btn-outline" onclick="executeSearch()">Retry</button>
      </div>
    `;
  }
}
