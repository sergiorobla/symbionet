import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";

// UserContext.jsx
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("symbionet_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [shouldForceLogout, setShouldForceLogout] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("symbionet_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("symbionet_user");
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.emit("registerUser", user.id);

    socket.on("userDeleted", (deletedUserId) => {
      if (deletedUserId === user.id) {
        setShouldForceLogout(true);
      }
    });

    return () => socket.disconnect();
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, shouldForceLogout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
