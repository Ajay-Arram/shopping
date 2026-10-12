const API_BASE = (function () {
  const host = window.location.hostname || '127.0.0.1';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  // In production (Render, custom domain), communicate with current origin
  if (!isLocalhost) {
    return `${window.location.origin}/api`;
  }

  // When testing directly through Django server locally (e.g. port 8000 or 8080)
  if (window.location.port === '8000' || window.location.port === '8080') {
    return `${window.location.origin}/api`;
  }

  // When frontend is served via Live Server (port 5500, etc.)
  return `http://${host}:8000/api`;
})();

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

// Session Key Management for Guest and Authenticated Carts
function getSessionId() {
  let sessionId = localStorage.getItem('shopping_cart_session_id');

  if (!sessionId) {
    sessionId =
      'sess_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    localStorage.setItem('shopping_cart_session_id', sessionId);
  }

  return sessionId;
}

function setSessionId(newId) {
  if (newId) {
    localStorage.setItem('shopping_cart_session_id', newId);
  }
}

// Read a cookie by name
function getCookie(name) {
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const trimmed = cookie.trim();

    if (trimmed.startsWith(name + '=')) {
      return decodeURIComponent(
        trimmed.substring(name.length + 1)
      );
    }
  }

  return null;
}

let currentCsrfToken = null;

function getCsrfToken() {
  const cookieVal = getCookie('csrftoken');
  if (cookieVal) {
    return cookieVal;
  }
  if (currentCsrfToken) {
    return currentCsrfToken;
  }
  try {
    return (
      sessionStorage.getItem('shopping_cart_csrftoken') ||
      localStorage.getItem('shopping_cart_csrftoken') ||
      null
    );
  } catch (e) {
    return null;
  }
}

function setCsrfToken(token) {
  if (token) {
    currentCsrfToken = token;
    try {
      sessionStorage.setItem('shopping_cart_csrftoken', token);
      localStorage.setItem('shopping_cart_csrftoken', token);
    } catch (e) {}
  }
}

