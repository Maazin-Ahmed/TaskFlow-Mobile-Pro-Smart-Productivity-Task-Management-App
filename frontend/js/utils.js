/**
 * TaskFlow Pro — Shared Utilities
 */

const Utils = {
  /** Format a date string to readable format */
  formatDate(dateStr, options = {}) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      ...options,
    });
  },

  /** Format a date relative to now */
  formatRelative(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = date - now;
    const absDiff = Math.abs(diff);
    const days    = Math.floor(absDiff / 86400000);

    if (diff < 0) {
      if (days === 0) return 'Overdue today';
      return `${days}d overdue`;
    }
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days <= 7)  return `Due in ${days}d`;
    return this.formatDate(dateStr);
  },

  /** Check if a date is overdue */
  isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  },

  /** Check if deadline is within 3 days */
  isSoon(dateStr) {
    if (!dateStr) return false;
    const diff = new Date(dateStr) - new Date();
    return diff > 0 && diff < 3 * 86400000;
  },

  /** Greeting based on time */
  getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  },

  /** Generate initials from name */
  initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  /** Debounce a function */
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  /** Capitalize first letter */
  capitalize(str) {
    if (!str) return '';
    return str[0].toUpperCase() + str.slice(1);
  },

  /** Get priority color CSS variable */
  priorityColor(priority) {
    const map = { high: 'var(--color-high)', medium: 'var(--color-medium)', low: 'var(--color-low)' };
    return map[priority] || 'var(--color-text-muted)';
  },

  /** Get category badge class */
  categoryBadgeClass(category) {
    return `badge badge-${category}`;
  },

  /** Get status badge class */
  statusBadgeClass(status) {
    const map = {
      'todo': 'badge badge-todo',
      'in-progress': 'badge badge-in-progress',
      'completed': 'badge badge-completed',
    };
    return map[status] || 'badge badge-muted';
  },

  /** Format status label */
  statusLabel(status) {
    const map = { 'todo': 'To Do', 'in-progress': 'In Progress', 'completed': 'Completed' };
    return map[status] || status;
  },

  /** Animate a number counter */
  animateCounter(el, target, duration = 800) {
    const start = performance.now();
    const from  = parseInt(el.textContent) || 0;
    const update = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },

  /** Intersection Observer for scroll animations */
  observeAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeInUp');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
  },
};

window.Utils = Utils;
