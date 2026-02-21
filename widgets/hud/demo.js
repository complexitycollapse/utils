import { ComponentSpec, childComponentSpec, createWidget } from "../declarative/widget.js";
import { divComponent, styleComponent } from "../declarative/components.js";
import { createHudList, createHudModalDialog, createHudTextButton } from "./widgets.js";

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
        receive(widget, data) {
          if (dialogChild) {
            widget.removeChild(dialogChild);
            dialogChild = undefined;
            return;
          }

          if (data !== "Dialog") {
            return;
          }

          dialogChild = widget.addChild(
            createHudModalDialog(
              "Open Dialog",
              "This is a demo HUD modal dialog.\nChoose one of the actions below.",
              ["Confirm", "Remind Me Later", "Cancel"]
            )
          );
        }
      };
    })
  )
  .with(childComponentSpec(actionsSpec));

const rootWidget = createWidget(rootSpec);
rootWidget.create();
rootWidget.show();

if (rootWidget.element) {
  app.appendChild(rootWidget.element);
}
