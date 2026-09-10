# QS AI Frontend — Payment Valuation Copilot

React / Vite UI for **QS AI Payment Valuation Copilot**, built for the **Smart QS Hackathon 2026** (Assigned Challenge **A2 – Payment Valuation**) at Cyberport, Hong Kong.

> **Principle:** AI advises; the authorised Quantity Surveyor decides and certifies.

## Hackathon context

| Item | Detail |
|------|--------|
| Programme | [Smart QS Hackathon 2026](https://www.cyberport.hk/en/smart_qs_hackathon_2026/) |
| Stream | Assigned Challenge – Payment Valuation |
| Team | AI-forAll |
| Co-organisers | Housing Bureau, Hong Kong Housing Authority, Cyberport, The University of Hong Kong |
| Companion API | [aiandcyber/qs-ai-backend](https://github.com/aiandcyber/qs-ai-backend) |

Related references:

- Programme site: https://www.cyberport.hk/en/smart_qs_hackathon_2026/
- Live demo domain used by the team: https://qs.ai-forall.org

## What this UI provides

- Project workspace for interim payment valuation demos
- Claim vs assessment table with **Green / Amber / Red** payment confidence
- Evidence / CPECS findings views
- Hong Kong open-data / market context panels (when backend enabled)
- Cap. 652 / contract deadline board
- Draft payment response / IPC views
- Docked **QS Agent** chat (EN + Traditional Chinese)
- Optional Auth0 login for the agent

## Technology stack

- **React 19** + **TypeScript**
- **Vite 8**
- **@auth0/auth0-react** (optional login)
- **Cloudflare** deploy via Wrangler / Pages-style asset hosting (`wrangler.jsonc`)

## Repository layout

```
src/                 Application source (pages, agent, auth, i18n)
public/              Static assets (favicon)
index.html           SPA entry
vite.config.ts       Dev server + Cloudflare Vite plugin; proxies /api → backend
wrangler.jsonc       Cloudflare frontend deploy config
package.json         Dependencies and scripts
```

Note: `src/_backup_ui_*` folders are historical UI snapshots kept for rollback reference.

## Local development

Requires the [backend](https://github.com/aiandcyber/qs-ai-backend) running on port **8000** (or set `VITE_API_TARGET`).

```bash
npm install
cp .env.example .env.local   # edit Auth0 / API base if needed
npm run dev
```

Open http://127.0.0.1:5173/ (or http://localhost:5173/ if using Auth0 localhost callbacks).

Vite proxies `/api` to `http://localhost:8000` by default.

## Configuration

Create `.env.local` (gitignored) from `.env.example`:

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Backend base URL in production builds (empty in local proxy mode) |
| `VITE_DEFAULT_LOCALE` | `en` or `zh-Hant` |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain (optional) |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client id (optional; public by design for SPA) |
| `VITE_AUTH0_AUDIENCE` | API audience (optional) |

If Auth0 variables are unset, the UI runs without login enforcement for the agent.

**Do not commit** `.env.local` / `.env.production`.

## Deployment

Configured for Cloudflare (Wrangler):

```bash
npm run build
npm run deploy
```

Or connect this GitHub repo to **Cloudflare Pages / Workers Builds** so every push to `main` builds `npm run build` and publishes `dist`.

Set production environment variables in the Cloudflare project (especially `VITE_API_BASE` pointing at your deployed backend).

Ensure the backend `CORS_ORIGINS` includes your frontend origin (e.g. `https://qs.ai-forall.org`).

## How to reuse

1. Clone this repo and [qs-ai-backend](https://github.com/aiandcyber/qs-ai-backend)
2. Run backend locally, then `npm install && npm run dev` here
3. Add your own Auth0 SPA application if you need login
4. Point `VITE_API_BASE` at your API for production builds
5. Rebrand / trim modules as needed; keep the “QS decides” wording if you demo to professionals
6. Remove `src/_backup_ui_*` if you do not need historical UI backups

## Security notes for public use

- No API keys belong in this frontend repo
- Auth0 **SPA client IDs** may appear in build env vars; they are public client identifiers — protect APIs with proper audience validation and secrets on the backend
- Do not embed evaluator passwords or real project documents in the UI source

## Licence / status

Prototype created for Smart QS Hackathon 2026. Provided as-is for learning, demo, and further development. Confirm licence / IP terms with your team and the Programme organisers before commercial reuse.

## Acknowledgements

- **Smart QS Hackathon 2026** co-organisers: Housing Bureau, Hong Kong Housing Authority, Hong Kong Cyberport Management Company Limited, The University of Hong Kong
- Open-source projects: React, Vite, TypeScript, Auth0 React SDK, Cloudflare Wrangler
- Team **AI-forAll** for building and demonstrating the prototype
