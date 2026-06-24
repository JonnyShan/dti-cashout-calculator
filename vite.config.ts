import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
// `base` is set to the repo name so a production build works as a GitHub Pages
// project site (jonnyshan.github.io/dti-cashout-calculator/); dev stays at '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/dti-cashout-calculator/' : '/',
  plugins: [react(), tailwindcss()],
}));
