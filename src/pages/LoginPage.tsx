// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { USE_MOCKS, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { WhyPanel } from '../components/explain/WhyPanel';
import { AppMark } from '../components/layout/AppShell';
import { GENERAL_EXPLAINER } from '../content/explainers';

export function LoginPage() {
  const { token, login, register, sessionEnded } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'login' | 'register' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to="/" replace />;

  const submit = async (mode: 'login' | 'register') => {
    if (!username.trim() || !password) {
      setError('Enter a username and a password.');
      return;
    }
    setBusy(mode);
    setError(null);
    try {
      await (mode === 'login' ? login(username, password) : register(username, password));
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      if (mode === 'login' && status === 401) setError("That username and password don't match. Check them, or create a new account.");
      else if (mode === 'register' && status === 409) setError('That username is taken. Log in instead, or pick another name.');
      else setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="login">
      <form
        className="card login-card"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void submit('login');
        }}
      >
        <div className="login-brand">
          <AppMark size={40} />
          <div>
            <h1>Crew Health Monitor</h1>
            <p className="muted">Check your own health during the mission, one simple step at a time.</p>
          </div>
        </div>
        {sessionEnded && <p className="note">Your session ended. Please log in again.</p>}
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <div className="input-with-action">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" className="btn btn-text" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <div className="login-actions">
          <button type="submit" className="btn btn-filled" disabled={busy !== null}>
            {busy === 'login' ? 'Logging in…' : 'Log in'}
          </button>
          <button type="button" className="btn btn-outline" disabled={busy !== null} onClick={() => void submit('register')}>
            {busy === 'register' ? 'Creating…' : 'Create account'}
          </button>
        </div>
        <p className="muted small">Both buttons use the username and password above. Your health data stays on this mission's system.</p>
        {USE_MOCKS && <p className="note small">Demo mode: create an account named "demo" to see three weeks of simulated readings.</p>}
      </form>
      <div className="login-why">
        <WhyPanel why={GENERAL_EXPLAINER.why} space={GENERAL_EXPLAINER.space} whyTitle="Why are these exams needed?" />
      </div>
    </div>
  );
}
