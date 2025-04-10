let gmuxContainer = document.getElementById("gmux");
const windows = [];
let viewportCols, viewportLines, charWidth, lineHeight;
const zBasic = 1000, zForward = 2000, zBack = 3000, zTop = 4000;

function addWindow() {
  const window = {
    panels: [], 
    addPanel(props) {
      const panel = { ...props };
      panel.z = props.z || zBasic;
      panel.element = document.createElement("div");
      panel.element.className = "gpanel";
      panel.element.style.top = "50px";
      panel.element.style.left = "50px";
      panel.element.style.zIndex = panel.z;
      gmuxContainer.appendChild(panel.element);
      if (panel.cols && panel.lines) {
        sizePanel(panel, panel.cols, panel.lines);
      }
      if (panel.col && panel.line) {
        positionPanel(panel, panel.col, panel.line);
      }
      window.panels.push(panel);
      return panel;
    }
  };
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

window.addEventListener("resize", updateViewportSize);
window.addEventListener("DOMContentLoaded", () => {
  measureCharSize();
  updateViewportSize();
  const width = 80;
  addWindow().addPanel({
    col: (viewportCols / 2) - (width / 2),
    line: 1,
    cols: width,
    lines: viewportLines - 2,
    text: "Hello, world!",
  });
});

function sizePanel(panel, cols, lines) {
  panel.cols = cols;
  panel.lines = lines;
  panel.element.style.width = `${cols * charWidth}px`;
  panel.element.style.height = `${lines * lineHeight}px`;
}

function positionPanel(panel, col, line) {
  panel.col = col;
  panel.line = line;
  panel.element.style.left = `${col * charWidth}px`;
  panel.element.style.top = `${line * lineHeight}px`;
}