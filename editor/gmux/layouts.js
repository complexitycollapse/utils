import { addSession, showWindow, Panel, onLoaded } from "./sessions.js";
import { Stack, Group } from "./groups.js";

function addMainWindowLayer(window, stack) {
  const defaultWidth = 120;

  stack.add("main-window-layer", [
    Group("main-area", "horizontal", [
      Group("left-margin", "vertical", []),
      Group("main-window", "vertical", [], { cols: defaultWidth }),
      Group("aux-window", "vertical", [], { cols: defaultWidth }),
      Group("right-margin", "vertical", [])
    ])
  ], {}, { z: "basic" });

  const aux = window.getGroup("aux-window");
  aux.visible = false;
  
  const mainPanel = Panel(), auxPanel = Panel();
  window.addPanel("main-window", mainPanel);
  window.addPanel("aux-window", auxPanel);
  
  const obj = {
    mainPanel,
    auxPanel,
    width: defaultWidth,
    requestedWidth: defaultWidth,
    setWidth(width) {
      obj.requestedWidth = width;
      obj.width = width;
      window.getGroup("main-window").setSize({ cols: width });
      window.getGroup("aux-window").setSize({ cols: width });
    },
    showAux() {
      aux.visible = true;
      window.getGroup("main-area").doLayout();
    },
    hideAux() {
      aux.visible = false;
      window.getGroup("main-area").doLayout();
    }
  };

  obj.setWidth(defaultWidth);
  return obj;
}

function addAlertLayer(window, stack) {
  stack.add("alert-layer", [
    Group("alerts", "vertical", [
      Group("alert-top-margin", "horizontal", []),
      Group("alert-vertical", "horizontal", [
        Group("alert-left-margin", "vertical", []),
        Group("alert", "vertical", []),
        Group("alert-right-margin", "vertical", []),
      ]),
      Group("alert-bottom-margin", "horizontal", []),
    ])
  ], {}, { z: "top" });
  
  const panel = Panel();
  window.addPanel("alert", panel);

  const obj = {
    panel,
    // Note: you can pass undefined for col and line to centre the alert in the window.
    show(col, line, cols, lines) {
      window.getGroup("alert").visible = true;
      window.getGroup("alert-top-margin").setSize({ lines: line});
      window.getGroup("alert-vertical").setSize({ lines });
      window.getGroup("alert-left-margin").setSize({ cols: col });
      window.getGroup("alert").setSize({ cols });
    },
    hide() {
      window.getGroup("alert").visible = false;
      window.getGroup("alert").doLayout();
    }
  };

  obj.hide();
  return obj;
}

onLoaded(() => {
  const window = addSession().addWindow();
  const stack = Stack("layers", []);

  window.addGroup("window", "top-margin", [], { lines: 1 });
  window.addGroup("window", "centre-bar", [stack]);
  window.addGroup("window", "bottom-margin", [], { lines: 1 });

  const main = addMainWindowLayer(window, stack);
  const alert = addAlertLayer(window, stack);
  alert.show(undefined, undefined, 30, 10);
  alert.hide();
  showWindow(window);

  // Test some text
  const line = main.mainPanel.addLine(0);
  line.textContent = "Hello, world!";
});
