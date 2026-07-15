// Checkout logic — renders cart on cart.html and handles order submission

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const emptyEl = document.getElementById('cart-empty');
  const checkoutForm = document.getElementById('checkout-form');

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    if (checkoutForm) checkoutForm.style.display = 'none';
    if (totalEl) totalEl.textContent = '0';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (checkoutForm) checkoutForm.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">Rp ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
      <div class="cart-item-actions">
        <button onclick="handleQuantity('${item.id}', ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button onclick="handleQuantity('${item.id}', ${item.quantity + 1})">+</button>
        <button class="btn-remove" onclick="handleRemove('${item.id}')">x</button>
      </div>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = getCartTotal().toLocaleString();

  // If logged in, hide email/name fields (we already have them from the token)
  const guestFields = document.getElementById('guest-fields');
  if (guestFields) {
    guestFields.style.display = isLoggedIn() ? 'none' : 'block';
  }
}

function handleQuantity(itemId, newQty) {
  updateQuantity(itemId, newQty);
  renderCart();
}

function handleRemove(itemId) {
  removeFromCart(itemId);
  renderCart();
}

async function handleCheckout(e) {
  e.preventDefault();
  const errorEl = document.getElementById('checkout-error');
  const successEl = document.getElementById('checkout-success');

  const cart = getCart();
  if (cart.length === 0) return;

  const tableNumber = document.getElementById('table-number').value;

  const orderData = {
    tableNumber,
    items: cart.map(item => ({ id: item.id, price: item.price, quantity: item.quantity })),
  };

  // Guest needs to provide name and email
  if (!isLoggedIn()) {
    orderData.customerName = document.getElementById('customer-name').value;
    orderData.email = document.getElementById('customer-email').value;

    if (!orderData.customerName || !orderData.email) {
      errorEl.textContent = 'Please fill in your name and email.';
      return;
    }
  } else {
    const user = getUser();
    orderData.customerName = user.email.split('@')[0]; // fallback name from email
  }

  errorEl.textContent = '';
  const data = await apiCreateOrder(orderData);

  if (data.id) {
    clearCart();
    successEl.textContent = 'Order placed! Your order ID: ' + data.id;
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('cart-items').innerHTML = '';
  } else {
    errorEl.textContent = data.error || 'Failed to place order.';
  }
}
