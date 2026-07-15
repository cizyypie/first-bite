
async function apiRegister(email, password) {
  const res = await fetch(`${API_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function apiLogin(email, password) {
  const res = await fetch(`${API_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// --- Menu ---

async function apiGetCategories() {
  const res = await fetch(`${API_URL}/api/categories`);
  return res.json();
}

async function apiGetMenu() {
  const res = await fetch(`${API_URL}/api/menu`);
  return res.json();
}

async function apiGetMenuByCategory(categoryId) {
  const res = await fetch(`${API_URL}/api/menu/category/${categoryId}`);
  return res.json();
}

// --- Orders ---

async function apiCreateOrder(orderData) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  });
  return res.json();
}

// --- Admin: Menu Management ---

async function apiCreateCategory(data) {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiUpdateCategory(id, data) {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiDeleteCategory(id) {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}

async function apiCreateItem(data) {
  const res = await fetch(`${API_URL}/api/menu`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiUpdateItem(id, data) {
  const res = await fetch(`${API_URL}/api/menu/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiDeleteItem(id) {
  const res = await fetch(`${API_URL}/api/menu/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}

// --- Admin: Orders ---

async function apiGetOrders() {
  const res = await fetch(`${API_URL}/api/orders`, {
    headers: authHeaders(),
  });
  return res.json();
}

async function apiGetOrder(id) {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    headers: authHeaders(),
  });
  return res.json();
}

async function apiUpdateOrderStatus(id, status) {
  const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return res.json();
}

// --- Helpers ---

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}
