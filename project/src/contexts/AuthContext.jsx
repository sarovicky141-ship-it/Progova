import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../libs/firebase";

const AuthContext = createContext();

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

  const syncUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        console.error(
          `No Firestore profile found for Firebase user ${firebaseUser.uid}.`
        );
        await signOut(auth);
        setUser(null);
        return;
      }

      const profile = userSnapshot.data();
      if (!["admin", "student"].includes(profile.role)) {
        console.error(`Invalid role for Firebase user ${firebaseUser.uid}.`);
        await signOut(auth);
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
      console.error("Error loading user profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        syncUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        console.error(
          `Login failed: Firestore profile missing for UID ${firebaseUser.uid}`
        );
        await signOut(auth);

        return {
          success: false,
          error: "Your account profile was not found. Please contact admin.",
        };
      }

      const profile = userSnapshot.data();
      if (!["admin", "student"].includes(profile.role)) {
        await signOut(auth);
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
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        error: "Invalid email or password.",
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
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