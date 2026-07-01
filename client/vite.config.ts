import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at the origin root. The same-origin matchmake proxy lives at /_mm
// (see scripts/dev-static-server.mjs and the README), so BASE_URL stays '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
