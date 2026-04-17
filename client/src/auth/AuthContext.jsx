import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const SESSION_KEY = "linkedin_sim_auth_session";
const API = "http://localhost:8005";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.role && parsed?.email) {
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  async function login({ email, password, role }) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Login failed");
    }

    const sessionUser = {
      userId: data.user_id,
      email: data.email,
      role: data.role,
      firstName: data.first_name,
      lastName: data.last_name,
      displayName: `${data.first_name} ${data.last_name}`.trim(),
    };

    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  }

  async function signup(payload) {
    const endpoint =
      payload.role === "member" ? "/auth/signup/member" : "/auth/signup/recruiter";

    const requestBody =
      payload.role === "member"
        ? {
            first_name: payload.firstName,
            last_name: payload.lastName,
            email: payload.email,
            password: payload.password,
          }
        : {
            recruiter_id: payload.recruiterId,
            company_id: payload.companyId,
            first_name: payload.firstName,
            last_name: payload.lastName,
            email: payload.email,
            company_name: payload.companyName,
            password: payload.password,
          };

    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Signup failed");
    }

    const sessionUser = {
      userId: data.user_id,
      email: data.email,
      role: data.role,
      firstName: data.first_name,
      lastName: data.last_name,
      displayName: `${data.first_name} ${data.last_name}`.trim(),
    };

    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}