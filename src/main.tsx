import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use import.meta.env.BASE_URL to get the correct base path for deployment
    const serviceWorkerUrl = `${import.meta.env.BASE_URL}service-worker.js`;
    navigator.serviceWorker.register(serviceWorkerUrl)
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });

    // Request persistent storage for the PWA
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(persistent => {
        if (persistent) {
          console.log("Storage will not be cleared except by user action.");
        } else {
          console.log("Storage may be cleared by the browser under storage pressure.");
        }
      }).catch(error => {
        console.error("Failed to request persistent storage:", error);
      });
    }
  });
}