export const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000");

export const AUTH_CHANGE_EVENT = "yummigo-auth-change";

export const getImageUrl = (coverImage, fallbackImg) => {
  if (!coverImage || typeof coverImage !== "string") {
    return fallbackImg;
  }
  const trimmed = coverImage.trim();
  if (!trimmed) {
    return fallbackImg;
  }
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  return `${API_URL}/images/${trimmed}`;
};

export const getAuthToken = () => localStorage.getItem("token") || "";

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const getStoredFavourites = () => {
  try {
    const raw = localStorage.getItem("fav");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const extractApiError = (err, fallback = "Something went wrong. Please try again.") => {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    (err?.code === "ERR_NETWORK" ? "Cannot reach the server. Please check your connection." : null) ||
    fallback
  );
};
