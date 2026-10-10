# UI brief review and implementation plan

Reviewed 9 October 2026 against the existing code and current early-FAW scope.

Accepted: quiet sunlight-readable tokens, locally hosted type, one question/group at a time, one primary action, pinned actions, fixed shell, FAW first, secondary tools retained, large radio targets, visible focus, reduced motion and bounded logbook paging.

Adjusted: the user approved contained scrolling when needed for long records, translated text, errors, enlarged text and short viewports. The page itself stays fixed; step content can scroll without hiding the action bar. The app stores encrypted farmer-owned cloud records, so copy must not claim an adviser receives them. Numeric parsing/default persistence were not changed because this is presentation work. A font asset and its license are added; no runtime dependency is added.

## Screen/state inventory

- FAW: start/instructions, each of 3 observations with unanswered/selected/uncertain answers, result (possible, uncertain, no signs), individual management steps, offline reference/source links, supplemental symptom choices and sample outcome.
- Calculator: start/sample context, crop/fertilizer group, field area, estimate/invalid input. Changing input clears the estimate.
- Logbook: loading, storage error/retry, protected logbook, recent entries (3), all entries (3/page below 700px height; 5 otherwise), entry detail, new/edit activity/category, notes, explicit Local-Only consent, saving/saved/error, delete confirmation.
- Record protection: create/open passphrase, show/hide, confirmation, unlocked/lock, encrypted backup, restore, wrong/damaged passphrase and progress.
- Cloud: optional account, sign in/register credentials, signing in/signed out, encrypted ownership, readable export, account deletion confirmation, request errors.
- Conflict: blocked notice, compare phone and downloaded cloud copy (or deletion), existing explicit resolution choices and confirmation.
- Global: online, offline, pending, syncing, synchronized, sync failure, language switch/draft/fallback, desktop rail/phone tabs, focus/keyboard/reduced motion.

## Design tokens and wireframe

Noto Sans variable 100–900, local WOFF2 with Latin and Extended Additional glyph checks. Surface #FBFCFB; ink #16211B; muted #55655C; line #E2E8E4 (dividers only); strong line #6F7F75; primary #1E5C3A; warning #8A5200; error #B3261E. Semantic warning/error are additional status tokens. Body 18px, secondary 16px, question 28px, result 36px. 12px interaction radius, flat layout, 4/8/16/24/32 spacing, borders instead of shadows. Warning foreground darkened where needed for AA.

    Phone                         Desktop
    +---------------------+       +----------+-------------------------+
    | AgriPulse status EN |       |AgriPulse | status          language|
    +---------------------+       |          +-------------------------+
    | Step 2 of 4         |       |FAW       |    max 520px column      |
    | Question            |       |Calc      |    Step / Question       |
    | [Radio answer]      |       |Logbook   |    [Radio answer]        |
    | [Radio answer]      |       |          |    content if overflow   |
    | content if overflow |       |          |                         |
    +---------------------+       |          |    [Back] [Next]         |
    | [Back] [Next]       |       +----------+-------------------------+
    | FAW | Calc | Records|
    +---------------------+

No decorative leaf marks, gradients, repeated shadow cards, tracked uppercase labels or marketing headings. Existing agronomic samples and language-review notices remain visible on relevant start/reference pages.

## User overrides applied

The app shell alone owns h-dvh/overflow-hidden; body remains scrollable. Step content scrolls as a fallback and actions remain pinned. Mobile tool tabs appear on homes, and hide while a wizard is running. First launch chooses among full language names. New UI keys are English only, with a missing-key list for nso/ve/ts. Noto Sans replaces Public Sans after actual glyph checks showed Public Sans misses 8 of 10 requested characters. Contrast reports cover all 28 pairs among 8 tokens. All entries uses 3 rows below 700px height and 5 otherwise. Phase acceptance adds 360×320, 640×360, 200% root text, and a +40% pseudo-locale; primary actions must stay within the viewport. Each phase stops with screenshots for review. Existing draft calculator/FAW/protection presentation work began before this override; phases 1–3 are now implemented; phase 4 remains pending.
