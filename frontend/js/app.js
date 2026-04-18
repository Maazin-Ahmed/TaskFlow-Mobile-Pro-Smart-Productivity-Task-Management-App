/**
 * TaskFlow Pro — App Initialization
 * Shared setup for all pages: theme, sidebar toggle, logout.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Theme
  Theme.init();
  Theme.setupToggle();

  // Sidebar mobile toggle
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Logout buttons
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  });

  // Active sidebar link highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href.replace('./', ''))) {
      link.classList.add('active');
    }
  });

  // Animate scroll-in elements
  Utils.observeAnimations();

  // Page-specific init
  const page = document.body.dataset.page;
  if (page === 'dashboard') Dashboard.init();
  if (page === 'tasks')     Tasks.init();
  if (page === 'kanban')    Kanban.init();
  if (page === 'profile')   Profile.init();
  if (page === 'login')     Auth.setupLoginForm();
  if (page === 'register')  Auth.setupRegisterForm();
  if (page === 'landing')   initLanding();
});

// ── Landing Page Specific ──
function initLanding() {
  // Sticky navbar on scroll
  const nav = document.getElementById('landing-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
}
