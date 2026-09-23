import { getAuth } from "firebase-admin/auth";
import { db } from "../libs/firebase.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const profileSnapshot = await db.collection("users").doc(decodedToken.uid).get();

    if (!profileSnapshot.exists) {
      return res.status(403).json({
        error: "User profile not found. Please contact an administrator.",
      });
    }

    const profile = profileSnapshot.data();
    if (!["admin", "student"].includes(profile.role)) {
      return res.status(403).json({
        error: "User account is not authorized.",
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...profile,
    };

    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      error: "Invalid or expired session token.",
    });
  }
};

export const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required.",
      });
    }

    return next();
  });
};
