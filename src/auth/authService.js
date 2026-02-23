// src/auth/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const ROLES = ["Job Seeker", "Hotel", "Broker"];

export async function signUpWithEmail({
  fullName,
  email,
  phone,
  password,
  role,
  companyName,
  termsAccepted,
}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  await updateProfile(user, { displayName: fullName });

  const profile = {
    uid: user.uid,
    fullName,
    email,
    phone,
    role,
    createdAt: serverTimestamp(),
    isEmailVerified: user.emailVerified,
    isPhoneVerified: false,
    isAadhaarVerified: false,
    digilockerSessionId: null,
    aadhaarFileUrl: null,
    termsAccepted: !!termsAccepted,
    termsAcceptedAt: serverTimestamp(),
    ...(role === "Broker" && companyName ? { companyName } : {}),
  };

  await setDoc(doc(db, "hhs_app", "users", role, user.uid), profile);
  return user;
}

export async function signInWithEmail({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function getUserRole(uid) {
  for (const role of ROLES) {
    const snap = await getDoc(doc(db, "hhs_app", "users", role, uid));
    if (snap.exists()) return role;
  }
  return null;
}

export async function getUserData(uid, role) {
  const snap = await getDoc(doc(db, "hhs_app", "users", role, uid));
  return snap.exists() ? snap.data() : null;
}
