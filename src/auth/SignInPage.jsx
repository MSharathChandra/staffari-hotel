// src/auth/SignInPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "./AuthApi";

export default function SignInPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await authApi.signIn({ email: email.trim(), password });
      // adapt keys to your backend response
      localStorage.setItem("uid", data.user?.uid || data.uid || "");
      localStorage.setItem("fullName", data.user?.fullName || data.fullName || "Hotel");
      localStorage.setItem("email", data.user?.email || email.trim());
      localStorage.setItem("role", data.user?.role || data.role || "Hotel");

      const role = (data.user?.role || data.role || "Hotel").toLowerCase();
      if (role.includes("hotel")) nav("/hotel");
      else if (role.includes("broker")) nav("/broker");
      else nav("/jobseeker");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h2>Sign In</h2>
      <form onSubmit={onSubmit}>
        <input
          style={{ width: "100%", marginBottom: 8 }}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={{ width: "100%", marginBottom: 12 }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button disabled={busy} type="submit">
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        New user? <Link to="/signup">Create account</Link>
      </p>
    </div>
  );
}
