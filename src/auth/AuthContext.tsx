// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { TOKEN_KEY, USERNAME_KEY, setUnauthorizedHandler } from '../api/client';
import { auth } from '../api/endpoints';

interface AuthState {
  token: string | null;
  username: string;
  /** Set when the server rejected the stored token, so the login page can explain why. */
  sessionEnded: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY) ?? '');
  const [sessionEnded, setSessionEnded] = useState(false);

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setUsername('');
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
      setSessionEnded(true);
    });
  }, [clear]);

  const store = useCallback(
    (newToken: string, name: string) => {
      // The token is kept so a refresh or a later visit on this device stays signed in.
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USERNAME_KEY, name);
      queryClient.clear();
      setSessionEnded(false);
      setUsername(name);
      setToken(newToken);
    },
    [queryClient],
  );

  const value = useMemo<AuthState>(
    () => ({
      token,
      username,
      sessionEnded,
      login: async (name, password) => store(await auth.login(name.trim(), password), name.trim()),
      register: async (name, password) => store(await auth.register(name.trim(), password), name.trim()),
      // The backend has no logout endpoint, so logging out only forgets the token on this device.
      logout: () => {
        clear();
        setSessionEnded(false);
      },
    }),
    [token, username, sessionEnded, store, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
