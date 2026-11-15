// AI-generated code and text (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// About: what the app is, exactly where and how AI was used, and the sources behind the content.
import { ErrorState, PageHeader } from '../components/layout/AppShell';
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
  { name: 'Roboto Flex and Roboto Mono fonts', url: 'https://fonts.google.com/specimen/Roboto+Flex', license: 'SIL Open Font License / Apache 2.0' },
];

export function AboutPage() {
  return (
    <div className="page narrow prose">
      <PageHeader title="About this app and how AI was used" eyebrow="About" back={{ to: '/', label: 'Home' }} />

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
              <td>The body outline and the step pictures were drawn by AI as simple vector shapes. No photos and no third-party artwork are used.</td>
              <td>
                Every one carries a visible watermark like this: <span className="inline-mark"><AiMark /></span>
              </td>
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
          Readings are stored by the mission's health system (the team's backend). This browser only keeps your sign-in token, your earned badges and reminder snooze times.
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
