// src/services/firebaseAuthService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase.js";

class FirebaseAuthService {
  async signUpWithEmailAndPassword({
    email,
    password,
    fullName,
    phone,
    role,
    companyName = null,
    termsAccepted,
    termsAcceptedAt, // JS Date
  }) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      if (!user) return null;

      await this._storeUserData({
        userId: user.uid,
        fullName,
        email,
        phone,
        role,
        companyName,
        termsAccepted,
        termsAcceptedAt,
      });

      // OPTIONAL (matches your Dart comment; currently you didn't call it there)
      // await sendEmailVerification(user);

      return user;
    } catch (e) {
      console.error("Firebase Auth Exception (Sign Up):", e?.message || e);
      return null;
    }
  }

  async signInWithEmailAndPassword({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user ?? null;
    } catch (e) {
      console.error("Firebase Auth Exception (Sign In):", e?.message || e);
      return null;
    }
  }

  async getUserRole(uid) {
    const roles = ["Job Seeker", "Hotel", "Broker"];
    for (const role of roles) {
      try {
        const ref = doc(db, "hhs_app", "users", role, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data()?.role ?? role;
      } catch (e) {
        console.error(`Error checking role ${role}:`, e);
      }
    }
    return null;
  }

  async getUserData(uid, role) {
    try {
      const ref = doc(db, "hhs_app", "users", role, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data();
    } catch (e) {
      console.error(`Error fetching user data for role ${role}:`, e);
    }
    return null;
  }

  async _storeUserData({
    userId,
    fullName,
    email,
    phone,
    role,
    companyName,
    termsAccepted,
    termsAcceptedAt,
  }) {
    const userData = {
      uid: userId,
      fullName,
      email,
      phone,
      role,
      createdAt: Timestamp.now(), // like Flutter Timestamp.now()
      isEmailVerified: false,
      isPhoneVerified: false,
      isAadhaarVerified: false,
      digilockerSessionId: null,
      aadhaarFileUrl: null,
      termsAccepted: !!termsAccepted,
      termsAcceptedAt: termsAcceptedAt
        ? Timestamp.fromDate(termsAcceptedAt)
        : serverTimestamp(),
    };

    if (role === "Broker" && companyName) userData.companyName = companyName;

    await setDoc(doc(db, "hhs_app", "users", role, userId), userData);
  }

  async signOut() {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
}

export default new FirebaseAuthService();
