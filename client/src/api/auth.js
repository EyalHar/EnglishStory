import apiFetch from "./client";

export function loginWithGoogle(credential) {
  return apiFetch("/api/auth/google", { method: "POST", body: { credential } });
}

export function fetchMe(token) {
  return apiFetch("/api/auth/me", { token });
}
