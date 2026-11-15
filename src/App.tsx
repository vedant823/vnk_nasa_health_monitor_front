// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import { Route, Routes } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Protected } from './auth/EnvironmentContext';
import { AppShell } from './components/layout/AppShell';
import { AboutPage, NotFoundPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MeasurementOverviewPage } from './pages/MeasurementOverviewPage';
import { MeasurementPerformPage } from './pages/MeasurementPerformPage';
import { ProfilePage } from './pages/ProfilePage';
import { SummaryPage } from './pages/SummaryPage';
import { RemindersPage } from './pages/RemindersPage';
import { RiskPage } from './pages/RiskPage';

/** Every id in a URL comes from the backend, so new risks and measurements need no frontend change. */
export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/info" element={<AboutPage />} />
        <Route path="/about" element={<Navigate to="/info" replace />} />
        <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
        <Route path="/summary" element={<Protected><SummaryPage /></Protected>} />
        <Route path="/" element={<Protected><HomePage /></Protected>} />
        <Route path="/reminders" element={<Protected><RemindersPage /></Protected>} />
        <Route path="/risks/:riskId" element={<Protected><RiskPage /></Protected>} />
        <Route path="/measurements/:measurementId" element={<Protected><MeasurementOverviewPage /></Protected>} />
        <Route path="/measurements/:measurementId/perform" element={<Protected><MeasurementPerformPage /></Protected>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
