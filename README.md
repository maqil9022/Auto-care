# 🚗 Auto Lab 360 — Vehicle Care & Workshop ERP Platform

Auto Lab 360 is an enterprise vehicle care and automotive workshop management system. It provides an end-to-end digital workflow for garage operations—from online appointment booking and live bay status to technician job cards, inventory tracking, invoicing, and revenue analytics.

---

## ✨ Key Features

- 📅 **Appointments & Booking**: Multi-service booking, customer history, status tracking, and automated customer communication.
- 🛠️ **Workshop Job Cards**: Real-time technician assignment, service task checklists, mileage tracking, parts used, and labor billing.
- 📦 **Spare Parts Inventory**: Real-time stock levels, low-stock warnings, purchase pricing vs. selling pricing, and automated inventory deduction on job completion.
- 🧾 **Invoices & Billing**: Itemized parts & labor bills, discount management, payment statuses (Paid, Pending, Overdue), and print-ready invoices.
- 📊 **Reports & Analytics**: Comprehensive revenue dashboards, technician productivity tracking, high-demand services, and monthly turnover metrics.
- 👥 **Team & Staff Management**: Role-based access control (RBAC), technician profiles, and performance tracking.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router, Recharts, Lucide Icons, Tailwind / Vanilla CSS |
| **Backend** | FastAPI (Python), REST API, Pydantic, Uvicorn |
| **Database** | SQLite (zero-config local dev) / PostgreSQL (production & cloud ready) |
| **Deployment** | Netlify (Frontend SPA), Cloud / VPS ready (FastAPI Backend) |

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/auto-care.git
cd auto-care
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs locally at `http://localhost:5173`.

### 3. Backend Setup
```bash
cd ../backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Interactive Swagger API docs available at `http://localhost:8000/docs`.

---

## 📁 Project Structure

```text
├── frontend/             # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components & modals
│   │   ├── pages/        # Dashboard, Appointments, Jobs, Inventory, Reports, etc.
│   │   ├── hooks/        # Custom React hooks (permissions, auth, etc.)
│   │   └── services/     # API integration services
│   └── package.json
├── backend/              # FastAPI Python Backend
│   ├── routers/          # Modular API endpoints (appointments, jobs, inventory, etc.)
│   ├── models/           # Data models & schemas
│   ├── database.py       # Hybrid DB connector (SQLite / PostgreSQL)
│   └── main.py           # Application entrypoint
├── database/             # PostgreSQL DDL schema & migrations
│   └── schema.sql
├── netlify.toml          # Netlify SPA redirect & build configuration
└── README.md
```

---

## 🔒 Security & Privacy Notice
Sensitive files such as `.env`, virtual environments (`.venv`), local SQLite databases (`*.db`), and dependency caches (`node_modules`) are strictly excluded via `.gitignore`.
