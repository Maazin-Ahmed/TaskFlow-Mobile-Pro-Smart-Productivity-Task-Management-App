/**
 * TaskFlow Pro — Toast Notification System
 */

const Toast = {
  _queue: [],

  _create(type, title, message, duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast  = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ'}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">✕</button>
    `;

    toast.querySelector('.toast-close').onclick = () => this._dismiss(toast);
    container.appendChild(toast);

    const timer = setTimeout(() => this._dismiss(toast), duration);
    toast._timer = timer;
  },

  _dismiss(toast) {
    clearTimeout(toast._timer);
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  },

  success(title, msg)  { this._create('success', title, msg); },
  error(title, msg)    { this._create('error',   title, msg, 5000); },
  warning(title, msg)  { this._create('warning', title, msg); },
  info(title, msg)     { this._create('info',    title, msg); },
};

window.Toast = Toast;
