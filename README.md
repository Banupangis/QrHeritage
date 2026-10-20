# Ruang Warisan

An accessible, bilingual digital heritage museum built with React, Vite, Tailwind CSS, Supabase, and QR codes.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and provide a Supabase project URL, anon key, and `VITE_ADMIN_PASSCODE`.
3. Run the SQL in `supabase_setup.sql` in the Supabase SQL Editor.
4. Start the app with `npm run dev`; use `npm run build` and `npm run lint` to verify changes.

The SQL intentionally permits unauthenticated (`anon`) table and image writes to support the requested development workflow. The browser passcode is also a convenience gate only: Vite `VITE_` variables are public in the built application and can be inspected by visitors. Before production, remove the anon write policies and use Supabase Auth, server-side authorization, and role-restricted RLS policies.

The public exhibit route is `/artifact/:slug`, where the slug is automatically generated from the Indonesian title (for example, `/artifact/keris-majapahit`). Slugs are unique; duplicate titles receive a numeric suffix, and existing records are backfilled when the setup SQL is run. Previously generated `/artifact/:id` links remain supported. The collection editor is `/admin`. Printable QR downloads are generated in the browser and link directly to each public exhibit.
