import { createClient, type Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import type { Profile } from "../../shared/types";
export const configured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);
export const supabase = configured
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  : null;
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!supabase)
    throw new Error(
      "Connect Supabase to use accounts and reservations. See the included setup guide.",
    );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const r = await fetch(`${import.meta.env.VITE_API_URL || ""}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });
  const body = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok)
    throw new Error(
      body?.error || "The server is unavailable. Please try again.",
    );
  return body as T;
}
const AuthContext = createContext<{
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  savedIds: string[];
  refreshSaved: () => Promise<void>;
}>({
  session: null,
  profile: null,
  loading: true,
  error: "",
  refresh: async () => {},
  savedIds: [],
  refreshSaved: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(configured),
    [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  async function refreshSaved() {
    const rows = await api<{ property_id: string }[]>("/saved");
    setSavedIds(rows.map((r) => r.property_id));
  }
  useEffect(() => {
    setSavedIds([]);
    if (profile?.role === "student") refreshSaved().catch(() => {});
  }, [profile?.id]);
  async function refresh() {
    try {
      setProfile(await api<Profile>("/profile"));
      setError("");
    } catch (e) {
      setError(message(e));
    }
  }
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setLoading(false);
        setError("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    if (!session) return;
    setLoading(true);
    api<Profile>("/profile")
      .then((p) => {
        if (active) {
          setProfile(p);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.access_token]);
  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        error,
        refresh,
        savedIds,
        refreshSaved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
export function Protected({
  children,
  role,
}: {
  children: ReactNode;
  role?: string;
}) {
  const { session, profile, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!session)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (error)
    return (
      <div className="page narrow">
        <Notice error>{error}</Notice>
        <button className="button" onClick={refresh}>
          Retry connection
        </button>
        <button
          className="text-button"
          onClick={() => supabase?.auth.signOut()}
        >
          Log out
        </button>
      </div>
    );
  if (role && profile?.role !== role)
    return (
      <div className="page narrow">
        <h1>This page is for {role}s.</h1>
        <Link className="button" to="/dashboard">
          Go to dashboard
        </Link>
      </div>
    );
  return <>{children}</>;
}
export const message = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong.";
export const money = (v: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(v);
export const dateTime = (v: string, tz: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(v));
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Loading HomeBridge…
    </div>
  );
}
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loader()
      .then((v) => {
        if (active) setData(v);
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [...deps, version]);
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
