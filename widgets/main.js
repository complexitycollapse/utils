import { createWidget } from "./widget.js";
import { createButton } from "./button.js";
import {
  alignComponent,
  backgroundComponent,
  boxComponent,
  classComponent,
  divComponent,
  minSizeComponent,
  paddingComponent,
  styleComponent,
  textComponent
} from "./components.js";

/**
 * @param {string} label
 * @param {{
 *   background: string,
 *   border: string,
 *   text: string
 * }} colors
 */
function createButtonVisual(label, colors) {
  const visual = createWidget();
  visual.components.push(divComponent());
  visual.components.push(
    textComponent(label, { fontSize: 15, fontWeight: 600, color: colors.text })
  );
  visual.components.push(paddingComponent("10px 16px"));
  visual.components.push(alignComponent("center", "center"));
  visual.components.push(minSizeComponent(140, 42));
  visual.components.push(backgroundComponent({ color: colors.background }));
  visual.components.push(
    boxComponent({
      width: 1,
      style: "solid",
      color: colors.border,
      radius: 10
    })
  );
  visual.components.push(classComponent("widget-btn"));
  return visual;
}

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app container");
}

const shell = document.createElement("section");
shell.className = "demo-shell";
shell.innerHTML = `
  <h1 class="demo-title">Widget Button Demo</h1>
  <p class="demo-subtitle">Buttons are behavior widgets delegating to visual child widgets.</p>
  <div class="button-row" id="button-row"></div>
  <div class="event-log" id="event-log"></div>
`;
app.appendChild(shell);

const row = /** @type {HTMLElement} */ (document.getElementById("button-row"));
const log = /** @type {HTMLElement} */ (document.getElementById("event-log"));
log.textContent = "Click a button.";

const root = createWidget();
root.components.push(divComponent());
root.components.push(styleComponent({ display: "contents" }));
root.components.push({
  receive(_widget, data) {
    log.textContent = `Received: ${String(data)}`;
  }
});

const saveButton = createButton({
  visualWidget: createButtonVisual("Save", {
    background: "#e2fbe8",
    border: "#5aa772",
    text: "#14532d"
  }),
  message: "save",
  defaultBackground: "#e2fbe8",
  pressedBackground: "#c8efd4",
  pressedClassName: "is-pressed"
});

const publishButton = createButton({
  visualWidget: createButtonVisual("Publish", {
    background: "#dbeafe",
    border: "#5b87d9",
    text: "#1e3a8a"
  }),
  message: "publish",
  defaultBackground: "#dbeafe",
  pressedBackground: "#bfdfff",
  pressedClassName: "is-pressed"
});

const deleteButton = createButton({
  visualWidget: createButtonVisual("Delete", {
    background: "#fee2e2",
    border: "#d07171",
    text: "#7f1d1d"
  }),
  message: "delete",
  defaultBackground: "#fee2e2",
  pressedBackground: "#ffcaca",
  pressedClassName: "is-pressed"
});

root.addChild(saveButton);
root.addChild(publishButton);
root.addChild(deleteButton);
root.show();

if (root.element) {
  row.appendChild(root.element);
}
