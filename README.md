# Semaj Neon Dossier

A minimal static cyberpunk blog/archive to chronicle activities of the local legend/terror known as **Semaj**. Posts will be added over time.

## Structure
```
Semaj/
  index.html            # Homepage listing posts & info
  assets/
    css/style.css       # Theme styling
    js/main.js          # Fetch & render posts
    img/                # Images (add as needed)
  posts/
    posts.json          # Array of post objects (currently empty)
```

## Adding Posts
Edit `posts/posts.json` and insert objects. Keep the file as a valid JSON array.

Example post object:
```json
{
  "title": "First Sighting",
  "date": "2025-11-02T21:30:00Z",
  "author": "Field Agent 7",
  "tag": "sighting",
  "summary": "A brief silhouette on a rain-slick rooftop, leaving a phosphor trail.",
  "body": "<p>At 21:25 local, motion sensors tripped on Sector-12 rooftops. A figure vaulted across three gaps. Neon reflection indicated chromed augment on left arm. Trail dissipated after 14 seconds.</p>"
}
```

Then ensure commas between objects and no trailing commas:
```json
[
  { /* post 1 */ },
  { /* post 2 */ }
]
```
Because JSON does not allow comments, do not literally put the `/* */` parts above—replace with real objects only.

### Tips
- Keep `body` concise. Basic inline HTML tags (`<p>`, `<strong>`, `<em>`, `<code>`, `<br>`). Avoid scripts.
- Use ISO date format (`YYYY-MM-DDTHH:mm:ssZ`).
- Keep tags short (e.g., `sighting`, `incident`, `artifact`).

## Local Preview
You can open `index.html` directly in a browser. For fetch to work reliably (especially Chrome), run a local server.

PowerShell one-liner (Python required):
```powershell
python -m http.server 8000
```
Then browse: http://localhost:8000/

If you have Node.js:
```powershell
npx serve .
```

## Hosting Options
### 1. GitHub Pages
1. Initialize git & push to a GitHub repo named `semaj`.
2. In repo settings > Pages, select branch `main` (root). Save.
3. Site appears at `https://<your-username>.github.io/semaj/`.

### 2. Netlify
1. Create account, click "Add new site" -> "Import an existing project".
2. Connect Git provider, select repo.
3. Build settings: No build command (static). Publish directory: `.`
4. Deploy. Custom domain optional.

### 3. Vercel
1. Import Git repo in Vercel dashboard.
2. Framework detection: choose "Other" if asked. No build command. Output directory `.`
3. Deploy and get URL.

### 4. Cloudflare Pages
1. Create a new Pages project from repo.
2. Set Build command empty and Output directory `.`
3. Deploy.

### 5. Simple Static Hosting / Object Storage
Upload files to an S3 bucket (enable static site hosting), Azure Storage static website, or similar. Point DNS.

## Updating Posts
Just edit `posts/posts.json` and redeploy (commit & push). Clients re-fetch with `cache: 'no-store'` to avoid stale data.

## Browser Form Posting (Netlify)

The form on the page uses a Netlify Function (`create-post`) to append a new post to `posts/posts.json` through the GitHub API.

### Setup Steps
1. In Netlify dashboard go to Site Settings > Environment Variables.
2. Add `GITHUB_TOKEN` with a GitHub Personal Access Token that has `repo` scope (can be classic token, limited to this repo).
3. Add `GITHUB_REPO` set to `rfaulkner7/semaj` (owner/repo format).
4. Redeploy the site (Netlify will build & include the function).
 5. (Optional) Set `ALLOW_PUBLIC_POSTS=true` to permit any visitor to submit posts.
 6. (Optional) Set `POST_SHARED_SECRET=<value>` and add a hidden input `name="secret"` to require a shared code.

### How It Works
- User submits form.
- `assets/js/post.js` packages fields; image (if present) is base64 Data URL (< 500KB) and included inline.
- Function fetches existing `posts/posts.json`, prepends new post, commits back to GitHub.
- Site reload displays new post.

### Security Notes
- Anyone with access to the deployed site can submit, so restrict by adding a simple shared secret or auth if needed.
- To add a secret: set `POST_SHARED_SECRET` env var in Netlify, then modify the function to require it in the payload.
- Large images will slow load; keep them small, consider future migration to external storage (e.g., Cloudinary) and store URL instead of base64.
- Public posting uses `ALLOW_PUBLIC_POSTS=true`. Remove or set to false to disable quickly.
- Sanitization strips `<script>` tags and inline `on*=""` handlers before commit.

### Add Shared Secret (Optional)
To enable: add `POST_SHARED_SECRET` in Netlify and include a hidden input `<input type="hidden" name="secret" value="YOURSECRET" />` in the form and validate inside the function.

### Rate Limiting / Spam Prevention
- Use Cloudflare or Netlify Edge Functions / turnstile captcha for heavier protection.
- Simple approach: add minimal server-side check (e.g., reject posts with identical title in last X minutes).

## License
Your choice; currently unspecified.

---
"The city hums. Semaj moves."