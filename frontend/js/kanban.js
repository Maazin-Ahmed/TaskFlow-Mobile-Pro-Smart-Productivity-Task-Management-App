/**
 * TaskFlow Pro — Kanban Board Module
 * Drag-and-drop kanban with status columns.
 */

const Kanban = {
  _tasks: { todo: [], 'in-progress': [], completed: [] },
  _dragging: null,

  async init() {
    if (!Auth.requireAuth()) return;
    this._setupSidebar();
    await this._load();
  },

  async _load() {
    const res = await Api.tasks.list({ sort: 'position' });
    const tasks = res.tasks || [];

    this._tasks = { todo: [], 'in-progress': [], completed: [] };
    tasks.forEach(t => {
      if (this._tasks[t.status]) this._tasks[t.status].push(t);
    });

    this._render();
  },

  _render() {
    ['todo', 'in-progress', 'completed'].forEach(status => {
      const col   = document.getElementById(`col-${status}`);
      const count = document.getElementById(`col-count-${status}`);
      if (!col) return;

      if (count) count.textContent = this._tasks[status].length;

      if (this._tasks[status].length === 0) {
        col.innerHTML = `
          <div style="text-align:center; padding: var(--space-8); color: var(--color-text-muted); font-size: var(--text-sm);">
            Drop tasks here
          </div>`;
      } else {
        col.innerHTML = this._tasks[status].map(t => this._cardHTML(t)).join('');
      }

      // Re-attach drag events
      col.querySelectorAll('.kanban-task-card').forEach(card => {
        this._attachDragEvents(card);
      });

      // Column drop zone
      this._attachColumnDrop(col, status);
    });
  },

  _cardHTML(task) {
    const deadlineStatus = Utils.isOverdue(task.deadline) ? 'overdue' : Utils.isSoon(task.deadline) ? 'soon' : '';
    return `
      <div class="kanban-task-card priority-${task.priority}"
           draggable="true" data-id="${task.id}" data-status="${task.status}">
        <div class="task-title" style="margin-bottom: var(--space-3);">${escHtml(task.title)}</div>
        ${task.description ? `
          <div class="task-description" style="margin-bottom: var(--space-3);">${escHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge badge-${task.priority}">${Utils.capitalize(task.priority)}</span>
          <span class="${Utils.categoryBadgeClass(task.category)}">${Utils.capitalize(task.category)}</span>
          ${task.deadline ? `
            <span class="task-deadline ${deadlineStatus}" style="font-size:var(--text-xs);">
              📅 ${Utils.formatRelative(task.deadline)}
            </span>` : ''}
        </div>
        <div style="display:flex; justify-content:flex-end; margin-top: var(--space-2);">
          <button class="btn btn-ghost btn-icon btn-sm"
                  onclick="Kanban._deleteTask('${task.id}')" title="Delete">🗑️</button>
        </div>
      </div>`;
  },

  _attachDragEvents(card) {
    card.addEventListener('dragstart', (e) => {
      this._dragging = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id);
    });

    card.addEventListener('dragend', () => {
      if (this._dragging) this._dragging.classList.remove('dragging');
      this._dragging = null;
      document.querySelectorAll('.kanban-cards').forEach(c => c.classList.remove('drag-over'));
    });
  },

  _attachColumnDrop(colEl, status) {
    colEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      colEl.classList.add('drag-over');
    });

    colEl.addEventListener('dragleave', (e) => {
      if (!colEl.contains(e.relatedTarget)) {
        colEl.classList.remove('drag-over');
      }
    });

    colEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      colEl.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;

      // Find original status
      let originalStatus = null;
      for (const [s, tasks] of Object.entries(this._tasks)) {
        if (tasks.find(t => t.id === taskId)) { originalStatus = s; break; }
      }

      if (originalStatus === status) return; // No change

      // Optimistic update: move in local state
      const task = this._tasks[originalStatus]?.find(t => t.id === taskId);
      if (!task) return;
      this._tasks[originalStatus] = this._tasks[originalStatus].filter(t => t.id !== taskId);
      task.status = status;
      this._tasks[status].push(task);
      this._render();

      // Persist to API
      const res = await Api.tasks.status(taskId, status);
      if (res.error) {
        Toast.error('Error', 'Failed to move task');
        await this._load(); // Revert
      } else {
        Toast.success('Moved', `Task moved to ${Utils.statusLabel(status)}`);
      }
    });
  },

  async _deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    const res = await Api.tasks.delete(id);
    if (res.error) { Toast.error('Error', res.error); return; }
    Toast.success('Deleted', 'Task removed');
    await this._load();
  },

  _setupSidebar() {
    const user = Auth.getUser();
    const nameEl   = document.getElementById('sidebar-user-name');
    const emailEl  = document.getElementById('sidebar-user-email');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl)  nameEl.textContent  = user?.name  || '';
    if (emailEl) emailEl.textContent = user?.email || '';
    if (avatarEl) {
      avatarEl.textContent = Utils.initials(user?.name || '?');
      avatarEl.style.background = user?.avatar_color || '#6366f1';
    }
  },
};

window.Kanban = Kanban;
