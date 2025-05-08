import { addSession, showWindow, Panel, onLoaded } from "./sessions.js";
import { Stack, Group } from "./groups.js";

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

  return {
    panel,
    // Note: you can pass undefined for col and line to centre the alert in the window.
    show(col, line, cols, lines) {
      window.getGroup("alert-top-margin").setSize({ lines: line});
      window.getGroup("alert-vertical").setSize({ lines });
      window.getGroup("alert-left-margin").setSize({ cols: col });
      window.getGroup("alert").setSize({ cols });
      window.addPanel("alert", panel);
    },
    hide() {
      window.removePanel("alert");
    }
  };
}

onLoaded(() => {
  const window = addSession().addWindow();
  const stack = Stack("layers", [
    Group("main-area", "horizontal", [], {}, { z: "basic" })
  ]);

  window.addGroup("window", "top-margin", [], { lines: 1 });
  window.addGroup("window", "centre-bar", [stack]);
  window.addGroup("window", "bottom-margin", [], { lines: 1 });

  const alert = addAlertLayer(window, stack);
  alert.show(undefined, undefined, 30, 10);
  showWindow(window);
});
