/**
 * TaskFlow Pro — Profile Module
 */

const Profile = {
  async init() {
    if (!Auth.requireAuth()) return;
    this._setupSidebar();
    await this._load();
    this._setupProfileForm();
    this._setupPasswordForm();
  },

  async _load() {
    const res = await Api.profile.get();
    if (res.error) { Toast.error('Error', res.error); return; }
    this._render(res.profile);
  },

  _render(profile) {
    // Header card
    const nameEl   = document.getElementById('profile-name');
    const emailEl  = document.getElementById('profile-email');
    const joinedEl = document.getElementById('profile-joined');
    const avatarEls = document.querySelectorAll('.profile-avatar-initial');

    if (nameEl)  nameEl.textContent  = profile.name || '';
    if (emailEl) emailEl.textContent = profile.email || '';
    if (joinedEl) joinedEl.textContent = 'Member since ' + Utils.formatDate(profile.created_at, { year: 'numeric', month: 'long' });

    avatarEls.forEach(el => {
      el.textContent = Utils.initials(profile.name || '?');
      el.style.background = profile.avatar_color || '#6366f1';
    });

    // Form fields
    const nameInput = document.getElementById('pf-name');
    const bioInput  = document.getElementById('pf-bio');
    const emailInput = document.getElementById('pf-email');
    if (nameInput)  nameInput.value  = profile.name  || '';
    if (bioInput)   bioInput.value   = profile.bio   || '';
    if (emailInput) { emailInput.value = profile.email || ''; emailInput.disabled = true; }
  },

  _setupProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn  = form.querySelector('#pf-save-btn');
      const name = form.querySelector('#pf-name').value.trim();
      const bio  = form.querySelector('#pf-bio').value.trim();

      setButtonLoading(btn, true, 'Saving...');
      const res = await Api.profile.update({ name, bio });
      setButtonLoading(btn, false, 'Save Changes');

      if (res.error) { Toast.error('Error', res.error); return; }

      // Update cached user
      const user = Auth.getUser();
      Auth.saveSession(Auth.getToken(), { ...user, name: res.profile.name });

      Toast.success('Profile updated!', 'Your changes have been saved.');
      this._render(res.profile);
    });
  },

  _setupPasswordForm() {
    const form = document.getElementById('password-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn      = form.querySelector('#pwd-save-btn');
      const current  = form.querySelector('#pwd-current').value;
      const newPwd   = form.querySelector('#pwd-new').value;
      const confirm  = form.querySelector('#pwd-confirm').value;

      if (newPwd !== confirm) {
        Toast.error('Validation', 'New passwords do not match');
        return;
      }

      setButtonLoading(btn, true, 'Changing...');
      const res = await Api.auth.changePassword({
        current_password: current,
        new_password: newPwd,
      });
      setButtonLoading(btn, false, 'Change Password');

      if (res.error) { Toast.error('Error', res.error); return; }

      form.reset();
      Toast.success('Password changed!', 'You can now use your new password.');
    });
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

window.Profile = Profile;
