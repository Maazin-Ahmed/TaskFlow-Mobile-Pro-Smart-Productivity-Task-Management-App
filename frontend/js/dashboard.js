/**
 * TaskFlow Pro — Dashboard Module
 */

const Dashboard = {
  async init() {
    if (!Auth.requireAuth()) return;

    const user = Auth.getUser();
    this._renderWelcome(user);
    this._setupSidebar(user);

    // Load data in parallel
    const [statsRes, upcomingRes] = await Promise.all([
      Api.tasks.stats(),
      Api.tasks.upcoming(6),
    ]);

    this._renderStats(statsRes.stats || {});
    this._renderUpcoming(upcomingRes.tasks || []);

    // Load chart
    await Charts.renderWeeklyChart('weeklyChart');

    // Notification badge
    this._loadNotifCount();
  },

  _renderWelcome(user) {
    const el = document.getElementById('welcome-name');
    const greeting = document.getElementById('welcome-greeting');
    if (el) el.textContent = user?.name?.split(' ')[0] || 'there';
    if (greeting) greeting.textContent = Utils.getGreeting() + ',';
  },

  _renderStats(stats) {
    const fields = [
      { id: 'stat-total',       val: stats.total      || 0 },
      { id: 'stat-completed',   val: stats.completed  || 0 },
      { id: 'stat-todo',        val: (stats.todo || 0) + (stats['in-progress'] || 0) },
      { id: 'stat-overdue',     val: stats.overdue    || 0 },
    ];

    fields.forEach(({ id, val }) => {
      const el = document.getElementById(id);
      if (el) Utils.animateCounter(el, val);
    });

    // Completion rate progress bar
    const rate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
    const bar  = document.getElementById('completion-bar');
    const pct  = document.getElementById('completion-pct');
    if (bar) setTimeout(() => { bar.style.width = rate + '%'; }, 300);
    if (pct) pct.textContent = rate + '%';
  },

  _renderUpcoming(tasks) {
    const list = document.getElementById('upcoming-list');
    if (!list) return;

    if (tasks.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="padding: var(--space-8)">
          <div class="empty-state-icon">🎉</div>
          <div class="empty-state-title">All clear!</div>
          <div class="empty-state-text">No upcoming deadlines</div>
        </div>`;
      return;
    }

    list.innerHTML = tasks.map(task => `
      <div class="deadline-item">
        <div class="deadline-dot ${task.priority}"></div>
        <div class="deadline-info">
          <div class="deadline-title">${escHtml(task.title)}</div>
          <div class="deadline-date">${Utils.formatRelative(task.deadline)}</div>
        </div>
        <span class="${Utils.categoryBadgeClass(task.category)}">${Utils.capitalize(task.category)}</span>
      </div>
    `).join('');
  },

  _setupSidebar(user) {
    const nameEl  = document.getElementById('sidebar-user-name');
    const emailEl = document.getElementById('sidebar-user-email');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl)  nameEl.textContent  = user?.name  || '';
    if (emailEl) emailEl.textContent = user?.email || '';
    if (avatarEl) {
      avatarEl.textContent = Utils.initials(user?.name || '?');
      avatarEl.style.background = user?.avatar_color || '#6366f1';
    }
  },

  async _loadNotifCount() {
    const res = await Api.notifications.unreadCount();
    const badge = document.getElementById('notif-badge');
    if (badge && res.count > 0) {
      badge.textContent = res.count;
      badge.style.display = 'flex';
    }
  },
};

// Prevent XSS
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

window.Dashboard = Dashboard;
window.escHtml = escHtml;
