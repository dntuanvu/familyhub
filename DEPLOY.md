# Deployment

Family Hub is a monorepo with three deployable units:

| Component | Recommended host | Why |
|---|---|---|
| **Web** (`apps/web`) | **Vercel** | Vite SPA, free, global CDN, instant deploys |
| **API** (`apps/api`) | **Render** (or Railway/Fly) | NestJS + Prisma need a long-lived Node process |
| **Postgres** | **Neon** | Serverless Postgres with a generous free tier, Prisma-friendly |

> You *can* run the API on Vercel serverless, but Prisma connection management on cold starts is painful. Render's free web service wakes in ~30 s after idle, which is a better trade for this app.

---

## 1. Database — Neon

1. Create an account at <https://neon.tech> and a new project (region close to you — Singapore / Frankfurt / Oregon).
2. On the project overview, copy the **pooled** connection string. It looks like:
   ```
   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Keep this handy — it goes into Render as `DATABASE_URL`.

The Prisma schema is unchanged; Neon speaks standard Postgres.

---

## 2. API — Render

### Blueprint deploy (one click)

1. Push the repo to GitHub.
2. Render dashboard → **New → Blueprint** → point at your repo. It picks up [`apps/api/render.yaml`](apps/api/render.yaml).
3. Render will ask for the three `sync: false` env vars:
   - `DATABASE_URL` → the Neon string from step 1
   - `CORS_ORIGIN` → `https://your-web.vercel.app,https://familyhub.app` (comma-separated, no spaces)
   - `WEB_BASE_URL` → your public web URL, e.g. `https://familyhub.app` (used in password-reset emails)
4. The `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are auto-generated.
5. First build runs `prisma:generate && build && prisma:deploy` — the last step applies migrations.
6. Note the public API URL Render gives you, e.g. `https://family-hub-api.onrender.com`.

### Alternative: Railway or Fly

Any Node 20+ host works. The important bits:

- Root directory: `apps/api`
- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm prisma:generate && pnpm build && pnpm prisma:deploy`
- Start: `node dist/main.js`
- Env: see [`apps/api/.env.example`](apps/api/.env.example)

---

## 3. Web — Vercel

1. Vercel dashboard → **Add New → Project** → import the repo.
2. In the import step:
   - **Root Directory**: `apps/web`
   - **Framework preset**: Vite (auto-detected)
   - Vercel will read [`apps/web/vercel.json`](apps/web/vercel.json) for build/output config.
3. **Environment variables** (Project Settings → Environment Variables):
   ```
   VITE_API_URL = https://family-hub-api.onrender.com/api
   ```
   Set for Production, Preview, and Development.
4. Deploy. Vercel gives you a `*.vercel.app` URL.

### SPA rewrites

The `vercel.json` rewrites every request to `/index.html` so React Router handles deep links like `/tasks` or `/reset-password?token=…`.

---

## 4. Custom domain

### Buying

I can't check availability live, so use **[Cloudflare Registrar](https://domains.cloudflare.com)** (at-cost pricing, no renewal markup) or **Namecheap** / **Porkbun**. Searches cost nothing.

Suggested, in rough order of punchiness:

| Domain | Vibe |
|---|---|
| `familyhub.app` | On brand, `.app` is HTTPS-only (secure by default). Likely taken but worth checking. |
| `familyhub.sg` | Country-targeted (Singapore). Short. |
| `familyhub.co` | Short, international. |
| `familyhub.family` | Niche TLD, fits exactly. |
| `myfamilyhub.com` | `.com` fallback if `familyhub.*` is gone. |
| `familyhub.com.sg` | Formal Singapore commercial, but 11 chars + `.com.sg` is a mouthful. |
| `hubfamily.com` | Reversed, often available when the obvious one isn't. |
| `rootsapp.io` / `nestapp.co` | If you want a different name entirely. |

**Rule of thumb for a kids' app:** pick something a 9-year-old can spell. `.app` and `.co` read cleaner on packaging than `.com.sg`.

### Pointing it at Vercel

1. Buy the domain at your registrar.
2. Vercel → Project → **Settings → Domains** → **Add** → type the domain.
3. Vercel shows the DNS records you need. Two typical options:
   - **Cloudflare DNS** (easiest, free): add the `CNAME` or `A` record Vercel shows.
   - **Cloudflare Registrar**: DNS is automatic, just paste the records in the DNS tab.
4. SSL is issued automatically within ~30 seconds.
5. Also add `www.familyhub.app` → will redirect to the apex automatically if you tick the box.

### Pointing it at Render

1. Pick a subdomain for the API, e.g. `api.familyhub.app`.
2. Render → Service → **Settings → Custom Domain** → add `api.familyhub.app`.
3. Add the `CNAME` Render shows at your registrar.
4. **After the API has a stable domain**, update the env vars:
   - On Render: `CORS_ORIGIN=https://familyhub.app,https://www.familyhub.app`
   - On Vercel: `VITE_API_URL=https://api.familyhub.app/api`
