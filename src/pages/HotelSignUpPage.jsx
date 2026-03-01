// src/pages/HotelSignUpPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import firebaseAuthService from "../services/firebaseAuthService";
import { staffari } from "../theme/staffariTheme";
import { lsSet } from "../utils/storage";

const TERMS_URL = "https://www.jacmagnus.com";
const CONTACT_URL = "https://www.jacmagnus.com";

export default function HotelSignUpPage() {
  const navigate = useNavigate();

  const [hotelName, setHotelName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: "", color: "red" });

  const showSnack = (msg, color = "red") => {
    setSnack({ open: true, msg, color });
    window.setTimeout(() => setSnack((s) => ({ ...s, open: false })), 2500);
  };

  const openLink = (url) => {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      showSnack("Could not open link", "red");
    }
  };

  const canSubmit = useMemo(() => {
    if (isLoading) return false;
    if (!hotelName.trim()) return false;
    if (!email.trim() || !email.includes("@")) return false;
    if ((phone || "").replace(/\D/g, "").length < 10) return false;
    if (!password || password.length < 8) return false;
    if (confirmPassword !== password) return false;
    return true;
  }, [hotelName, email, phone, password, confirmPassword, isLoading]);

  const validate = () => {
    if (!hotelName.trim()) return "Please enter the hotel name";
    if (!email.trim() || !email.includes("@"))
      return "Please enter a valid email";
    if ((phone || "").replace(/\D/g, "").length < 10)
      return "Please enter a valid phone number";
    if (!password || password.length < 8)
      return "Password must be at least 8 characters";
    if (confirmPassword !== password) return "Passwords do not match";
    if (!termsAccepted) return "Please accept Terms & Conditions to continue.";
    return null;
  };

  const signUp = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      showSnack(err, err.includes("Terms") ? "orange" : "red");
      return;
    }

    setIsLoading(true);

    const user = await firebaseAuthService.signUpWithEmailAndPassword({
      email: email.trim(),
      password,
      fullName: hotelName.trim(), // Flutter uses fullName field for hotel name
      phone: phone.trim(),
      role: "Hotel",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    setIsLoading(false);

    if (!user) {
      showSnack("Registration failed. Email might already be in use.", "red");
      return;
    }

    // After signup, store the Firestore user doc in localStorage (same idea as Flutter prefs)
    const userData = await firebaseAuthService.getUserData(user.uid, "Hotel");
    if (!userData) {
      showSnack("Registered, but could not fetch user profile.", "red");
      return;
    }

    lsSet("isLoggedIn", true);
    Object.entries(userData).forEach(([k, v]) => lsSet(k, v));
    lsSet("uid", user.uid);
    lsSet("role", "Hotel");

    showSnack(
      "Registration successful! Please check your email to verify.",
      "green",
    );
    navigate("/hotel", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      <div
        style={{ maxWidth: 520, margin: "0 auto", padding: "24px 24px 40px" }}
      >
        {/* Header */}
        <div style={{ height: 8 }} />

        <h1
          style={{
            margin: "16px 0 8px",
            textAlign: "center",
            fontSize: 32,
            fontWeight: 800,
            color: staffari.deepJungleGreen,
            fontFamily: "Space Grotesk, system-ui",
          }}
        >
          List Your Property
        </h1>

        <p
          style={{
            margin: "0 0 18px",
            textAlign: "center",
            fontSize: 16,
            color: staffari.mutedOlive,
            fontFamily: "Poppins, system-ui",
          }}
        >
          Find the best talent for your team.
        </p>

        {/* Form */}
        <form onSubmit={signUp}>
          <Field
            label="Hotel Name"
            value={hotelName}
            onChange={setHotelName}
            placeholder="Hotel Name"
          />

          <div style={{ height: 16 }} />

          <Field
            label="Hotel Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="Hotel Email"
          />

          <div style={{ height: 16 }} />

          <Field
            label="Hotel Phone Number"
            value={phone}
            onChange={setPhone}
            type="tel"
            placeholder="Hotel Phone Number"
          />

          <div style={{ height: 16 }} />

          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="Password"
          />

          <div style={{ height: 16 }} />

          <Field
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            type="password"
            placeholder="Confirm Password"
          />

          <div style={{ height: 14 }} />

          {/* Terms box */}
          <div
            style={{
              background: staffari.cardBackground,
              borderRadius: 16,
              border: "1px solid rgba(123,111,87,0.45)",
              padding: 12,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              fontFamily: "Poppins, system-ui",
            }}
          >
            <input
              type="checkbox"
              checked={termsAccepted}
              disabled={isLoading}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginTop: 3,
                accentColor: staffari.emeraldGreen,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: staffari.charcoalBlack,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                I agree to the
              </div>

              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => openLink(TERMS_URL)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    color: staffari.emeraldGreen,
                    fontWeight: 700,
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontFamily: "Poppins, system-ui",
                  }}
                >
                  Terms & Conditions
                </button>

                <span style={{ color: staffari.mutedOlive, fontSize: 10 }}>
                  Required to register a Hotel account.
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: 22 }} />

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: "none",
              background: staffari.emeraldGreen,
              color: "#fff",
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.6,
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "Poppins, system-ui",
            }}
          >
            {isLoading ? "Loading..." : "Register Hotel"}
          </button>
        </form>

        <div style={{ height: 10 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            fontFamily: "Poppins, system-ui",
          }}
        >
          <span style={{ color: staffari.charcoalBlack }}>
            Already have an account?
          </span>
          <Link
            to="/signin"
            style={{
              color: staffari.emeraldGreen,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button
            type="button"
            onClick={() => openLink(CONTACT_URL)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: staffari.emeraldGreen,
              fontWeight: 700,
              fontFamily: "Poppins, system-ui",
              padding: 8,
            }}
          >
            Contact us
          </button>
        </div>

        {snack.open && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: 20,
              transform: "translateX(-50%)",
              background:
                snack.color === "red"
                  ? "#E53935"
                  : snack.color === "orange"
                    ? "#FB8C00"
                    : staffari.emeraldGreen,
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 12,
              fontFamily: "Poppins, system-ui",
              fontWeight: 800,
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              zIndex: 9999,
              maxWidth: 560,
            }}
          >
            {snack.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          marginBottom: 8,
          color: staffari.mutedOlive,
          fontFamily: "Poppins, system-ui",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: staffari.cardBackground,
          borderRadius: 16,
          border: "1px solid rgba(123,111,87,0.45)",
          padding: "12px 14px",
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: staffari.charcoalBlack,
            fontSize: 16,
            fontFamily: "Poppins, system-ui",
          }}
        />
      </div>
    </label>
  );
}
