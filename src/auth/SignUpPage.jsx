// src/auth/SignUpPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUpWithEmail } from "./authService";

export default function SignUpPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "Hotel",
    companyName: "",
    termsAccepted: false,
  });

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.termsAccepted) return alert("Please accept terms.");
    if (form.password.length < 6) return alert("Password must be at least 6 characters.");

    setBusy(true);
    try {
      await signUpWithEmail(form);
      alert("Signup successful. Please sign in.");
      nav("/signin");
    } catch (e2) {
      alert(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Sign Up</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Full Name" value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <input placeholder="Email" value={form.email} onChange={(e) => onChange("email", e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => onChange("password", e.target.value)} style={{ width: "100%", marginBottom: 8 }} />

        <select value={form.role} onChange={(e) => onChange("role", e.target.value)} style={{ width: "100%", marginBottom: 8 }}>
          <option>Hotel</option>
          <option>Broker</option>
          <option>Job Seeker</option>
        </select>

        {form.role === "Broker" && (
          <input placeholder="Company Name" value={form.companyName} onChange={(e) => onChange("companyName", e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        )}

        <label style={{ display: "block", marginBottom: 12 }}>
          <input type="checkbox" checked={form.termsAccepted} onChange={(e) => onChange("termsAccepted", e.target.checked)} /> I accept terms and conditions
        </label>

        <button type="submit" disabled={busy}>{busy ? "Creating..." : "Create Account"}</button>
      </form>
      <p style={{ marginTop: 12 }}>Already have an account? <Link to="/signin">Sign in</Link></p>
    </div>
  );
}
