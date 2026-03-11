import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        notes: "notes.html",
        gallery: "gallery.html",
        projects: "projects.html",
        personal: "personal.html",
        message: "message.html",
      },
    },
  },
});
