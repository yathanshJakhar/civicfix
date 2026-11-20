"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Role = "citizen" | "authority" | "admin" | "contractor";
export type Portal = "citizen" | "authority" | "contractor";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string | null;
}

/** Department officers and the admin: they see the department dashboard and map. */
export function isStaff(user: User | null | undefined): user is User & { role: "authority" | "admin" } {
  return !!user && (user.role === "authority" || user.role === "admin");
}

export function isContractor(user: User | null | undefined): user is User & { role: "contractor" } {
  return !!user && user.role === "contractor";
}

/** Each role's landing page. */
export function homeFor(user: User | null | undefined): string {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin/contractors";
  if (isStaff(user)) return "/authority";
  if (isContractor(user)) return "/contractor";
  return "/tickets";
}

/** How a staff member's department reads on screen. */
export function departmentLabel(user: User): string {
  return user.role === "admin" ? "All departments" : (user.department ?? "No department");
}

interface AuthValue {
  user: User | null;
  /** True until the first /api/auth/me answer arrives. */
  loading: boolean;
  /**
   * Emails a 6-digit sign-in code and resolves to null. When the server signs the person in
   * straight away (staff while STAFF_SIGN_IN_WITHOUT_CODE is on), resolves to the page to open next instead.
   * Throws with the server's message.
   */
  requestCode: (email: string, portal: Portal) => Promise<string | null>;
  /** Checks the code and signs in. Resolves to the page to open next. Throws with the server's message. */
  verifyCode: (email: string, portal: Portal, code: string, name?: string) => Promise<string>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setUser(res.ok ? (data.user ?? null) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the session once on mount
    refresh();
  }, [refresh]);

  const requestCode = useCallback(async (email: string, portal: Portal) => {
    const data = await post<{ ok?: true; user?: User; redirect?: string }>("/api/auth/otp/request", { email, portal });
    if (!data.user) return null;
    setUser(data.user);
    return data.redirect || homeFor(data.user);
  }, []);

  const verifyCode = useCallback(async (email: string, portal: Portal, code: string, name?: string) => {
    const data = await post<{ user: User; redirect: string }>("/api/auth/otp/verify", { email, portal, code, name });
    setUser(data.user);
    return data.redirect || homeFor(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await post("/api/auth/logout");
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, requestCode, verifyCode, logout, refresh }),
    [user, loading, requestCode, verifyCode, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
