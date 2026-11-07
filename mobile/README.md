# Hasanat Scroll (Expo)

The Hasanat Scroll app, on Expo SDK 58. The same code runs on iPhone (Expo Go) and as the web app on GitHub Pages.

- `npm install` then `npx expo start`, and scan the QR code with Expo Go on an iPhone.
- `node scripts/build-web.js` builds the web app into `dist/`; `--deploy` also copies it to the repo root, which GitHub Pages serves. Web-only versions of a few modules sit next to the phone ones as `*.web.js` (sound through Web Audio, haptics, compass, reminders, saved learning texts); the page template, icons and manifest are in `public/`, the service worker in `scripts/sw-template.js`.
- `node scripts/extract-web.js` re-copies the dhikr content, translations, rules, buddy drawing and prayer maths from the old one-file web app (`legacy-web/index.html`) into `src/web-data.js`. It also reverts a manual edit in web-data.js, so prefer editing web-data.js directly.
- `node scripts/make-sounds.js` re-renders the sound effects in `assets/sounds`.

## Checks

- `npm test` runs the tests in `tests/` (the checks on saved progress and backup files, `src/safe.js`).
- `npm run lint` runs ESLint (Expo's rules, `eslint.config.js`).
- `npx expo export --platform ios` builds the bundle, the quickest way to catch an import or syntax error.

## Security notes

- Progress is only on the phone (AsyncStorage). Everything read back from storage or from a restored backup file goes through `src/safe.js`, which checks every field and drops anything unexpected.
- The learning path downloads Qur'an and hadith texts over HTTPS (`src/content.js`) with a time limit, a size limit and a check of the data's shape before anything is saved.
- No API keys or secrets live in the app or the repo. Publishing uses an `EXPO_TOKEN` kept in the environment.
- The web app has a Content-Security-Policy (`public/index.html`) that only lets the site's own script files run (`script-src 'self'`) and only fetches from the site, jsDelivr and raw GitHub.

© 2026 Zine. All rights reserved. See ../LICENSE.
