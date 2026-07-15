// Cart state — stored in localStorage so it persists across page reloads

function getCart() {
  const raw = localStorage.getItem('cart');
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
  }

  saveCart(cart);
}

function removeFromCart(itemId) {
  const cart = getCart().filter(i => i.id !== itemId);
  saveCart(cart);
}

function updateQuantity(itemId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.id === itemId);

  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      saveCart(cart.filter(i => i.id !== itemId));
    } else {
      saveCart(cart);
    }
  }
}

function clearCart() {
  localStorage.removeItem('cart');
  updateCartBadge();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }
}
