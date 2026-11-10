import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative stier, så appen virker under /samling/ på GitHub Pages
  base: './',
  plugins: [react(), tailwindcss()],
})
