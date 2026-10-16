import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../libs/firebase";
import { cancelPendingApiRequests } from "../lib/api";

const AuthContext = createContext();

const logFirebaseErrorCode = (stage, error) => {
  const code =
    error && typeof error.code === "string" ? error.code : "unknown";
  console.error(`${stage} failed (Firebase error code: ${code})`);
};

const signOutAfterLoginFailure = async (stage) => {
  try {
    await signOut(auth);
  } catch (error) {
    logFirebaseErrorCode(stage, error);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authStateRequest = useRef(0);

  const syncUserProfile = useCallback(async (firebaseUser, requestId) => {
    if (!firebaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (requestId !== authStateRequest.current) return;

      if (!userSnapshot.exists()) {
        console.error("No Firestore profile found for authenticated user.");
        await signOutAfterLoginFailure("Sign-out after missing profile");
        setUser(null);
        return;
      }

      const profile = userSnapshot.data();
      if (!["admin", "student"].includes(profile.role)) {
        console.error("Authenticated user has an invalid Firestore role.");
        await signOutAfterLoginFailure("Sign-out after invalid role");
        setUser(null);
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || profile.email || null,
        name: profile.name || firebaseUser.displayName || null,
        role: profile.role || null,
        ...profile,
      });
    } catch (error) {
      if (requestId !== authStateRequest.current) return;
      logFirebaseErrorCode("Authentication-state profile lookup", error);
      setUser(null);
    } finally {
      if (requestId === authStateRequest.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      cancelPendingApiRequests();
      const requestId = ++authStateRequest.current;

      if (firebaseUser) {
        syncUserProfile(firebaseUser, requestId);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  const login = async (email, password) => {
    let firebaseUser;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      firebaseUser = userCredential.user;
    } catch (error) {
      logFirebaseErrorCode("Firebase sign-in", error);

      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    let profileSnapshot;
    try {
      profileSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
    } catch (error) {
      logFirebaseErrorCode("Login Firestore profile lookup", error);
      await signOutAfterLoginFailure("Sign-out after profile lookup failure");
      setUser(null);
      return {
        success: false,
        error: "Unable to load your account profile. Please try again.",
      };
    }

    if (!profileSnapshot.exists()) {
      console.error("Login failed: Firestore profile is missing.");
      await signOutAfterLoginFailure("Sign-out after missing profile");
      setUser(null);
      return {
        success: false,
        error: "Your account profile was not found. Please contact admin.",
      };
    }

    const profile = profileSnapshot.data();
    if (!["admin", "student"].includes(profile.role)) {
      console.error("Login failed: Firestore profile has an invalid role.");
      await signOutAfterLoginFailure("Sign-out after invalid role");
      setUser(null);
      return {
        success: false,
        error: "Your account has an invalid role. Please contact admin.",
      };
    }

    const loggedInUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || profile.email || null,
      name: profile.name || firebaseUser.displayName || null,
      role: profile.role || null,
      ...profile,
    };

    setUser(loggedInUser);
    setLoading(false);

    return {
      success: true,
      user: loggedInUser,
    };
  };

  const logout = async () => {
    try {
      await signOut(auth);
      cancelPendingApiRequests();
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};