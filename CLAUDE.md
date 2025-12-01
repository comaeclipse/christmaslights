# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PensacolaLights is a Christmas lights display mapping application that allows users to browse and review holiday light displays. The application is deployed on **Vercel** with a **PostgreSQL** database (Neon).

## Development Commands

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 3000
```

### Build and Preview
```bash
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally
```

## Architecture

### Backend (Vercel Serverless Functions)

The backend is built with **Vercel Serverless Functions** located in the `api/` directory:
- Uses **PostgreSQL** database (Neon) via `pg` library
- JWT authentication via `@tsndr/cloudflare-worker-jwt` (despite the name, it's just a JWT library)
- Database connection pool configured in `api/_db.ts`
- Auth utilities in `api/_auth.ts`

### Frontend Architecture

- **Framework**: React 19 with TypeScript, built with Vite
- **Routing**: React Router (routes: `/`, `/privacy`, `/legal`)
- **Mapping**: Leaflet (via `LightMap` component, lazy-loaded)
- **State Management**: React hooks (no external state library)
- **Styling**: Tailwind CSS v4
- **Multi-page Build**: Vite builds two entry points:
  - `index.html` → Main map application (`App.tsx`)
  - `admin.html` → Admin panel (`admin.tsx`)

### API Client Pattern

The `services/apiClient.ts` module provides a centralized API client that automatically switches between:
- Local development: `http://localhost:8788/api`
- Production: `/api` (proxied by deployment platform)

### Authentication Flow

1. Admin login via `POST /api/auth/login` with password
2. Returns JWT token (24h expiry)
3. Token passed in `Authorization: Bearer <token>` header for admin endpoints
4. JWT verification in both platforms uses shared logic pattern (different imports)

### Database Schema

Core entities:
- **locations**: Christmas light display locations (id, title, description, lat, lng, featured, address, schedule, radio_station)
- **reviews**: User reviews (id, location_id, rating, text, author, date)

### Review Submission

- Anonymous reviews allowed (default author: "A Festive Visitor")
- Duplicate review prevention via cookies (`reviewed_<locationId>`)
- Cookie expires after 1 year
- No server-side duplicate prevention (relies on client-side cookie)

## Important Patterns

### Database Field Mapping

Backend maps snake_case database fields to camelCase for the frontend:
- `radio_station` → `radioStation`

### Environment Variables

Required environment variables (set in Vercel dashboard):
- `DATABASE_URL` / `POSTGRES_URL` / `POSTGRES_PRISMA_URL`: PostgreSQL connection string (Neon)
- `ADMIN_PASSWORD`: Admin authentication password
- `JWT_SECRET`: JWT signing secret (fallback: `'change-me-secret'`)

### CORS Headers

API responses include CORS headers:
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

## Code Organization

```
├── api/                       # Vercel serverless functions
│   ├── _auth.ts              # JWT utilities
│   ├── _db.ts                # PostgreSQL connection pool
│   ├── auth/login.ts         # Admin login endpoint
│   ├── locations.ts          # Public locations endpoint
│   ├── reviews.ts            # Public reviews endpoint
│   └── admin/                # Protected admin endpoints
├── components/                # React components
│   ├── LightMap.tsx          # Leaflet map implementation
│   ├── Sidebar.tsx           # Location list and review UI
│   └── Manage.tsx            # Admin panel component
├── services/
│   └── apiClient.ts          # Centralized API client
├── App.tsx                    # Main application
├── admin.tsx                  # Admin panel entry point
└── types.ts                   # Shared TypeScript types
```

## When Making Changes

1. **API endpoints**: Located in `api/` directory - use PostgreSQL syntax (`$1`, `$2` parameter placeholders)
2. **Database queries**: PostgreSQL via `pg` library - connection pool in `api/_db.ts`
3. **Authentication**: JWT tokens with 24-hour expiry, verified via `api/_auth.ts`
4. **Environment setup**: Set environment variables in Vercel dashboard
5. **Map component**: Uses Leaflet for map rendering, lazy-loaded for performance
