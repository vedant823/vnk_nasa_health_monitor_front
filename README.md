# Crew Health Monitor (front end)

Team VNK's entry for the NASA Space Apps Challenge 2026 challenge
[Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

This is the React front end. It talks to the team's Spring backend
(`vnk_nasa_health_monitor_back`). It lets a crew member log in, see which body areas and health
risks need attention, follow simple step-by-step instructions for each health check, log the
result, and see what to do next.

> **AI disclosure.** The source code, the body illustration, the drawing for every measurement step and
> the plain-language help text in this repository were generated with an AI assistant (Claude by
> Anthropic) and reviewed by team VNK. Every AI-made image carries a visible "AI-generated"
> watermark. Nothing here uses, contains or modifies NASA branding or design elements. Details
> are in [AI_DISCLOSURE.md](AI_DISCLOSURE.md) and on the app's Info page.

## Run it

You need Node.js 18 or newer.

```bash
npm install
cp .env.example .env.local   # then edit if your backend is not on localhost:8080
npm run dev                  # opens on http://localhost:5173
```

Start the backend first (it listens on port 8080 and needs MongoDB). The backend only accepts
browser requests from `http://localhost:5173`, so the dev server is pinned to that port.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 5173 |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the built app |
| `npm run typecheck` | Type-check only |

### Settings (`.env.local`)

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the backend |
| `VITE_USE_MOCKS` | `false` | `true` runs the app without the backend (demo mode) |

### Demo mode (no backend needed)

Set `VITE_USE_MOCKS=true` in `.env.local`. The app then answers its own requests with simulated
data that follows the backend's rules and is saved in the browser. Create any account to start
empty, or create an account whose username starts with `demo` to get three weeks of simulated
readings. A bar at the top of every screen says that the data is simulated.

## How it is organized

```
src/
  api/         axios client, one function per backend endpoint, response types, demo-mode adapter
  auth/        login state (the token is stored at login and sent on every /users request) and
               the mission environment choice
  hooks/       data hooks (TanStack Query), including the joined dashboard view
  lib/         zones and thresholds, dates, streak/readiness/badges, escalation ladder,
               mission environments, change history
  content/     plain-language explainers, per-measurement input fields, body-area mapping
  components/  status chips, body figure, step drawings, trend chart, prompts, change history,
               gamification, layout
  pages/       Login, Home, Reminders, Risk, Measurement Overview, Measurement Performance,
               Summary (Crew Medical Officer), Profile, Info
  mocks/       copies of the backend's data files and of badges.json, used only in demo mode
  styles/      one global stylesheet with design tokens (light and dark)
```

Nothing about risks or measurements is hardcoded in the screens. The lists, ids, ranges,
instructions and recommendations come from the backend, and every URL is built from backend ids
(`/risks/:riskId`, `/measurements/:measurementId`, `/measurements/:measurementId/perform`).

### Backend endpoints used

| Screen | Endpoints |
| --- | --- |
| Login | `PUT /users/login` (log in), `POST /users/login` (create account) |
| Home | `GET /users/badges`, `GET /data/risks`, `GET /users/risks`, `GET /users/upcoming`, `GET /data/measurements/{id}`, `GET /users/measurements/{id}` |
| Reminders | `GET /users/digest`, `GET /users/upcoming` |
| Risk | `GET /data/risks/{id}`, `GET /users/risks/{id}` |
| Measurement Overview | `GET /users/measurements/{id}`, `GET /users/measurements/{id}/trend`, `PUT /users/measurements/{id}/frequency`, `DELETE /users/measurements/{id}?measurementIndex=N` |
| Result sheet and mood check-in (Undo) | `DELETE /users/measurements/{id}` (removes the most recent reading) |
| Measurement Performance | `GET /data/measurements/{id}`, `POST /users/measurements/{id}` |
| Edit a reading | `POST /users/measurements/{id}` (the corrected reading), then `DELETE /users/measurements/{id}?measurementIndex=N` (the old one) |
| Summary | The same endpoints as Home |
| Profile, Info | None (see "Kept in the browser" below) |

### What the app adds on top of the spec below

- **Color-coded status everywhere:** grey (no readings yet), green (healthy), yellow (watch),
  red (act now), and an emergency state reached by ticking a red-flag symptom.
- **What to do next:** yellow and red results show a short ladder: you act first, then the Crew
  Medical Officer, then the flight surgeon. Red results offer a ready-to-send report.
- **Escalating reminders:** a due check starts as a quiet banner, becomes a dialog after 24 hours,
  and after 72 hours is flagged as a missed check on the Crew Medical Officer summary (and the
  dialog can no longer be skipped for the day). If the measurement's last reading was in the watch
  range the steps come at 12 and 48 hours, and in the act-now range at 6 and 24 hours. It is all
  worked out on the device from the backend's due dates (`src/lib/reminderEscalation.ts`). There
  is also a one-tap daily mood check-in.
- **Extreme readings:** when a saved reading is past its act-now limit by at least the width of
  its watch band (for example resting heart rate above 140, where watch starts at 100 and act-now
  at 120), the app prepares a Crew Medical Officer packet automatically and tells the crew member
  that the ground crew will be notified in 5 minutes unless the reading is undone. Undoing,
  deleting or correcting the reading withdraws the alert. **This is simulated:** the prototype
  sends nothing off the device, and "notified" is a status kept in the browser
  (`chm.alerts.<username>`, `src/lib/groundAlerts.ts`).
- **Undo and delete:** right after saving, "Undo this entry" removes the reading just logged. The
  measurement page lists every saved reading with a Delete button. A baseline reading can only be
  deleted once the later readings are gone, because the backend measures them against it.
- **Edit a reading:** the Edit button next to a saved reading opens the entry form again. Saving
  stores the corrected reading and removes the old one in one step.
- **Change history:** every edit, undo and delete shows when it happened (GMT) and what changed
  from what. The full list is on the measurement page, the Profile page and the Summary page.
- **Mission environment:** a new account must pick one of five environments (spacecraft in
  transit, space station, pressurized rover, Moon base, Mars base). It can be changed on the
  Profile page. The environment changes the advice, the message delay shown for the flight
  surgeon step, the evacuation note, and any healthy ranges that differ (see below).
- **Crew Medical Officer summary:** one page with red flags, every risk, the latest reading of
  every measurement (GMT) and recent changes. It can be printed.
- **Profile page:** account facts, the environment setting and the change history.
- **Info page:** how the app works, why the exams are needed, the environments, and the AI
  disclosure.
- **Motivation:** mission readiness score, check-in streak, weekly progress bar and badges.
  Badges come from the backend (`GET /users/badges`), which decides what is earned and reports
  progress on the rest. `src/mocks/badges.json` is only used by demo mode.
- **Plain language:** every screen answers "Why is this exam needed?" and "How does spaceflight
  affect this?" without jargon.

### Kept in the browser, because the backend has no place for it

The backend is not changed by this front end. Three things it does not store are kept in the
browser's local storage, per account, so they do not follow the account to another device:

- the mission environment (`chm.environment.<username>`),
- the change history (`chm.changes.<username>`, newest 300 entries),
- the reminder frequency last chosen (`chm.frequency.<username>.<measurementId>`), because the
  backend has no endpoint to read the current frequency back.

An edited reading gets the time of the edit as its timestamp, because the backend stamps every
reading itself. The first (baseline) reading of a baseline measurement can only be edited or
deleted when it is the only reading.

### Ranges by environment

If the backend sends a `ranges` list for a measurement (one entry per situation: `spacecraft`,
`station`, `rover`, `moon`, `mars`), the app uses the entry for the chosen environment. If it
sends one set of limits, that set is used. The team's ranges guide gives the same limits in all
five environments for the 15 measurements the backend tracks today. The four ranges that do
differ (blood oxygen, solar storm dose, daily exercise time, dust irritation) are not tracked by
the backend yet, so they are shown on the Profile and Info pages and used in the advice text.
Risk scores are worked out by the backend and do not depend on the environment.

### Instruction images

Every instruction step has its own drawing (`src/components/measurement/StepArt.tsx`), with
"AI-generated" drawn into the picture. If a real image file is added at the path the backend
names, it is shown instead, with an "AI-generated" label on top. See
[public/images/README.md](public/images/README.md) for where to put image files.

## Testing status

The app type-checks, builds, and every screen and flow was exercised in a browser in demo mode.
It has **not yet been run against the live Spring backend**, so do one pass with the backend
running before the demo (log in, log one measurement, change one reminder frequency).

## Sources

- NASA Space Apps Challenge 2026, Create Health Monitoring Software for Astronauts on Space Missions: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
- NASA Human Research Program: https://www.nasa.gov/hrp/
- NASA Human Research Roadmap, Risks: https://humanresearchroadmap.nasa.gov/Risks/
- NASA Open Science Data Repository: https://osdr.nasa.gov/
- NASA DONKI space weather database: https://ccmc.gsfc.nasa.gov/tools/DONKI/
- NOAA Space Weather Prediction Center: https://www.swpc.noaa.gov/
- CDC National Health and Nutrition Examination Survey: https://www.cdc.gov/nchs/nhanes/
- PhysioNet: https://physionet.org/
- Canadian Space Agency, Bio-Monitor: https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp

Open-source software used (all MIT licensed unless noted): React, Vite, React Router, TanStack
Query, axios, Recharts; Roboto Flex and Roboto Mono fonts (SIL Open Font License / Apache 2.0).

This is a hackathon prototype for education and demonstration. It is not a medical device and
does not give medical advice.

---

# App Specifications

## Screens

### Login Screen
* **Input Fields:** Two fields for a username and a password.
* **Actions:** Two buttons—one to log into an existing account, and another to create a new account using the entered credentials.

### Home Screen
* **Purpose:** Provides an overview and access to each function for an astronaut.
* **Left Half (Body Overview):** Displays a human body with color coding on different body parts to demonstrate any unhealthy trends.
* **Right Half (Upcoming Measurements):** Displays a list of upcoming measurements organized by day.
* **Navigation:**
  * Clicking a **body part** on the left opens the corresponding Body Part / Risk screen.
  * Clicking a **measurement** on the right opens its Measurement Overview screen.
  * Clicking the **header** above the measurements on the right opens the Reminders screen.

### Reminders Screen
* **Layout:** Provides a scrollable list of upcoming measurements grouped by the next day, week, and month.

### Risk Factor Screens
* *Note: One screen per risk factor / body part.*
* **Top Section:** Displays a risk score from 1–100 alongside a visual of the affected area.
* **Bottom Section:** Includes a list of related measurements ordered by urgency.

### Measurement Overview Screens
* *Note: One screen per measurement.*
* **Top Section:** Displays a graph with an overview of numerical or visual data, accompanied by an analysis of trends.
* **Middle Section:** Features a dropdown below the graph to edit reminder frequency (measured in days between measurements).
* **Bottom Section:** Contains a button that navigates to the Measurement Performance screen.

### Measurement Performance Screens
* *Note: One screen per measurement.*
* **Middle Section:** Contains a detailed text explanation of how to perform the measurement, supported by images.
* **Bottom Section (Fixed):** Features an input field to enter or upload the measurement, paired with a button to finalize the entry and return to the Home screen.

---

## Style
* **Aesthetic:** Sleek, minimalistic design that looks distinct, bespoke, and non-AI generated.
