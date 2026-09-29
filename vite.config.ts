import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sqlitePlugin } from './server/plugin'

export default defineConfig({
  plugins: [react(), sqlitePlugin()],
  server: {
    host: true,
    port: 5173,
    open: true,
  },
})
