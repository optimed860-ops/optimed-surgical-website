# Medical & Surgical B2B Platform

B2B product catalogue and quotation management system.
Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth, Storage).

- Technical plan: [docs/technical-plan.md](docs/technical-plan.md)
- Status: **Stage 2 (foundation) complete.** The public website and admin modules come next.

---

## Setup (no Docker needed)

You do everything in the Supabase website. There's nothing to install except Node.js.

### 1. Create a Supabase project

1. Go to <https://supabase.com>, sign in, and click **New project**.
2. Pick a name, a strong database password (save it somewhere safe) and a region close to your customers.
3. Wait until the project finishes setting up.

### 2. Run the SQL files (in this exact order)

Open **SQL Editor → New query**. For each file below: open it here, copy **all** of it, paste it into the editor, and click **Run**. Every file should say **Success**. Don't skip or reorder them.

| # | File |
|---|---|
| 1 | `supabase/migrations/20261121000001_extensions_and_helpers.sql` |
| 2 | `supabase/migrations/20261121000002_admins.sql` |
| 3 | `supabase/migrations/20261121000003_catalogue.sql` |
| 4 | `supabase/migrations/20261121000004_quotations.sql` |
| 5 | `supabase/migrations/20261121000005_orders.sql` |
| 6 | `supabase/migrations/20261121000006_certifications_and_settings.sql` |
| 7 | `supabase/migrations/20261121000007_functions.sql` |
| 8 | `supabase/migrations/20261121000008_rls_policies.sql` |
| 9 | `supabase/migrations/20261121000009_storage.sql` |
| 10 | `supabase/migrations/20261121000010_inquiries_and_free_text.sql` (catalogue & contact forms, typed item lists) |
| 11 | `supabase/migrations/20261121000011_admin_content.sql` (editable website text, deleting orders) |
| 12 | `supabase/migrations/20261121000012_blog.sql` (blog articles) |
| 13 | `supabase/migrations/20261121000013_product_codes.sql` (unique item codes like OPM-688-428 for every product) |
| 14 | `supabase/migrations/20261121000014_security_hardening.sql` (admin login attempt limit, no SVG uploads) |

**Not sure what you already ran?** Paste `supabase/tests/setup_check.sql` into a new query and click **Run**. It changes nothing; it lists every step with ✅ (done) or ❌ (still to do) and tells you what to run next. Files 10 to 14 can safely be run again.

Each file runs only **once**. If a file fails partway, send the error message to your developer before running anything else.

### 3. Run the security self-check

Paste `supabase/tests/rls_checks.sql` into a new query and click **Run**.

- **"Success. No rows returned"** means every security rule works.
- An error starting with **`FAIL:`** means something is wrong. Don't go live; send the error to your developer.

The check removes its own test data, so you can run it as often as you like.

### 3b. (Optional) Load the starter catalogue

Paste `supabase/seed/catalogue_products.sql` into the SQL Editor and click **Run**. It adds 8 categories and 25 common instrument types (no prices, no product codes, no photos). Edit, photograph or delete any of them later in **Admin → Products**. Running it twice does not create duplicates.

Then paste `supabase/seed/catalogue_photos.sql` and click **Run** to attach starter photos to 16 of these products (the image files are already in Storage). They are free-licence photos from Wikimedia Commons, credited on the `/image-credits` page. Replace them with your own photos any time in **Admin → Products**; remove the matching entry from `src/content/image-credits.ts` when you do.

For the blog, paste `supabase/seed/blog_posts.sql` and click **Run**: it adds 5 starter articles (original buying and care guides). Edit or delete them in **Admin → Blog**.

(The older `demo_catalogue.sql` adds sample products with codes starting `DEMO-`; remove them with `remove_demo_catalogue.sql`.)

### 4. Turn off public sign-ups

**Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up". Keep **Email** enabled.
Only you create admin accounts, so nobody else can register.

### 5. Create the admin account

1. **Authentication → Users → Add user → Create new user.** Enter the admin email and a strong password, and tick **Auto Confirm User**.
2. In **SQL Editor**, run this with **your admin email** filled in:

   ```sql
   insert into public.admins (user_id, full_name)
   select id, 'Admin' from auth.users where email = 'YOUR-ADMIN-EMAIL@example.com';
   ```

   It should say **Success. 1 row affected**. "0 rows" means the email is spelt differently from the user you created.

A user who isn't in the `admins` table can't open the admin area, even with a correct password. The login page tells you which problem it is: wrong password, email not confirmed (open the user in **Authentication → Users** and confirm it), or not an admin yet (run the SQL above).

### 6. Add your keys to `.env.local` and `.env`