// Initialize the Django CSRF cookie and token
async function initializeCSRF() {
  try {
    const response = await fetch(`${API_BASE}/csrf/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      try {
        const data = await response.json();
        if (data && data.csrfToken) {
          setCsrfToken(data.csrfToken);
          return data.csrfToken;
        }
      } catch (parseError) {
        // Fallback to cookie
      }
      const cookieToken = getCookie('csrftoken');
      if (cookieToken) {
        setCsrfToken(cookieToken);
        return cookieToken;
      }
    } else {
      console.warn(
        'Could not initialize CSRF cookie:',
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.warn('CSRF initialization failed:', error);
  }
  return getCsrfToken();
}

// Fetch helper with session headers, CSRF handling, and error reporting
async function fetchAPI(endpoint, options = {}, isRetry = false) {
  const method = (options.method || 'GET').toUpperCase();

  // For state-modifying methods (POST, PUT, PATCH, DELETE), ensure CSRF token is available
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    let token = getCsrfToken();
    if (!token) {
      await initializeCSRF();
    }
  }

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'session-id': getSessionId(),
    ...(options.headers || {})
  };

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Save the cart session ID returned by Django.
  const returnedSession = response.headers.get('session-id');

  if (returnedSession) {
    setSessionId(returnedSession);
  }

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText || response.statusText;

    try {
      const errData = JSON.parse(responseText);
      message =
        errData.error ||
        errData.message ||
        errData.detail ||
        responseText;
    } catch (error) {
      // Keep the original response text.
    }

    // Auto-retry once on CSRF failure (e.g. rotated session/token)
    if (
      response.status === 403 &&
      !isRetry &&
      typeof message === 'string' &&
      message.toLowerCase().includes('csrf')
    ) {
      console.warn('CSRF error detected, refreshing token and retrying request...');
      const freshToken = await initializeCSRF();
      if (freshToken) {
        return fetchAPI(endpoint, options, true);
      }
    }

    console.error(
      `API error ${response.status} at ${endpoint}:`,
      message
    );

    throw new Error(
      message || `API request failed (${response.status})`
    );
  }

  return response.json();
}

// Currency Formatter (INR)
function formatPrice(value) {
  const num = parseFloat(value) || 0;

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(num);
}

// Star Rating HTML Generator
function renderRatingStars(ratingValue) {
  const rating = parseFloat(ratingValue) || 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;

  let starsHtml = '';

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHtml += '★';
    } else if (i === fullStars && hasHalf) {
      starsHtml += '★';
    } else {
      starsHtml += '☆';
    }
  }

  return `<span class="stars" title="${rating.toFixed(1)} out of 5 stars">${starsHtml}</span>`;
}

// Toast Notifications
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;

  toast.appendChild(messageSpan);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';

    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Reusable Product Card HTML Template
function createProductCardHTML(product) {
  const discountBadge = product.discount > 0
    ? `<span class="badge badge-discount product-card-badge">${product.discount}% OFF</span>`
    : '';

  const origPriceHtml =
    product.original_price &&
    parseFloat(product.original_price) > parseFloat(product.price)
      ? `<span class="product-original-price">₹${formatPrice(product.original_price)}</span>`
      : '';

  const isOutOfStock =
    product.stock <= 0 ||
    product.availability === 'Out of Stock';

  const stockClass = isOutOfStock ? 'out-of-stock' : 'in-stock';

  const stockText = isOutOfStock
    ? 'Out of Stock'
    : product.stock < 5
      ? `Only ${product.stock} left`
      : 'In Stock';

  const mainImage = product.image || DEFAULT_FALLBACK_IMAGE;

  return `
    <div class="product-card" data-id="${product.id}">
      ${discountBadge}

      <a href="product-details.html?id=${product.id}" class="product-image-container">
        <img
          src="${mainImage}"
          alt="${escapeHTML(product.name)}"
          class="product-image"
          loading="lazy"
          onerror="this.onerror=null; this.src='${DEFAULT_FALLBACK_IMAGE}';"
        />
      </a>

      <div class="product-info">
        <div class="product-brand">
          ${escapeHTML(product.brand || 'Verified')}
        </div>

        <a
          href="product-details.html?id=${product.id}"
          class="product-title"
          title="${escapeHTML(product.name)}"
        >
          ${escapeHTML(product.name)}
        </a>

        <div class="product-rating">
          ${renderRatingStars(product.rating)}
          <span class="rating-count">
            (${(Number(product.review_count) || 0).toLocaleString()})
          </span>
        </div>

        <div class="product-price-block">
          <div class="product-price">
            <span class="product-price-symbol">₹</span>${formatPrice(product.price)}
          </div>
          ${origPriceHtml}
        </div>

        <div class="product-availability ${stockClass}">
          ${stockText}
        </div>

        <div class="product-actions">
          <a href="product-details.html?id=${product.id}" class="btn btn-outline">
            Details
          </a>

          <button
            type="button"
            class="btn btn-primary add-to-cart-btn"
            ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
            onclick="handleQuickAddToCart(${product.id}, event)"
          >
            ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Escape HTML to prevent unintended markup injection
function escapeHTML(str) {
  if (str === null || str === undefined) {
    return '';
  }

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Quick Add to Cart Handler
async function handleQuickAddToCart(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const btn = event ? event.currentTarget : null;
  const originalText = btn ? btn.textContent : '';

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Adding...';
  }

  try {
    const data = await fetchAPI('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity: 1
      })
    });

    updateCartBadgeCount(data.total_items);
    showToast('Item added to your cart!', 'success');
  } catch (err) {
    console.error('Add to cart failed:', err);
    showToast(
      err.message || 'Failed to add item to cart',
      'error'
    );
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

// Cart Badge Updater
async function updateCartBadge() {
  try {
    const data = await fetchAPI('/cart/');
    updateCartBadgeCount(data.total_items);
  } catch (err) {
    console.warn('Could not load cart count:', err);
  }
}

function updateCartBadgeCount(count) {
  const badges = document.querySelectorAll('.cart-badge');

  badges.forEach(badge => {
    badge.textContent = count || 0;
  });
}

// Category List Loader
async function loadCategoriesIntoNav(selectSelector, pillsSelector) {
  try {
    const categories = await fetchAPI('/categories/');

    if (selectSelector) {
      const select = document.querySelector(selectSelector);

      if (select) {
        categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.name;
          option.textContent = cat.name;
          select.appendChild(option);
        });
      }
    }

    if (pillsSelector) {
      const pillsContainer = document.querySelector(pillsSelector);

      if (pillsContainer) {
        pillsContainer.innerHTML = categories.map(cat => `
          <a
            href="category.html?category=${encodeURIComponent(cat.name)}"
            class="category-pill-card"
          >
            <img
              src="${cat.image || DEFAULT_FALLBACK_IMAGE}"
              alt="${escapeHTML(cat.name)}"
              class="category-pill-img"
              onerror="this.onerror=null; this.src='${DEFAULT_FALLBACK_IMAGE}';"
            />
            <span class="category-pill-title">
              ${escapeHTML(cat.name)}
            </span>
          </a>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// Products Section Loader
async function loadProductsSection(containerSelector, queryParams = '') {
  const container = document.querySelector(containerSelector);

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="loading-spinner" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>
  `;

  try {
    const endpoint =
      `/products/${queryParams ? '?' + queryParams : ''}`;

    const products = await fetchAPI(endpoint);

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No Products Found</h3>
          <p>We couldn't find any items matching this criteria right now.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products
      .map(createProductCardHTML)
      .join('');
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>Unable to load products</h3>
        <p>${escapeHTML(err.message)}</p>
        <button
          class="btn btn-outline"
          onclick="loadProductsSection('${containerSelector}', '${queryParams}')"
        >
          Retry
        </button>
      </div>
    `;
  }
}

// User Authentication State in Header
async function checkAuthStatus() {
  try {
    const data = await fetchAPI('/auth/user/');
    const accountLink = document.getElementById('header-account-link');

    if (accountLink && data.authenticated && data.user) {
      accountLink.innerHTML = `
        <span>Hello, ${escapeHTML(data.user.username)}</span>
        <strong>Account & Lists</strong>
      `;

      accountLink.href = '#';
      accountLink.title = 'Click to log out';

      accountLink.onclick = async (event) => {
        event.preventDefault();

        if (
          confirm(
            `Logged in as ${data.user.username}. Do you want to log out?`
          )
        ) {
          try {
            await fetchAPI('/auth/logout/', {
              method: 'POST'
            });

            showToast('Logged out successfully', 'info');

            setTimeout(() => {
              window.location.reload();
            }, 600);
          } catch (err) {
            showToast(err.message || 'Logout failed', 'error');
          }
        }
      };
    }
  } catch (err) {
    // Authentication check is optional.
  }
}

// Header Search Form Initialization
function initHeaderSearch() {
  const searchForm = document.getElementById('header-search-form');

  if (searchForm) {
    searchForm.addEventListener('submit', event => {
      event.preventDefault();

      const input = document.getElementById('header-search-input');
      const catSelect = document.getElementById('header-category-select');

      const query = input ? input.value.trim() : '';
      const category = catSelect ? catSelect.value : '';

      let targetUrl = 'search.html';
      const params = new URLSearchParams();

      if (query) {
        params.set('search', query);
      }

      if (category) {
        params.set('category', category);
      }

      if (params.toString()) {
        targetUrl += '?' + params.toString();
      }

      window.location.href = targetUrl;
    });
  }
}

// Initialize common page listeners on load
document.addEventListener('DOMContentLoaded', async () => {
  // Request a CSRF cookie before making API requests.
  await initializeCSRF();

  updateCartBadge();
  checkAuthStatus();
  initHeaderSearch();

  loadCategoriesIntoNav(
    '#header-category-select',
    '#categories-carousel-container'
  );
});