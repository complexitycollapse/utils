import { charWidth, lineHeight } from "./sessions.js";

export function Panel() {
  const panel = {
    element: document.createElement("div"),
    linesElement: document.createElement("div"),
    cursorOverlay: document.createElement("div"),
    textEntry: document.createElement("textarea"),
    doLayout() {
      positionPanelElement(panel);
    },
    addLine(position) {
      const line = document.createElement("div");
      line.className = "gline";
      const prev = panel.linesElement.childNodes[position];
      if (prev) {
        prev.insertAdjacentElement("afterend", line);
      } else {
        panel.linesElement.appendChild(line);
      }
        return line;
    },
    deleteLine(position) {
      const line = panel.linesElement.childNodes[position];
      if (line) {
        panel.linesElement.removeChild(line);
      }
    },
    getLine(position) {
      return panel.linesElement.childNodes[position];
    }
  };

  const contents = document.createElement("div");
  contents.className = "gpanelContents";
  panel.element.className = "gpanel";
  panel.linesElement.className = "glines";
  panel.cursorOverlay.className = "gcursorOverlay";
  panel.textEntry.className = "gtextEntry";
  contents.append(panel.linesElement);
  contents.append(panel.cursorOverlay);
  panel.element.append(panel.textEntry);
  panel.element.append(contents);

  return panel;
}

function positionPanelElement(panel) {
  if (!panel.visible) {
    panel.element.style.display = "none";
    return;
  }
  panel.element.style.display = "block";
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
