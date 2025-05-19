import React, { useState } from "react";
import { deleteUserAdmin, deletePostAdmin } from "../api/api";
const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:4000";
export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState(null); // { users: [...], posts: [...] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDeleteUser(id) {
    if (!confirm("¿Eliminar usuario?")) return;
    try {
      await deleteUserAdmin(id, username, password);
      setData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== id),
      }));
    } catch (err) {
      alert(err.message || "Error eliminando usuario");
    }
  }

  async function handleDeletePost(id) {
    if (!confirm("¿Eliminar post?")) return;
    try {
      await deletePostAdmin(id, username, password);
      setData((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== id),
      }));
    } catch (err) {
      alert(err.message || "Error eliminando post");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${BASE_URL}/admin/data`, {
        headers: {
          Authorization: "Basic " + btoa(username + ":" + password),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Acceso denegado. Credenciales incorrectas.");
        } else {
          setError("Error al obtener datos.");
        }
        setLoading(false);
        return;
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError("Error de red o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      {!data && (
        <form
          onSubmit={handleSubmit}
          style={{ marginBottom: 20 }}
          className="flex flex-col items-center"
        >
          <div>
            <label className="flex flex-col">
              Usuario{" "}
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-black border border-black px-1 rounded"
                required
                autoComplete="username"
              />
            </label>
          </div>
          <div>
            <label className="flex flex-col">
              Contraseña{" "}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-black border border-black mb-3 px-1 rounded"
                required
                autoComplete="current-password"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 h-8 rounded"
            style={{ width: "100px" }}
          >
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <>
          <h3>Usuarios</h3>
          <ul>
            {data.users.map((user) => (
              <li
                key={user.id}
                className="flex justify-between items-center mb-2"
              >
                <span>
                  {user.username} (Reputación: {user.reputation})
                </span>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="ml-2 text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-sm"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <h3>Posts</h3>
          <ul>
            {data.posts.map((post) => (
              <li
                key={post.id}
                className="flex justify-between items-center mb-2"
              >
                <span>
                  <b>{post.username}</b>: {post.content}{" "}
                  <i>({new Date(post.created_at).toLocaleString()})</i>
                </span>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="ml-2 text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-sm"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              setData(null);
              setUsername("");
              setPassword("");
              setError(null);
            }}
          >
            Cerrar sesión
          </button>
        </>
      )}
    </div>
  );
}
