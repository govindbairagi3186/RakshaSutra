# RakshaSutra PWA Stage 1 — Logo update

Upload these NEW files to the repository root:
- manifest.json
- service-worker.js
- pwa.js
- pwa.css
- offline.html
- icon-192.png
- icon-512.png
- apple-touch-icon.png
- favicon.png

Replace `index.html` with the included `index.html`.

For the existing `user.html` and `admin.html`, do not replace the body. Add these four lines inside `<head>` after the viewport meta tag:

<meta name="theme-color" content="#07111f" />
<link rel="manifest" href="manifest.json" />
<link rel="icon" href="favicon.png" type="image/png" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="stylesheet" href="pwa.css" />

Also replace the existing:
<span class="brand-badge">🛡️</span>

with:
<img class="brand-logo" src="icon-192.png" alt="RakshaSutra logo" />

Finally, immediately before `</body>` in BOTH files add:
<script src="pwa.js" defer></script>

Do not delete the existing module scripts (`user.js` or `admin-logic.js`).
