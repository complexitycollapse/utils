import { app, BrowserWindow } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fileWatcher from "./file-watcher.js";

const env = process.env.NODE_ENV || "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If development environment 
if (env === "development") {
  fileWatcher.watch(path.join(__dirname, ".."));
}


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: true,
      contextIsolation: true
    }
  });

  // win.maximize();
  // win.show();
  win.loadFile("window/index.html");

  // Listen for console events and open DevTools on error
  win.webContents.on("console-message", (event, level, message, line, sourceId) => {
    if (level >= 2) { // 2 is "warn", 3 is "error"
        win.webContents.openDevTools({ mode: "bottom" });
    }
  });
}

app.whenReady().then(async () => {
  await import("./api.js");
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
