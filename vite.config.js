import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/thumbnail': 'http://localhost:3000',
      '/process': 'http://localhost:3000',
      '/results': 'http://localhost:3000',
      // /videos clashes with the React Router page route, so we only proxy
      // requests for actual video FILES (anything with an extension like .mp4).
      // Bare "/videos" falls through to the React app like normal.
      '/videos': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (!/\.\w+$/.test(req.url)) {
            return req.url
          }
        },
      },
    },
  },
})
