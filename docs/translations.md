# Language decision for the six-hour MVP

Decision on 9 October 2026: prepare the fixed interface text with the public Google Translate UI and bundle the resulting draft language files. The user has no Google Cloud project configured. No cloud account, billing setup, API key, runtime translation endpoint or translation SDK is required for this MVP.

| Option | Sepedi | Xitsonga | Tshivenda | Setup and limits |
| --- | --- | --- | --- | --- |
| Azure Translator Text API | `nso` listed | Not listed | Not listed | Azure subscription/resource/key; F0 provides 2 million characters/month |
| Google Cloud Translation | `nso` listed | `ts` listed | Not listed | Cloud project, API enablement and credentials; Basic has a 500,000-character monthly credit allowance |
| Google Translate public UI → bundled files | Available | Available | Available | Used to prepare this draft once; no account required for the preparation performed here |

References checked: [Azure languages](https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support), [Azure pricing](https://azure.microsoft.com/en-us/pricing/details/translator/), [Google Cloud languages](https://docs.cloud.google.com/translate/docs/languages), [Google Cloud pricing](https://cloud.google.com/products/translate/pricing), [public Google Translate](https://translate.google.com/). Consumer and Cloud language availability differ. Do not assume a consumer language is available in the Cloud API.

This choice optimizes delivery time and offline operation; it is not a claim that Google is more accurate than Azure. The output contains awkward and incorrect terms, so all non-English packs remain machine drafts awaiting fluent-speaker review. Known ambiguous English phrases were resubmitted with fertilizer context. Treatment actions and chemical doses retain the original English text because the observed machine output mistranslated chemical terms. Symptom buttons display English references alongside the draft translations.

## Implementation

- `src/locales/en.json` is the source catalog; `nso.json`, `ts.json`, `ve.json` are bundled drafts with matching keys. English brand, fertilizer identifiers, chemical actions and doses remain unchanged.
- `se` was an incorrect code for Sepedi: it denotes Northern Sami. Saved `se` preferences migrate to `nso`; invalid preferences fall back to English. The HTML language is updated for assistive technology.
- Help, loading, empty-state, error, navigation, privacy/consent and form text now pass through i18next. Crop names come from the same catalog rather than the old incorrect data labels.
- Interpolation preserves `{{area}}` and `{{count}}`. Google translated the names of these placeholders in the Tshivenda output; they were restored before validation.
- No farmer records, notes, account identifiers, passphrases or passwords were sent for translation. Language changes make no translation-service requests. User-entered text is preserved as entered.

## Updating and reviewing

The numbered public-text exports are in `scripts/translations/`, with the original batches in `scripts/translation-batches.json`. `scripts/import-translations.mjs` checks ordering, completeness and placeholders before publishing all packs. Its supplemental mappings document the clearer source phrases used for translation. Run `node scripts/import-translations.mjs` only when intentionally reimporting those exports; direct reviewer edits to locale JSON would otherwise be overwritten.

Review the calculator quantities/units, crop and symptom labels, saving/unlocking messages, deletion confirmations and sharing consent first. A fluent reviewer must assess meaning and reading ease, not just key completeness. Keep treatment content in English until qualified review confirms both translation and sample content. Do not label these packs human-reviewed until that happens.

Checks passed: three localization tests, lint, production build, and all nine browser tests (including the existing encryption/offline/sync flows). Browser tests verify switching all three languages with networking disabled, reopening, translated validation, crop names, logbook states and 375 px overflow. Real-phone and native-speaker acceptance remain pending. Native browser controls, such as the file-picker button, use the browser's own language settings.

For later API automation, use the official Google Cloud Translation API to regenerate supported languages during preparation/build. Confirm target support through its languages endpoint and protect credentials outside Vite client environment variables. Retain bundled packs for offline use. Tshivenda needs a separately supported translation/review workflow unless Cloud support changes.

## FAW pivot additions
The new early-diagnosis checklist and all of its guidance have English and draft Sepedi copy in the existing catalogs. The FAW additions in Xitsonga and Tshivenda use English and display an explicit fallback notice. They are not translated packs for the FAW flow. A fluent Sepedi reviewer must verify terminology, comprehension and management steps with local farmers before release. Existing generic diagnostic chemical instructions remain subject to their earlier review gate.
