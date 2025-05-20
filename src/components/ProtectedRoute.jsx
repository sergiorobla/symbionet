import React from "react";
import { getAccessToken } from "../api/auth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = getAccessToken();
  if (token === null) {
    // Si quieres, puedes mostrar un spinner aquí
    // return <Spinner />;
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
