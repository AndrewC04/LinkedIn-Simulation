import React from "react";
import { useNavigate } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import PlaceholderScreen from "../components/PlaceholderScreen.jsx";

export default function MemberMessages() {
  const navigate = useNavigate();

  return (
    <>
      <LinkedInNav userType="member" />
      <PlaceholderScreen
        title="Messages"
        description="Messaging UI is not wired yet in this integration branch."
        onBack={() => navigate("/member/home")}
      />
    </>
  );
}
