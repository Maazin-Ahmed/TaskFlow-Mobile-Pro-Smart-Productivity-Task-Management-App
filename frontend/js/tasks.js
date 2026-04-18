/**
 * TaskFlow Pro — Tasks Module
 * Full CRUD task manager with filters, search, and modal.
 */

const Tasks = {
  _tasks: [],
  _filters: {},
  _searchQuery: '',

  async init() {
    if (!Auth.requireAuth()) return;
    this._setupSidebar();
    this._setupSearch();
    this._setupFilters();
    this._setupModal();
    this._setupCreateBtn();
    await this._load();
  },

  async _load() {
    this._showLoading();
    const params = { ...this._filters };
    if (this._searchQuery) params.search = this._searchQuery;

    const res = await Api.tasks.list(params);
    this._tasks = res.tasks || [];
    this._render();
  },

  _render() {
    const list  = document.getElementById('task-list');
    const count = document.getElementById('task-count');
    if (!list) return;

    if (count) count.textContent = `${this._tasks.length} task${this._tasks.length !== 1 ? 's' : ''}`;

    if (this._tasks.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No tasks found</div>
          <div class="empty-state-text">Create your first task to get started</div>
          <button class="btn btn-primary" onclick="Tasks._openModal()">
            <span>＋</span> New Task
          </button>
        </div>`;
      return;
    }

    list.innerHTML = this._tasks.map(task => this._taskCardHTML(task)).join('');
    list.classList.add('stagger-children');
    list.querySelectorAll('.task-card').forEach((el, i) => {
      el.style.animationDelay = `${i * 40}ms`;
      el.classList.add('animate-fadeInUp');
    });
  },

  _taskCardHTML(task) {
    const isCompleted = task.status === 'completed';
    const deadlineStatus = Utils.isOverdue(task.deadline) ? 'overdue' : Utils.isSoon(task.deadline) ? 'soon' : '';
    return `
      <div class="task-card priority-${task.priority} ${isCompleted ? 'completed' : ''}"
           data-id="${task.id}" onclick="Tasks._openModal('${task.id}')">
        <div class="task-card-header">
          <div class="task-checkbox ${isCompleted ? 'checked' : ''}"
               onclick="event.stopPropagation(); Tasks._toggleStatus('${task.id}', '${task.status}')"></div>
          <div class="task-title">${escHtml(task.title)}</div>
          <div class="task-actions">
            <button class="btn btn-ghost btn-icon btn-sm" title="Edit"
                    onclick="event.stopPropagation(); Tasks._openModal('${task.id}')">✏️</button>
            <button class="btn btn-ghost btn-icon btn-sm" title="Delete"
                    onclick="event.stopPropagation(); Tasks._delete('${task.id}')">🗑️</button>
          </div>
        </div>
        ${task.description ? `<div class="task-description">${escHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge badge-${task.priority}">${Utils.capitalize(task.priority)}</span>
          <span class="${Utils.categoryBadgeClass(task.category)}">${Utils.capitalize(task.category)}</span>
          <span class="${Utils.statusBadgeClass(task.status)}">${Utils.statusLabel(task.status)}</span>
          ${task.deadline ? `
            <span class="task-deadline ${deadlineStatus}">
              📅 ${Utils.formatRelative(task.deadline)}
            </span>` : ''}
        </div>
      </div>`;
  },

  async _toggleStatus(id, currentStatus) {
    const next = currentStatus === 'completed' ? 'todo' : 'completed';
    const res  = await Api.tasks.status(id, next);
    if (res.error) { Toast.error('Error', res.error); return; }
    Toast.success(next === 'completed' ? '✓ Completed!' : 'Reopened', res.task?.title || '');
    await this._load();
  },

  async _delete(id) {
    const task = this._tasks.find(t => t.id === id);
    if (!confirm(`Delete "${task?.title}"?`)) return;
    const res = await Api.tasks.delete(id);
    if (res.error) { Toast.error('Error', res.error); return; }
    Toast.success('Deleted', 'Task removed');
    await this._load();
  },

  // ── Modal ──
  _currentTaskId: null,

  _openModal(taskId = null) {
    this._currentTaskId = taskId;
    const overlay = document.getElementById('task-modal');
    const title   = document.getElementById('modal-title');
    const form    = document.getElementById('task-form');
    if (!overlay) return;

    if (title) title.textContent = taskId ? 'Edit Task' : 'New Task';
    form.reset();

    if (taskId) {
      const task = this._tasks.find(t => t.id === taskId);
      if (task) this._populateForm(task);
    }

    overlay.classList.add('active');
    document.getElementById('task-title-input')?.focus();
  },

  _closeModal() {
    document.getElementById('task-modal')?.classList.remove('active');
    this._currentTaskId = null;
  },

  _populateForm(task) {
    const f = document.getElementById('task-form');
    f.querySelector('#task-title-input').value       = task.title || '';
    f.querySelector('#task-description-input').value = task.description || '';
    f.querySelector('#task-priority-input').value    = task.priority || 'medium';
    f.querySelector('#task-category-input').value    = task.category || 'work';
    f.querySelector('#task-status-input').value      = task.status || 'todo';
    if (task.deadline) {
      f.querySelector('#task-deadline-input').value =
        new Date(task.deadline).toISOString().slice(0, 16);
    }
  },

  _setupModal() {
    const form = document.getElementById('task-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn  = document.getElementById('task-save-btn');
      const data = {
        title:       form.querySelector('#task-title-input').value.trim(),
        description: form.querySelector('#task-description-input').value.trim(),
        priority:    form.querySelector('#task-priority-input').value,
        category:    form.querySelector('#task-category-input').value,
        status:      form.querySelector('#task-status-input').value,
        deadline:    form.querySelector('#task-deadline-input').value || null,
      };

      if (!data.title) {
        Toast.error('Validation', 'Task title is required');
        return;
      }

      setButtonLoading(btn, true, 'Saving...');
      const res = this._currentTaskId
        ? await Api.tasks.update(this._currentTaskId, data)
        : await Api.tasks.create(data);

      setButtonLoading(btn, false, 'Save Task');

      if (res.error) { Toast.error('Error', res.error); return; }

      Toast.success(
        this._currentTaskId ? 'Task updated!' : 'Task created!',
        data.title
      );
      this._closeModal();
      await this._load();
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => this._closeModal());
    document.getElementById('task-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'task-modal') this._closeModal();
    });
  },

  // ── Search ──
  _setupSearch() {
    const input = document.getElementById('task-search');
    if (!input) return;
    const debouncedLoad = Utils.debounce(async () => {
      this._searchQuery = input.value.trim();
      await this._load();
    }, 400);
    input.addEventListener('input', debouncedLoad);
  },

  // ── Filters ──
  _setupFilters() {
    document.querySelectorAll('[data-filter]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const key   = chip.dataset.filter;
        const value = chip.dataset.value;

        if (this._filters[key] === value) {
          delete this._filters[key];
          chip.classList.remove('active');
        } else {
          // Deactivate siblings
          document.querySelectorAll(`[data-filter="${key}"]`).forEach(c => c.classList.remove('active'));
          this._filters[key] = value;
          chip.classList.add('active');
        }
        this._load();
      });
    });
  },

  _setupCreateBtn() {
    document.getElementById('create-task-btn')?.addEventListener('click', () => this._openModal());
  },

  _setupSidebar() {
    const user = Auth.getUser();
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

  _showLoading() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = Array(3).fill(0).map(() => `
      <div class="task-card" style="pointer-events:none">
        <div class="skeleton" style="height:20px; width:60%; margin-bottom:12px;"></div>
        <div class="skeleton" style="height:14px; width:90%; margin-bottom:8px;"></div>
        <div class="skeleton" style="height:14px; width:40%;"></div>
      </div>`).join('');
  },
};

window.Tasks = Tasks;