5. Redeploy the web app for `VITE_API_URL` to take effect.

---

## 5. Post-deploy checklist

- [ ] Open `https://familyhub.app` — landing page loads, language switcher works
- [ ] Register a test family — redirects to dashboard
- [ ] Open `https://api.familyhub.app/docs` — Swagger renders
- [ ] Add a child, a task, mark done — stars increment
- [ ] Request password reset — email isn't wired yet, but the Render logs show the reset URL
- [ ] Mobile: bottom tabs appear, no page scroll bounce
- [ ] iPad landscape: sidebar visible with roomy tap targets

---

## 6. Email delivery

Password-reset email is wired. The `MailService` has three providers; pick one via env:

| `MAIL_PROVIDER` | Required env | Notes |
|---|---|---|
| *(empty)* | — | **Console log only** (dev default). Reset URL is also returned in the response when `NODE_ENV !== production`. |
| `resend` | `RESEND_API_KEY`, `MAIL_FROM` | Easiest. Use `onboarding@resend.dev` as `MAIL_FROM` during setup — works without domain verification, but only sends to your Resend account email. For public use, verify a domain in Resend and switch `MAIL_FROM` to e.g. `noreply@familyhub.app`. |
| `postmark` | `POSTMARK_SERVER_TOKEN`, `MAIL_FROM` | Reliable deliverability; requires a verified sender signature. |

### Resend quick setup

1. Sign up at <https://resend.com> (free tier: 3k emails/month, 100/day).
2. **API Keys** → create a sending key → paste into Render as `RESEND_API_KEY`.
3. Keep `MAIL_FROM="Family Hub <onboarding@resend.dev>"` for testing.
4. To send to anyone (not just you): **Domains** → add `familyhub.app` → add the DNS records Resend shows at your registrar → wait for verification → change `MAIL_FROM` to `noreply@familyhub.app`.

### Postmark quick setup

1. Sign up at <https://postmarkapp.com> (free trial: 100 emails to any address; paid from $15/mo).
2. **Sender Signatures** → add and verify a sender (DKIM/Return-Path records).
3. **Servers** → use the default server's **Server API Token** → paste into Render as `POSTMARK_SERVER_TOKEN`.
4. Set `MAIL_FROM` to the verified sender address.

The email template is localized (en/zh/vi). The web passes the user's current UI locale with the forgot-password request; the API also falls back to the user's family locale if the request doesn't carry one.

## 7. Known gaps for production

Flagging these honestly so you aren't surprised:

- **No rate limiting** on `/auth/login` or `/auth/forgot-password`. Add `@nestjs/throttler` before going public.
- **No HTTPS redirect** in Nest. If you expose the API directly instead of behind Render's TLS, enforce it.
- **CORS is open to listed origins only.** Keep that list tight.
- **Prisma migrations run on every Render deploy** (`prisma:deploy`). That's fine for a solo project but switch to a dedicated migration step before you have paying users.
- **Render free tier sleeps after 15 min idle.** The first request after a sleep takes ~30 s to wake. Upgrade to the $7/mo starter plan to kill that.
