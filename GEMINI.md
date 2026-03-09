# Maison Clothes Shop

Maison is a comprehensive e-commerce web application for a clothing shop, built with Node.js, Express, TypeScript, and EJS. It uses Supabase (PostgreSQL) as its primary database and Cloudinary for image storage.

## Project Overview

- **Architecture:** MVC-inspired (Models, Views, Controllers, Services).
- **Backend:** Node.js, Express.js, TypeScript.
- **Frontend:** EJS (Embedded JavaScript) templates with Vanilla CSS.
- **Database:** Supabase (PostgreSQL) for data persistence.
- **Authentication:** `bcryptjs` for password hashing and `express-session` for session management.
- **Testing:** Jest and Supertest for unit and integration testing.
- **Image Storage:** Cloudinary for managing product and banner images.

## Project Structure

- `src/`: Main source code.
  - `controllers/`: Handles incoming requests and orchestrates responses.
  - `models/`: Interacts with the Supabase database.
  - `services/`: Contains core business logic.
  - `middleware/`: Custom Express middleware (e.g., auth, session injection).
  - `routes/`: Defines API and web routes.
  - `types/`: TypeScript type definitions and interfaces.
- `views/`: EJS templates for the frontend (admin and client sections).
- `public/`: Static assets (CSS, client-side scripts, images).
- `database/`: SQL schema and migration files.
- `data/`: Supabase client configuration.

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- A Supabase project with the schema from `database/schema.sql` applied.
- Environment variables configured (see `.env.example`).

### Key Commands
- `npm run dev`: Starts the development server with `tsx watch` (hot-reloading).
- `npm run build`: Compiles TypeScript files into the `dist/` directory.
- `npm run start`: Runs the compiled production server from `dist/server.js`.
- `npm run test`: Executes the test suite using Jest.
- `npm run test:watch`: Runs Jest in watch mode for interactive testing.

## Development Conventions

- **Language:** Use TypeScript for all backend logic to ensure type safety.
- **Modules:** The project uses ES Modules (`"type": "module"`). Always use `.js` extensions in imports (e.g., `import { foo } from './bar.js';`).
- **Data Persistence:** Use the models in `src/models` for database operations. Avoid direct Supabase client calls in controllers.
- **Soft Deletes:** Most tables use a `del_flg` (boolean) for soft deletes. Ensure queries account for this flag.
- **Authentication:** Admin-specific logic should be protected using `adminMiddleware.ts`. Use `authMiddleware.ts` for general client-side authentication.
- **Views:** Templates are split into `client/`, `admin/`, and `partials/` for better organization.
- **Naming:** Follow camelCase for variables and functions, and PascalCase for classes and interfaces.