Both files exist in the project folder. Put the same values in both. `.env.local` is what your computer uses (it wins if both are set), and `.env` is your copy for later deployment. Neither file goes to GitHub. When you deploy, you type these same values into the hosting dashboard's "Environment variables" page.

| Variable | Where to find it in Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → Data API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Project Settings → API Keys** → Publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | **Project Settings → API Keys** → Secret key (`sb_secret_…`) |

`RATE_LIMIT_HMAC_SECRET` is already filled with a random value.

Every form (quote, contact, catalogue) is saved in Supabase and shows up in the admin panel.

**Optional email alert with Resend (free):**

1. Sign up at <https://resend.com> (free plan) with the email where alerts should arrive.
2. **API Keys → Create API key** (permission: Sending access). Copy it once; it starts with `re_`.
3. In `.env.local` and `.env` (and later in Netlify) fill in:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | the `re_…` key |
| `NOTIFY_EMAIL` | the email you signed up to Resend with |
| `EMAIL_FROM` | keep `onboarding@resend.dev` |

Without your own domain, Resend only delivers to your own Resend account email, which is exactly what an admin alert needs. To send from `website@optimedsurgical.com` or to other addresses, add the domain under **Resend → Domains**, put the DNS records it shows into your domain's DNS, wait for "Verified", then set `EMAIL_FROM=website@optimedsurgical.com`. When `RESEND_API_KEY` is filled in, the Gmail settings below are ignored.

**Or, without Resend (free, Gmail):** to also get an email for each new form, fill in these in `.env.local` / `.env` (and later in Netlify):

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | the Gmail address that sends the alerts |
| `SMTP_PASS` | a Gmail **App Password** (16 letters), not your normal password |
| `NOTIFY_EMAIL` | where alerts should arrive (can be the same Gmail or sales@…) |

To make an App Password: turn on **2-Step Verification** in your Google account, then open <https://myaccount.google.com/apppasswords>, create one named "Website", and paste it into `SMTP_PASS`. Gmail allows about 500 emails a day for free. Leave `SMTP_PASS` empty and no emails are sent; forms still work. Replying to the alert email replies straight to the buyer.

> ⚠ The **secret key** gives full database access. Never paste it into chat, email, screenshots or code, and never add `NEXT_PUBLIC_` to its name. `.env.local` is excluded from git.
> This folder is inside OneDrive, so OneDrive will back `.env.local` up to your OneDrive account.

### 7. Start the app

```powershell
npm install
```

```powershell
npm run dev
```

Open <http://localhost:3000/admin/login> and sign in with the admin account. The dashboard shows live counts from your database.

## Deploy to Vercel

Vercel builds the site straight from GitHub (zip upload is not supported for Next.js sites with a server). Note: Vercel's free Hobby plan is for non-commercial use; a business site needs the Pro plan.

