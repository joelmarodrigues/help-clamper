/**
 * Svelte Configuration File
 * 
 * This file configures how Svelte compiles your components.
 * 
 * Key concepts:
 * - Preprocessors transform your Svelte code before compilation
 * - vitePreprocess enables modern syntax (TypeScript, PostCSS, etc.)
 * - This config is separate from Vite's configuration
 * 
 * Learn more: https://svelte.dev/docs/svelte-compiler#preprocess
 */

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://help-clamper.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '') // /api/lookup -> /lookup
      }
    }
  }
})