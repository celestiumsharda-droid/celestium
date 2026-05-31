# Deploying Celestium

This is the exact click-path to take Celestium from a local project to
a live site on Cloudflare Pages. It assumes you have a GitHub account
and a working local build (`npm run build` succeeds).

The whole thing takes about ten minutes the first time. Subsequent
pushes redeploy automatically.

---

## 1. Push to GitHub

If you haven't already:

1. Create a new repository at <https://github.com/new>. Name it
   `celestium`. Leave it empty — no README, no `.gitignore`, no
   license. (We already have those locally.)
2. From the project root, connect and push:

   ```powershell
   cd C:\Users\devan\Downloads\files\celestium
   git remote add origin https://github.com/<your-username>/celestium.git
   git branch -M main
   git push -u origin main
   ```

   Authenticate when prompted. If you're using HTTPS and 2FA is on,
   create a personal access token at
   <https://github.com/settings/tokens?type=beta> with **Contents: read
   and write** scope and paste it as the password.

3. Refresh the GitHub repo page. You should see all the project files.

---

## 2. Connect Cloudflare Pages

1. Sign in to <https://dash.cloudflare.com/>. A free account is fine.
2. In the left sidebar, click **Workers & Pages**.
3. Click **Create application** → tab **Pages** → **Connect to Git**.
4. Authorize Cloudflare to read your GitHub account if prompted. You
   can scope the access to just the `celestium` repo.
5. Pick the `celestium` repo from the list and click **Begin setup**.

You'll land on a build configuration page. Use these exact values:

| Field | Value |
|---|---|
| Project name | `celestium` (or whatever you want — this becomes your `*.pages.dev` subdomain) |
| Production branch | `main` |
| Framework preset | **None** (we control the build ourselves) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank)* |

Under **Environment variables** click *Add variable* and add:

| Name | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `VITE_NASA_API_KEY` | your real NASA key (or `DEMO_KEY` for now — get a free one at <https://api.nasa.gov/>) |

Click **Save and deploy**. Cloudflare runs `npm install`, then
`npm run build`, then publishes `dist/`. First build takes 2–3 minutes.
You can watch the live log; if it goes red, paste the last 20 lines
back to your collaborator.

When it finishes you'll get a URL like
`https://celestium.pages.dev/`. Open it. The site should be live, with
working pretty paths (`/discoveries/black-hole-image/`), 404 page, and
sitemap.

---

## 3. Sanity-check the live deploy

Open these in a browser and verify:

- `https://celestium.pages.dev/` — homepage loads, NASA APOD card
  populates (or fails gracefully if the rate limit is hit).
- `https://celestium.pages.dev/discoveries/black-hole-image/` —
  article renders, the depth toggle works, the back-link returns
  home.
- `https://celestium.pages.dev/discoveries/first-exoplanet/` — the
  new planet article loads.
- `https://celestium.pages.dev/discovery.html?id=black-hole-image` —
  legacy URL **redirects** (301) to the pretty path.
- `https://celestium.pages.dev/sitemap.xml` — visible XML, one entry
  per discovery plus the homepage.
- `https://celestium.pages.dev/robots.txt` — points at the sitemap.
- `https://celestium.pages.dev/does-not-exist` — your 404 page.

If any of these fail, the most likely cause is a typo in the build
config above. Fix it under **Settings → Builds & deployments** and
trigger **Retry deployment**.

---

## 4. Custom domain

Until you buy one, the `*.pages.dev` URL is your real address. When
you do buy one:

### 4a. Add it in Cloudflare

1. Open your project → **Custom domains** tab → **Set up a custom
   domain**.
2. Type the domain (e.g. `celestium.space`) and click **Continue**.

Cloudflare will give you one of two instruction sets depending on
where you bought the domain:

- **If the registrar lets you change nameservers** (Namecheap,
  Porkbun, Cloudflare Registrar, most others), it'll show two
  Cloudflare nameservers. Set those on the registrar, wait up to an
  hour for propagation. SSL is automatic.
- **If you can only set records**, it'll give you a CNAME (apex via
  `CNAME flattening` or an `A` record). Follow the on-screen values
  exactly.

### 4b. Update the project's hardcoded domain

Once the custom domain is live, change **one line** in the repo so
canonical / OG / sitemap URLs match:

```js
// site.config.js
origin: "https://celestium.space"   // ← change this
```

Then in `public/robots.txt`, update the sitemap URL the same way:

```text
Sitemap: https://celestium.space/sitemap.xml
```

Commit and push. Cloudflare auto-deploys; sitemap + meta tags now use
the real domain.

---

## 5. After every change

Local development:

```powershell
cd C:\Users\devan\Downloads\files\celestium
npm run dev
```

When ready to deploy:

```powershell
git add -A
git commit -m "your message"
git push
```

That's it. Cloudflare watches the `main` branch and rebuilds
automatically. The new version is live in 2–3 minutes.

Preview deploys: any branch other than `main` gets its own
`https://<branch>.celestium.pages.dev` URL. Useful for letting
someone review a draft article before merging.

---

## Recommended NASA API key

`DEMO_KEY` works but is rate-limited to ~30 requests/hour per IP
across **all of NASA**. On a public site, you'll hit that fast. Get a
free real key at <https://api.nasa.gov/> (instant, no approval, 1000
requests/hour). Drop it into the `VITE_NASA_API_KEY` env var in
Cloudflare Pages → **Settings → Environment variables → Production**.
Re-deploy to bake the new value into the bundle.

---

## Recommended domain registrars

In rough order of trust / pricing:

1. **Cloudflare Registrar** (<https://www.cloudflare.com/products/registrar/>)
   — at-cost, no markup. You're already using Cloudflare; one less
   account. Doesn't sell every TLD, but covers most.
2. **Porkbun** — at-cost-adjacent. Wide TLD coverage. Good UI.
3. **Namecheap** — cheap year one, regular thereafter.

Avoid GoDaddy and Network Solutions.

For Celestium specifically: `.space` is on offer at most registrars
for first-year sub-$5 promos, regular ~$25/yr. `.science` exists but
is uncommon. `.org` is canonical for non-commercial publications and
costs ~$12/yr.
