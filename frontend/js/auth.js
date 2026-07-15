// Token management — stores JWT in localStorage

function saveToken(token) {
  localStorage.setItem('token', token);
}

function getToken() {
  return localStorage.getItem('token');
}

function removeToken() {
  localStorage.removeItem('token');
}

function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'ADMIN';
}

function logout() {
  removeToken();
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Update nav links based on login state
function updateAuthUI() {
  const loginLink = document.getElementById('login-link');
  const logoutLink = document.getElementById('logout-link');
  const adminLink = document.getElementById('admin-link');

  if (!loginLink) return;

  if (isLoggedIn()) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline';
    if (adminLink && isAdmin()) {
      adminLink.style.display = 'inline';
    }
  } else {
    loginLink.style.display = 'inline';
    logoutLink.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

// Handle login form
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  const data = await apiLogin(email, password);

  if (data.token) {
    saveToken(data.token);
    saveUser(data.user);
    window.location.href = isAdmin() ? 'admin.html' : 'index.html';
  } else {
    errorEl.textContent = data.error || 'Login failed';
  }
}

// Handle register form
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const errorEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');

  const data = await apiRegister(email, password);

  if (data.user) {
    successEl.textContent = 'Account created! You can now log in.';
    errorEl.textContent = '';
  } else {
    errorEl.textContent = data.error || 'Registration failed';
    successEl.textContent = '';
  }
}
