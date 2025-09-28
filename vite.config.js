import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "public/background.js"),
        content: resolve(__dirname, "public/content.js"),
      },
      output: {
        dir: "dist",
      },
    },
  },
})
