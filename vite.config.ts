import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from 'fs';

// The base path for your GitHub Pages deployment.
// IMPORTANT: Replace <REPO_NAME> with your actual GitHub repository name.
const REPO_NAME = "xerciser"; // Make sure to replace this with your actual repo name!

// Read package.json to get the version
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const appVersion = packageJson.version;

export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Conditionally set the base path: '/' for development, '/<REPO_NAME>/' for build
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  define: {
    // Define global constants that can be accessed in the app
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}));