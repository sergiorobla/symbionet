import React, { createContext, useContext, useState } from "react";

const KeyContext = createContext();

export const KeyProvider = ({ children }) => {
  const [privateKey, setPrivateKey] = useState(null);

  // Limpia la clave privada del contexto
  const clearKey = () => setPrivateKey(null);

  return (
    <KeyContext.Provider value={{ privateKey, setPrivateKey, clearKey }}>
      {children}
    </KeyContext.Provider>
  );
};

export const useKey = () => useContext(KeyContext);
