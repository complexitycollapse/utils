import { showWindow } from "./sessions.js";
import { Stack, Group } from "./groups.js";
import { Panel } from "./panel.js";

function addMainWindowLayer(window, stack) {
  const defaultWidth = 120;

  stack.add("main-window-layer", [
    Group("main-area", "horizontal", [
      Group("left-margin", "vertical", []),
      Group("main-panel-container", "vertical", [], { cols: defaultWidth }),
      Group("aux-panel-container", "vertical", [], { cols: defaultWidth }),
      Group("right-margin", "vertical", [])
    ])
  ], {}, { z: "basic" });

  const main = window.getGroup("main-panel-container");
  const aux = window.getGroup("aux-panel-container");
  aux.visible = false;
  
  const obj = {
    main,
    aux,
    width: defaultWidth,
    requestedWidth: defaultWidth,
    setWidth(width) {
      obj.requestedWidth = width;
      obj.width = width;
      main.setSize({ cols: width });
      aux.setSize({ cols: width });
    },
    showAux() {
      aux.visible = true;
      window.getGroup("main-area").doLayout();
    },
    hideAux() {
      aux.visible = false;
      window.getGroup("main-area").doLayout();
    },
    setMain(panel) {
      window.addPanel("main-panel-container", panel);
      window.getGroup("main-area").doLayout();
    },
    setAux(panel) {
      window.addPanel("aux-panel-container", panel);
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

export function createLayout(window) {
  const stack = Stack("layers", []);

  window.addGroup("window", "top-margin", [], { lines: 1 });
  window.addGroup("window", "centre-bar", [stack]);
  window.addGroup("window", "bottom-margin", [], { lines: 1 });

  const editors = addMainWindowLayer(window, stack);
  const alert = addAlertLayer(window, stack);
  alert.show(undefined, undefined, 30, 10);
  alert.hide();
  showWindow(window);

  return {
    editors,
    alert
  }
};
