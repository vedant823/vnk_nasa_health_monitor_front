// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { AboutPage, NotFoundPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MeasurementOverviewPage } from './pages/MeasurementOverviewPage';
import { MeasurementPerformPage } from './pages/MeasurementPerformPage';
import { RemindersPage } from './pages/RemindersPage';
import { RiskPage } from './pages/RiskPage';

/** Every id in a URL comes from the backend, so new risks and measurements need no frontend change. */
export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/reminders" element={<RequireAuth><RemindersPage /></RequireAuth>} />
        <Route path="/risks/:riskId" element={<RequireAuth><RiskPage /></RequireAuth>} />
        <Route path="/measurements/:measurementId" element={<RequireAuth><MeasurementOverviewPage /></RequireAuth>} />
        <Route path="/measurements/:measurementId/perform" element={<RequireAuth><MeasurementPerformPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
