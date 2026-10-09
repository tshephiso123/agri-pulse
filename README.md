# AgriPulse

Offline-first hackathon field companion: sample input calculator, crop symptom tree, IndexedDB logbook, retryable sync and mock officer view.

Requires Node 24. Run `npm start` and open http://localhost:4173. Run `npm run check` and `npm test` for automated verification. There are no external dependencies.

## Project layout

```text
AgriPulse/
├── public/                 # Browser app; served at the web root
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js               # Service worker at root scope
│   ├── js/
│   │   ├── app.js          # Screens and sync orchestration
│   │   ├── data.js         # Sample crops, rates and symptom tree
│   │   └── storage.js      # IndexedDB persistence
│   ├── css/style.css
│   └── icons/              # SVG and PWA PNG icons
├── server/index.mjs        # Static server and mock API
├── tests/prototype.test.mjs
├── docs/architecture.md    # Folder ownership and change guidance
├── mock-data/              # Runtime records; ignored by Git
├── AGENTS.md               # Agent entry point
├── agent.md                # Current engineering context
├── instruction.md          # Sprint plan and acceptance checklist
├── package.json
└── README.md
```

Deploy with `npm start` for the complete prototype. If using static hosting, set the published directory to `public/`; sync still requires the Node API.

See [instruction.md](instruction.md) for Sprint 1 tasks and phone acceptance, and [agent.md](agent.md) for engineering context. Phone installation requires HTTPS hosting. Rates and symptoms are illustrative, not agronomic advice. The mock API has no authentication; enter fictional data only.
