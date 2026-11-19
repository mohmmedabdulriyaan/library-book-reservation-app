// Desktop app (Windows .exe) made with Electron.
// It opens the Library web app in its own window, like a normal program.
//
// Which address it opens is set in config.json:
//   "http://localhost:5000"           -> the backend running on this laptop
//   "https://your-app.onrender.com"   -> the deployed website (works anywhere)
const path = require("path");
const { app, BrowserWindow, shell, ipcMain, Menu } = require("electron");
const config = require("./config.json");

const APP_URL = (process.env.APP_URL || config.appUrl).replace(/\/$/, "");
let win = null;
let retryTimer = null;

const isAppLink = (url) => url.startsWith(APP_URL);

function loadApp() {
  clearTimeout(retryTimer);
  win.loadURL(APP_URL);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    title: "College Library",
    icon: path.join(__dirname, "build", "icon.png"),
    backgroundColor: "#0b0c12", // same dark colour as the app, no white flash
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Server not running / no internet: show a friendly page and try again by itself
  win.webContents.on("did-fail-load", (event, code, description, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return; // -3 = load was cancelled, not an error
    win.loadFile(path.join(__dirname, "offline.html"), { query: { url: APP_URL } });
    retryTimer = setTimeout(loadApp, 8000);
  });

  // Links that open a new tab (e.g. PDFs in the E-Library):
  // our own pages open in a new app window, other websites open in the browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppLink(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: { width: 1000, height: 800, autoHideMenuBar: true, backgroundColor: "#0b0c12" },
      };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Never navigate the main window away to another website
  win.webContents.on("will-navigate", (event, url) => {
    if (!isAppLink(url) && !url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  loadApp();
}

ipcMain.on("retry", loadApp);

// Only one copy of the app at a time
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // Small menu: reload, zoom, full screen (Alt key shows it)
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "View",
          submenu: [
            { role: "reload" },
            { type: "separator" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { role: "resetZoom" },
            { type: "separator" },
            { role: "togglefullscreen" },
          ],
        },
      ])
    );
    createWindow();
  });

  app.on("window-all-closed", () => app.quit());
}
