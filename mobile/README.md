# Hasanat Scroll (Expo)

React Native port of the web app in the repo root, on Expo SDK 58.

- `npm install` then `npx expo start`, and scan the QR code with Expo Go on an iPhone.
- `node scripts/extract-web.js` re-copies the dhikr content, translations, rules, buddy drawing and prayer maths from `../index.html` into `src/web-data.js`.
- `node scripts/make-sounds.js` re-renders the sound effects in `assets/sounds`.

## Checks

- `npm test` runs the tests in `tests/` (the checks on saved progress and backup files, `src/safe.js`).
- `npm run lint` runs ESLint (Expo's rules, `eslint.config.js`).
- `npx expo export --platform ios` builds the bundle, the quickest way to catch an import or syntax error.

## Security notes

- Progress is only on the phone (AsyncStorage). Everything read back from storage or from a restored backup file goes through `src/safe.js`, which checks every field and drops anything unexpected.
- The learning path downloads Qur'an and hadith texts over HTTPS (`src/content.js`) with a time limit, a size limit and a check of the data's shape before anything is saved.
- No API keys or secrets live in the app or the repo. Publishing uses an `EXPO_TOKEN` kept in the environment.
- The web app at the repo root has a Content-Security-Policy that only lets its own scripts run. After editing a script in `../index.html`, run `python3 scripts/web-csp.py` to update their hashes.

© 2026 Zine. All rights reserved. See ../LICENSE.
