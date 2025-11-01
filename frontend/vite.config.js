/**
 * Vite Configuration File
 * 
 * Vite is a modern build tool that provides:
 * - Fast Hot Module Replacement (HMR) during development
 * - Optimized production builds
 * - Built-in dev server with proxy capabilities
 * 
 * Learn more: https://vitejs.dev/config/
 */

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  /**
   * Plugins
   * 
   * The Svelte plugin enables Vite to:
   * - Compile .svelte files to JavaScript
   * - Enable hot module replacement for Svelte components
   * - Optimize Svelte code for production
   */
  plugins: [svelte()],

  /**
   * Development Server Configuration
   */
  server: {
    /**
     * Proxy Configuration
     * 
     * During development, the frontend runs on localhost:5173
     * and the backend API runs on localhost:8000.
     * 
     * Without a proxy, the browser would block requests due to CORS
     * (Cross-Origin Resource Sharing) restrictions.
     * 
     * The proxy forwards requests from the frontend to the backend:
     * - Frontend makes request to: http://localhost:5173/lookup
     * - Proxy forwards it to: http://localhost:8000/lookup
     * - Backend processes and returns response
     * - Proxy sends response back to frontend
     * 
     * This eliminates CORS issues during development.
     * In production, both frontend and backend have their own domains
     * and CORS is handled by the backend's ALLOWED_ORIGINS setting.
     */
    proxy: {
      /**
       * Lookup endpoint proxy
       * Any request to /lookup is forwarded to the backend API
       */
      '/lookup': {
        target: 'http://localhost:8000',  // Backend API address
        changeOrigin: true,                // Changes the origin header to match target
      },

      /**
       * Health check endpoint proxy
       * Used for monitoring backend availability
       */
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})