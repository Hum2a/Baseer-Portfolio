import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SiteSettingsProvider } from "./lib/site-settings";
import { ThemeProvider } from "./themes/ThemeProvider";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <SiteSettingsProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SiteSettingsProvider>
  </StrictMode>,
);
