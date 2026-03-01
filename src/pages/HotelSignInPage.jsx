import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import firebaseAuthService from "../services/firebaseAuthService";
import notificationService from "../services/notificationService";
import { staffari } from "../theme/staffariTheme";
import { lsSet } from "../utils/storage";

export default function HotelSignInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: "", color: "red" });

  const canSubmit = useMemo(() => {
    const e = email.trim();
    return e.length > 0 && e.includes("@") && password.length > 0 && !isLoading;
  }, [email, password, isLoading]);

  const showSnack = (msg, color = "red") => {
    setSnack({ open: true, msg, color });
    window.setTimeout(() => setSnack((s) => ({ ...s, open: false })), 2500);
  };

  const signIn = async (e) => {
    e.preventDefault();

    const e1 = email.trim();
    if (!e1 || !e1.includes("@"))
      return showSnack("Please enter a valid email", "red");
    if (!password) return showSnack("Please enter your password", "red");

    setIsLoading(true);

    const user = await firebaseAuthService.signInWithEmailAndPassword({
      email: e1,
      password,
    });

    if (!user) {
      setIsLoading(false);
      showSnack("Sign in failed. Check your credentials.", "red");
      return;
    }

    const role = await firebaseAuthService.getUserRole(user.uid);
    if (!role) {
      setIsLoading(false);
      showSnack("Could not determine user role.", "red");
      return;
    }

    // HOTEL ONLY
    if (role !== "Hotel") {
      await firebaseAuthService.signOut();
      setIsLoading(false);
      showSnack("Only Hotel users can login here.", "red");
      return;
    }

    const userData = await firebaseAuthService.getUserData(user.uid, role);
    if (!userData) {
      setIsLoading(false);
      showSnack("Could not fetch user profile.", "red");
      return;
    }

    // Store like SharedPreferences (but in localStorage)
    lsSet("isLoggedIn", true);
    Object.entries(userData).forEach(([k, v]) => lsSet(k, v));
    lsSet("uid", user.uid);
    lsSet("role", role);

    setIsLoading(false);

    // Navigate first (same idea as Flutter)
    navigate("/hotel", { replace: true });

    // Then request notification permission (post-login)
    try {
      const settings = await notificationService.requestPermissionAfterLogin();
      lsSet("notifAuthorizationStatus", settings.authorizationStatus);
    } catch {
      // do nothing
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      <div
        style={{ maxWidth: 420, margin: "0 auto", padding: "24px 24px 40px" }}
      >
        <div style={{ height: 12 }} />

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              margin: "0 auto",
              background: staffari.cardBackground,
              border: `1px solid rgba(123,111,87,0.35)`,
              display: "grid",
              placeItems: "center",
            }}
            aria-hidden
          >
            <span style={{ fontSize: 34, color: staffari.emeraldGreen }}>
              ⎈
            </span>
          </div>

          <div style={{ height: 16 }} />

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              color: staffari.deepJungleGreen,
              fontFamily: "Space Grotesk, system-ui",
            }}
          >
            Welcome Back!
          </h1>

          <div style={{ height: 10 }} />

          <p
            style={{
              margin: 0,
              fontSize: 16,
              color: staffari.mutedOlive,
              fontFamily: "Poppins, system-ui",
            }}
          >
            Continue your talent hunt.
          </p>
        </div>

        <div style={{ height: 34 }} />

        <form onSubmit={signIn}>
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="Email"
          />

          <div style={{ height: 16 }} />

          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type={isPasswordVisible ? "text" : "password"}
            placeholder="Password"
            right={
              <button
                type="button"
                onClick={() => setIsPasswordVisible((v) => !v)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: staffari.mutedOlive,
                  fontFamily: "Poppins, system-ui",
                  fontWeight: 700,
                }}
              >
                {isPasswordVisible ? "Hide" : "Show"}
              </button>
            }
          />

          <div style={{ height: 26 }} />

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
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>

        <div style={{ height: 16 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            fontFamily: "Poppins, system-ui",
          }}
        >
          <span style={{ color: staffari.charcoalBlack }}>
            Don't have an account?
          </span>
          <Link
            to="/signup"
            style={{
              color: staffari.emeraldGreen,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Sign Up
          </Link>
        </div>

        {snack.open && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: 20,
              transform: "translateX(-50%)",
              background:
                snack.color === "red" ? "#E53935" : staffari.emeraldGreen,
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 12,
              fontFamily: "Poppins, system-ui",
              fontWeight: 800,
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              zIndex: 9999,
              maxWidth: 520,
            }}
          >
            {snack.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder, right }) {
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
          border: `1px solid rgba(123,111,87,0.45)`,
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
        {right ? <div>{right}</div> : null}
      </div>
    </label>
  );
}
