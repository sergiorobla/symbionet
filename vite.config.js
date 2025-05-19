import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,       // ✅ Activa HTTPS
    host: "0.0.0.0",   // ✅ Accesible desde IP local
    port: 3000,
  },
});
