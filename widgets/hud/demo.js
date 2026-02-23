import {
  ComponentSpec,
  childComponentSpec,
  childComponentSpecWithOptions,
  createWidget
} from "../declarative/widget.js";
import {
  DIMMABLE_CAPABILITY,
  dimmableComponent,
  classComponent,
  divComponent,
  styleComponent,
  textComponent
} from "../declarative/components.js";
import {
  createHudColourPicker,
  createHudList,
  createHudModalWindow,
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
const NESTED_MODAL_EXIT_CHANNEL = Symbol("nestedModalExit");
const NESTED_MODAL_OPEN_CHANNEL = Symbol("nestedModalOpen");
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
 * @typedef {import("../declarative/components.js").DimmableCapability} DimmableCapability
 */

/**
 * @param {{
 *   title: string,
 *   text: string,
 *   includeOpenButton: boolean,
 *   panelClassName?: string,
 *   panelComponentSpec?: import("../declarative/types.js").ComponentSpec
 * }} options
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
function createNestedModalWindow(options) {
  const {
    title,
    text,
    includeOpenButton,
    panelClassName,
    panelComponentSpec
  } = options;

  const textSpec = divComponent()
    .with(classComponent("hud-modal-text"))
    .with(textComponent(text, { fontSize: 14, lineHeight: "1.5", color: "#c6f9ff" }));

  let actionsSpec = createHudList({
    orientation: "horizontal",
    gap: "10px",
    padding: 0,
    className: "hud-modal-actions"
  })
    .with(styleComponent({ justifyContent: "flex-end" }))
    .with(
      childComponentSpecWithOptions(createHudTextButton("Exit"), {
        channel: NESTED_MODAL_EXIT_CHANNEL
      })
    );

  if (includeOpenButton) {
    actionsSpec = actionsSpec.with(
      childComponentSpecWithOptions(createHudTextButton("Open"), {
        channel: NESTED_MODAL_OPEN_CHANNEL
      })
    );
  }

  const contentSpec = createHudList({
    orientation: "vertical",
    gap: "12px",
    padding: 0,
    className: "hud-modal-dialog-content"
  })
    .with(childComponentSpec(textSpec))
    .with(childComponentSpec(actionsSpec));

  if (panelClassName !== undefined) {
    if (panelComponentSpec !== undefined) {
      return createHudModalWindow(title, contentSpec, {
        panelClassName,
        panelComponentSpec
      });
    }

    return createHudModalWindow(title, contentSpec, {
      panelClassName
    });
  }

  if (panelComponentSpec !== undefined) {
    return createHudModalWindow(title, contentSpec, {
      panelComponentSpec
    });
  }

  return createHudModalWindow(title, contentSpec);
}

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
    dimmableComponent({
      className: "hud-widget-dim-layer",
      color: "rgba(1, 6, 12, 0.50)",
      enterDurationMs: 0,
      exitDurationMs: 50,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      zIndex: 500
    })
  )
  .with(
    ComponentSpec(() => {
      /** @type {import("../declarative/types.js").Widget | undefined} */
      let dialogChild = undefined;
      /** @type {import("../declarative/types.js").Widget[]} */
      const nestedModalChildren = [];
      /** @type {import("../declarative/types.js").Widget | undefined} */
      let colourPickerButtonWidget = undefined;
      const nestedPanelDimmableSpec = dimmableComponent({
        className: "hud-modal-self-dim-layer",
        color: "rgba(1, 6, 12, 0.38)",
        enterDurationMs: 0,
        exitDurationMs: 50,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 20
      });

      /**
       * @param {import("../declarative/types.js").Widget} widget
       */
      function syncDimming(widget) {
        const dimmable = /** @type {DimmableCapability | undefined} */ (
          widget.getCapability(DIMMABLE_CAPABILITY)
        );
        if (dialogChild || nestedModalChildren.length > 0) {
          dimmable?.dim(widget);
          return;
        }
        dimmable?.undim(widget);
      }

      /**
       * @param {import("../declarative/types.js").Widget | undefined} modalWidget
       * @returns {{ panelWidget: import("../declarative/types.js").Widget, dimmable: DimmableCapability } | undefined}
       */
      function getNestedPanelDimmable(modalWidget) {
        const panelWidget = modalWidget?.children[0];
        if (!panelWidget) {
          return undefined;
        }
        const dimmable = /** @type {DimmableCapability | undefined} */ (
          panelWidget.getCapability(DIMMABLE_CAPABILITY)
        );
        if (!dimmable) {
          return undefined;
        }
        return { panelWidget, dimmable };
      }

      /**
       * @param {import("../declarative/types.js").Widget} widget
       * @param {import("../declarative/types.js").ComponentSpec} modalSpec
       */
      function pushNestedModal(widget, modalSpec) {
        const previousTop = nestedModalChildren[nestedModalChildren.length - 1];
        const previousTopPanel = getNestedPanelDimmable(previousTop);
        previousTopPanel?.dimmable.dim(previousTopPanel.panelWidget);

        const nestedChild = widget.addChild(modalSpec);
        nestedModalChildren.push(nestedChild);
        syncDimming(widget);
      }

      /**
       * @param {import("../declarative/types.js").Widget} widget
       * @returns {Promise<void>}
       */
      async function popNestedModal(widget) {
        const nestedChild = nestedModalChildren.pop();
        if (!nestedChild) {
          return;
        }
        await widget.removeChild(nestedChild);

        const nextTop = nestedModalChildren[nestedModalChildren.length - 1];
        const nextTopPanel = getNestedPanelDimmable(nextTop);
        nextTopPanel?.dimmable.undim(nextTopPanel.panelWidget);

        syncDimming(widget);
      }

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
            syncDimming(widget);
            return;
          }

          if (messageChannel === NESTED_MODAL_OPEN_CHANNEL) {
            pushNestedModal(
              widget,
              createNestedModalWindow({
                title: "Nested Modal",
                text: "This is a second-level modal window.\nClick Exit to close only this window.",
                includeOpenButton: false,
                panelComponentSpec: nestedPanelDimmableSpec
              })
            );
            return;
          }

          if (messageChannel === NESTED_MODAL_EXIT_CHANNEL) {
            await popNestedModal(widget);
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
              syncDimming(widget);
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
              syncDimming(widget);
              return;
            case MODAL_BUTTON_CHANNEL:
              pushNestedModal(
                widget,
                createNestedModalWindow({
                  title: "Parent Modal",
                  text: "This modal tests nested dimming.\nClick Open to spawn another modal above this one.",
                  includeOpenButton: true,
                  panelClassName: "hud-modal-panel-large",
                  panelComponentSpec: nestedPanelDimmableSpec
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
