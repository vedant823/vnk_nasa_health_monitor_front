// AI-generated code and text (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Info: how the app works, why the exams matter, exactly where and how AI was used, and the
// sources behind the content.
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorState, PageHeader } from '../components/layout/AppShell';
import { GENERAL_EXPLAINER } from '../content/explainers';
import { ENVIRONMENTS, commDelayText } from '../lib/environment';
import { AiMark } from '../components/status/Status';

const SOURCES: { name: string; url: string; use: string }[] = [
  { name: 'NASA Space Apps Challenge 2026: Create Health Monitoring Software for Astronauts on Space Missions', url: 'https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/', use: 'The challenge this app answers.' },
  { name: 'NASA Human Research Program', url: 'https://www.nasa.gov/hrp/', use: 'The list of human spaceflight health risks the app is organized around.' },
  { name: 'NASA Human Research Roadmap: Risks', url: 'https://humanresearchroadmap.nasa.gov/Risks/', use: 'Plain-language descriptions of each risk.' },
  { name: 'NASA Open Science Data Repository (OSDR)', url: 'https://osdr.nasa.gov/', use: 'Spaceflight biology datasets behind the numbers quoted in the explainers (for example immune cells, grip strength, eye pressure).' },
  { name: 'NASA DONKI space weather database', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', use: 'Solar particle event records.' },
  { name: 'NOAA Space Weather Prediction Center', url: 'https://www.swpc.noaa.gov/', use: 'Solar proton levels and the storm scale.' },
  { name: 'CDC National Health and Nutrition Examination Survey (NHANES)', url: 'https://www.cdc.gov/nchs/nhanes/', use: 'Earth comparison values for sleep and bone.' },
  { name: 'PhysioNet', url: 'https://physionet.org/', use: 'Standing blood pressure and brain blood flow data.' },
  { name: 'Canadian Space Agency: Bio-Monitor', url: 'https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp', use: 'The wearable sensor shirt referred to in the measurement steps.' },
];

const LIBRARIES = [
  { name: 'React', url: 'https://react.dev/', license: 'MIT' },
  { name: 'Vite', url: 'https://vite.dev/', license: 'MIT' },
  { name: 'React Router', url: 'https://reactrouter.com/', license: 'MIT' },
  { name: 'TanStack Query', url: 'https://tanstack.com/query/latest', license: 'MIT' },
  { name: 'axios', url: 'https://axios-http.com/', license: 'MIT' },
  { name: 'Recharts', url: 'https://recharts.org/', license: 'MIT' },
  { name: 'Chivo Mono font by Omnibus-Type', url: 'https://fonts.google.com/specimen/Chivo+Mono', license: 'SIL Open Font License 1.1' },
];

const HOW_IT_WORKS: { title: string; text: string }[] = [
  { title: 'Sign in and choose where you are', text: 'Create an account or log in. The first time, you choose your mission environment: spacecraft, space station, rover, Moon base or Mars base. You can change it on your Profile page.' },
  { title: 'Look at Home', text: 'Home shows your mission readiness score, a body outline colored by how each area is doing, a square for every health risk, and the checks that are due next. Tap a body area or a square to open that risk.' },
  { title: 'Read the colors', text: 'Grey means no readings yet. Green means healthy. Yellow means watch. Red means act now. Every color also has a word and an icon, so you never have to rely on color alone.' },
  { title: 'Take a measurement', text: 'Open a measurement and press "Take this measurement". You get a list of what you need and numbered steps with a picture for each one. Enter the reading in the bar at the bottom and save.' },
  { title: 'See what the result means', text: 'After saving you see the reading, its color, what to do, and which risk scores it changed. A risk score starts at 100. Each "watch" reading takes off 40 points and each "act now" reading takes off 75.' },
  { title: 'Know who to tell', text: 'For a yellow or red result the app shows the steps: you act first, then the Crew Medical Officer, then the flight surgeon on Earth. A red result can prepare a report to send. Ticking a red-flag symptom, such as chest pain, turns any result into an emergency.' },
  { title: 'Fix mistakes', text: 'Right after saving you can press Undo. On a measurement page you can edit or delete any saved reading. Every edit, undo and delete is written to the change history with the date and time in GMT and what changed.' },
  { title: 'Stay on schedule', text: 'The Reminders page lists what is due today, this week and this month. Each measurement page lets you set how many days pass between reminders. A banner on Home tells you when a check is due. If you miss it, the reminder grows: a pop-up after a day, then a missed-check flag on the Crew Medical Officer summary after three days. It moves faster when the last reading was in the watch or act-now range.' },
  { title: 'Extreme readings', text: 'If a reading is far past its act-now limit, the app prepares a packet for the Crew Medical Officer and tells you the ground crew will be notified in 5 minutes unless you undo the reading. In this prototype that notification is simulated: nothing leaves the device.' },
  { title: 'Get your scans reviewed', text: 'An eye scan is scored by a person, not by AI. The reviewer ticks every finding they can see on a checklist: none is healthy, one is watch, two or more is act now. Your medical officer reviews your scans. If you have no medical officer, you review your own.' },
  { title: 'Work as a medical officer', text: 'On the Profile page an account can become a medical officer, and a crew member can name their medical officer by username. A medical officer gets a Crew page with every assigned crew member, their risks, overdue checks and scans to review.' },
  { title: 'Earn badges', text: 'Regular check-ins build a streak, fill the weekly bar and earn badges. They are there to make a daily habit easier to keep.' },
  { title: 'Share with the Crew Medical Officer', text: 'The Crew Medical Officer summary puts all risks, latest readings, red flags and recent changes on one page that can be printed or read out.' },
];

export function AboutPage() {
  const { token } = useAuth();
  return (
    <div className="page narrow prose">
      <PageHeader title="How this app works" eyebrow="Info" back={{ to: '/', label: 'Home' }} />

      <section className="card">
        <h2>Why are these exams needed?</h2>
        <p>{GENERAL_EXPLAINER.why}</p>
        <h2>How does spaceflight affect your health?</h2>
        <p>{GENERAL_EXPLAINER.space}</p>
        <p className="muted small">Every risk and measurement screen answers these two questions for that specific risk or exam.</p>
      </section>

      <section className="card">
        <h2>Using the app, step by step</h2>
        <ol className="how-list">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title}>
              <span className="step-num">{i + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        {token && (
          <div className="chips">
            <Link to="/" className="chip">Home</Link>
            <Link to="/reminders" className="chip">Reminders</Link>
            <Link to="/summary" className="chip">Crew Medical Officer summary</Link>
            <Link to="/profile" className="chip">Profile</Link>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Mission environments</h2>
        <p>Where you are changes some healthy ranges, the advice you see, and how fast help from Earth can reach you.</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Environment</th>
              <th>Message delay to Earth</th>
              <th>Getting back to full medical care</th>
            </tr>
          </thead>
          <tbody>
            {ENVIRONMENTS.map((env) => (
              <tr key={env.id}>
                <td>{env.name}</td>
                <td>{commDelayText(env)}</td>
                <td>{env.care}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Your Profile page lists the ranges that change in your environment.</p>
      </section>

      <section className="card">
        <h2>What this is</h2>
        <p>
          Crew Health Monitor is a prototype built by team VNK for the NASA Space Apps Challenge 2026. It helps astronauts take simple health measurements themselves,
          understand the results in plain words, and know what to do next: act yourself first, then the Crew Medical Officer, then the flight surgeon.
        </p>
        <p>
          <strong>It is not a medical device and gives no medical advice.</strong> The healthy ranges and scores are for demonstration and have not been clinically validated.
          This project is not affiliated with or endorsed by NASA, and it uses no NASA logos, insignia or other branding.
        </p>
      </section>

      <section className="card">
        <h2>Where and how AI was used</h2>
        <p>This team used an AI assistant (Claude, made by Anthropic) and reviewed its output. Here is exactly what it produced:</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>What</th>
              <th>How AI was used</th>
              <th>How it is marked</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Frontend source code</td>
              <td>Written by AI from the team's design spec and plan, then reviewed and tested by the team.</td>
              <td>A comment at the top of every source file, the package.json description, and AI_DISCLOSURE.md.</td>
            </tr>
            <tr>
              <td>Images and illustrations</td>
              <td>The body outline, the picture for every measurement step, the app mark and the stand-in eye scan used in demo mode were drawn by AI as simple vector shapes. No photos and no third-party artwork are used.</td>
              <td>
                Every one carries a visible watermark like this: <span className="inline-mark"><AiMark /></span>
              </td>
            </tr>
            <tr>
              <td>Visual design</td>
              <td>The layout, colours and type were designed by AI with a design checklist, then reviewed by the team. The typeface is Chivo Mono, an open-source font.</td>
              <td>Comments in the style files and AI_DISCLOSURE.md.</td>
            </tr>
            <tr>
              <td>Explainer text</td>
              <td>The "Why is this exam needed?" and "How does spaceflight affect this?" answers, badge names and guidance wording were drafted by AI from the sources below.</td>
              <td>This page, AI_DISCLOSURE.md and comments in the content files.</td>
            </tr>
            <tr>
              <td>Data</td>
              <td>
                The healthy ranges, risk list and measurement steps were compiled with AI help from public datasets. In demo mode, all readings are simulated by AI-written code;
                they are not real crew data.
              </td>
              <td>A "Demo mode" bar across the top of every screen when simulated readings are in use.</td>
            </tr>
            <tr>
              <td>Video and audio</td>
              <td>None in the app.</td>
              <td>Not applicable.</td>
            </tr>
          </tbody>
        </table>
        <p className="muted small">User interface icons (arrows, check marks and so on) are small line drawings written as code by AI and are covered by this notice.</p>
      </section>

      <section className="card">
        <h2>Sources</h2>
        <ul className="source-list">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.name}
              </a>
              <span className="muted small"> {s.use}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">
          The risk list, measurement steps, healthy ranges and recommendations shown in the app are served by the team's backend from its own data files, which were built from these sources.
        </p>
        <h3>Open-source software</h3>
        <ul className="source-list">
          {LIBRARIES.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.name}
              </a>
              <span className="muted small"> {l.license}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Your data</h2>
        <p>
          Readings are stored by the mission's health system (the team's backend). Your environment, role and medical officer are stored there too. This browser only keeps your sign-in token, a note that you chose an environment, the change history, extreme-reading alerts, your reminder choices and which badges you have already seen.
          Logging out removes the token from this device.
        </p>
      </section>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="page narrow">
      <PageHeader title="Page not found" back={{ to: '/', label: 'Home' }} />
      <ErrorState error={new Error('not found')} />
      <p className="muted">That page does not exist. Go back to Home to see your risks and reminders.</p>
    </div>
  );
}
