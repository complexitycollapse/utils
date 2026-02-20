import { createWidget } from "./widget.js";
import { createButton } from "./button.js";
import { gridComponent } from "./grid.js";
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
  visual.components.push(paddingComponent("8px 10px"));
  visual.components.push(alignComponent("center", "center"));
  visual.components.push(minSizeComponent(100, 100));
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
  <h1 class="demo-title">Widget Grid Demo</h1>
  <p class="demo-subtitle">Single grid containing 40 composed buttons.</p>
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

const grid = createWidget();
grid.components.push(divComponent());
grid.components.push(gridComponent(700, 100, 12));
grid.components.push(styleComponent({ margin: "0 auto" }));

const palette = [
  { background: "#e2fbe8", border: "#5aa772", text: "#14532d", pressed: "#c8efd4" },
  { background: "#dbeafe", border: "#5b87d9", text: "#1e3a8a", pressed: "#bfdfff" },
  { background: "#fee2e2", border: "#d07171", text: "#7f1d1d", pressed: "#ffcaca" },
  { background: "#fef3c7", border: "#c59c2c", text: "#713f12", pressed: "#fde68a" }
];

for (let i = 1; i <= 40; i += 1) {
  const tone = palette[(i - 1) % palette.length];
  if (!tone) {
    continue;
  }
  const label = `Button ${i}`;
  const button = createButton({
    visualWidget: createButtonVisual(label, tone),
    message: `button-${i}`,
    defaultBackground: tone.background,
    pressedBackground: tone.pressed,
    pressedClassName: "is-pressed"
  });
  grid.addChild(button);
}

root.addChild(grid);
root.show();

if (root.element) {
  row.appendChild(root.element);
}
