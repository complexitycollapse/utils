import { ComponentSpec, childComponentSpec, createWidget } from "./widget.js";
import { createButton } from "./button.js";
import { gridComponent } from "./grid.js";
import { listComponent } from "./list.js";
import {
  alignComponent,
  backgroundComponent,
  boxComponent,
  classComponent,
  divComponent,
  paddingComponent,
  styleComponent,
  textComponent
} from "./components.js";

const GRID_WIDTH = 700;
const GRID_WIDGET_WIDTH = 130;
const GRID_WIDGET_HEIGHT = 80;
const GRID_SPACING_X = 18;
const GRID_SPACING_Y = 10;

/**
 * @param {string} label
 * @param {{
 *   background: string,
 *   border: string,
 *   text: string
 * }} colors
 */
function createButtonVisualComponentSpec(label, colors) {
  return divComponent()
    .with(textComponent(label, { fontSize: 15, fontWeight: 600, color: colors.text }))
    .with(paddingComponent("8px 10px"))
    .with(alignComponent("center", "center"))
    .with(backgroundComponent({ color: colors.background }))
    .with(styleComponent({ "--glow-color": colors.border }))
    .with(
      boxComponent({
        width: 1,
        style: "solid",
        color: colors.border,
        radius: 10
      })
    )
    .with(classComponent("widget-btn"));
}

/**
 * @param {string} text
 * @param {import("./components.js").StyleMap} styles
 */
function createTextWidgetComponentSpec(text, styles) {
  return divComponent()
    .with(textComponent(text))
    .with(styleComponent(styles));
}

const appElement = /** @type {HTMLElement | null} */ (document.getElementById("app"));
if (!appElement) {
  throw new Error("Missing #app container");
}
const app = /** @type {HTMLElement} */ (appElement);

const titleComponentSpec = createTextWidgetComponentSpec("Widget Grid Demo", {
  margin: 0,
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "#b8fbff",
  textShadow: "0 0 10px rgba(71, 255, 248, 0.5)"
});

const subtitleComponentSpec = createTextWidgetComponentSpec(
  "Single grid containing 40 composed buttons.",
  { margin: 0, color: "rgba(153, 236, 255, 0.8)" }
);

let gridComponentSpec = divComponent()
  .with(
    gridComponent(
      GRID_WIDTH,
      GRID_WIDGET_WIDTH,
      GRID_WIDGET_HEIGHT,
      GRID_SPACING_X,
      GRID_SPACING_Y
    )
  )
  .with(styleComponent({ margin: "0 auto" }));

const logComponentSpec = divComponent()
  .with(styleComponent({
    border: "1px solid rgba(0, 255, 245, 0.38)",
    background: "rgba(8, 28, 36, 0.55)",
    borderRadius: "10px",
    padding: "10px 12px",
    minHeight: "22px",
    color: "#c6f9ff",
    boxShadow: "inset 0 0 16px rgba(0, 255, 245, 0.12)"
  }))
  .with(textComponent("Click a button."))
  .with(
    ComponentSpec(() => ({
      receive(widget, data) {
        if (!widget.element) {
          return;
        }
        widget.element.textContent = `Received: ${String(data)}`;
      }
    }))
  );

const palette = [
  {
    background: "rgba(0, 255, 245, 0.19)",
    border: "rgba(75, 255, 249, 0.8)",
    text: "#bffcff",
    pressed: "rgba(0, 255, 245, 0.33)"
  },
  {
    background: "rgba(94, 255, 115, 0.17)",
    border: "rgba(113, 255, 132, 0.82)",
    text: "#d4ffd9",
    pressed: "rgba(94, 255, 115, 0.31)"
  },
  {
    background: "rgba(255, 215, 70, 0.17)",
    border: "rgba(255, 224, 120, 0.82)",
    text: "#fff7d1",
    pressed: "rgba(255, 215, 70, 0.31)"
  },
  {
    background: "rgba(255, 95, 95, 0.17)",
    border: "rgba(255, 140, 140, 0.82)",
    text: "#ffd9d9",
    pressed: "rgba(255, 95, 95, 0.31)"
  }
];

for (let i = 1; i <= 40; i += 1) {
  const tone = palette[(i - 1) % palette.length];
  if (!tone) {
    continue;
  }

  const label = `Button ${i}`;
  const buttonSpec = createButton({
    visualComponentSpec: createButtonVisualComponentSpec(label, tone),
    message: `button-${i}`,
    defaultBackground: tone.background,
    pressedBackground: tone.pressed,
    pressedClassName: "is-pressed"
  });

  gridComponentSpec = gridComponentSpec.with(childComponentSpec(buttonSpec));
}

const listComponentSpec = ComponentSpec(() => ({
  mount(widget) {
    if (widget.element) {
      return;
    }
    widget.element = document.createElement("div");
  }
}))
  .with(listComponent("vertical"))
  .with(styleComponent({ gap: "14px" }))
  .with(childComponentSpec(titleComponentSpec))
  .with(childComponentSpec(subtitleComponentSpec))
  .with(childComponentSpec(gridComponentSpec))
  .with(childComponentSpec(logComponentSpec));

const boxComponentSpec = divComponent()
  .with(classComponent("demo-shell"))
  .with(
    ComponentSpec(() => ({
      receive(widget, data) {
        widget.sendDown(data);
      }
    }))
  )
  .with(childComponentSpec(listComponentSpec));

async function run() {
  const boxWidget = createWidget(boxComponentSpec);
  await boxWidget.create();
  await boxWidget.show();

  if (boxWidget.element) {
    app.appendChild(boxWidget.element);
  }
}

void run();
