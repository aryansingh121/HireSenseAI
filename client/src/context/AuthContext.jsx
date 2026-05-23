import { createContext, useContext, useMemo, useState } from "react";
import api from "../utils/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("hiresense_user");
    return raw ? JSON.parse(raw) : null;
  });

  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem("hiresense_token", data.token);
    localStorage.setItem("hiresense_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("hiresense_token");
    localStorage.removeItem("hiresense_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
