import { Group, Stack } from "./groups.js";

let gmuxContainer = document.getElementById("gmux");
const sessions = [];
let currentWindow;
let viewportCols, viewportLines, charWidth, lineHeight;

// There are sessions, which contain windows, which contain groups.
// A group can contain a panel or other groups. Groups lay out their
// contents either horizontally or vertically. A group can specify
// its dimensions or max/min dimensions, or nothing at all. The parent
// group will distribute space within the group among its children
// subject to these constraints.

// TODO: stacks of groups, each with a different z-order, that allow
// panels to be overlaid on other panels without disturbing their
// layout.

// TODO: keyboard input. This will provide commands to create new
// windows and add content to them.

function addSession() {
  const session = {
    windows: [],
    addWindow(group) {
      const win = addWindow(session, group);
      return win;
    },
    removeWindow(win) {
      const index = this.windows.indexOf(win);
      if (index !== -1) {
        this.windows.splice(index, 1);
        gmuxContainer.removeChild(win.element);
      }
    }
  };
  sessions.push(session);
  return session;
}

function addWindow(session, group) {
  const window = {
    group,
    addGroup(parentName, name, members, sizing = {}) {
      window.group.get(parentName).add(name, members, sizing);
      window.group.doLayout();
    },
    getGroup(name) {
      return group.get(name);
    },
    addPanel(groupName, panel) {
      const group = window.group.get(groupName);
      if (group) {
        group.setPanel(panel);
        gmuxContainer.appendChild(panel.element);
      }
    },
    removePanel(groupName) {
      const group = window.group.get(groupName);
      if (group) {
        group.removePanel();
        gmuxContainer.removeChild(group.panel.element);
      }
    }
  };
  session.windows.push(window);
  return window;
}

function Panel() {
  const panel = {};
  panel.element = document.createElement("div");
  panel.element.className = "gpanel gtext";
  panel.setDimensions = function (group) {
    panel.col = group.col;
    panel.line = group.line;
    panel.cols = group.cols;
    panel.lines = group.lines;
    panel.z = group.z;
    positionPanelElement(panel);
  };
  return panel;
}

function positionPanelElement(panel) {
  panel.element.style.width = `${panel.cols * charWidth}px`;
  panel.element.style.height = `${panel.lines * lineHeight}px`;
  panel.element.style.left = `${panel.col * charWidth}px`;
  panel.element.style.top = `${panel.line * lineHeight}px`;
  panel.element.zOrder = getZOrder(panel.z);
}

function getZOrder(z) {
  switch (z) {
    case "basic":
      return 1000;
    case "forward":
      return 2000;
    case "back":
      return 0;
    case "top":
      return 4000;
  }
}

function measureCharSize() {
  const probe = document.createElement("span");
  probe.className = "gmeasure gtext";
  probe.textContent = "M";
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  document.body.removeChild(probe);
  charWidth = rect.width;
  lineHeight = rect.height;
}

function updateViewportSize() {
  viewportCols = Math.floor(window.innerWidth / charWidth);
  viewportLines = Math.floor(window.innerHeight / lineHeight);
}

window.addEventListener("resize", () => {
  updateViewportSize();
  currentWindow.group.cols = viewportCols;
  currentWindow.group.lines = viewportLines;
  currentWindow.group.doLayout();
});
window.addEventListener("DOMContentLoaded", () => {
  measureCharSize();
  updateViewportSize();
  const width = 80;
  const windowSizing = {
    col: 0,
    line: 0,
    cols: viewportCols,
    lines: viewportLines
  };
  currentWindow = addSession().addWindow(
    Group("window", "vertical", [], windowSizing, windowSizing));

  currentWindow.addGroup("window", "top-margin", [], { lines: 1 });
  currentWindow.addGroup("window", "centre-bar", [ Stack("focus-plane", [
    Group("main-area", "horizontal", [], {}, { z: "basic" }),
    Group("alerts", "horizontal", [
      Group("alert-top-margin", "vertical", []),
      Group("alert-vertical", "vertical", [
        Group("alert-left-margin", "horizontal", []),
        Group("alert", "horizontal", []),
        Group("alert-right-margin", "horizontal", []),
      ]),
      Group("alert-bottom-margin", "vertical", []),
    ], {}, { z: "top" })
  ])]);
  currentWindow.addGroup("main-area", "left-margin", []);
  currentWindow.addGroup("main-area", "focus", [], { cols: width });
  currentWindow.addGroup("main-area", "focus2", [], { cols: width });
  currentWindow.addGroup("main-area", "right-margin", []);
  currentWindow.addGroup("window", "bottom-margin", [], { lines: 1 });
  currentWindow.addPanel("focus", Panel());
  currentWindow.addPanel("focus2", Panel());
  currentWindow.getGroup("alert-vertical").setSize({lines: 5});
  currentWindow.getGroup("alert-top-margin").setSize({lines: 10});
  currentWindow.getGroup("alert").setSize({cols: 5});
  currentWindow.addPanel("alert", Panel());
});
