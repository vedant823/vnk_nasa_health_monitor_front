# Crew Health Monitor (front end)

Team VNK's entry for the NASA Space Apps Challenge 2026 challenge
[Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

This is the React front end. It talks to the team's Spring backend
(`vnk_nasa_health_monitor_back`). It lets a crew member log in, see which body areas and health
risks need attention, follow simple step-by-step instructions for each health check, log the
result, and see what to do next.

> **AI disclosure.** The source code, the body illustration, the step placeholder drawings and
> the plain-language help text in this repository were generated with an AI assistant (Claude by
> Anthropic) and reviewed by team VNK. Every AI-made image carries a visible "AI-generated"
> watermark. Nothing here uses, contains or modifies NASA branding or design elements. Details
> are in [AI_DISCLOSURE.md](AI_DISCLOSURE.md) and on the app's About page.

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
  auth/        login state; the token is stored at login and sent on every /users request
  hooks/       data hooks (TanStack Query), including the joined dashboard view
  lib/         zones and thresholds, dates, streak/readiness/badges, escalation ladder
  content/     plain-language explainers, per-measurement input fields, body-area mapping
  components/  status chips, body figure, trend chart, prompts, gamification, layout
  pages/       Login, Home, Reminders, Risk, Measurement Overview, Measurement Performance, About
  mocks/       copies of the backend's data files, used only in demo mode
  styles/      one global stylesheet with design tokens (light and dark)
```

Nothing about risks or measurements is hardcoded in the screens. The lists, ids, ranges,
instructions and recommendations come from the backend, and every URL is built from backend ids
(`/risks/:riskId`, `/measurements/:measurementId`, `/measurements/:measurementId/perform`).

### Backend endpoints used

| Screen | Endpoints |
| --- | --- |
| Login | `PUT /users/login` (log in), `POST /users/login` (create account) |
| Home | `GET /data/risks`, `GET /users/risks`, `GET /users/upcoming`, `GET /data/measurements/{id}`, `GET /users/measurements/{id}` |
| Reminders | `GET /users/digest`, `GET /users/upcoming` |
| Risk | `GET /data/risks/{id}`, `GET /users/risks/{id}` |
| Measurement Overview | `GET /users/measurements/{id}`, `GET /users/measurements/{id}/trend`, `PUT /users/measurements/{id}/frequency` |
| Measurement Performance | `GET /data/measurements/{id}`, `POST /users/measurements/{id}` |

### What the app adds on top of the spec below

- **Color-coded status everywhere:** grey (no readings yet), green (healthy), yellow (watch),
  red (act now), and an emergency state reached by ticking a red-flag symptom.
- **What to do next:** yellow and red results show a short ladder: you act first, then the Crew
  Medical Officer, then the flight surgeon. Red results offer a ready-to-send report.
- **Prompts:** a banner when a check is due, a dialog for overdue checks (at most every 4 hours),
  and a one-tap daily mood check-in.
- **Motivation:** mission readiness score, check-in streak, weekly progress bar and badges.
- **Plain language:** every screen answers "Why is this exam needed?" and "How does spaceflight
  affect this?" without jargon.

### Instruction images

The backend's instructions name image files that do not exist yet. Until real ones are added,
each step shows a simple drawn placeholder with an "AI-generated" watermark. See
[public/images/README.md](public/images/README.md) for where to put real images.

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
