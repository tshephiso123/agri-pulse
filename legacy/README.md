# Original prototype

Preserved from main during the backend merge. The active application lives in src/ and uses the repository's server/index.mjs.

Run this prototype separately with `node legacy/server/index.mjs`; use another PORT if the active server is running. Checks: `node --test legacy/tests/prototype.test.mjs`. Its ignored mock records live in legacy/mock-data/. It uses separate storage and API contracts from the encrypted backend.
