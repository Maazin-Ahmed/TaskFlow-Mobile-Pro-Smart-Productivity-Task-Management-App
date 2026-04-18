# TaskFlow Pro

> **A premium, production-ready task management SaaS platform.**  
> Built with Flask · MongoDB Atlas · Vanilla JS · JWT Auth · Glassmorphism UI

![TaskFlow Pro](https://img.shields.io/badge/Status-Production%20Ready-6366f1?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.0-green?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square)

---

## ✨ Features

- 🔐 **JWT Authentication** — Register, Login, Logout, Change Password
- 📋 **Task Management** — Create, Edit, Delete, Filter, Search with priorities & categories
- 🗂️ **Kanban Board** — Drag-and-drop task management across 3 columns
- 📊 **Productivity Dashboard** — Stats, weekly Chart.js graphs, upcoming deadlines
- 🌙 **Dark Mode** — Persistent theme toggle with glassmorphism design
- 🔍 **Smart Filters** — By priority, status, category, and full-text search
- 🎯 **Milestone Achievements** — Auto-notifications at 1, 5, 10, 25, 50 completed tasks
- 📱 **Fully Responsive** — Works beautifully on mobile, tablet, and desktop

---

## 🏗️ Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS |
| Backend    | Python Flask 3.0        |
| Database   | MongoDB Atlas           |
| Auth       | JWT + bcrypt            |
| Deployment | Vercel + Render         |

---

## 📁 Project Structure

```
Taskflow Pro/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # Flask factory
│   │   ├── config.py          # Config classes
│   │   ├── extensions.py      # MongoDB init
│   │   ├── models/            # Data models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # JWT middleware
│   │   └── utils/             # Helpers, validators
│   ├── run.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── Procfile
│   └── render.yaml
└── frontend/
    ├── index.html             # Landing page
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── tasks.html
    ├── kanban.html
    ├── profile.html
    ├── css/                   # Design system
    └── js/                    # App modules
```

---

## 🚀 Local Development

### 1. Prerequisites
- Python 3.10+
- MongoDB Atlas account (or local MongoDB)

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Fill in MONGO_URI and JWT_SECRET_KEY
python run.py
```

Backend starts at `http://localhost:5000`

### 3. Frontend Setup

No build step required! Serve statically:

```bash
cd frontend
python3 -m http.server 5500
```

Open `http://localhost:5500`

---

## ☁️ Deployment

### Backend — Render
1. Push `backend/` to GitHub
2. New Web Service on [render.com](https://render.com)
3. Set env vars: `MONGO_URI`, `JWT_SECRET_KEY`, `FLASK_ENV=production`, `CORS_ORIGINS`
4. Build: `pip install -r requirements.txt` | Start: `gunicorn run:app`

### Frontend — Vercel
1. Push `frontend/` to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Update `js/api.js` production URL to your Render URL
4. Deploy

---

## 🔒 Environment Variables

| Variable              | Description                         | Required |
|-----------------------|-------------------------------------|----------|
| `MONGO_URI`           | MongoDB Atlas connection string     | ✅       |
| `JWT_SECRET_KEY`      | Strong secret for JWT signing       | ✅       |
| `FLASK_ENV`           | `development` or `production`       | ✅       |
| `CORS_ORIGINS`        | Comma-separated allowed origins     | ✅       |
| `JWT_EXPIRATION_HOURS`| Token expiry hours (default: 24)    | ❌       |
| `PORT`                | Server port (default: 5000)         | ❌       |

---

## 🛡️ Security Best Practices

- ✅ bcrypt password hashing
- ✅ JWT with expiration
- ✅ Input validation (frontend + backend)
- ✅ XSS prevention via `escHtml()` 
- ✅ CORS restricted to known origins
- ✅ MongoDB ownership checks on all mutations
- ✅ Security headers via Vercel config

---

## 📊 MongoDB Collections

| Collection          | Purpose                     |
|---------------------|-----------------------------|
| `users`             | User accounts & profiles    |
| `tasks`             | All task documents          |
| `productivity_logs` | Daily activity logs         |
| `notifications`     | User notification inbox     |

---

## 🎨 Design System

- **Font**: Inter + JetBrains Mono
- **Primary**: `#6366f1` Indigo → `#8b5cf6` Violet  
- **Glassmorphism**: `backdrop-filter: blur(20px)`
- **Dark Mode**: Full `[data-theme="dark"]` CSS system

---

## 📝 License

MIT — Portfolio-grade, recruiter-impressive.