1. Open <https://vercel.com>, sign in with the GitHub account that can see the repository.
2. **Add New… → Project → Import** the repository `optimed-surgical-website`. Framework is detected as Next.js; keep the default build settings.
3. Before clicking Deploy, open **Environment Variables** and add (values from your `.env.local`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RATE_LIMIT_HMAC_SECRET`, `RESEND_API_KEY`, `NOTIFY_EMAIL`, `EMAIL_FROM`, `CRON_SECRET`, `GOOGLE_SITE_VERIFICATION` (optional) and `NEXT_PUBLIC_SITE_URL` (your live address, e.g. `https://optimedsurgical.com`, no slash at the end).
4. Click **Deploy**. Then **Settings → Domains → Add** `optimedsurgical.com` and follow the DNS records Vercel shows at your domain provider (remove the old Netlify records).
5. Supabase → **Authentication → URL Configuration** → set **Site URL** to the same live address.
6. `vercel.json` adds a daily cron (`/api/keep-alive`) that keeps the free Supabase project awake; it uses `CRON_SECRET`.

## Deploy to Netlify

1. Put the project on GitHub (private repository is fine). `.env` and `.env.local` are not uploaded.
2. In Netlify: **Add new site → Import an existing project → GitHub** and pick the repository. Netlify reads `netlify.toml` (build command `npm run build`, Node 22) and installs its Next.js runtime by itself.
3. **Site configuration → Environment variables**: add the same values as your `.env.local`:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from Supabase |
   | `SUPABASE_SECRET_KEY` | from Supabase (mark it as secret) |
   | `RATE_LIMIT_HMAC_SECRET` | same random value as in `.env.local` |
   | `NEXT_PUBLIC_SITE_URL` | your live address, e.g. `https://www.optimedsurgical.com` (no slash at the end) |
   | `RESEND_API_KEY`, `NOTIFY_EMAIL`, `EMAIL_FROM` | for email alerts |
   | `GOOGLE_SITE_VERIFICATION` | optional, see below |

4. Click **Deploy**. When it is live, open **Domain management** to connect your own domain (Netlify gives free HTTPS).
5. After changing `NEXT_PUBLIC_SITE_URL` or any variable, run **Deploys → Trigger deploy** so the new value is used.
6. In Supabase → **Authentication → URL Configuration**, set **Site URL** to the same live address.

## Google Search Console

1. Open <https://search.google.com/search-console> and add a property.
   - **Domain property** (recommended): verify with the DNS TXT record Google shows, at your domain provider.
   - **URL-prefix property**: choose the **HTML tag** method, copy only the code inside `content="…"`, put it in `GOOGLE_SITE_VERIFICATION` in Netlify, redeploy, then click **Verify**.
2. **Sitemaps** → submit `sitemap.xml` (full address: `https://YOUR-DOMAIN/sitemap.xml`). It lists every page, category, product and published article, and updates itself.
3. Use **URL inspection → Request indexing** for the homepage and new articles to speed things up.

Already built in for search engines and AI answer engines: page titles and descriptions, canonical links, `robots.txt`, `sitemap.xml`, share images (Open Graph), structured data (Organization, WebSite, BreadcrumbList, FAQPage, Blog and BlogPosting) and `/llms.txt` (a plain summary for AI assistants). Admin pages are hidden from search engines.

## Keeping the free Supabase project awake

Supabase pauses free projects after 7 days without requests. Two daily pings prevent that:

1. **Netlify scheduled function** (`netlify/functions/keep-supabase-awake.mts`): runs every day at 06:00 UTC once the site is deployed. Nothing to set up; check it under Netlify → **Logs → Functions**.
2. **GitHub Actions backup** (`.github/workflows/keep-supabase-awake.yml`): add repository secrets `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (Settings → Secrets and variables → Actions), then run it once from the **Actions** tab to test.

Both only read one public settings row with the publishable key. If the project is ever paused anyway, open it in the Supabase dashboard and click **Restore**.

## Blog

The blog is linked only from the footer (**Company → Blog**). Write articles in **Admin → Blog**: title, summary, article text (simple formatting: `## heading`, `- list`, `**bold**`, `[link](/products)`), SEO title and description, tags and a cover image (1200 × 630). A future publish date schedules an article. Tips: one clear topic per article, use the words buyers search for in the title and first paragraph, add a short FAQ at the end, and link to related product pages.

## What the admin panel can do

| Section | What you can change |
|---|---|
| Products | Add, edit, hide or delete products: name, category, code, description, key details, photos (upload, choose the main photo, delete) |
| Categories | Add, rename, reorder, image, subcategories |
| Quotations | Read quote requests, change status, private notes, turn one into an order |
| Messages | Contact form and catalogue requests, status and notes |
| Orders | Status updates with history, notes, delete |
| Certifications | Upload certificate PDFs or images, publish or hide them |
| Website content | Every text on the website: hero, about, what we make, process, how it works, certifications badges, FAQ, quote/catalogue/contact pages, footer. "Restore original" brings back the default wording |
| Blog | Write, schedule, publish and delete articles, with SEO fields and cover images |
| Settings | Email, phone, address, and Facebook / Instagram / LinkedIn / YouTube links (footer icons appear only for links you fill in) |

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm test` | Unit tests, plus the full database and RLS checks (run against an in-memory Postgres, no Docker) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Project structure

```text
src/
  app/                 routes (public pages, /admin/*)
  features/<domain>/   schemas, server actions, queries and components per domain
  lib/supabase/        server / public / secret / browser clients and the session proxy
  lib/auth/            requireAdmin (server-side admin check)
  config/              env validation, limits, status lists
  types/database.ts    database types (keep in sync with migrations)
supabase/
  migrations/          SQL files, run in order
  tests/rls_checks.sql security self-check
  tests/setup_check.sql shows which SQL steps are done
  seed/                starter catalogue
tests/                 unit + integration tests
```

## Security model (short version)

- Every table has Row Level Security. Visitors can read only published catalogue content.
- Admin access needs a signed-in user **and** a row in `admins`. It's checked on the server and in the database.
- The secret key is used only on the server, and only to save public quotation requests.
- Quotation product names and codes are copied from the database, never trusted from the browser. No prices exist anywhere.
- Submitted quotations and messages are readable only by admins, in the admin panel. The only email is the optional alert to the admin; buyers get no automatic email.
