import { createContext, useContext, useMemo, useState } from "react";
import api from "../utils/api.js";
import { normalizeUser } from "../utils/roleRoutes.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("hiresense_user");
    if (!raw) return null;
    const normalizedUser = normalizeUser(JSON.parse(raw));
    localStorage.setItem("hiresense_user", JSON.stringify(normalizedUser));
    return normalizedUser;
  });

  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    const normalizedUser = normalizeUser(data.user);
    localStorage.setItem("hiresense_token", data.token);
    localStorage.setItem("hiresense_user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    const normalizedUser = normalizeUser(data.user);
    localStorage.setItem("hiresense_token", data.token);
    localStorage.setItem("hiresense_user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  }

  function logout() {
    localStorage.removeItem("hiresense_token");
    localStorage.removeItem("hiresense_user");
    setUser(null);
  }

  function updateUser(nextUser) {
    const normalizedUser = normalizeUser(nextUser);
    localStorage.setItem("hiresense_user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  }

  const value = useMemo(
    () => ({ user, login, logout, register, updateUser }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
