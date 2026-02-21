import { ComponentSpec, childComponentSpec, createWidget } from "../declarative/widget.js";
import { divComponent, styleComponent } from "../declarative/components.js";
import {
  createHudColourPicker,
  createHudList,
  createHudModalDialog,
  createHudTextButton
} from "./widgets.js";

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

const rootSpec = divComponent()
  .with(styleComponent({
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "24px",
    position: "relative"
  }))
  .with(
    ComponentSpec(() => {
      /** @type {import("../declarative/types.js").Widget | undefined} */
      let dialogChild = undefined;

      return {
        async receive(widget, data) {
          if (dialogChild) {
            const currentDialog = dialogChild;
            dialogChild = undefined;
            await widget.removeChild(currentDialog);
            return;
          }

          switch (data) {
            case "Dialog":
              dialogChild = widget.addChild(
                createHudModalDialog(
                  "Open Dialog",
                  "This is a demo HUD modal dialog.\nChoose one of the actions below.",
                  ["Confirm", "Remind Me Later", "Cancel"]
                )
              );
              return;
            case "Colour Picker":
              dialogChild = widget.addChild(
                createHudColourPicker({
                  title: "Colour Picker",
                  columns: 32,
                  rows: 16,
                  swatchSize: 28,
                  spacing: 8
                })
              );
              return;
            default:
              return;
          }
        }
      };
    })
  )
  .with(childComponentSpec(actionsSpec));

async function run() {
  const rootWidget = createWidget(rootSpec);
  await rootWidget.create();
  await rootWidget.show();

  if (rootWidget.element) {
    app.appendChild(rootWidget.element);
  }
}

void run();
