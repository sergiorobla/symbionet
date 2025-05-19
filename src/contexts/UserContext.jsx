import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Inicializa el usuario desde localStorage solo una vez
    const savedUser = localStorage.getItem("symbionet_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Sincroniza el usuario con localStorage cada vez que cambie
  useEffect(() => {
    if (user) {
      localStorage.setItem("symbionet_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("symbionet_user");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
