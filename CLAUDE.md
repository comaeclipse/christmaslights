# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PensacolaLights is a Christmas lights display mapping application that allows users to browse and review holiday light displays. The application supports two deployment platforms: **Cloudflare Pages** (with D1 database) and **Vercel** (with PostgreSQL).

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

### Cloudflare Pages Development
```bash
npm run pages:dev    # Run Cloudflare Pages dev server with functions
npm run pages:deploy # Build and deploy to Cloudflare Pages
```

### Database Management (Cloudflare D1)
```bash
npm run db:create    # Create D1 database
npm run db:migrate   # Run migrations (0001_initial_schema.sql, 0002_seed_data.sql)
```

## Architecture

### Dual Platform Support

This codebase maintains **two separate backend implementations** that serve the same frontend:

1. **Cloudflare Pages + D1** (`functions/` directory)
   - Uses Cloudflare Workers for serverless functions
   - D1 database (SQLite-based)
   - Located in `functions/api/` and `functions/[[path]].ts`
   - JWT auth via `@tsndr/cloudflare-worker-jwt`
   - Types defined in `functions/types.ts`

2. **Vercel + PostgreSQL** (`api/` directory)
   - Uses Vercel Serverless Functions
   - PostgreSQL database via `pg` library
   - Located in `api/` directory
   - JWT auth via `@tsndr/cloudflare-worker-jwt`
   - Database connection in `api/_db.ts`

**Key Point**: When modifying API endpoints or database logic, you must update BOTH `functions/api/` and `api/` directories to maintain platform parity.

### Frontend Architecture

- **Framework**: React 19 with TypeScript, built with Vite
- **Routing**: React Router (routes: `/`, `/demo`, `/privacy`, `/legal`)
- **Mapping Libraries**:
  - Leaflet (default, used on `/` route via `LightMap` component)
  - Mapbox GL (demo, used on `/demo` route via `MapboxMap` component)
  - Both are lazy-loaded to split bundles
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

Both backends map snake_case database fields to camelCase for the frontend:
- `radio_station` → `radioStation`

### Environment Variables

**Cloudflare Pages** (`functions/` expects):
- `DB`: D1 Database binding
- `GEMINI_API_KEY`: API key for AI features
- `ADMIN_PASSWORD`: Admin authentication password
- `JWT_SECRET`: JWT signing secret (fallback: `'change-me-secret'`)

**Vercel** (`api/` expects):
- `DATABASE_URL` / `POSTGRES_URL` / `POSTGRES_PRISMA_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: API key for AI features
- `ADMIN_PASSWORD`: Admin authentication password
- `JWT_SECRET`: JWT signing secret (fallback: `'change-me-secret'`)

### CORS Headers

Both backends return CORS headers on all JSON responses:
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

## Code Organization

```
├── api/                       # Vercel serverless functions
│   ├── _auth.ts              # JWT utilities for Vercel
│   ├── _db.ts                # PostgreSQL connection pool
│   ├── auth/login.ts         # Admin login endpoint
│   ├── locations.ts          # Public locations endpoint
│   ├── reviews.ts            # Public reviews endpoint
│   └── admin/                # Protected admin endpoints
├── functions/                 # Cloudflare Pages functions
│   ├── types.ts              # Cloudflare-specific types (Env)
│   ├── _middleware.ts        # JWT utilities for Cloudflare
│   ├── [[path]].ts           # SPA catch-all route
│   └── api/                  # API routes (mirror api/)
├── components/                # React components
│   ├── LightMap.tsx          # Leaflet map implementation
│   ├── MapboxMap.tsx         # Mapbox GL map implementation
│   ├── Sidebar.tsx           # Location list and review UI
│   └── Manage.tsx            # Admin panel component
├── services/
│   └── apiClient.ts          # Centralized API client
├── App.tsx                    # Main application (Home + Demo routes)
├── admin.tsx                  # Admin panel entry point
└── types.ts                   # Shared TypeScript types
```

## When Making Changes

1. **API endpoints**: Update both `functions/api/` and `api/` to maintain platform parity
2. **Database queries**: Ensure both D1 (SQLite) and PostgreSQL syntax compatibility
3. **Authentication**: Both platforms use the same JWT library and patterns
4. **Environment setup**: Verify environment variables for target platform
5. **Map components**: Remember there are two separate map implementations (Leaflet and Mapbox)
