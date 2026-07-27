const { contextBridge } = require("electron");

// A minimal, safe bridge. Extended later for offline storage, printing, etc.
contextBridge.exposeInMainWorld("camhealth", {
  appVersion: "1.0.0",
  platform: process.platform,
});
