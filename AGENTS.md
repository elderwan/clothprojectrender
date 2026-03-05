# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the application code (TypeScript, ESM).
- `src/app.ts` is the entry point for the Express server.
- `src/routes/` defines route groups (`clientRoutes.ts`, `adminRoutes.ts`).
- `src/controllers/` handles request/response logic.
- `src/services/` contains business logic used by controllers.
- `src/models/` contains data-access logic.
- `src/middleware/` contains auth/admin guards and shared middleware.
- `src/types/` contains shared and augmented TypeScript types.
- `views/` contains EJS templates, `public/` static assets, `database/schema.sql` database schema, and `data/supabaseClient.ts` Supabase setup.
- `dist/` is build output; do not edit manually.

## Build, Test, and Development Commands
- `npm run dev`: Start development server with watch mode via `tsx`.
- `npm run build`: Compile TypeScript to `dist/` using `tsc`.
- `npm start`: Run compiled server from `dist/app.js`.

Example workflow:
```bash
npm install
npm run dev
```

## Coding Style & Naming Conventions
- Use TypeScript with strict type checking (`tsconfig.json` has `"strict": true`).
- Follow existing style: 2-space indentation, semicolons, single quotes, and ES module imports with `.js` extension in local imports.
- Use clear layer-based names: `*Controller.ts`, `*Service.ts`, `*Model.ts`, `*Middleware.ts`.
- Prefer small, single-purpose functions and keep controller logic thin by delegating to services/models.

## Testing Guidelines
- No automated test framework is currently configured.
- For now, validate changes by:
  - running `npm run build` (must pass),
  - manually testing key routes in both client and admin flows.
- When adding tests, place them under `src/**/__tests__/` or `tests/` and use `*.test.ts` naming.

## Commit & Pull Request Guidelines
- Recent history uses short, direct commit messages (for example: `init the backend api`, `add addr and image`).
- Prefer concise imperative messages, ideally scoped (for example: `auth: add admin session guard`).
- PRs should include:
  - summary of behavior changes,
  - affected routes/modules,
  - setup or migration notes (if schema/env changed),
  - screenshots for UI/template updates.

## Security & Configuration Tips
- Copy `.env.example` to `.env` and set secrets locally.
- Never commit real credentials or production secrets.
- Keep `SESSION_SECRET` and Supabase keys environment-specific.
