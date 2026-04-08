import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from 'url'
import path from "path"

// @ts-ignore - Ignore missing types on host machine
const __filename = fileURLToPath(import.meta.url)
// @ts-ignore - Ignore missing types on host machine
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
// @ts-ignore - Silence mode type error on host
export default defineConfig(({ mode }) => {
  // @ts-ignore - Silence process error on host
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true, // Listen on all local IPs
      proxy: {
        '/api': {
          // Force use of 'backend' service name with changeOrigin
          target: env.VITE_BACKEND_URL || 'http://backend:8000',
          changeOrigin: true,
          secure: false,
          // Expert tip: Force IPv4 for Docker networks to avoid ECONNREFUSED on Node 18+
          //@ts-ignore
          lookup: (hostname, options, callback) => {
            // Force IPv4 for both 'backend' and 'localhost'/'127.0.0.1' 
            // to avoid Node 18+ IPv6 resolution issues
            return callback(null, hostname, 4);
          }
        }
      }
    }
  }
})
