import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// The base path for your GitHub Pages deployment.
// IMPORTANT: Replace <REPO_NAME> with your actual GitHub repository name.
const REPO_NAME = "<REPO_NAME>"; // Make sure to replace this with your actual repo name!

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
}));