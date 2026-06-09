# Admin Dashboard

A full-stack admin dashboard built with React, Vite, Tailwind CSS, shadcn/ui, TanStack React Query, and Supabase.

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project.
2. Run the SQL script located at `database/schema.sql` in your Supabase SQL Editor. This will create the `organizations` and `organization_members` tables, apply RLS policies, and set up constraints.
3. Deploy the Edge Function for member invitations using the Supabase CLI:
   ```bash
   supabase functions deploy invite-member --no-verify-jwt
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase URL and Anon Key.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture & Decisions
- **Frontend Framework:** React 18 with Vite.
- **Data Fetching:** TanStack React Query is used for caching and invalidation, providing a smooth UX without full page reloads.
- **Form Validation:** React Hook Form paired with Zod schemas to ensure type-safety and conditional field validation (e.g., School -> District Name).
- **Backend / Database:** Supabase Postgres. All tables have strict Row Level Security (RLS) policies.
- **Edge Functions:** The `/invite-member` logic runs on Deno Edge Functions to securely validate permissions before creating an invitation record.
- **UI:** Custom implementations of Radix-based shadcn components using Tailwind CSS, ensuring accessibility and a premium aesthetic.

## Git Branching Strategy
We use a two-branch workflow:
- **`main`**: The production branch, automatically deployed to the Production Vercel URL.
- **`development`**: The default working branch, deployed to a stable Preview Vercel URL.
- Feature branches are created off `development` and merged via Pull Requests. `main` only receives merges from `development` once features are stable.
