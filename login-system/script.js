const STORAGE_KEYS = {
  users: 'yvonne_users',
  session: 'yvonne_active_user',
};

const demoUser = {
  id: createId(),
  name: 'Demo User',
  email: 'demo@mail.com',
  password: '123456',
  createdAt: new Date().toISOString(),
  loginCount: 0,
  lastLoginAt: '',
};

const tabs = document.querySelectorAll('.tabs button');
const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const authCard = document.querySelector('#authCard');
const dashboard = document.querySelector('#dashboard');
const welcome = document.querySelector('#welcome');
const loginCount = document.querySelector('#loginCount');
const lastLogin = document.querySelector('#lastLogin');
const profileForm = document.querySelector('#profileForm');
const profileName = document.querySelector('#profileName');

let users = loadUsers();

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadUsers() {
  const savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');

  if (!savedUsers.length) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([demoUser]));
    return [demoUser];
  }

  return savedUsers.map((user) => ({
    id: user.id || createId(),
    createdAt: user.createdAt || new Date().toISOString(),
    loginCount: Number(user.loginCount || 0),
    lastLoginAt: user.lastLoginAt || '',
    ...user,
  }));
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getValue(selector) {
  return document.querySelector(selector).value.trim();
}

function setMessage(elementId, message = '', type = 'error') {
  const element = document.querySelector(`#${elementId}`);
  element.textContent = message;
  element.dataset.type = type;
}

function setFieldError(fieldId, message = '') {
  const input = document.querySelector(`#${fieldId}`);
  const error = document.querySelector(`#${fieldId}Error`);

  input.classList.toggle('invalid', Boolean(message));
  error.textContent = message;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatDate(value) {
  if (!value) return '首次登入';

  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function switchTab(targetTab) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === targetTab;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  loginForm.classList.toggle('hidden', targetTab !== 'login');
  registerForm.classList.toggle('hidden', targetTab !== 'register');
  clearMessages();
}

function clearMessages() {
  [
    'loginEmail',
    'loginPassword',
    'regName',
    'regEmail',
    'regPassword',
  ].forEach((fieldId) => setFieldError(fieldId));

  ['loginMsg', 'regMsg', 'profileMsg'].forEach((id) => setMessage(id));
}

function passwordScore(password) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function updatePasswordStrength() {
  const password = document.querySelector('#regPassword').value;
  const strength = document.querySelector('.strength');
  const score = passwordScore(password);

  strength.dataset.level = password ? Math.min(score, 4) : 0;
}

function showDashboard(user) {
  authCard.classList.add('hidden');
  dashboard.classList.remove('hidden');
  welcome.textContent = `歡迎回來，${user.name}！你可以在這裡延伸會員資料、訂單紀錄或後台首頁。`;
  loginCount.textContent = user.loginCount;
  lastLogin.textContent = formatDate(user.lastLoginAt);
  profileName.value = user.name;
}

function createSession(user, shouldRemember) {
  const now = new Date().toISOString();
  const previousLogin = user.lastLoginAt;

  user.loginCount = Number(user.loginCount || 0) + 1;
  user.lastLoginAt = now;
  saveUsers();

  if (shouldRemember) {
    localStorage.setItem(STORAGE_KEYS.session, user.email);
  } else {
    sessionStorage.setItem(STORAGE_KEYS.session, user.email);
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  showDashboard({ ...user, lastLoginAt: previousLogin });
}

function getActiveUser() {
  const email =
    localStorage.getItem(STORAGE_KEYS.session) ||
    sessionStorage.getItem(STORAGE_KEYS.session);

  return users.find((user) => user.email === email);
}

function validateLogin(email, password) {
  let isValid = true;

  if (!isEmail(email)) {
    setFieldError('loginEmail', '請輸入有效的 Email。');
    isValid = false;
  }

  if (!password) {
    setFieldError('loginPassword', '請輸入密碼。');
    isValid = false;
  }

  return isValid;
}

function validateRegistration(name, email, password) {
  let isValid = true;

  if (name.length < 2) {
    setFieldError('regName', '姓名至少需要 2 個字元。');
    isValid = false;
  }

  if (!isEmail(email)) {
    setFieldError('regEmail', '請輸入有效的 Email。');
    isValid = false;
  }

  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    setFieldError('regEmail', '這個 Email 已經註冊。');
    isValid = false;
  }

  if (password.length < 6) {
    setFieldError('regPassword', '密碼至少需要 6 碼。');
    isValid = false;
  }

  return isValid;
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

document.querySelectorAll('[data-toggle-password]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.querySelector(`#${button.dataset.togglePassword}`);
    const shouldShow = input.type === 'password';

    input.type = shouldShow ? 'text' : 'password';
    button.textContent = shouldShow ? '隱藏' : '顯示';
  });
});

document.querySelector('#regPassword').addEventListener('input', updatePasswordStrength);

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearMessages();

  const email = getValue('#loginEmail').toLowerCase();
  const password = document.querySelector('#loginPassword').value;

  if (!validateLogin(email, password)) return;

  const user = users.find(
    (item) => item.email.toLowerCase() === email && item.password === password,
  );

  if (!user) {
    setMessage('loginMsg', '帳號或密碼錯誤，可試 demo@mail.com / 123456。');
    return;
  }

  createSession(user, document.querySelector('#rememberMe').checked);
});

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearMessages();

  const name = getValue('#regName');
  const email = getValue('#regEmail').toLowerCase();
  const password = document.querySelector('#regPassword').value;

  if (!validateRegistration(name, email, password)) return;

  users.push({
    id: createId(),
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
    loginCount: 0,
    lastLoginAt: '',
  });
  saveUsers();

  registerForm.reset();
  updatePasswordStrength();
  setMessage('regMsg', '註冊成功，請切回登入。', 'success');
});

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const activeEmail =
    localStorage.getItem(STORAGE_KEYS.session) ||
    sessionStorage.getItem(STORAGE_KEYS.session);
  const user = users.find((item) => item.email === activeEmail);
  const nextName = profileName.value.trim();

  if (!user || nextName.length < 2) {
    setMessage('profileMsg', '姓名至少需要 2 個字元。');
    return;
  }

  user.name = nextName;
  saveUsers();
  showDashboard(user);
  setMessage('profileMsg', '會員資料已更新。', 'success');
});

document.querySelector('#logout').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.session);
  sessionStorage.removeItem(STORAGE_KEYS.session);
  dashboard.classList.add('hidden');
  authCard.classList.remove('hidden');
  loginForm.reset();
  switchTab('login');
});

const activeUser = getActiveUser();
if (activeUser) {
  showDashboard(activeUser);
}
