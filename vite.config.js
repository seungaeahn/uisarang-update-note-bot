import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // 같은 네트워크의 다른 PC에서 접속 허용
    proxy: {
      '/api/redmine': {
        target: 'https://redmine.ubware.com',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api\/redmine/, ''),
      },
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/api\/claude/, ''),
      },
    }
  }
})
