# Tick Tack Web

React client for Tick Tack.

## Stack

- React and TypeScript
- Vite
- React Router
- Redux Toolkit and RTK Query
- Zod
- Feature-Sliced Design
- Sass and CSS Modules

The color system uses semantic CSS custom properties. The initial theme follows
the operating-system preference, and an explicit choice is persisted locally.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

During development, requests under `/api` are proxied to
`http://localhost:8080`. The prefix is removed before the request reaches the
backend, so `/api/health` is forwarded as `/health`.
