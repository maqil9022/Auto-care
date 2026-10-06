import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("autolab_session") || "null"); }
    catch { return null; }
  });

  const login  = (u) => { localStorage.setItem("autolab_session", JSON.stringify(u)); setUser(u); };
  const logout = ()  => { localStorage.removeItem("autolab_session"); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
