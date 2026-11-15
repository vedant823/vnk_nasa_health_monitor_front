**Important:** Provide daily/weekly/monthly notifications to take measurements and monitor health

## Front-end (React)

* **Screens:**
  * **Login screen**
    * Has two fields for a username and a password as well as two buttons: one that logs into an existing account, and another that uses the above to create a new account
  * **Home screen with overview + each function for an astronaut**
    * Left half has a grid of different risks with color-coded risk scores (detailed later)
    * Clicking one of the squares on the left leads you to one of the risk screens, clicking a measurement on the right leads you to one of its screens, and clicking the header above the measurements on the right leads you to the reminders screen.
  * **Reminders screen**
    * Provides a scrollable list of the upcoming measurements in the next day, week, and month
    * Clicking on a measurement brings you to its screen.
  * **A screen for each risk factor**
    * Provides a title, the category, and risk score from 1-100, provided by the backend, as well as a visual of the area. Also includes a reason to pay attention to the risk. Below the risk score, it includes recommendations to improve health in the case of a low score.
    * Below, includes a list of measurements ordered by urgency.
    * Clicking on a measurement brings you to its screen.
  * **Measurement overview screens for each measurement**
    * Top has a graph with an overview of numerical data or visual data and an analysis of trends.
    * Dropdown below the graph allows you to edit the frequency of reminders (in days between measurements)
    * Button at the bottom goes to the measurement performance screen.
  * **Measurement performance screens for each measurement**
    * Middle contains a detailed text explanation of how to perform the measurement with images.
    * Bottom (fixed) has a field to enter or upload the measurement and a button to finalize it and return to the home screen.
* **Approach:**
  * Mostly depend on the backend to calculate risk scores and list measurements for each risk. In this way, urls are also parameterized so that nothing is hardcoded. (Risks and measurements come with ids provided by the backend)
  * Stores a token upon login that is continually passed to the backend.
* **Style:**
  * Sleek, minimalistic style that looks fairly unique and non-AI.
  * Google-esque design language?

---

## Back-end (Spring Java w/ MongoDB repositories)

