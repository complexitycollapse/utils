import * as chokidar from "chokidar";
import { app } from "electron";

const browserWindows = [];
let watcher, watchRoot, watching;

export function watch(watchRootArg) {
  watchRoot = watchRootArg;
  watching = true;
  resumeWatch(); 
  
  app.on("browser-window-created", (e, bw) => {
    browserWindows.push(bw)
  
    // Remove closed windows from list of maintained items
    bw.on("closed", function () {
      const i = browserWindows.indexOf(bw) // Must use current index
      browserWindows.splice(i, 1)
    })
  });
}

export function suspendWatch() {
  if (!watching) return;
  watcher.close()
  watcher = undefined;
}

export function resumeWatch() {
  if (!watching) return;
  watcher = chokidar.watch(watchRoot, Object.assign({ ignored: [/node_modules|[/\\]\./] }, {}));
  watcher.on("change", hotReload);
}

function hotReload() {
  browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache());
}
