import React from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import LoginSignupPage from "../pages/LoginSignupPage.jsx";

export default function ProtectedRoute({ allowedRole, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginSignupPage />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <LoginSignupPage />;
  }

  return children;
}