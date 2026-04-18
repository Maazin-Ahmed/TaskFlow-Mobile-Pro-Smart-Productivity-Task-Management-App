/**
 * TaskFlow Pro — Charts Module (Chart.js)
 */

const Charts = {
  _instances: {},

  async renderWeeklyChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    const res = await Api.productivity.weekly();
    const data = res.data || [];

    const labels    = data.map(d => d.day || d.date);
    const completed = data.map(d => d.tasks_completed);
    const created   = data.map(d => d.tasks_created);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (this._instances[canvasId]) {
      this._instances[canvasId].destroy();
    }

    this._instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Completed',
            data: completed,
            backgroundColor: 'rgba(99,102,241,0.8)',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Created',
            data: created,
            backgroundColor: 'rgba(139,92,246,0.35)',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              pointStyleWidth: 8,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#f1f5f9' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            titleFont: { family: 'Inter', size: 13, weight: '600' },
            bodyFont:  { family: 'Inter', size: 12 },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Inter', size: 12 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter', size: 12 },
              stepSize: 1,
            },
          },
        },
      },
    });
  },

  async renderCategoryChart(canvasId, stats) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    const categories = ['work', 'personal', 'study', 'health', 'finance'];
    const colors = ['#6366f1', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b'];

    if (this._instances[canvasId]) {
      this._instances[canvasId].destroy();
    }

    this._instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => Utils.capitalize(c)),
        datasets: [{
          data: categories.map(c => stats[c] || 0),
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b',
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderWidth: 0,
            padding: 10,
            cornerRadius: 8,
          },
        },
      },
    });
  },
};

window.Charts = Charts;