* **Controllers**
  * **LoginController**
    * Manages user logins (login credentials in body). Both endpoints take the same body and return the token as a raw JSON string, which the client then sends as `Authorization: Bearer <token>` on every user endpoint.
    * `POST /users/login`
      * Creates a new account with the given credentials, initializes every measurement's reminder frequency to the default (7 days), and returns the new account's token. Fails with 409 if the username is already taken.
      * Body: `username` (string, required), `password` (string, required)
      * Outputs `String` — the token
    * `PUT /users/login`
      * Verifies the credentials and returns the existing account's token, so logging in on another device returns the same token. Fails with 401 for wrong credentials. PUT (not GET) because the request carries a credentials body, which browsers cannot send with GET — and login is idempotent, which fits PUT semantics.
      * Body: `username` (string, required), `password` (string, required)
      * Outputs `String` — the token
  * **UserController**
    * Manages user data, reminders, and risks. Every endpoint requires `Authorization: Bearer <token>`; a missing header is 400 and an invalid token is 401.
    * `GET /users/measurements/{measurementID}`
      * Returns the user's logged history for one measurement, newest first. Values of baseline-relative measurements are served as the change from the user's baseline (percent or plain difference per `baselineMode`); absolute measurements are returned raw.
      * Path: `measurementID` — a measurement ID from the data endpoints
      * Outputs `List<MeasurementSet>` — each `{measurementId, userId, timestamp, values[] | images[]}` (exactly one of values/images, per the measurement's category)
    * `POST /users/measurements/{measurementID}`
      * Logs one reading as a `MeasurementSet` and updates the measurement's last-taken time, which drives reminders and risk scoring. The first logged reading of a baseline-relative measurement becomes the user's baseline; later readings are stored raw and converted on the way out.
      * Body: `values` (list of numbers, required for numerical measurements — finite, and non-negative unless the measurement `canBeNegative`) or `image` (base64 string, required for visual measurements)
      * Outputs nothing (empty 200 body). Errors: 404 unknown measurement, 400 missing or invalid values/image
    * `PUT /users/measurements/{measurementID}/frequency`
      * Sets how many days pass between reminders for one measurement (the frontend's frequency dropdown). The next due date becomes last-taken plus this many days.
      * Body: `frequencyDays` (integer, minimum 1)
      * Outputs nothing (empty 200 body). Errors: 404 unknown measurement, 400 invalid frequency
    * `GET /users/upcoming`
      * Lists every measurement due within the given window, ordered by due date. A measurement is due when `lastTaken + frequencyDays` has passed, or immediately if never taken — so a fresh account's list is the complete baseline checklist.
      * Query: `withinDays` (integer, optional, default 30)
      * Outputs `List<Reminder>` — each `{measurementId, dueDate}`, dueDate ascending
    * `GET /users/risks`
      * Scores every risk factor for the user with the rule-based `JudgementService` (start at 100; −40 per abnormal and −75 per dangerous latest reading, stacked, floored at 1). Risks without measurements yet always score 100.
      * Outputs `List<RiskEvaluation>` — each `{riskId, score, advice[], reason}`
    * `GET /users/risks/{riskID}`
      * Returns one risk's score, the advice list (the recommendation string of every violated measurement, most severe first), and a reason string describing each violation.
      * Path: `riskID` — a risk ID from `GET /data/risks`
      * Outputs `RiskEvaluation` — `{riskId, score, advice[], reason}`. Errors: 404 unknown risk
    * `GET /users/measurements/{measurementID}/trend`
      * Compares the measurement's two most recent baseline-adjusted readings and returns their direction — a lightweight hint for the frontend graphs, no statistical modelling. `up` and `down` are raw directions; whether that is good or bad depends on the measurement.
      * Outputs `MeasurementTrend` — `{measurementId, direction}`, direction `"up"`, `"down"`, `"flat"` (within 0.5%), or `null` with fewer than two readings
    * `GET /users/digest`
      * Returns the user's daily/weekly/monthly reminder digest — the exact buckets the scheduled notification sender delivers, built from one 30-day snapshot and partitioned into disjoint buckets: each measurement lands in exactly one bucket, the smallest window it is due within (daily holds the urgent, including overdue, set; a fresh user's weekly and monthly buckets are empty). Lets the frontend's reminders screen show precisely what the notifications say.
      * Outputs `ReminderDigest` — `{username, daily[], weekly[], monthly[]}`, each bucket a list of `Reminder`
  * **DataController**
    * Serves measurement instructions as well as risk overviews. No authentication: this is the same static content for every user.
    * `GET /data/measurements/{measurementID}`
      * Returns one measurement's full definition: display name, category, unit, guideline bounds (optional per side), baseline mode, the low/high recommendation strings, and the step-by-step instructions. Merged at startup from `measurementDetails.json` and `measurementInstructions.json`.
      * Outputs `Measurement` — `{id, name, category, unit, dangerousLow?, abnormalLow?, abnormalHigh?, dangerousHigh?, canBeNegative, baselineMode, lowRecommendation?, highRecommendation?, instructions[]}`, each instruction `{image, text}`. Errors: 404 unknown measurement
    * `GET /data/risks/{riskID}`
      * Returns one risk's display name, category, the reason to pay attention to it, and its child measurement IDs (empty for risks with no usable data yet).
      * Outputs `RiskFactor` — `{id, name, category, measurementIds[], reason}`. Errors: 404 unknown risk
    * `GET /data/risks`
      * Returns every risk factor in file order, so the frontend's home grid hardcodes nothing.
      * Outputs `List<RiskFactor>`
  * **Notes on output shapes (deliberate evolutions, justified):**
    * `RiskEvaluation.advice` is a `List<String>`, not a single string: several measurements can be abnormal at once, each with its own recommendation string (the `JudgementService` spec text already describes the advice as "a list", ordered most severe first).
    * `Measurement` and `RiskFactor` carry the display name, unit, guideline bounds, and baseline mode from `measurementDetails.json`/`riskInfo.json`, per the addendum's merge and the "the frontend hardcodes nothing" principle.
    * History values of baseline-relative measurements are served as the change from the user's baseline (percent or difference per `baselineMode`), matching the units the spec defines for those measurements; absolute measurements are unchanged.
* **Services**
  * **UserDataService**
    * Stores and retrieves user data from the repository (Makes sure to update measurement dates when logging one)
  * **UserLoginService**
    * Handles the login procedure and creates new accounts
  * **UserReminderService**
    * Compiles every measurement and how soon it should be taken based on measurement times and frequencies.
  * **DataRetrievalService**
    * Gets the risk data and measurement instructions using Jackson and records
  * **JudgementService**
    * Rule-based judging against guideline ranges (no statistics, no AI). Each numerical measurement’s latest value is classified against the ranges in `measurementDetails.json`: below `abnormalLow` (or above `abnormalHigh`) is abnormal, and beyond `dangerousLow`/`dangerousHigh` is dangerous. Scoring starts at 100; each abnormal measurement subtracts 40 and each dangerous one subtracts 75, stacking and floored at 1. The recommendation string matching the violated side of every abnormal measurement is collected into the advice (a list), ordered most severe first. Visual measurements are stored but excluded from scoring for the time being.
* **Repositories / Databases**
  * **UserData**
    * Stores user logins, passwords, measurement times and frequencies, and measurement data.
* **Classes**
  * **Enum classes:**
    * `RiskCategory`
      * Physical or Psychological, used in RiskFactor
    * `MeasurementCategory`
      * Numerical or Visual, used in Measurement
  * **“Static” classes:**
    * `RiskFactor`
      * Uses a string ID as well as a category and contains child measurements’ IDs and a string for the explanation of the risk’s purpose
    * `Measurement`
      * Uses a string ID as well as a category and contains instructions alongside two optional recommendation strings
    * `Instruction`
      * Contains an image reference and text.
  * **Non-static classes:**
    * `User` + `User (document)`
      * Contains a user’s username, hashed password, and current token (?)
      * Document class contains a map of measurement IDs to MeasurementSet objects
    * `MeasurementSet`
      * Contains a list / array of numbers or images along with the user ID it is associated with and the Measurement ID it corresponds to
    * `RiskEvaluation`
      * Contains a string ID correlating it to a risk factor as well as an integer score, a list of strings suggesting how to improve the score (one per abnormal measurement, most severe first), and an optional string describing the reason for the score
    * `Reminder`
      * Contains a measurement ID and a date/time.
* **Other**
  * **Folder with data**
    * `riskInfo.json`
      * Includes physical and psychological risks and the reasons to address them: A list of risks, which each have an ID as well as a category, a list of child measurements’ IDs (which correspond to those on the other JSON), and a string explaining the reason to pay attention to the risk.
      * Will be adjusted after the code is complete
    * `measurementInstructions.json`
      * Contains the instructions for each measurement: A list of measurements, which each have an ID and a list of instructions with an image and text for each.
      * Will also be adjusted after the code is complete
    * `measurementDetails.json`
      * Contains each measurement’s display name, type (numerical, visual), unit, and for numerical values: upper and lower bounds around abnormal and dangerous levels (4 doubles, each optional — a missing side does not apply), a boolean indicating whether it can be negative, and 2 optional recommendation strings for an unusually low and high number.

---

## Implementation addendum

* **Stack:** Spring Boot 4 (Jackson 3), Java 25, Gradle; MongoDB 7 via `docker-compose.yml`. Start dependencies with `docker-compose up -d` (the standalone binary; the Docker CLI has no compose plugin). On macOS the Docker daemon runs inside colima: run `colima start` first if `docker ps` fails.
* **Auth:** Tokens are generated with `UUID` on account creation, stored on the user document, and passed as an `Authorization: Bearer <token>` header on every user endpoint. Passwords are hashed with BCrypt (`spring-security-crypto`).
* **Data model:** `UserDocument` stores, keyed by measurement ID: `measurementFrequencies` (days between reminders), `measurementLastTaken`, and `measurementHistory` (lists of `MeasurementSet`). New accounts initialize every measurement frequency to 7 days (configurable via `app.defaults.measurement-frequency-days` in `application.yaml`).
* **`Measurement` output:** `DataRetrievalService` merges `measurementDetails.json` (name, type, unit, ranges, recommendations) with `measurementInstructions.json` (steps) into one `Measurement` record. JSON files are read from the `jsonData/` folder at startup (path configurable via `app.data-dir`) and parsed into records with Jackson; loading fails fast on malformed data or a risk referencing an unknown measurement ID.
* **Reminders:** `GET /users/upcoming?withinDays=N` returns every measurement whose next due date (`lastTaken + frequencyDays`, or now if never taken) falls within the window, ordered by due date. The frontend groups these into day/week/month buckets. Never-taken measurements are due immediately, so a fresh account's first reminder list is the complete baseline checklist.
* **Testability:** All services inject a `Clock` bean (`config/ClockConfig`) instead of calling `Instant.now()`, so date math is deterministic under test with a fixed `Clock`. Controllers are pure delegation (resolve the user, call one service); all logic lives in services.
* **Notifications:** A `NotificationSender` interface delivers each user's daily/weekly/monthly digest; `LoggingNotificationSender` is the development implementation (push/email plug in later behind the same interface). `NotificationScheduler` (`@Scheduled` daily, cron via `app.notifications.cron`, gated by `app.notifications.enabled`) builds a `ReminderDigest` per user from a single 30-day snapshot of `UserReminderService.getUpcoming`, then partitions it into disjoint day (1), week (7), and month (30) buckets — each measurement appears in exactly one bucket, the smallest window it is due within, and the due-date math lives in one place. Failures sending to one user do not stop the others.
* **`ReminderDigest`:** New DTO alongside `Reminder`: the username plus daily, weekly, and monthly `Reminder` lists.
* **CORS & Hoppscotch:** `app.cors.allowed-origins` includes the React dev server and `https://hoppscotch.io`, so Hoppscotch (web or desktop) can call the API. Login is `PUT /users/login` — the original GET-with-body design could not be called from browsers, and PUT is both browser-compatible and semantically fitting (idempotent). A full request-by-request walkthrough lives in `docs/api-testing.md`.
* **API client artifacts:** `docs/openapi.yaml` (OpenAPI 3.1, every endpoint and schema, mirrors the descriptive REST section above; importable into Hoppscotch, Postman, and Insomnia).
* **Testing:** Two-layer suite. Unit tests (plain JUnit + Mockito; services with mocked dependencies and a fixed `Clock`, controllers via standalone MockMvc with mocked services) run with `./gradlew test` and need no external services. Functional tests (tagged `functional`, `@SpringBootTest(RANDOM_PORT)` driving the fully booted app over real HTTP against the Dockerized MongoDB in the dedicated `healthmonitor-functional` database) run with `./gradlew functionalTest` after `docker-compose up -d`; they cover the complete user journey, auth and error paths (missing header → 400, invalid token → 401, unknown IDs → 404, duplicate username → 409, validation errors → 400), the data endpoints, CORS preflight/actual requests for the Hoppscotch origin, and the notification digests. The functional database is dropped before each test class and again when the test JVM exits, so runs leave no permanent data behind. (Note: the database URIs must use `spring.mongodb.uri` — Spring Boot 4 deprecated `spring.data.mongodb.uri` at error level, and the old key was silently ignored, sending everything to Mongo's default `test` database.)
* **Package layout:** `controller/`, `service/`, `repository/`, `domain/{dto,document}/`, `config/` (CORS + error handling + Clock + scheduling).
* **Status:** All spec classes exist; controllers are wired to services; service logic is implemented as described above. Controllers remain pure delegation. The daily/weekly/monthly reminder notifications (the spec's headline requirement) are implemented and tested; the test suite (90 unit + 29 functional tests) is green.

---

## Future steps

### Backend
1. ~~**User baselines**~~ — **Delivered.** Baseline-relative measurements (`baselineMode: percent|difference` in `measurementDetails.json`) now take plain raw values; the first logged reading is stored on the user document as the baseline and every reading is converted server-side before scoring and before serving history.
2. **Visual measurement scoring** — replace the neutral placeholder for visual measurements (e.g. `oct_fundus_scan`) with real analysis, or a manual score-entry path for the Crew Medical Officer.
3. **Image storage** — visual `MeasurementSet` images are base64 in MongoDB documents; move to GridFS or object storage before real use (16 MB document limit).
4. **Per-measurement weights** — add an optional `weight` per measurement in `riskInfo.json` so some measurements count more toward a risk's score.
5. ~~**Trend hints**~~ — **Delivered.** `GET /users/measurements/{measurementID}/trend` returns the direction (`up`/`down`/`flat`/null) of the two most recent baseline-adjusted readings.
6. **Token hardening** — token rotation on login, logout/invalidation endpoint, and possibly signed JWTs if more structure is needed.
7. **Notification delivery** — replace `LoggingNotificationSender` with a real push/email channel behind the same `NotificationSender` interface. (The `@Scheduled` trigger itself is now covered by a functional test that boots the app with a one-second cron and a counting sender.)
8. **API documentation & ops** — OpenAPI/Swagger UI, Actuator health endpoints, and a production deployment story (containerized app + MongoDB Atlas or a managed Mongo).

*(Delivered since the original list: the two-layer test suite — unit tests for `UserReminderService`, `JudgementService`, `UserLoginService`, `DataRetrievalService`, `UserDataService`, `NotificationScheduler`, and controller tests, plus functional tests over real HTTP against the Dockerized Mongo — and the scheduled daily/weekly/monthly notifications via `NotificationSender`/`NotificationScheduler`. Also delivered since: user baselines with server-side raw-to-change conversion, the per-measurement trend endpoint, and `GET /users/digest`, which serves the exact buckets the scheduled sender delivers over HTTP.)*

### Frontend (React)
1. **Screens** — login, home (risk grid + measurement list), reminders (day/week/month), risk detail, measurement overview (graph + frequency dropdown), and measurement performance (instructions + input) screens, all parameterized by backend IDs.
2. **Token handling** — store the token from login and attach it as an `Authorization: Bearer <token>` header on every request.
3. **Graphs** — render `GET /users/measurements/{id}` history as line charts with range bands from the measurement's guideline thresholds.

### Content
1. **Instruction images** — the `images/...` paths referenced by `measurementInstructions.json` need actual images.
2. **JSON tuning** — revisit ranges, recommendations, and risk-measurement groupings once the app is exercised end-to-end (per the original spec note).