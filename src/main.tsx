import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CONFIG } from "lib/config";
import { PortalApp } from "features/portal/PortalApp";
import "lib/firebase";

const root = createRoot(document.getElementById("root")!);

// The complete Sunflower Land client remains the default application.
// Portal mode is retained for the upstream embedded-minigame experience.
root.render(CONFIG.PORTAL_APP ? <PortalApp /> : <App />);
