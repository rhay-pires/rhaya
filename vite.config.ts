import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Site no Pages: https://rhay-pires.github.io/rhaya/docs/
// (a raiz do repo redireciona para /docs enquanto o Source for "branch main")
export default defineConfig(({ command }) => ({
  // Build local/docs: paths relativos (funciona no Live Server / Go Live)
  // Actions sobrescreve com --base /rhaya/ no workflow
  base: command === 'build' ? './' : '/',
  resolve: {
    // Pacote exporta entry Vue; usamos só o core JS puro (svgBanco / listarBancos)
    alias: {
      '@edusites/bancos-brasil': path.resolve(
        import.meta.dirname,
        'node_modules/@edusites/bancos-brasil/src/core.js',
      ),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dev-html-alias',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url?.startsWith('/index.html')) {
            req.url = '/dev.html'
          }
          next()
        })
      },
    },
  ],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, 'dev.html'),
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: (info) =>
          info.name?.endsWith('.css') ? 'assets/app.css' : 'assets/[name][extname]',
      },
    },
  },
}))
