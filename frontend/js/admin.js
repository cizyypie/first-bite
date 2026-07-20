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

  // Group orders by status
  const groups = {
    'PAID': { label: 'New (Paid)', orders: [] },
    'PREPARING': { label: 'Preparing', orders: [] },
    'READY': { label: 'Ready', orders: [] },
    'PENDING_PAYMENT': { label: 'Pending Payment', orders: [] },
    'CANCELLED': { label: 'Cancelled', orders: [] },
  };

  orders.forEach(order => {
    const group = groups[order.status];
    if (group) group.orders.push(order);
    else {
      if (!groups['OTHER']) groups['OTHER'] = { label: 'Other', orders: [] };
      groups['OTHER'].orders.push(order);
    }
  });

  // Sort each group newest first
  Object.values(groups).forEach(g => {
    g.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });

  container.innerHTML = Object.entries(groups)
    .filter(([_, g]) => g.orders.length > 0)
    .map(([status, group]) => `
      <div class="order-group">
        <h3 class="order-group-title">${group.label} (${group.orders.length})</h3>
        <table class="order-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Table</th>
              <th>Total</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${group.orders.map(order => `
              <tr class="status-${order.status.toLowerCase()}">
                <td class="order-id">#${order.id.slice(0, 8)}</td>
                <td>${order.customerName}</td>
                <td>${order.tableNumber}</td>
                <td>Rp ${order.totalAmount.toLocaleString()}</td>
                <td class="order-time">${new Date(order.createdAt).toLocaleTimeString()}</td>
                <td>${getStatusButtons(order.id, order.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
  if (next.length === 0) return '<span class="done-label">-</span>';

  return next.map(status =>
    `<button class="btn-status" onclick="handleStatusUpdate('${orderId}', '${status}')">Mark ${status}</button>`
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
        <button class="btn-delete btn-small" onclick="handleDeleteCategory('${cat.id}')">Delete Category</button>
      </div>
      <table class="menu-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.filter(i => i.categoryId === cat.id).map(item => `
            <tr id="item-row-${item.id}">
              <td>${item.name}</td>
              <td>Rp ${item.price.toLocaleString()}</td>
              <td>
                <span class="${item.isAvailable ? 'available' : 'unavailable'}">
                  ${item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </td>
              <td class="item-actions">
                <button class="btn-small" onclick="handleToggleAvailability('${item.id}', ${!item.isAvailable})">
                  ${item.isAvailable ? 'Disable' : 'Enable'}
                </button>
                <button class="btn-small btn-edit" onclick="showEditForm('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price}, '${item.description || ''}')">Edit</button>
                <button class="btn-delete btn-small" onclick="handleDeleteItem('${item.id}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

// --- Edit Item ---

function showEditForm(id, name, price, description) {
  // Remove any existing edit form
  const existing = document.getElementById('edit-form-container');
  if (existing) existing.remove();

  const form = document.createElement('div');
  form.id = 'edit-form-container';
  form.className = 'edit-modal';
  form.innerHTML = `
    <div class="edit-modal-content">
      <h3>Edit Item</h3>
      <form onsubmit="handleEditItem(event, '${id}')">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="edit-name" value="${name}" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" id="edit-desc" value="${description}">
        </div>
        <div class="form-group">
          <label>Price</label>
          <input type="number" id="edit-price" value="${price}" required>
        </div>
        <div class="edit-actions">
          <button type="submit" class="btn-primary">Save</button>
          <button type="button" class="btn-small" onclick="closeEditForm()">Cancel</button>
        </div>
        <p id="edit-error" class="error"></p>
      </form>
    </div>
  `;
  document.body.appendChild(form);
}

function closeEditForm() {
  const form = document.getElementById('edit-form-container');
  if (form) form.remove();
}

async function handleEditItem(e, id) {
  e.preventDefault();
  const name = document.getElementById('edit-name').value;
  const description = document.getElementById('edit-desc').value;
  const price = parseInt(document.getElementById('edit-price').value);
  const errorEl = document.getElementById('edit-error');

  const data = await apiUpdateItem(id, {
    name,
    description: description || undefined,
    price,
  });

  if (data.id) {
    closeEditForm();
    await loadAdminMenu();
  } else {
    errorEl.textContent = data.error || 'Failed to update item';
  }
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

let ordersPollingInterval = null;

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).style.display = 'block';
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Clear any existing polling
  if (ordersPollingInterval) {
    clearInterval(ordersPollingInterval);
    ordersPollingInterval = null;
  }

  if (tabName === 'orders') {
    loadOrders();
    // Auto-refresh orders every 5 seconds
    ordersPollingInterval = setInterval(loadOrders, 5000);
  }
  if (tabName === 'menu') {
    loadAdminMenu();
    loadCategoryOptions();
  }
}
