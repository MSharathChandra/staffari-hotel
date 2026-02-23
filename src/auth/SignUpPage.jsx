// src/auth/SignUpPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "./AuthApi";

export default function SignUpPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "Hotel",
    companyName: "",
    termsAccepted: false,
  });
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.termsAccepted) return alert("Please accept terms.");
    setBusy(true);
    try {
      await authApi.signUpHotel({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        companyName: form.companyName.trim(),
        termsAccepted: true,
      });
      alert("Signup successful. Please sign in.");
      nav("/signin");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: "40px auto", padding: 16 }}>
      <h2>Sign Up</h2>
      <form onSubmit={onSubmit}>
        <input style={{ width: "100%", marginBottom: 8 }} placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input style={{ width: "100%", marginBottom: 8 }} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input style={{ width: "100%", marginBottom: 8 }} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input style={{ width: "100%", marginBottom: 8 }} type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input style={{ width: "100%", marginBottom: 8 }} placeholder="Company Name (optional)" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />

        <select style={{ width: "100%", marginBottom: 8 }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="Hotel">Hotel</option>
          <option value="Broker">Broker</option>
          <option value="Job Seeker">Job Seeker</option>
        </select>

        <label style={{ display: "block", marginBottom: 12 }}>
          <input type="checkbox" checked={form.termsAccepted} onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })} /> I accept terms
        </label>

        <button disabled={busy} type="submit">
          {busy ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </div>
  );
}
