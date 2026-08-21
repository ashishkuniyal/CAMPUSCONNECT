# CampusConnect

A full-stack campus event management platform built with the MERN stack. Students can discover and RSVP to events, organizers can create and track them, and admins manage the entire platform from a dedicated portal.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Socket.IO client |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB (Mongoose) |
| Auth | JWT (15-min access + 7-day refresh tokens) |
| Images | Cloudinary |
| Security | Helmet, express-rate-limit, express-validator |

---

## Project Structure

```
campusconnect/
├── backend/
│   ├── config/          # DB + Cloudinary config
│   ├── controllers/     # Route handler logic
│   ├── middleware/       # auth, errorHandler, rateLimiter, validators
│   ├── models/          # Mongoose schemas (User, Event, Message, AuditLog, Announcement)
│   ├── routes/          # Express routers
│   ├── utils/
│   ├── uploads/         # Local temp uploads (before Cloudinary)
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── components/  # Navbar, ProtectedRoute, ErrorBoundary, Toast …
        ├── pages/       # Home, Events, Dashboard, Profile, AdminPortal …
        └── utils/       # api.js (axios client + interceptors), useApi hook
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI
- (Optional) Cloudinary account for image uploads

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/campusconnect

# Generate strong secrets — the server will refuse to start without these
JWT_SECRET=replace_with_a_long_random_string
JWT_REFRESH_SECRET=replace_with_another_long_random_string

# Cloudinary (optional — only needed for event image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** The server performs startup validation and will exit immediately if `JWT_SECRET`, `JWT_REFRESH_SECRET`, or `MONGO_URI` are missing.

### 3. Run in development

Open two terminals:

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

---

## User Roles

| Feature | Student | Organizer | Admin |
|---------|:-------:|:---------:|:-----:|
| Browse & search events | ✅ | ✅ | ✅ |
| RSVP to events | ✅ | ✅ | ✅ |
| Chat rooms | ✅ | ✅ | ✅ |
| Calendar view | ✅ | ✅ | ✅ |
| Internship aggregator | ✅ | ✅ | ✅ |
| Create events | ❌ | ✅ | ✅ |
| Event analytics / dashboard | ❌ | ✅ (own) | ✅ (all) |
| Approve / reject events | ❌ | ❌ | ✅ |
| Manage users (delete, roles) | ❌ | ❌ | ✅ |
| Suspend users | ❌ | ❌ | ✅ |
| Platform stats & audit log | ❌ | ❌ | ✅ |
| Announcements | ❌ | ❌ | ✅ |

### Creating an Admin User

After registering normally, promote the user via MongoDB shell or Compass:

```js
// MongoDB shell
use campusconnect
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Then log out and log back in to get a fresh token that includes the updated role.

---

## API Overview

All routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Returns `accessToken` + `refreshToken` |
| POST | `/refresh` | — | Exchange refresh token for new access token |
| POST | `/logout` | — | Invalidate refresh token |
| GET | `/profile` | ✅ | Get current user |
| PUT | `/profile` | ✅ | Update profile |
| GET | `/users` | Admin | List all users |
| PATCH | `/users/:id/role` | Admin | Change user role |
| PATCH | `/users/:id/suspend` | Admin | Suspend / unsuspend user |
| DELETE | `/users/:id` | Admin | Delete user |
| GET | `/stats` | Admin | Platform statistics |
| GET | `/audit-log` | Admin | Admin action history |
| GET | `/announcements` | Admin | List announcements |
| POST | `/announcements` | Admin | Create announcement |
| DELETE | `/announcements/:id` | Admin | Delete announcement |

### Events — `/api/events`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List events (paginated, filterable) |
| POST | `/` | ✅ | Create event |
| GET | `/:id` | — | Get single event |
| PUT | `/:id` | ✅ | Update event (creator or admin) |
| DELETE | `/:id` | ✅ | Delete event (creator or admin) |
| PATCH | `/:id/approve` | Admin | Approve / reject event |

### Other Routes
- `GET /api/chat/:eventId` / `POST /api/chat/:eventId` — Event chat messages
- `GET /api/recommendations` — Personalised event recommendations
- `GET /api/preferences` / `PUT /api/preferences` — User preferences
- `GET /api/internships` — Scraped internship listings
- `GET /api/aggregator` — External event feed aggregator

---

## Authentication Flow

```
1. POST /api/auth/login
   → { accessToken (15 min), refreshToken (7 days), user }

2. All protected requests:
   → Authorization: Bearer <accessToken>

3. On 401 TOKEN_EXPIRED:
   → Axios interceptor auto-calls POST /api/auth/refresh
   → Retries original request with new accessToken

4. On logout:
   → POST /api/auth/logout (clears server-side refreshToken)
   → localStorage cleared, redirect to /login
```

---

## Security

- **Helmet** — Sets HTTP security headers on every response
- **CORS** — Scoped to `FRONTEND_URL` only
- **Rate limiting** — Tiered limits (auth: 5/15 min · account creation: 3/hr · events: 10/hr · messages: 20/min · general API: 100/15 min)
- **Input validation** — `express-validator` on all mutating routes
- **ReDoS protection** — User search input is regex-escaped before use
- **Refresh token rotation** — Stored in DB; invalidated on logout
- **Suspended user blocking** — Checked on every login
- **Audit log** — All admin actions are recorded

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Server won't start | Check that `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MONGO_URI` are set in `backend/.env` |
| "Not authorized, token failed" | Log out and log in again for a fresh token |
| "Admin link not showing" | Verify `role: "admin"` in DB, then log out and back in |
| "Cannot load dashboard data" | Ensure backend is running and MongoDB is reachable |
| CORS errors in browser | Set `FRONTEND_URL` in `.env` to match the exact frontend origin |

---

## Deployment Notes

1. Set `NODE_ENV=production` in the backend environment
2. Use strong, randomly generated values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Point `FRONTEND_URL` to your actual deployed frontend domain
4. Serve frontend build through a CDN or static host (Vercel, Netlify, etc.)
5. Use MongoDB Atlas (or a managed cluster) instead of a local `mongod`
6. Enable HTTPS — the app uses `credentials: true` on CORS, which requires a secure origin in production

---

*Built with ❤️ using the MERN stack.*
