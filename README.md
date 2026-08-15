# Moment of Honor Dashboard

A small author-facing dashboard for the [`moment-of-honor-cms`](https://github.com/ChernegaSergiy/moment-of-honor-cms)
API: sign in with GitHub, create/edit/delete posts and stories, and upload
media.

The CMS API is intentionally UI-less — it's a serverless backend, not a
product. This repository is a from-scratch, single-purpose client for it,
free to make its own technology choices. Those choices here are
deliberately narrow:

- **No framework, no build step.** Plain HTML, CSS, and ES modules, served
  as static files.
- **[Pico CSS](https://picocss.com) (classless build).** Semantic HTML is
  styled automatically; there's no utility classes to maintain for a UI
  this small.
- **[Cloudflare Pages](https://pages.cloudflare.com).** One-click deploy,
  matching how `moment-of-honor-cms` already runs on Cloudflare Workers.

## Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ChernegaSergiy/moment-of-honor-dashboard)

This deploys the static site as-is — there is nothing to build or
configure at deploy time. Configuration (the CMS API URL) happens once,
in the browser, on first load.

## Same-origin setup (recommended)

The CMS Worker's session cookie is `SameSite=Lax`. A `fetch` from one
origin (e.g. `*.pages.dev`) to another (e.g. `*.workers.dev`) is
cross-origin, so the browser will neither attach that cookie nor allow the
response without matching CORS headers — and `moment-of-honor-cms` does not
send any, by design (see its README's security notes). This is not a bug
to work around in JavaScript; it needs the dashboard and the API to share
an origin.

The straightforward way to get there **without changing
`moment-of-honor-cms`** at all: put both behind one custom domain in the
same Cloudflare zone, and route by path.

1. Add a custom domain to this Pages project, e.g. `moment-of-honor.example`.
2. Add [Worker Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
   for the same zone pointing at the `moment-of-honor-cms` Worker:
   - `moment-of-honor.example/api/*`
   - `moment-of-honor.example/auth/*`
   - `moment-of-honor.example/webhook/github`
   - `moment-of-honor.example/feed.json`
3. Set the dashboard's API base URL (in Settings) to `https://moment-of-honor.example`.

Everything else — Pages serving `index.html`, `js/`, `css/` for all other
paths — keeps working unchanged, because Worker Routes only intercept the
paths they match.

Without this, the dashboard still loads and the settings screen still
works, but sign-in will appear to succeed (the Worker does set a cookie)
while every subsequent API call returns 401, because the browser withheld
the cookie on the cross-origin request. The dashboard detects a
cross-origin API URL and shows a warning in Settings so this isn't a silent
failure.

## Using the dashboard

1. Open the deployed site. On first load you're asked for the CMS API base
   URL (e.g. `https://moment-of-honor.example` per the setup above, or a
   `*.workers.dev` URL for local testing where the cross-origin limitation
   above doesn't matter as much since you're not persisting a real
   session across visits).
2. Click **Sign in with GitHub**. This opens `/auth/github` in a new tab;
   after GitHub's consent screen you'll land on a small JSON confirmation
   page — close that tab and click **I've signed in — continue** back in
   the dashboard.
3. Use the **Posts**, **Stories**, and **Media** tabs to manage content.
   Uploading media returns a repository path (e.g. `media/posts/…`); copy
   it into the `Media paths` field of a post or story.

All writes go through the CMS API exactly as documented in its README —
this dashboard has no direct GitHub access of its own.

## Project layout

```text
index.html          Page shell: settings, sign-in, and the three tabs
css/style.css        Small overrides on top of Pico classless
js/
├── app.js            Bootstrap: wires every module to the DOM
├── api.js            fetch wrapper for the CMS API
├── config.js         Stores the API base URL in localStorage
├── auth.js           Sign-in / sign-out flow
├── posts.js          Post list rendering + form (de)serialization
├── stories.js        Story list rendering + form (de)serialization
├── media.js          Media upload + copy-to-clipboard
└── dom.js            Small createElement / formatting helpers
```

## Local development

No build step — any static file server works:

```bash
python3 -m http.server 8080
# or: npx serve .
```

Then open `http://localhost:8080` and point Settings at your Worker's
`*.workers.dev` URL or local `wrangler dev` address. Cross-origin
limitations from the section above still apply.

## License

CSSM Unlimited License v2.0 — see [LICENCE](LICENCE).
