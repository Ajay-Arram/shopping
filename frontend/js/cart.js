/**
 * Shopping Cart - Cart Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  loadCartData();

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleProceedToCheckout);
  }

  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }
});

async function loadCartData() {
  const container = document.getElementById('cart-items-container');
  const summaryBox = document.getElementById('cart-summary-card');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading your shopping cart...</p>
    </div>
  `;

  try {
    const cart = await fetchAPI('/cart/');
    renderCart(cart);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Could not load cart</h3>
        <p>${escapeHTML(err.message || 'Unable to connect to cart service.')}</p>
        <button class="btn btn-outline" onclick="loadCartData()">Try Again</button>
      </div>
    `;
  }
}

function renderCart(cart) {
  const container = document.getElementById('cart-items-container');
  const summaryBox = document.getElementById('cart-summary-card');
  const items = cart.items || [];

  updateCartBadgeCount(cart.total_items);

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <h3>Your Shopping Cart is empty</h3>
        <p>Explore our wide selection of authorized products and add items to your cart.</p>
        <a href="index.html" class="btn btn-primary">Shop Today's Deals</a>
      </div>
    `;
    if (summaryBox) {
      summaryBox.style.display = 'none';
    }
    return;
  }

  if (summaryBox) {
    summaryBox.style.display = 'block';
  }

  const itemsHtml = items.map(item => {
    const product = item.product || {};
    const img = product.image || DEFAULT_FALLBACK_IMAGE;

    return `
      <div class="cart-item" data-product-id="${item.product_id}">
        <div class="cart-item-img-box">
          <a href="product-details.html?id=${item.product_id}">
            <img 
              src="${img}" 
              alt="${escapeHTML(product.name)}" 
              class="cart-item-img"
              onerror="this.onerror=null; this.src='${DEFAULT_FALLBACK_IMAGE}';"
            />
          </a>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-brand">${escapeHTML(product.brand || 'Authorized')}</div>
          <a href="product-details.html?id=${item.product_id}" class="cart-item-title">
            ${escapeHTML(product.name)}
          </a>
          <div class="cart-item-stock-status">In Stock</div>
          <div class="cart-item-controls">
            <div class="quantity-stepper">
              <button 
                type="button" 
                class="stepper-btn" 
                onclick="updateItemQuantity(${item.product_id}, ${item.quantity - 1})"
                title="Decrease quantity"
              >−</button>
              <span class="stepper-value">${item.quantity}</span>
              <button 
                type="button" 
                class="stepper-btn" 
                onclick="updateItemQuantity(${item.product_id}, ${item.quantity + 1})"
                title="Increase quantity"
              >+</button>
            </div>
            <button 
              type="button" 
              class="remove-btn" 
              onclick="removeCartItem(${item.product_id})"
            >Delete</button>
          </div>
        </div>
        <div class="cart-item-price-col">
          ₹${formatPrice(item.subtotal)}
          <span class="cart-item-unit-price">₹${formatPrice(product.price)} each</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="cart-header">
      <h1 class="cart-title">Shopping Cart</h1>
      <span class="cart-header-price-label">Price</span>
    </div>
    <div class="cart-items-list">
      ${itemsHtml}
    </div>
    <div class="cart-subtotal-row">
      Subtotal (${cart.total_items} items): <strong>₹${formatPrice(cart.total_price)}</strong>
    </div>
  `;

  // Update Summary card
  const summaryItemsCount = document.getElementById('summary-items-count');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryTotal = document.getElementById('summary-total');

  if (summaryItemsCount) summaryItemsCount.textContent = cart.total_items;
  if (summarySubtotal) summarySubtotal.textContent = `₹${formatPrice(cart.total_price)}`;
  if (summaryTotal) summaryTotal.textContent = `₹${formatPrice(cart.total_price)}`;
}

// Update Quantity
async function updateItemQuantity(productId, newQty) {
  try {
    const cart = await fetchAPI('/cart/update/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: newQty })
    });
    renderCart(cart);
    showToast('Cart updated', 'info');
  } catch (err) {
    showToast(err.message || 'Could not update quantity', 'error');
  }
}

// Remove item
async function removeCartItem(productId) {
  try {
    const cart = await fetchAPI('/cart/remove/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId })
    });
    renderCart(cart);
    showToast('Item removed from cart', 'info');
  } catch (err) {
    showToast(err.message || 'Could not remove item', 'error');
  }
}

// Proceed to Checkout
function handleProceedToCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

async function confirmPlaceOrder() {
  const btn = document.getElementById('place-order-confirm-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Placing Order...';
  }

  try {
    // Clear cart on backend
    await fetchAPI('/cart/clear/', { method: 'POST' });
    closeModal();
    showToast('Order placed successfully! Thank you for shopping with us.', 'success');
    loadCartData();
  } catch (err) {
    showToast(err.message || 'Order error', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Confirm Order';
    }
  }
}

function closeModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}
