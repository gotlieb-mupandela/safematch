import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.filter((key) => key.startsWith("safematch-")).forEach((key) => caches.delete(key));
        });
      }

      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // The prototype still works without the service worker.
    });
  });
}
