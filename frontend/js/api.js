/**
 * TaskFlow Pro — API Client
 * Centralized fetch wrapper with JWT injection and error handling.
 */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5000/api'
  : 'https://taskflow-pro-api.onrender.com/api'; // Replace with your Render URL

const Api = {
  _getToken() {
    return localStorage.getItem('tfp_token');
  },

  _headers(extra = {}) {
    const token = this._getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...extra,
    };
  },

  async _request(method, path, body = null) {
    const options = {
      method,
      headers: this._headers(),
    };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${path}`, options);
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // Token expired — redirect to login
        localStorage.removeItem('tfp_token');
        localStorage.removeItem('tfp_user');
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register') && !window.location.pathname.includes('index')) {
          window.location.href = '/login.html';
        }
        return { error: data.message || 'Authentication required' };
      }

      if (!res.ok) {
        return { error: data.error || data.message || 'Request failed', details: data.details };
      }

      return data;
    } catch (err) {
      return { error: 'Network error. Please check your connection.' };
    }
  },

  get(path)         { return this._request('GET',    path); },
  post(path, body)  { return this._request('POST',   path, body); },
  put(path, body)   { return this._request('PUT',    path, body); },
  patch(path, body) { return this._request('PATCH',  path, body); },
  delete(path)      { return this._request('DELETE', path); },

  // ── Auth ──
  auth: {
    register: (d) => Api.post('/auth/register', d),
    login:    (d) => Api.post('/auth/login', d),
    me:       ()  => Api.get('/auth/me'),
    logout:   ()  => Api.post('/auth/logout'),
    changePassword: (d) => Api.post('/auth/change-password', d),
  },

  // ── Tasks ──
  tasks: {
    list:    (params = {}) => Api.get('/tasks/?' + new URLSearchParams(params).toString()),
    create:  (d)           => Api.post('/tasks/', d),
    get:     (id)          => Api.get(`/tasks/${id}`),
    update:  (id, d)       => Api.put(`/tasks/${id}`, d),
    delete:  (id)          => Api.delete(`/tasks/${id}`),
    status:  (id, status)  => Api.patch(`/tasks/${id}/status`, { status }),
    reorder: (tasks)       => Api.patch('/tasks/reorder', { tasks }),
    stats:   ()            => Api.get('/tasks/stats'),
    upcoming:(limit = 5)   => Api.get(`/tasks/upcoming?limit=${limit}`),
  },

  // ── Profile ──
  profile: {
    get:    ()  => Api.get('/profile/'),
    update: (d) => Api.put('/profile/', d),
  },

  // ── Productivity ──
  productivity: {
    weekly:  () => Api.get('/productivity/weekly'),
    monthly: () => Api.get('/productivity/monthly'),
    summary: () => Api.get('/productivity/summary'),
  },

  // ── Notifications ──
  notifications: {
    list:        (params = {}) => Api.get('/notifications/?' + new URLSearchParams(params).toString()),
    unreadCount: ()  => Api.get('/notifications/unread-count'),
    markRead:    (id)=> Api.patch(`/notifications/${id}/read`),
    markAllRead: ()  => Api.patch('/notifications/read-all'),
  },
};

window.Api = Api;
