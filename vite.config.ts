import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Le site est servi depuis https://guillaumegth.github.io/bsport-system-design/,
  // pas depuis la racine du domaine.
  base: '/bsport-system-design/',
  plugins: [react()],
})
