import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginWithGoogle, fetchMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe(token)
      .then(({ user }) => setUser(user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  const login = useCallback(async (credential) => {
    const { token, user } = await loginWithGoogle(credential);
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const { user } = await fetchMe(token);
    setUser(user);
    return user;
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
