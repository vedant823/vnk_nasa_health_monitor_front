// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { USE_MOCKS, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useStatus } from '../../hooks/queries';
import { Icon } from '../status/Status';
import { GuestBar } from '../guest/Guest';

/** Original app mark: a pulse line on a square ink plate, with a cobalt reading point. Not based on any agency logo or insignia. */
export function AppMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" fill="var(--color-ink)" />
      <path d="M4 18h6l2.5-8 4 14 2.5-6H22" fill="none" stroke="var(--color-paper)" strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter" />
      <rect x="23" y="15" width="5" height="5" fill="var(--color-accent)" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  // Medical officers get a Crew page. The role comes from the backend.
  const status = useStatus(!!token);
  const isOfficer = !!token && status.data === 'medical officer';
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <Link to="/" className="brand">
          <AppMark />
          <span>Crew Health Monitor</span>
        </Link>
        {token && (
          <nav aria-label="Main">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/reminders">Reminders</NavLink>
            <NavLink to="/summary">Summary</NavLink>
            {isOfficer && <NavLink to="/crew">Crew</NavLink>}
            <NavLink to="/info">Info</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </nav>
        )}
        <div className="topbar-right">
          {token ? (
            <>
              <NavLink to="/profile" className="user-name">
                {username || 'Profile'}
              </NavLink>
              <button
                type="button"
                className="btn btn-text"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/info">Info and AI use</NavLink>
          )}
        </div>
      </header>
      {token && <GuestBar />}
      {USE_MOCKS && (
        <div className="demo-bar" role="note">
          Demo mode: readings are simulated and stay in this browser. They are not real crew data.
        </div>
      )}
      <main id="main">{children}</main>
      <footer className="footer">
        <p>
          Hackathon prototype, not a medical device. Code, illustrations and explainer text were made with AI and are labelled.{' '}
          <Link to="/info">How AI was used</Link>
        </p>
      </footer>
    </div>
  );
}

export function PageHeader({ title, eyebrow, back, children }: { title: string; eyebrow?: string; back?: { to: string; label: string }; children?: ReactNode }) {
  return (
    <div className="page-header">
      {back && (
        <Link to={back.to} className="back-link">
          <Icon name="back" size={16} /> {back.label}
        </Link>
      )}
      <h1>{title}</h1>
      {eyebrow && <span className="page-sub">{eyebrow}</span>}
      {children}
    </div>
  );
}

export function Loading({ label = 'Loading your health data…' }: { label?: string }) {
  return (
    <div className="skeletons" role="status" aria-label={label}>
      <div className="skeleton tall" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="card error-state" role="alert">
      <p>{errorMessage(error)}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
