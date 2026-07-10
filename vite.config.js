import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: true },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
