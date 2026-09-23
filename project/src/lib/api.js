import { auth } from "../../libs/firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiFetch = async (endpoint, options = {}) => {
  const firebaseUser = auth.currentUser;

  const token = firebaseUser
    ? await firebaseUser.getIdToken()
    : null;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
};
