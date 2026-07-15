// Admin dashboard logic — orders management + menu management

// --- Orders Tab ---

async function loadOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  const orders = await apiGetOrders();

  if (!orders.length) {
    container.innerHTML = '<p>No orders yet.</p>';
    return;
  }

  // Sort: newest first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = orders.map(order => `
    <div class="order-card status-${order.status.toLowerCase()}">
      <div class="order-header">
        <span class="order-id">#${order.id.slice(0, 8)}</span>
        <span class="order-status">${order.status}</span>
      </div>
      <div class="order-details">
        <p><strong>${order.customerName}</strong> - Table ${order.tableNumber}</p>
        <p>Rp ${order.totalAmount.toLocaleString()}</p>
        <p class="order-time">${new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <div class="order-actions">
        ${getStatusButtons(order.id, order.status)}
      </div>
    </div>
  `).join('');
}

function getStatusButtons(orderId, currentStatus) {
  const transitions = {
    'PENDING_PAYMENT': [],
    'PAID': ['PREPARING'],
    'PREPARING': ['READY'],
    'READY': [],
    'CANCELLED': [],
  };

  const next = transitions[currentStatus] || [];
  return next.map(status =>
    `<button class="btn-status" onclick="handleStatusUpdate('${orderId}', '${status}')">${status}</button>`
  ).join('');
}

async function handleStatusUpdate(orderId, status) {
  await apiUpdateOrderStatus(orderId, status);
  await loadOrders();
}

// --- Menu Management Tab ---

async function loadAdminMenu() {
  const container = document.getElementById('admin-menu-list');
  if (!container) return;

  const categories = await apiGetCategories();
  const items = await apiGetMenu();

  container.innerHTML = categories.map(cat => `
    <div class="admin-category">
      <div class="admin-category-header">
        <h3>${cat.name}</h3>
        <button class="btn-delete" onclick="handleDeleteCategory('${cat.id}')">Delete</button>
      </div>
      <div class="admin-items">
        ${items.filter(i => i.categoryId === cat.id).map(item => `
          <div class="admin-item">
            <span>${item.name} - Rp ${item.price.toLocaleString()}</span>
            <span class="${item.isAvailable ? 'available' : 'unavailable'}">
              ${item.isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <button class="btn-small" onclick="handleToggleAvailability('${item.id}', ${!item.isAvailable})">
              ${item.isAvailable ? 'Disable' : 'Enable'}
            </button>
            <button class="btn-delete btn-small" onclick="handleDeleteItem('${item.id}')">Delete</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// --- Category Form ---

async function handleAddCategory(e) {
  e.preventDefault();
  const name = document.getElementById('cat-name').value;
  const description = document.getElementById('cat-desc').value;
  const errorEl = document.getElementById('cat-error');

  const data = await apiCreateCategory({ name, description: description || undefined });

  if (data.id) {
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-desc').value = '';
    errorEl.textContent = '';
    await loadAdminMenu();
  } else {
    errorEl.textContent = data.error || 'Failed to create category';
  }
}

async function handleDeleteCategory(id) {
  if (!confirm('Delete this category? Items in it may become orphaned.')) return;
  await apiDeleteCategory(id);
  await loadAdminMenu();
}

// --- Item Form ---

async function handleAddItem(e) {
  e.preventDefault();
  const categoryId = document.getElementById('item-category').value;
  const name = document.getElementById('item-name').value;
  const description = document.getElementById('item-desc').value;
  const price = parseInt(document.getElementById('item-price').value);
  const errorEl = document.getElementById('item-error');

  if (!categoryId || !name || !price) {
    errorEl.textContent = 'Fill in all required fields.';
    return;
  }

  const data = await apiCreateItem({
    categoryId,
    name,
    description: description || undefined,
    price,
  });

  if (data.id) {
    document.getElementById('item-name').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-price').value = '';
    errorEl.textContent = '';
    await loadAdminMenu();
  } else {
    errorEl.textContent = data.error || 'Failed to create item';
  }
}

async function handleToggleAvailability(id, newValue) {
  await apiUpdateItem(id, { isAvailable: newValue });
  await loadAdminMenu();
}

async function handleDeleteItem(id) {
  if (!confirm('Delete this item?')) return;
  await apiDeleteItem(id);
  await loadAdminMenu();
}

// --- Load category options for the item form ---

async function loadCategoryOptions() {
  const select = document.getElementById('item-category');
  if (!select) return;

  const categories = await apiGetCategories();
  select.innerHTML = '<option value="">Select category</option>' +
    categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

// --- Tab switching ---

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).style.display = 'block';
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'orders') loadOrders();
  if (tabName === 'menu') {
    loadAdminMenu();
    loadCategoryOptions();
  }
}
