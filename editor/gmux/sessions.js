import { Group } from "./groups.js";

let gmuxContainer = document.getElementById("gmux");
const sessions = [], editors = [];
let currentWindow;
let viewportCols, viewportLines;
export let charWidth, lineHeight;

// There are sessions, which contain windows, which contain groups.
// A group can contain a panel or other groups. Groups lay out their
// contents either horizontally, vertically or stacked. A group can
// specify its dimensions or max/min dimensions, or nothing at all.
// The parent group will distribute space within the group among its
// children subject to these constraints.

// Panels are not owned by windows or groups but by editors, and an
// editor's panel can be migrated between groups and windows.

// TODO: keyboard input. This will provide commands to create new
// windows and add content to them.

export function addSession() {
  const session = {
    windows: [],
    addWindow() {
      const windowSizing = {
        col: 0,
        line: 0,
        cols: viewportCols,
        lines: viewportLines
      };
      const win = addWindow(session, Group("window", "vertical", [], windowSizing, windowSizing));
      return win;
    },
    removeWindow(win) {
      const index = this.windows.indexOf(win);
      if (index !== -1) {
        this.windows.splice(index, 1);
      }
    },
    addEditor(editor) {
      editors.push(editor);
    }
  };
  sessions.push(session);
  return session;
}

export function showWindow(window) {
  currentWindow = window;
  currentWindow.group.cols = viewportCols;
  currentWindow.group.lines = viewportLines;
  currentWindow.group.doLayout();
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
  if (currentWindow) {
    showWindow(currentWindow);
  }
});

export function init() {
  measureCharSize();
  updateViewportSize();
}
