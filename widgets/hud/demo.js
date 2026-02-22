import {
  ComponentSpec,
  childComponentSpec,
  childComponentSpecWithOptions,
  createWidget
} from "../declarative/widget.js";
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

/** @type {[string, string, string]} */
const labels = ["Dialog", "Colour Picker", "Modal"];
const DIALOG_BUTTON_CHANNEL = Symbol("dialogButton");
const COLOUR_PICKER_BUTTON_CHANNEL = Symbol("colourPickerButton");
const MODAL_BUTTON_CHANNEL = Symbol("modalButton");
const COLOUR_TARGET_CAPABILITY = Symbol("colourTarget");

/**
 * @param {unknown} data
 * @returns {data is import("../declarative/types.js").ChildChannelMessage}
 */
function isChildChannelMessage(data) {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const value = /** @type {Record<string, unknown>} */ (data);
  return "channel" in value && "payload" in value && "child" in value;
}

/**
 * @param {unknown} data
 * @returns {data is string}
 */
function isColourMessage(data) {
  return typeof data === "string" && data.startsWith("hsl(");
}

/**
 * @typedef {{
 *   setColor: (widget: import("../declarative/types.js").Widget, color: string) => void,
 *   getColor: (widget: import("../declarative/types.js").Widget) => string
 * }} ColourTargetCapability
 */

/**
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
function colourTargetCapabilityComponent() {
  return ComponentSpec(() => {
    let color = "transparent";

    /**
     * @param {import("../declarative/types.js").Widget} widget
     */
    function apply(widget) {
      if (!widget.element) {
        return;
      }
      widget.element.style.backgroundColor = color;
    }

    /** @type {ColourTargetCapability} */
    const capability = {
      setColor(widget, nextColor) {
        color = nextColor;
        apply(widget);
      },
      getColor(_widget) {
        return color;
      }
    };

    return {
      create(widget) {
        widget.provideCapability(COLOUR_TARGET_CAPABILITY, capability);
      },
      mount(widget) {
        apply(widget);
      },
      destroy(widget) {
        widget.revokeCapability(COLOUR_TARGET_CAPABILITY);
      }
    };
  });
}

const dialogButtonSpec = createHudTextButton(labels[0]);
const colourPickerButtonSpec = createHudTextButton(labels[1], {
  defaultBackground: "transparent",
  pressedBackground: "transparent"
}).with(colourTargetCapabilityComponent());
const modalButtonSpec = createHudTextButton(labels[2]);

const actionsSpec = createHudList({
  orientation: "horizontal",
  gap: "12px",
  padding: "14px"
})
  .with(childComponentSpecWithOptions(dialogButtonSpec, { channel: DIALOG_BUTTON_CHANNEL }))
  .with(
    childComponentSpecWithOptions(colourPickerButtonSpec, {
      channel: COLOUR_PICKER_BUTTON_CHANNEL
    })
  )
  .with(childComponentSpecWithOptions(modalButtonSpec, { channel: MODAL_BUTTON_CHANNEL }));

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
      /** @type {import("../declarative/types.js").Widget | undefined} */
      let colourPickerButtonWidget = undefined;

      return {
        async receive(widget, data) {
          const message = isChildChannelMessage(data) ? data : undefined;
          const messageChannel = message?.channel;
          const messagePayload = message?.payload ?? data;

          if (dialogChild) {
            if (isColourMessage(messagePayload) && colourPickerButtonWidget) {
              const capability = /** @type {ColourTargetCapability | undefined} */ (
                colourPickerButtonWidget.getCapability(COLOUR_TARGET_CAPABILITY)
              );
              capability?.setColor(colourPickerButtonWidget, messagePayload);
            }

            const currentDialog = dialogChild;
            dialogChild = undefined;
            await widget.removeChild(currentDialog);
            return;
          }

          switch (messageChannel) {
            case DIALOG_BUTTON_CHANNEL:
              dialogChild = widget.addChild(
                createHudModalDialog(
                  "Open Dialog",
                  "This is a demo HUD modal dialog.\nChoose one of the actions below.",
                  ["Confirm", "Remind Me Later", "Cancel"]
                )
              );
              return;
            case COLOUR_PICKER_BUTTON_CHANNEL:
              colourPickerButtonWidget = message?.child;
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

  if (rootWidget.element && app) {
    app.appendChild(rootWidget.element);
  }
}

void run();
