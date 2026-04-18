/**
 * TaskFlow Pro — Auth Module
 * Handles login, register, session, redirects.
 */

const Auth = {
  TOKEN_KEY: 'tfp_token',
  USER_KEY:  'tfp_user',

  getToken() { return localStorage.getItem(this.TOKEN_KEY); },
  getUser()  {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); }
    catch { return null; }
  },

  isLoggedIn() { return !!this.getToken(); },

  saveSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = '/dashboard.html';
    }
  },

  async logout() {
    await Api.auth.logout().catch(() => {});
    this.clearSession();
    window.location.href = '/login.html';
  },

  // ── Setup Login Form ──
  setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    this.redirectIfLoggedIn();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn   = form.querySelector('#login-btn');
      const email = form.querySelector('#email').value.trim();
      const pass  = form.querySelector('#password').value;

      setButtonLoading(btn, true, 'Signing in...');
      clearFormErrors(form);

      const res = await Api.auth.login({ email, password: pass });

      if (res.error) {
        showFormError(form, res.error);
        setButtonLoading(btn, false, 'Sign In');
        return;
      }

      this.saveSession(res.token, res.user);
      Toast.success('Welcome back!', `Good to see you, ${res.user.name}!`);
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 600);
    });
  },

  // ── Setup Register Form ──
  setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    this.redirectIfLoggedIn();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn      = form.querySelector('#register-btn');
      const name     = form.querySelector('#name').value.trim();
      const email    = form.querySelector('#email').value.trim();
      const password = form.querySelector('#password').value;
      const confirm  = form.querySelector('#confirm-password').value;

      clearFormErrors(form);

      if (password !== confirm) {
        showFormError(form, 'Passwords do not match');
        return;
      }

      setButtonLoading(btn, true, 'Creating account...');

      const res = await Api.auth.register({ name, email, password });

      if (res.error) {
        showFormError(form, res.error);
        setButtonLoading(btn, false, 'Create Account');
        return;
      }

      this.saveSession(res.token, res.user);
      Toast.success('Account created!', `Welcome to TaskFlow Pro, ${res.user.name}!`);
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 600);
    });
  },
};

// ── Helper Functions ──
function setButtonLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner"></span> ${text}`
    : text;
}

function showFormError(form, message) {
  const err = form.querySelector('.form-error');
  if (err) {
    err.textContent = message;
    err.style.display = 'flex';
    err.classList.add('animate-fadeIn');
  }
}

function clearFormErrors(form) {
  const err = form.querySelector('.form-error');
  if (err) { err.style.display = 'none'; err.textContent = ''; }
}

window.Auth = Auth;
window.setButtonLoading = setButtonLoading;
window.showFormError = showFormError;
window.clearFormErrors = clearFormErrors;
