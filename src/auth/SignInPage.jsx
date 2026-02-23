// src/auth/SignInPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserData, getUserRole, signInWithEmail } from "./authService";

export default function SignInPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await signInWithEmail({ email: email.trim(), password });
      const role = await getUserRole(user.uid);

      if (!role) throw new Error("Could not determine user role.");

      const profile = await getUserData(user.uid, role);
      if (!profile) throw new Error("Could not fetch user profile.");

      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", profile.email || user.email || "");
      localStorage.setItem("fullName", profile.fullName || user.displayName || "");
      localStorage.setItem("role", role);

      if (role === "Hotel") nav("/hotel");
      else if (role === "Broker") nav("/broker");
      else nav("/jobseeker");
    } catch (e2) {
      alert(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h2>Sign In</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
        <button type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
      </form>
      <p style={{ marginTop: 12 }}>New user? <Link to="/signup">Create account</Link></p>
    </div>
  );
}
