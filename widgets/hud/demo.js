import { childComponentSpec, createWidget } from "../declarative/widget.js";
import { createHudList, createHudTextButton } from "./widgets.js";

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app container");
}

const labels = ["Dialog", "Colour Picker", "Modal"];

let actionsSpec = createHudList({
  orientation: "horizontal",
  gap: "12px",
  padding: "14px"
});

for (const label of labels) {
  actionsSpec = actionsSpec.with(childComponentSpec(createHudTextButton(label)));
}

const actionsWidget = createWidget(actionsSpec);
actionsWidget.create();
actionsWidget.show();

if (actionsWidget.element) {
  app.appendChild(actionsWidget.element);
}
