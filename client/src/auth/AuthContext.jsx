import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const SESSION_KEY = "linkedin_sim_auth_session";
const API = "http://adfd79d807cdc4e96bb86f461a5bc2d0-4b9c3d7da87e2d61.elb.us-east-2.amazonaws.com:8001";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.role && parsed?.email) {
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  function extractErrorMessage(data, fallback) {
    if (!data) return fallback;

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail.map((item) => item?.msg || "Invalid request").join(", ");
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return fallback;
  }

  async function login({ email, password, role }) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(extractErrorMessage(data, "Login failed"));
    }

    const sessionUser = {
      userId: data.user_id,
      email: data.email,
      role: data.role,
      firstName: data.first_name,
      lastName: data.last_name,
      displayName: `${data.first_name} ${data.last_name}`.trim(),
      companyName: data.company_name || null,
      companyId: data.company_id || null,
      token: data.access_token,
    };

    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  }

  async function signup(payload) {
    const isRecruiter = payload.role === "recruiter";

    const endpoint = isRecruiter
      ? "/auth/signup/recruiter"
      : "/auth/signup/member";

    const requestBody = isRecruiter
      ? {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          companyName: payload.companyName,
          password: payload.password,
        }
      : {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: payload.password,
        };

    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(extractErrorMessage(data, "Signup failed"));
    }

    const sessionUser = {
      userId: data.user_id,
      email: data.email,
      role: data.role,
      firstName: data.first_name,
      lastName: data.last_name,
      displayName: `${data.first_name} ${data.last_name}`.trim(),
      companyName: data.company_name || null,
      companyId: data.company_id || null,
      token: data.access_token,
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
      loading,
      login,
      signup,
      logout,
    }),
    [user, loading]
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