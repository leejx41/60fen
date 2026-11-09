import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The app shell is cached for offline use only in a production build. In dev
// a service worker would serve stale modules and hide HMR changes.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        // Check for a new shell on every launch and when the app returns to
        // the foreground. The next refresh then runs the new controller.
        // update() can reject while offline; it must never become an
        // unhandled rejection.
        const checkForUpdate = (): void => {
          void registration.update().catch(() => {});
        };
        checkForUpdate();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkForUpdate();
          }
        });
      } catch {
        // Registration is best effort; the app still works without it.
      }
    })();
  });
}
