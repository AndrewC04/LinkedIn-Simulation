import React, { useState } from "react";
import { brand } from "../styles/theme.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LoginSignupPage() {
  const { login, signup } = useAuth();

  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginState, setLoginState] = useState({
    role: "member",
    email: "",
    password: "",
  });

  const [signupState, setSignupState] = useState({
    role: "member",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    recruiterId: "",
    companyId: "",
    companyName: "",
  });

  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#f3f2ef",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "Arial, Helvetica, sans-serif",
      padding: "24px",
      boxSizing: "border-box",
    },
    container: {
      width: "100%",
      maxWidth: "420px",
    },
    logoWrap: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "18px",
    },
    logoBox: {
      display: "inline-flex",
      width: "52px",
      height: "52px",
      borderRadius: "10px",
      backgroundColor: brand.blue,
      color: "white",
      fontWeight: "bold",
      fontSize: "30px",
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "14px",
      padding: "28px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      border: "1px solid #ddd",
    },
    heading: {
      fontSize: "24px",
      fontWeight: 700,
      marginBottom: "6px",
      color: "#1d2226",
      textAlign: "center",
    },
    subheading: {
      textAlign: "center",
      color: "#666",
      fontSize: "14px",
      marginBottom: "20px",
    },
    tabRow: {
      display: "flex",
      gap: "8px",
      marginBottom: "20px",
    },
    tab: (active) => ({
      flex: 1,
      padding: "10px",
      borderRadius: "8px",
      border: active ? "none" : "1px solid #ddd",
      backgroundColor: active ? brand.blue : "white",
      color: active ? "white" : "#333",
      fontWeight: "bold",
      cursor: "pointer",
    }),
    label: {
      fontSize: "14px",
      fontWeight: "bold",
      marginBottom: "6px",
      display: "block",
      color: "#1d2226",
    },
    input: {
      width: "100%",
      padding: "11px 12px",
      marginBottom: "15px",
      borderRadius: "8px",
      border: "1px solid #cfd8e3",
      boxSizing: "border-box",
      fontSize: "14px",
    },
    roleRow: {
      display: "flex",
      gap: "8px",
      marginBottom: "15px",
    },
    roleBtn: (active) => ({
      flex: 1,
      padding: "9px",
      borderRadius: "999px",
      border: active ? "none" : "1px solid #ccc",
      backgroundColor: active ? brand.blue : "white",
      color: active ? "white" : "#333",
      cursor: "pointer",
      fontWeight: "bold",
    }),
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "999px",
      backgroundColor: brand.blue,
      color: "white",
      fontWeight: "bold",
      border: "none",
      cursor: "pointer",
      marginTop: "4px",
    },
    error: {
      backgroundColor: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
      padding: "10px 12px",
      borderRadius: "8px",
      marginBottom: "14px",
      fontSize: "14px",
    },
  };

  async function handleLogin() {
    setError("");

    if (!loginState.email.trim() || !loginState.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      await login({
        email: loginState.email,
        password: loginState.password,
        role: loginState.role,
      });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    setError("");

    if (
      !signupState.firstName.trim() ||
      !signupState.lastName.trim() ||
      !signupState.email.trim() ||
      !signupState.password.trim()
    ) {
      setError("First name, last name, email, and password are required.");
      return;
    }

    if (signupState.role === "recruiter") {
      if (
        !signupState.recruiterId.trim() ||
        !signupState.companyId.trim() ||
        !signupState.companyName.trim()
      ) {
        setError("Recruiter ID, Company ID, and Company Name are required for recruiter signup.");
        return;
      }
    }

    try {
      setLoading(true);
      await signup({
        role: signupState.role,
        email: signupState.email,
        password: signupState.password,
        firstName: signupState.firstName,
        lastName: signupState.lastName,
        recruiterId: signupState.recruiterId,
        companyId: signupState.companyId,
        companyName: signupState.companyName,
      });
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logoWrap}>
          <div style={styles.logoBox}>in</div>
        </div>

        <div style={styles.card}>
          <div style={styles.heading}>LinkedIn Simulation</div>
          <div style={styles.subheading}>Sign in or create an account</div>

          <div style={styles.tabRow}>
            <button
              style={styles.tab(tab === "login")}
              onClick={() => {
                setTab("login");
                setError("");
              }}
            >
              Login
            </button>
            <button
              style={styles.tab(tab === "signup")}
              onClick={() => {
                setTab("signup");
                setError("");
              }}
            >
              Sign Up
            </button>
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}

          {tab === "login" ? (
            <>
              <div style={styles.label}>Role</div>
              <div style={styles.roleRow}>
                <button
                  style={styles.roleBtn(loginState.role === "member")}
                  onClick={() => setLoginState({ ...loginState, role: "member" })}
                >
                  Member
                </button>
                <button
                  style={styles.roleBtn(loginState.role === "recruiter")}
                  onClick={() => setLoginState({ ...loginState, role: "recruiter" })}
                >
                  Recruiter
                </button>
              </div>

              <div style={styles.label}>Email</div>
              <input
                style={styles.input}
                value={loginState.email}
                onChange={(e) => setLoginState({ ...loginState, email: e.target.value })}
                placeholder="name@example.com"
              />

              <div style={styles.label}>Password</div>
              <input
                type="password"
                style={styles.input}
                value={loginState.password}
                onChange={(e) => setLoginState({ ...loginState, password: e.target.value })}
                placeholder="Enter password"
              />

              <button style={styles.button} onClick={handleLogin} disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </>
          ) : (
            <>
              <div style={styles.label}>Role</div>
              <div style={styles.roleRow}>
                <button
                  style={styles.roleBtn(signupState.role === "member")}
                  onClick={() => setSignupState({ ...signupState, role: "member" })}
                >
                  Member
                </button>
                <button
                  style={styles.roleBtn(signupState.role === "recruiter")}
                  onClick={() => setSignupState({ ...signupState, role: "recruiter" })}
                >
                  Recruiter
                </button>
              </div>

              <div style={styles.label}>First Name</div>
              <input
                style={styles.input}
                value={signupState.firstName}
                onChange={(e) => setSignupState({ ...signupState, firstName: e.target.value })}
                placeholder="First name"
              />

              <div style={styles.label}>Last Name</div>
              <input
                style={styles.input}
                value={signupState.lastName}
                onChange={(e) => setSignupState({ ...signupState, lastName: e.target.value })}
                placeholder="Last name"
              />

              <div style={styles.label}>Email</div>
              <input
                style={styles.input}
                value={signupState.email}
                onChange={(e) => setSignupState({ ...signupState, email: e.target.value })}
                placeholder="name@example.com"
              />

              <div style={styles.label}>Password</div>
              <input
                type="password"
                style={styles.input}
                value={signupState.password}
                onChange={(e) => setSignupState({ ...signupState, password: e.target.value })}
                placeholder="Create password"
              />

              {signupState.role === "recruiter" ? (
                <>
                  <div style={styles.label}>Recruiter ID</div>
                  <input
                    style={styles.input}
                    value={signupState.recruiterId}
                    onChange={(e) => setSignupState({ ...signupState, recruiterId: e.target.value })}
                    placeholder="rec_100"
                  />

                  <div style={styles.label}>Company ID</div>
                  <input
                    style={styles.input}
                    value={signupState.companyId}
                    onChange={(e) => setSignupState({ ...signupState, companyId: e.target.value })}
                    placeholder="comp_100"
                  />

                  <div style={styles.label}>Company Name</div>
                  <input
                    style={styles.input}
                    value={signupState.companyName}
                    onChange={(e) => setSignupState({ ...signupState, companyName: e.target.value })}
                    placeholder="TechCorp"
                  />
                </>
              ) : null}

              <button style={styles.button} onClick={handleSignup} disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}