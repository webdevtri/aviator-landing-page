# KIXO9 content studio

Start the existing server with `npm run dev`, then open **http://localhost:3000/admin**.

The editor covers page copy, game labels, reward/loss popups, randomized chatter, multiplier reactions, legal notices, help/tour text, logos, characters, four player avatars, player names, and theme colors. Live balances, multipliers and stake amounts remain controlled by the game. Keep `{seconds}`, `{amount}`, `{step}` and `{total}` in labels that need those live values.

Changes appear in the embedded preview immediately. **Save changes** writes them to `data/site-content.json`; new landing-page loads use those saved values. Drafts survive editor reloads in that browser. **Discard draft** reloads the saved version. **Use original content** restores defaults to a draft, which only goes live after saving. JSON export/import moves content settings between installations; copy `assets/uploads` too when migrating uploaded images.

The preview offers desktop/mobile sizes and direct popup previews. Preview play uses the same server protection as the landing page. Log in as an admin to test without consuming visitor chances; admin rounds are recorded separately. Uploads support PNG, JPEG, WebP and plain SVG up to 6 MB; active SVG content is rejected. Uploaded images are stored in `assets/uploads/` and become visible on the landing page only when the associated content is saved. Replaced assets are retained so existing exports continue to work.

All editing requires an admin username and password, including on localhost. Admin accounts use salted scrypt password hashes in `data/activity.sqlite`; plaintext passwords are never saved in content files or browser storage. The old password-free local access and `CMS_PASSWORD` Basic-auth shortcut are removed. Use HTTPS on a remote host. Ten failed login attempts from one IP trigger a 15-minute cooldown.

Use **Change password** in the sidebar to change your own password (12–256 characters). This requires the current password, revokes that account’s other sessions, and renews the current session. Use **Add admin** to create another named account with full CMS access and unlimited replay. Usernames are case-insensitive and contain 3–40 letters, numbers, dots, underscores or hyphens. Credentials are excluded from CMS import/export. The initial `admin` account was created directly in the private database; its generated password is provided separately, not in source control.

CMS saving requires persistent disk storage. Temporary/serverless environments such as the current Vercel function are deliberately read-only in the CMS; configure a durable backend or use a persistent Node host before enabling remote publishing there. Include saved content and uploads in deployment artifacts for read-only deployments.

Implementation: `js/cms-schema.js` defines the fields and defaults, `cms.js` provides validated/revisioned saving and uploads, `js/cms-client.js` applies content to the landing page, and `admin.html` is the editor. `scripts/build-cms-schema.cjs` is the initial schema-generation source, not a content-saving command. Run checks with `node --test tests/*.test.cjs`.

## Visitor database and replay limits

Requires Node.js 24 or newer. `data/activity.sqlite` is a persistent SQLite database with durable writes for visitor identity, used rounds, cashouts, events, and admin sessions. It is excluded from Git and cannot be downloaded through the web server. Back up this database with SQLite-aware backup tooling or while the server is stopped.

A chance is consumed in a database transaction at takeoff, before the server responds. Refreshing, clearing cookies on the same IP, and parallel tabs do not restore it. A browser cookie also links visits across IP changes. IP matching uses keyed hashes rather than raw addresses. People sharing an IP can share the two-flight allowance; an IP does not uniquely identify a person. There is no client-side fallback that can grant extra rounds when the server is unavailable.

Cashouts are checked against server time. Submitted client multipliers, outcomes and payout amounts are not trusted. Completed flights are settled even if the browser closes. Refresh during an active flight waits for that already-recorded flight to finish, then presents the next available round or retained second-round reward.

Sign in at **/admin** with your username and password to create a 12-hour admin session in an HttpOnly cookie. Only this authenticated session grants unlimited replay. Click **Log out** to return to visitor limits. The **Visitor activity** panel shows the latest 150 events and refreshes every three seconds.

Behind a reverse proxy, set `TRUST_PROXY` only to the known proxy address/subnet (or `loopback` for a local reverse proxy). Forwarded IP headers are ignored otherwise. Do not trust arbitrary forwarded headers. The SQLite database and a persistent Node process must be shared by this deployment; do not run independent replicas with separate databases. Serverless temporary filesystems are rejected for tracked play.

## Flight and responsive settings

**Flight settings** controls both random multiplier ranges and the shared growth speed. Limits and speed are captured per flight when it starts, so changing settings does not change flights already running.

**Responsive settings** enables automatic safe-area insets and extra top, bottom and side clearance (0–120 px). The layout tracks the visual viewport as browser chrome or the keyboard changes it. For Android devices whose navigation overlays are not reported, set extra bottom clearance, for example 48 px. Keep this at 0 when the browser already reserves that space.

## CTA link and Google Tag Manager

Under **Popups**, edit **Claim CTA destination URL** to change where YOURS. CLAIM IT opens. Its default is https://www.kixo9.com/signup.

Under **Tracking**, paste a GTM container ID or its installation code. The CMS extracts and saves only the container ID and uses the standard asynchronous Google loader. Leave blank to disable it. Saved changes apply on new landing-page loads. The CMS preview does not load tracking. This JavaScript game uses the JavaScript GTM installation; no noscript fallback is needed for game interactions. Configure tags and consent behavior in your GTM container and keep your notices aligned with those tags.

Implementation reference: https://developers.google.com/tag-platform/tag-manager/datalayer
