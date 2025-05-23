const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:4000";
import { normalizeJwk } from "./publicKeyUtils";

// Manejo simple de accessToken en sessionStorage
function getAccessToken() {
  return sessionStorage.getItem("accessToken");
}
function setAccessToken(token) {
  sessionStorage.setItem("accessToken", token);
}
function removeAccessToken() {
  sessionStorage.removeItem("accessToken");
}

// Helper para peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
  let token = getAccessToken();

  // ⛔ NUEVO: si el token no está, intenta refrescar manualmente antes de la primera petición
  if (!token) {
    const refreshed = await refreshToken();
    if (refreshed) {
      token = getAccessToken();
    } else {
      console.warn("No hay token, y refresh falló.");
    }
  }

  // Construir headers
  let headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      if (k.toLowerCase() !== "authorization") {
        headers[k] = v;
      }
    }
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Reintento si el token expiró
  if (response.status === 401 || response.status === 403) {
    const refreshed = await refreshToken();
    if (refreshed) {
      token = getAccessToken();
      headers["Authorization"] = `Bearer ${token}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    } else {
      removeAccessToken();
      throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
    }
  }

  return response;
}

// Llama al endpoint /refresh
export async function refreshToken() {
  const resp = await fetch(`${BASE_URL}/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (resp.ok) {
    const data = await resp.json();
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
  }
  return false;
}

export async function registerUser({
  public_key,
  captchaQuestion,
  captchaAnswer,
  username,
}) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      public_key,
      captchaQuestion,
      captchaAnswer,
      username,
    }),
    credentials: "include",
  });

  const text = await response.text();
  if (!response.ok) {
    let errorMessage = "Error en el registro";
    try {
      if (text) {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
    } catch {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  try {
    const data = text ? JSON.parse(text) : null;
    return data;
  } catch {
    return null;
  }
}

//El usuario puede cambiar su nombre
export async function updateUsername(newUsername, public_key) {
  const response = await fetchWithAuth(`${BASE_URL}/username`, {
    method: "PUT",
    body: JSON.stringify({ newUsername, public_key }),
  });

  const text = await response.text();

  if (!response.ok) {
    let errorMessage = "Error al cambiar el nombre";
    try {
      if (text) {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
    } catch {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// Obtener datos usuario
export async function getMe(publicKey) {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/me`, {
      method: "POST",
      body: JSON.stringify({ public_key: publicKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error obteniendo usuario");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getMe:", error);
    throw error;
  }
}

// Obtener posts de un usuario: POST porque enviamos objeto publicKey en body
export async function fetchPosts(publicKey) {
  const pubkey =
    typeof publicKey === "string" ? JSON.parse(publicKey) : publicKey;
  const response = await fetchWithAuth(`${BASE_URL}/postsuser`, {
    method: "POST",
    body: JSON.stringify({ public_key: pubkey }),
  });

  const text = await response.text();

  if (!response.ok) {
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || errorData.message || text);
    } catch {
      throw new Error(text);
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Respuesta del backend no es JSON: " + text);
  }
}

// Obtener usuarios por id
export async function fetchUserById(id) {
  const response = await fetch(`${BASE_URL}/user/${id}`);
  if (response.status === 404) throw new Error("Usuario no encontrado");
  if (!response.ok) throw new Error("No se pudo obtener el usuario");
  return await response.json();
}

// Obtener posts para el Home
export async function fetchHomePosts() {
  const response = await fetchWithAuth(`${BASE_URL}/postshome`, {
    method: "GET",
  });
  if (!response.ok) throw new Error("Error obteniendo posts del home");
  return await response.json();
}

// Crear post: enviamos message, firma base64 DER y clave pÃºblica (objeto)
export async function createPost(message, signature, publicKey) {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/post`, {
      method: "POST",
      body: JSON.stringify({ message, signature, publicKey }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error creando post");
    }

    return await res.json();
  } catch (error) {
    console.error("Error en createPost:", error);
    throw error;
  }
}

//Eliminar post

export async function deletePost(postId, publicKeyJwk) {
  const normalizedKey = normalizeJwk(publicKeyJwk);
  const res = await fetchWithAuth(`${BASE_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_key: JSON.parse(normalizedKey) }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Error eliminando post");
  }
  return await res.json();
}

// Eliminar usuario (usando JWT)
export async function deleteUserAdmin(id, token) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Error eliminando usuario");
  }

  return await res.json();
}

// Eliminar post (usando JWT)
export async function deletePostAdmin(id, token) {
  const res = await fetch(`${BASE_URL}/admin/posts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Error eliminando post");
  }

  return await res.json();
}
