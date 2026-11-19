// Runs before the app page loads. Lets the "offline" page ask the main
// process to try again. Nothing else from Node.js is given to the web page.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  retry: () => ipcRenderer.send("retry"),
});
