import { createWidget } from "./widget.js";
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
function createButtonVisual(label, colors) {
  const visual = createWidget();
  visual.components.push(divComponent());
  visual.components.push(
    textComponent(label, { fontSize: 15, fontWeight: 600, color: colors.text })
  );
  visual.components.push(paddingComponent("8px 10px"));
  visual.components.push(alignComponent("center", "center"));
  visual.components.push(backgroundComponent({ color: colors.background }));
  visual.components.push(styleComponent({ "--glow-color": colors.border }));
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

/**
 * @param {string} text
 * @param {import("./components.js").StyleMap} styles
 */
function createTextWidget(text, styles) {
  const widget = createWidget();
  widget.components.push(divComponent());
  widget.components.push(textComponent(text));
  widget.components.push(styleComponent(styles));
  return widget;
}

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app container");
}

const boxWidget = createWidget();
boxWidget.components.push(divComponent());
boxWidget.components.push(classComponent("demo-shell"));

const listWidget = createWidget();
listWidget.components.push({
  beforeShow(widget) {
    widget.element = document.createElement("div");
  }
});
listWidget.components.push(listComponent("vertical"));
listWidget.components.push(styleComponent({ gap: "14px" }));

const titleWidget = createTextWidget("Widget Grid Demo", {
  margin: 0,
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "#b8fbff",
  textShadow: "0 0 10px rgba(71, 255, 248, 0.5)"
});

const subtitleWidget = createTextWidget(
  "Single grid containing 40 composed buttons.",
  { margin: 0, color: "rgba(153, 236, 255, 0.8)" }
);

const grid = createWidget();
grid.components.push(divComponent());
grid.components.push(
  gridComponent(
    GRID_WIDTH,
    GRID_WIDGET_WIDTH,
    GRID_WIDGET_HEIGHT,
    GRID_SPACING_X,
    GRID_SPACING_Y
  )
);
grid.components.push(styleComponent({ margin: "0 auto" }));

const logWidget = createWidget();
logWidget.components.push(divComponent());
logWidget.components.push(styleComponent({
  border: "1px solid rgba(0, 255, 245, 0.38)",
  background: "rgba(8, 28, 36, 0.55)",
  borderRadius: "10px",
  padding: "10px 12px",
  minHeight: "22px",
  color: "#c6f9ff",
  boxShadow: "inset 0 0 16px rgba(0, 255, 245, 0.12)"
}));
logWidget.components.push(textComponent("Click a button."));

boxWidget.components.push({
  receive(_widget, data) {
    if (!logWidget.element) {
      return;
    }
    logWidget.element.textContent = `Received: ${String(data)}`;
  }
});

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
  const button = createButton({
    visualWidget: createButtonVisual(label, tone),
    message: `button-${i}`,
    defaultBackground: tone.background,
    pressedBackground: tone.pressed,
    pressedClassName: "is-pressed"
  });
  grid.addChild(button);
}

listWidget.addChild(titleWidget);
listWidget.addChild(subtitleWidget);
listWidget.addChild(grid);
listWidget.addChild(logWidget);
boxWidget.addChild(listWidget);
boxWidget.create();
boxWidget.show();

if (boxWidget.element) {
  app.appendChild(boxWidget.element);
}
