# Alignment with the comprehensive specification

The supplied specification is the product reference. The React implementation now adds missing field tools while avoiding unsupported dosage and distribution claims.

| Requirement | Current implementation |
| --- | --- |
| Offline calculator, diagnostics, logbook | Implemented and browser-tested; real-phone acceptance pending |
| Product nitrogen fraction, kg, 50 kg bags, 15 kg quantities | Implemented; nitrogen-only plan and sample targets clearly labelled |
| Soil-test subtraction | Adviser-provided plant-available nitrogen credit in kg/ha; no raw ppm conversion |
| Validation and salt-burn/split caution | Finite/range checks; sandy-soil and high sample-target caution; no invented safe schedule |
| Bottle caps per plant | Actual product mass per cap and plant count required; unit conversion only |
| Diagnostic questions, back and restart | JSON-defined guided sample triage |
| Practical tank quantities | Exact label mL/L × tank litres; generic pesticide cap advice removed from active UI |
| Soil guide and jar method | Bundled sandy/clay/loam education with calculator link and approximate jar observation |
| Four languages | Existing dictionaries bundled; new guidance uses English fallback pending full translation and review |
| Free access | No account/paywall for core tools; local logbook needs only a local encryption passphrase |
| Initial distribution | Install PWA with connectivity, or share self-contained offline HTML field kit; actual receiving-phone handling still needs tests |
| Under 3 MB | Current precached assets around 441 KB; field kit around 44 KB; verify each release |
| Reconnect sync / recovery | Existing encrypted opt-in sync, external backups and account recovery retained |
| Officer aggregated dashboard | Phase 2; no officer authorization or encryption-key sharing implemented |

## Claims to use

“Free field tools that work without signal after setup. A small shareable field kit gives basic access without an account or PWA installation. Optional backup helps protect records when connectivity returns.”

Do not claim zero data forever, guaranteed PWA installation through Xender, validated crop treatments, complete local-language guidance, or guaranteed recovery of unsynced notes. Cached data may be evicted by browsers; phone-only notes can be lost with the device.

## Content references

- FAO Soil Texture training manual: https://www.fao.org/fishery/static/FAO_Training/FAO_Training/General/x6706e/x6706e06.htm
- FAO Soil and Water: https://www.fao.org/4/r4082e/r4082e03.htm
- EPA pesticide label Q&A supports the general principle of product-specific rates: https://www.epa.gov/pesticide-labels/pesticide-labeling-questions-answers

These references inform general explanations and unit-conversion safeguards. They do not validate the bundled Limpopo crop targets, diagnoses or South African product approvals. Seek local agronomic and native-speaker review before farmer rollout.
