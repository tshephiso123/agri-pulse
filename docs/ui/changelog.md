# UI changelog

## Phase 1 — shell and shared presentation

- Replaced the decorative header with app name, connection/status control and a full-name language selector.
- Added first-launch language selection and compact homes for maize checks, calculator and records.
- Fixed the app frame to the viewport. Step bodies can scroll for large text and short screens; action bars stay outside that scroll area.
- Moved connection details and manual sync into a keyboard-accessible dialog.
- Added shared step/progress/action framing and icon-plus-word state components.
- Defined eight semantic color tokens, strong interaction boundaries, one 12px control radius and scalable type sizes.
- Added a locally hosted Noto Sans variable subset and license; checked Tshivenda glyph coverage and offline rendering.
- New UI strings are English only. Existing language catalogs remain intact; missing translations are listed separately.
- Added +40% pseudo-locale and phase-1 viewport/200%-text checks.

At the phase-1 checkpoint, calculator, diagnosis, protection and full logbook presentation drafts were unfinished. Later phases will complete these flows and adapt the existing regression suite. The user requested a stop for screenshots at each phase.

## Font rebuild

The source is NotoSans[wdth,wght].ttf from https://github.com/google/fonts/tree/main/ofl/notosans under the included OFL. Install fonttools and brotli as temporary build tools, then run `python scripts/subset-ui-font.py /path/to/source.ttf`. The app only ships the 153,960-byte WOFF2 subset, not the tools or source TTF.

## Phase 2 — calculator wizard

- Replaced the calculator draft with five data-defined steps: crop, fertilizer, field size, review and sample estimate.
- Added icon-labelled radio cards for two crop choices and three fertilizer choices, with maize/urea defaults preserved.
- Added a readable review of the selected crop, product and numeric hectares before calculation.
- Kept the existing calculation formula, rounding, minimum area and unsafe-output rejection; no new numeric-input syntax was introduced.
- Back keeps entered details while removing stale results. Calculate again returns to the choices with the current inputs retained.
- New text is English only and is listed for localization. Existing crop labels and error translations remain in use.
- Extended screenshot checks through every calculator step, invalid-input feedback, result and scrollable result details, in English, +40% pseudo text and 200% text at all six viewport sizes.
- Short portrait viewports reserve more width for the primary action and use compact Back layout. Progress bars now use the palette tokens in Chromium and Firefox.

Phase 3 diagnosis/logbook and phase 4 full-state integration remain pending. Screenshots are in docs/ui/phase2/. Actual Android font/keyboard behavior still needs real-device acceptance.

Phase-2 verification: production build, changed-file lint, 17 unit/backend/storage/localization checks, and the final 41-case phase-1/phase-2 browser run passed. Token contrast remains within the enforced thresholds.

## Phase 3 — diagnosis and logbook

- Fixed unlocked Logbook showing passphrase controls in an unbounded legacy container; shared step content scrolls while actions stay pinned.
- Added three recent summaries, responsive All entries pagination, record details, data-defined entry steps and saved confirmation.
- Kept existing encryption, consent, API and sync functions; moved protection/account/backup into bounded settings screens.
- Converted supplementary symptoms into shared data-defined steps; added answer icons and corrected Back on the first management step.
- Split conflicts into phone review and reviewed cloud-choice steps, applying the reviewed server version with explicit confirmation.
- Added phase-3 viewport/text, offline persistence/backup, and opt-in conflict regression scenarios. New English keys are listed in translations-needed.md.

Acceptance: 63 combined phase-1/2/3 browser cases and 17 Node cases passed; build, changed-file lint and contrast checks passed. Minor final dialog/protection/border adjustments were rechecked with focused phone/desktop/delete scenarios. Phase 4 remains pending.

## Branding adjustment

Renamed the visible app, browser title and PWA manifest to AgriSmart. Removed decorative icons above tool-home headings. Storage and protocol identifiers retain compatibility with existing records.

## Phase 4 — crop checks, farm setup and full-state acceptance (10 October 2026)

- Renamed the diagnostic navigation and home to Crop check. Added maize, tomato, beans and cabbage selection. Maize retains the offline FAW library and now displays the complete management list on the result. Other crops have sample general symptom triage and immediate inspection/adviser guidance; crop-specific diagnoses need validation.
- Added first-launch farm questions after language selection: optional farm name/community, crops and optional hectares. Preferences stay on this phone and can be edited. A storage error supports retry or session-only continuation.
- Added bounded restore actions, friendly storage/connection feedback, distinct sync/conflict states and matching visible/accessibility labels. Existing encrypted storage, opt-in sync and backend protocols are preserved.
- Migrated legacy browser checks to the shared wizard flows. Captured phone/desktop screen states in English, +40% pseudo-locale and 200% text, including slow/failed storage, saving, account states, offline pending records, encryption recovery and conflict resolution.
- Added normal-browser PWA installability, cold offline four-crop checks, and isolated Lighthouse accessibility snapshots. Every one of the 62 phone/desktop accessibility snapshots scored 100 with no failed automated audits. Build, lint, 17 Node tests and all intended contrast checks pass.

Screenshots, machine-readable browser results and audit reports are in docs/ui/phase4/. New English-only keys are listed for the localization lead. Real Android checks, reviewed translations and local agronomic validation remain pending; sample labels remain visible.

Final browser verification: 100 scenarios pass across the complete run and targeted rechecks for 12 Windows screenshot-write interruptions; all six gallery runs pass. The acceptance summary and raw reports are retained in docs/ui/phase4/. Phase 4 implementation and automated checks are complete.
