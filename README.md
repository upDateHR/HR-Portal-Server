# HR Portal Backend (local)

Quick Express + MongoDB backend for authentication (register/login) using JWT.

Setup

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies and start dev server:

```powershell
cd server
npm install
npm run dev
```

Endpoints

- `POST /api/auth/register` { name, email, password, role }
- `POST /api/auth/login` { email, password }

The responses include a JWT token and basic user info. Use the token in `Authorization: Bearer <token>` for protected endpoints (not included in this minimal scaffold).
