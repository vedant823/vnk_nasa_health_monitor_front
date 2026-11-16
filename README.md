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
readings. A username that starts with `cmo` creates a medical officer with two simulated crew
members already assigned (`<name>-crew-ada` and `<name>-crew-ben`). A bar at the top of every screen says that the data is simulated.

### Docker (no Node needed)

A multi-stage `Dockerfile` builds the app with Node and serves the result with nginx, so you
only need Docker (or Podman) — no local Node or npm install. The image listens on port 80.

```bash
docker build -t vnk-nasa-health-monitor-front .
docker run -d -p 5173:80 vnk-nasa-health-monitor-front   # opens on http://localhost:5173
```

Vite bakes `VITE_API_URL` and `VITE_USE_MOCKS` into the JavaScript bundle at build time, so they
cannot be changed with `docker run -e` — pass them as build args instead:

```bash
# Backend on another host
podman build --build-arg VITE_API_URL=http://myhost:8080 -t vnk-nasa-health-monitor-front .

# Demo mode with simulated data, no backend needed
podman build --build-arg VITE_USE_MOCKS=true -t vnk-nasa-health-monitor-front .
```

The default `VITE_API_URL` (`http://localhost:8080`) works for local demo use, since the backend's
CORS config only accepts requests from `http://localhost:5173`.

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
               Summary (Crew Medical Officer), Crew (medical officers), Profile, Info
  mocks/       copies of the backend's data files and of badges.json, used only in demo mode
  styles/      tokens.css (every colour and font, light and dark), base.css, global.css
```

Nothing about risks or measurements is hardcoded in the screens. The lists, ids, ranges,
instructions and recommendations come from the backend, and every URL is built from backend ids
(`/risks/:riskId`, `/measurements/:measurementId`, `/measurements/:measurementId/perform`).

### Guest mode

The login page has a **View in guest mode** button. It logs in as the demo Crew Medical Officer
`testOfficer` and opens its Crew page. A bar under the top bar then lets the visitor switch to any
crew member and see the app as them, reset one account or all of them to their starting data,
and leave guest mode.

- Guest mode uses the crew already assigned to `testOfficer` that it can log in to. If there are
  fewer than three, it adds `testCrewAva` (Moon base), `testCrewBen` (space station) and
  `testCrewCai` (Mars base) and assigns them to `testOfficer`.
- An account with no readings gets a few weeks of made-up but realistic readings, one profile per
  crew member (mostly healthy with slipping sleep; weight, muscle and lymphocytes to watch;
  heart rate in the act-now range). Accounts that already have readings are left alone.
- **Reset** deletes every reading on that account, logs the starting readings again and restores
  its environment and role. It uses only the normal endpoints, so it changes the real database.
- The demo password is in the front end on purpose (`src/lib/guestMode.ts`), because these are
  public demo accounts. `VITE_GUEST_PASSWORD` and `VITE_GUEST_CREW_PASSWORD` override it.
- The backend stamps every reading with the time it arrives, so on the real backend all starting
  readings share today's date. Demo mode spreads them over the past weeks.

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
| Scan review (OCT fundus scan) | `GET /data/measurements/{id}/flags` (the checklist), `PUT /users/measurements/{id}/score?numAbnormal=N&measurementIndex=I` (crew member without a medical officer) |
| Profile | `GET`/`PUT /users/environment`, `GET`/`PUT /users/status`, `GET`/`PUT /users/officer` |
| Crew (medical officers) | `GET /users/children`, `GET /users/overdue`, `GET /users/children/{id}/risks`, `GET /users/children/{id}/measurements/{mid}`, `GET /users/children/{id}/upcoming`, `PUT /users/children/{id}/measurements/{mid}/score` |
| Info | None |

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
- **Profile page:** account facts, the environment setting, the role (crew member or medical
  officer), the medical officer's username, and the change history.
- **Scan review ("image analysis"):** the backend scores a scan by the number of findings a
  person sees on its checklist (0 healthy, 1 watch, 2 or more act now). No AI looks at the
  image. A crew member without a medical officer reviews their own scans; once a medical officer
  is named, only that officer can review them. An unreviewed scan shows "Awaiting review".
- **Medical officer role:** an account can switch to medical officer on the Profile page (the
  backend refuses while it has an officer or crew). A crew member names their officer by
  username; the backend has no way to remove an officer again. Medical officers get a Crew page:
  every assigned crew member with their act-now and watch risks, overdue checks across the crew,
  and each crew member's full summary with scan review. The backend does not share a crew
  member's environment, change history or extreme-reading alerts with the officer.
- **Info page:** how the app works, why the exams are needed, the environments, and the AI
  disclosure.
- **Motivation:** mission readiness score, check-in streak, weekly progress bar and badges.
  Badges come from the backend (`GET /users/badges`), which decides what is earned and reports
  progress on the rest. `src/mocks/badges.json` is only used by demo mode.
- **Plain language:** every screen answers "Why is this exam needed?" and "How does spaceflight
  affect this?" without jargon.

### Kept in the browser, because the backend has no place for it

The backend is not changed by this front end. The mission environment is saved on the backend;
the browser only remembers that a choice was made (`chm.environment.<username>`), so a new
account is asked once. Things the backend does not store are kept in the browser's local storage,
per account, so they do not follow the account to another device:

- the extreme-reading alerts (`chm.alerts.<username>`),
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
Risk scores are worked out by the backend with the ranges of the environment saved there.

### Instruction images

Every instruction step has its own drawing (`src/components/measurement/StepArt.tsx`), with
"AI-generated" drawn into the picture. If a real image file is added at the path the backend
names, it is shown instead, with an "AI-generated" label on top. See
[public/images/README.md](public/images/README.md) for where to put image files.

## Testing status

The app type-checks, builds, and every screen and flow was exercised in a browser in demo mode.
It has **not yet been run against the live Spring backend**, so do one pass with the backend
running before the demo (log in, log one measurement, change one reminder frequency, switch one
account to medical officer, name it as another account's officer, and review a scan).

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
Query, axios, Recharts; Chivo Mono font by Omnibus-Type (SIL Open Font License 1.1).

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
