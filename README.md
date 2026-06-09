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

## Test Credentials
To quickly log in to the live Vercel deployments, you can use these seeded credentials:
- **Email:** 123123@gmail.com
- **Password:** 123456

## Trade-offs & Shortcuts
Given the 8-10 hour time budget for this hiring challenge, the following tradeoffs were made:
- **Email Delivery:** The Edge Function securely validates permissions and records the member invitation in the database with an `invited` status. Did not integrate an external SMTP provider (e.g., Resend) to send actual emails.
- **End-to-End Testing:** Skipped automated Playwright tests in favour of manual testing to stay within the time budget.
- **UI Components:** Implemented accessible Tailwind UI components directly instead of relying on the `shadcn` CLI.

## What I'd Do With Another Day
- **Real email sending:** Wire the `invite-member` Edge Function up to an SMTP provider like Resend so invited members actually receive an email with a sign-up link.
- **Invitation acceptance flow:** Build the page where an invited user clicks the link in their email, signs up, and has their `organization_members` row automatically linked to their new `auth.users` ID with the status updated from `invited` to `active`.
- **End-to-end tests:** Add a Playwright test covering the full flow: sign-in → create organization → invite member → verify member appears in the list.
- **Search & filter:** Add a search bar on the Organization Directory so admins can quickly find organizations by name or type.
- **Separate dev/prod Supabase projects:** Set up two isolated Supabase projects (one for `development`, one for `main`) so testing never pollutes production data.
