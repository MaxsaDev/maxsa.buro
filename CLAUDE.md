# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **React Compiler** (stable)
- **TypeScript 5** (strict mode)
- **PostgreSQL 17** — direct SQL via `pg` connection pool (no ORM)
- **Better Auth 5.x** — authentication (email/password, OAuth, Passkeys/WebAuthn, TOTP 2FA)
- **Zustand** — global state (menus, permissions)
- **Shadcn UI** + **Radix UI** + **Tailwind CSS 4.x**
- **React Hook Form** + **Zod** — forms and validation
- **Resend** + **React Email** — email delivery

## Commands

```bash
npm run dev            # Dev server on localhost:3000
npm run build          # Production build
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format all files
npm run format:check   # Check formatting
npm run type-check     # TypeScript type check (tsc --noEmit)
```

## Project Structure

```
actions/           Server actions ('use server') for CRUD operations
  auth/            Auth actions (register, login, password reset, 2FA, passkeys)
  mx-admin/        Admin panel actions
  profile/         Profile-related actions
app/               Next.js App Router
  (auth)/          Public auth pages (login, register, verify-email, etc.)
  (protected)/     Auth-required pages (dashboard, profile, mx-admin)
  api/             API routes (Better Auth handler, passkey endpoints, 2FA status)
components/        React components
  ui/              Shadcn UI primitives
data/              Database query functions (server-side SQL queries)
interfaces/        TypeScript interfaces
lib/               Utilities and core libraries
  auth/            Auth core (auth.ts singleton, auth-server.ts, auth-client.ts, user-context.tsx)
  db.ts            PostgreSQL connection pool
schemas/           Zod validation schemas
sql/               Database migrations and seed scripts
store/             Zustand stores (user-menu, user-permissions)
```

## Architecture

### Routing & Layouts

- Route groups: `(auth)` for public auth pages, `(protected)` for authenticated pages
- Protected layout (`app/(protected)/layout.tsx`) enforces auth check, loads user data/menus/permissions
- Dynamic routes use `[param]` convention (e.g., `/mx-admin/user-data/[user_id]`)

### Data Flow

- **Server Actions** in `actions/` perform mutations (`'use server'`)
- **Data functions** in `data/` run read queries against PostgreSQL
- **Context Providers** in protected layout: `UserProvider`, `MenuProvider`, `PermissionsProvider`
- Raw SQL with parameterized queries — no ORM. Database uses `snake_case`, code uses `camelCase`

### Authentication

- Better Auth singleton in `lib/auth/auth.ts` with session management (7-day expiry, 24-hour refresh)
- Email verification required on registration
- Multi-factor: TOTP 2FA with backup codes, WebAuthn/Passkey support
- OAuth: Google provider
- Roles: user/admin with database-driven permission system
- Admin panel at `/mx-admin` for managing users, sessions, menus, permissions

### State Management (preference order)

1. React Server Components (default)
2. Pure functions / derived values (React Compiler auto-optimizes)
3. Zustand for shared state across components
4. `useTransition` for async operations affecting multiple UI elements
5. `useState` for isolated local UI state
6. `useEffect` only for side effects

## Design System

**MANDATORY**: Before any UI work, read `docs/design-system.md`. All UI components MUST follow the rules defined there. Key rules:

- Pages: NO `container`/`max-w-*` wrappers. Layout provides padding.
- Buttons: NO `w-full`/`flex-1` on action buttons. Use `size="sm"` for form actions.
- InputGroup buttons: `size="icon-xs" variant="ghost"` with semantic color classes.
- Tabs: Card-based navigation (NOT Radix Tabs) for page-level navigation.
- Cards: Colored borders for status (`border-success/30`, `border-warning/30`).

## Code Conventions

- **Imports**: Always use `@/` alias from root (e.g., `import { db } from '@/lib/db'`). Group: external libs → project imports → types → styles, alphabetically within groups. Import directly from `'react'` not `React.*`.
- **TypeScript**: Interfaces over types. Maps over enums. Zero `any`, zero lint warnings.
- **Naming**: `lowercase-with-dashes` for directories. Named exports for components. `snake_case` in SQL, `camelCase` in TS.
- **Components**: Add `displayName` to `forwardRef`/`memo`/HOC components. Extend `ButtonHTMLAttributes<HTMLButtonElement>` for button components. Use arrow functions.
- **Performance**: Do NOT use `useMemo`/`useCallback`/`React.memo` — React Compiler handles memoization. Must justify if ever needed. Minimize `'use client'`, push client boundaries deep. Wrap client components in `Suspense`.
- **Language**: Code comments in Ukrainian, user-facing UI strings in Ukrainian.
