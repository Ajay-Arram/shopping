/**
 * Shopping Cart - Product Details Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const container = document.getElementById('product-details-container');
  if (!container) return;

  if (!productId) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Product Not Specified</h3>
        <p>No product ID was provided in the URL. Please return to the store catalog.</p>
        <a href="index.html" class="btn btn-primary">Go to Home</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Fetching authorized product specifications & details...</p>
    </div>
  `;

  try {
    const product = await fetchAPI(`/products/${productId}/`);
    renderProductDetails(product, container);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Product Not Found</h3>
        <p>${escapeHTML(err.message || 'The requested product could not be loaded.')}</p>
        <a href="index.html" class="btn btn-primary">Return to Store</a>
      </div>
    `;
  }
});

function renderProductDetails(product, container) {
  // Page title
  document.title = `${product.name} | Shopping Cart`;

  const isOutOfStock = product.stock <= 0 || product.availability === 'Out of Stock';
  const mainImage = product.image || DEFAULT_FALLBACK_IMAGE;

  // Compile all images (main + additional)
  let allImages = [mainImage];
  if (Array.isArray(product.additional_images)) {
    product.additional_images.forEach(img => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }

  // Thumbnails HTML
  const thumbsHtml = allImages.length > 1 
    ? `
      <div class="gallery-thumbnails">
        ${allImages.map((img, idx) => `
          <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchDetailImage('${escapeHTML(img)}', this)">
            <img 
              src="${escapeHTML(img)}" 
              alt="Thumbnail" 
              class="thumb-img" 
              onerror="this.onerror=null; this.src='${DEFAULT_FALLBACK_IMAGE}';"
            />
          </div>
        `).join('')}
      </div>
    `
    : '';

  // Original price and savings
  const origPriceHtml = product.original_price && parseFloat(product.original_price) > parseFloat(product.price)
    ? `
      <div class="detail-orig-price-row">
        Typical Price: <span class="detail-orig-price">₹${formatPrice(product.original_price)}</span>
        <span style="color:#cc0c39; font-weight:600; margin-left:8px;">You Save: ₹${formatPrice(product.original_price - product.price)} (${product.discount}%)</span>
      </div>
    `
    : '';

  // Features list
  let featuresHtml = '';
  if (Array.isArray(product.features) && product.features.length > 0) {
    featuresHtml = `
      <div class="features-section">
        <h3 class="features-title">About this item</h3>
        <ul class="features-list">
          ${product.features.map(f => `<li>${escapeHTML(f)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Specifications table
  let specsHtml = '';
  if (product.specifications && typeof product.specifications === 'object' && Object.keys(product.specifications).length > 0) {
    specsHtml = `
      <div class="specs-section">
        <h3 class="features-title">Product Specifications</h3>
        <table class="specs-table">
          <tbody>
            ${Object.entries(product.specifications).map(([key, val]) => `
              <tr>
                <th>${escapeHTML(key)}</th>
                <td>${escapeHTML(String(val))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Quantity dropdown options (up to available stock, max 10)
  const maxQty = Math.min(product.stock || 10, 10);
  let qtyOptions = '';
  for (let i = 1; i <= (maxQty > 0 ? maxQty : 1); i++) {
    qtyOptions += `<option value="${i}">${i}</option>`;
  }

  // Official Amazon / External Product Link
  const amazonUrl = product.product_url || `https://www.amazon.in/dp/${product.external_product_id}`;

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb-nav">
      <ul class="breadcrumb-list">
        <li class="breadcrumb-item"><a href="index.html">Home</a></li>
        <li class="breadcrumb-item"><a href="category.html?category=${encodeURIComponent(product.category || 'Electronics')}">${escapeHTML(product.category || 'Category')}</a></li>
        <li class="breadcrumb-item" style="color:#111;">${escapeHTML(product.name.substring(0, 40))}...</li>
      </ul>
    </nav>

    <div class="product-detail-layout">
      <!-- 1. Left Gallery -->
      <div class="product-gallery">
        <div class="gallery-main-view">
          <img 
            id="detail-main-img" 
            src="${mainImage}" 
            alt="${escapeHTML(product.name)}" 
            class="gallery-main-img"
            onerror="this.onerror=null; this.src='${DEFAULT_FALLBACK_IMAGE}';"
          />
        </div>
        ${thumbsHtml}
      </div>

      <!-- 2. Center Product Details -->
      <div class="product-main-details">
        <a href="search.html?search=${encodeURIComponent(product.brand || '')}" class="detail-brand-badge">
          Visit the ${escapeHTML(product.brand || 'Product')} Store
        </a>
        <h1 class="detail-title">${escapeHTML(product.name)}</h1>

        <div class="detail-meta-row">
          <div class="product-rating">
            ${renderRatingStars(product.rating)}
            <span class="rating-count">${parseFloat(product.rating).toFixed(1)} (${product.review_count.toLocaleString()} customer ratings)</span>
          </div>
          <span class="badge badge-source">${escapeHTML(product.source || 'Authorized API')}</span>
        </div>

        <div class="detail-price-box">
          <div class="detail-price-tag">
            ${product.discount > 0 ? `<span class="detail-discount-percent">-${product.discount}%</span>` : ''}
            <div class="detail-current-price"><span class="symbol">₹</span>${formatPrice(product.price)}</div>
          </div>
          ${origPriceHtml}
          <div class="detail-inclusive-text">Inclusive of all taxes. Free shipping on this item.</div>
        </div>

        ${featuresHtml}

        <div class="description-section">
          <h3 class="description-title">Product Description</h3>
          <p class="description-text">${escapeHTML(product.description || 'No detailed description available.')}</p>
        </div>

        ${specsHtml}
      </div>

      <!-- 3. Right Buy Box -->
      <div class="product-buy-box">
        <div class="buy-box-price">₹${formatPrice(product.price)}</div>

        <div class="buy-box-delivery">
          <strong>FREE Delivery</strong> available for this order.<br>
          Fastest delivery: <strong>Tomorrow, within 24 hours</strong>
        </div>

        <div class="buy-box-location">
          <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span>Delivering to your location</span>
        </div>

        <div class="buy-box-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
          ${isOutOfStock ? 'Currently unavailable / Out of stock' : (product.stock < 5 ? `Only ${product.stock} left in stock - order soon.` : 'In Stock')}
        </div>

        ${!isOutOfStock ? `
          <div class="buy-box-qty-row">
            <label for="detail-qty-select" class="qty-label">Quantity:</label>
            <select id="detail-qty-select" class="qty-select">
              ${qtyOptions}
            </select>
          </div>
        ` : ''}

        <div class="buy-box-actions">
          <button 
            type="button" 
            id="detail-add-to-cart-btn" 
            class="btn btn-primary"
            ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
            onclick="handleDetailAddToCart(${product.id})"
          >
            Add to Cart
          </button>

          <button 
            type="button" 
            id="detail-buy-now-btn" 
            class="btn btn-secondary"
            ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
            onclick="handleDetailBuyNow(${product.id})"
          >
            Buy Now
          </button>

          <a 
            href="${escapeHTML(amazonUrl)}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="view-amazon-btn"
            title="Open verified product page directly on Amazon"
          >
            <svg viewBox="0 0 24 24"><path d="M18.8 17.5c-2.3 1.7-5.5 2.6-8.4 2.6-3.9 0-7.4-1.5-10.4-4.5-.2-.2-.2-.6 0-.8.2-.2.6-.2.8 0 2.8 2.8 6.1 4.2 9.6 4.2 2.7 0 5.6-.8 7.7-2.4.3-.2.7-.2.9.1.2.3.1.7-.2.8zm2.2-1.7c-.5-.6-1.5-.9-2.3-.9-.3 0-.5.2-.5.5s.2.5.5.5c.5 0 1.1.2 1.4.6.2.2.5.3.7.1.3-.2.3-.6.2-.8l-.5-.7z"/></svg>
            View on Amazon
          </a>
        </div>

        <div class="buy-box-security">
          <div class="security-item">
            <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            <span>Secure transaction with 256-bit encryption</span>
          </div>
          <div class="security-item">
            <svg viewBox="0 0 24 24"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/></svg>
            <span>7 Days Replacement / Returnable</span>
          </div>
          <div class="security-item">
            <svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
            <span>Shopping Cart Authorized Delivery</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Gallery image switcher
function switchDetailImage(newUrl, thumbElement) {
  const mainImg = document.getElementById('detail-main-img');
  if (mainImg) {
    mainImg.src = newUrl;
  }
  document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
  if (thumbElement) {
    thumbElement.classList.add('active');
  }
}

// Add to Cart from Detail Page
async function handleDetailAddToCart(productId) {
  const qtySelect = document.getElementById('detail-qty-select');
  const qty = qtySelect ? parseInt(qtySelect.value, 10) : 1;
  const btn = document.getElementById('detail-add-to-cart-btn');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Adding to Cart...';
  }

  try {
    const data = await fetchAPI('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: qty })
    });
    updateCartBadgeCount(data.total_items);
    showToast(`Added ${qty} item(s) to your cart!`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to add item', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Add to Cart';
    }
  }
}

// Buy Now (Add to Cart and redirect to cart.html)
async function handleDetailBuyNow(productId) {
  const qtySelect = document.getElementById('detail-qty-select');
  const qty = qtySelect ? parseInt(qtySelect.value, 10) : 1;
  const btn = document.getElementById('detail-buy-now-btn');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Processing...';
  }

  try {
    const data = await fetchAPI('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: qty })
    });
    updateCartBadgeCount(data.total_items);
    window.location.href = 'cart.html';
  } catch (err) {
    showToast(err.message || 'Failed to process purchase', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Buy Now';
    }
  }
}
