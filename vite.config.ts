import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Repo: github.com/rhay-pires/rhaya → https://rhay-pires.github.io/rhaya/
  base: '/rhaya/',
  plugins: [react(), tailwindcss()],
})
