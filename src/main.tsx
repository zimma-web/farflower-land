import React from "react";

if (typeof (Number.prototype as any).toNumber !== "function") {
  (Number.prototype as any).toNumber = function () {
    return Number(this) || 0;
  };
}
if (typeof (String.prototype as any).toNumber !== "function") {
  (String.prototype as any).toNumber = function () {
    return Number(this) || 0;
  };
}
if (typeof (Object.prototype as any).toNumber !== "function") {
  (Object.prototype as any).toNumber = function () {
    return Number(this.valueOf ? this.valueOf() : this) || 0;
  };
}
if (!Object.prototype[Symbol.iterator]) {
  Object.defineProperty(Object.prototype, Symbol.iterator, {
    value: function* () {
      yield* Object.values(this);
    },
    writable: true,
    configurable: true,
  });
}
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CONFIG } from "lib/config";
import { PortalApp } from "features/portal/PortalApp";
import "lib/firebase";

const root = createRoot(document.getElementById("root")!);

// The complete Sunflower Land client remains the default application.
// Portal mode is retained for the upstream embedded-minigame experience.
root.render(CONFIG.PORTAL_APP ? <PortalApp /> : <App />);
