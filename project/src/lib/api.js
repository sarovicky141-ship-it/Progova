import { auth } from "../../libs/firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const pendingRequests = new Set();

export class ApiAuthenticationError extends Error {
  constructor() {
    super("Authentication is required to make this request.");
    this.name = "ApiAuthenticationError";
  }
}

export const isApiRequestInterrupted = (error) =>
  error?.name === "AbortError" ||
  error?.name === "ApiAuthenticationError";

export const cancelPendingApiRequests = () => {
  pendingRequests.forEach((controller) => controller.abort());
  pendingRequests.clear();
};

export const apiFetch = async (endpoint, options = {}) => {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    throw new ApiAuthenticationError();
  }

  let token;
  try {
    token = await firebaseUser.getIdToken();
  } catch (error) {
    if (auth.currentUser?.uid !== firebaseUser.uid) {
      throw new ApiAuthenticationError();
    }
    throw error;
  }

  if (auth.currentUser?.uid !== firebaseUser.uid) {
    throw new ApiAuthenticationError();
  }

  const headers = {
    ...(options.headers || {}),
  };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortRequest = () => controller.abort();
  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener("abort", abortRequest, { once: true });
  }

  pendingRequests.add(controller);
  try {
    return await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    pendingRequests.delete(controller);
    externalSignal?.removeEventListener("abort", abortRequest);
  }
};
