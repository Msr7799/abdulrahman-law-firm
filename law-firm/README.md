# Abdulrahman Almawdah — Law Firm Website

A production-oriented bilingual website for a Bahraini lawyer, built with Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and Lucide React. Arabic is the default locale and uses full RTL layout.

## Run locally

Requirements: Node.js 20.9+ and pnpm.

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. The root route redirects to `/ar`.

Production checks and start:

```bash
pnpm lint
pnpm build
pnpm start
```

## Main routes

Every public page is available under `/ar` and `/en`: home, about, services, consultation, contact, location, FAQ, privacy, and legal disclaimer. Technical endpoints are `POST /api/consultations` and `GET /api/place`. Next.js also generates `/sitemap.xml`, `/robots.txt`, and an Open Graph image.

## Configuration

Copy `.env.example` to `.env.local` and set only what is available:

- `NEXT_PUBLIC_SITE_URL`: canonical production origin, without a trailing slash.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: optional browser-restricted key. Reserved for a future interactive client map; never place a server key here.
- `GOOGLE_MAPS_SERVER_API_KEY`: server-only key used by the Places endpoint.
- `GOOGLE_CLOUD_PROJECT_ID`: documentation/deployment reference; not sent to clients.
- `GOOGLE_MAPS_PLACE_ID`: verified Place ID. Leave empty rather than guessing.

The existing legacy `GOOGLE_MAPS_API_KEY` is accepted server-side as a compatibility fallback, but migrating to `GOOGLE_MAPS_SERVER_API_KEY` is recommended.

Business identity and contact fields live in `src/config/site.ts`. Phone, WhatsApp, and email are intentionally `null` and therefore hidden. Hours, working days, blocked dates, timezone, and slot duration live in `src/config/business.ts`. General service categories are in `src/data/services.ts`; confirm them with the owner before presenting them as the firm's specific practice areas.

## Google Maps and Places

The public site works without Google credentials and provides the verified Google Maps link. `GET /api/place` uses the current Places API (New) Place Details endpoint from the server, requests a minimal field mask, normalizes the response, and caches it for one hour.

In Google Cloud:

1. Enable only the required APIs: Places API (New), plus Maps JavaScript API if a client-side interactive map is added later.
2. Restrict the browser key by HTTP referrers, such as `http://localhost:3000/*`, `https://example.com/*`, and `https://www.example.com/*`.
3. Use a separate server key for Places. Restrict it to Places API and apply the server/network restrictions available for the deployment platform.
4. Find and verify the official Place ID, then set `GOOGLE_MAPS_PLACE_ID`. Do not infer one from the short URL.

No secret is exposed through a `NEXT_PUBLIC_` variable. The current map card deliberately uses a resilient styled fallback and the verified directions link.

## Consultation booking

The form provides bilingual client validation plus independent server-side Zod validation, same-origin checking, sanitization, an invisible honeypot, and a basic in-memory rate-limit adapter. Available times are generated only from configured office hours. A successful response returns a `CONS-XXXXXXXX` reference and clearly states that the appointment still requires confirmation.

The development adapter does **not** persist consultation requests. Connect the validated `clean` payload in `src/app/api/consultations/route.ts` to an approved PostgreSQL, Supabase, Neon, email, or calendar adapter before production use. Replace the in-memory rate limiter with a shared store for multi-instance deployment, and consider Cloudflare Turnstile if abuse warrants it. Review retention and privacy text after adding storage.

## Content and assets

No external stock images, scraped social content, fabricated testimonials, qualifications, contact details, ratings, or case results are included. `ASSETS.md` records the current asset status. Replace the code-native profile placeholder only with an officially approved portrait, place it in `public/assets/images/`, and update `src/data/lawyer.ts` plus the profile component to use `next/image`.

The scripts in `scripts/` create the prescribed asset folders but intentionally contain no invented download URL. Record source, licence, date, and purpose in `ASSETS.md` before adding any third-party asset.

## Deployment

Import the repository into Vercel, keep the package manager as pnpm, configure the environment variables for Preview and Production, and deploy. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin. After connecting persistent booking storage, test privacy handling, rate limiting, notification delivery, and the complete confirmation workflow before accepting live requests.
