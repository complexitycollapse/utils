/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").ChildChannelMessage} ChildChannelMessage */
import {
  ComponentSpec,
  childComponentSpec,
  childComponentSpecWithOptions
} from "../component-specs.js";
import { buttonBehaviorComponent } from "../button-component.js";
import { divComponent } from "../dom-components.js";
import { styleComponent } from "../style-components.js";
import { textComponent } from "../text-component.js";
import { WINDOW_MANAGER_CAPABILITY } from "./window-manager.js";
import { windowComponent } from "./window-component.js";

/**
 * @typedef {{
 *   x?: number | string,
 *   y?: number | string,
 *   centerHorizontally?: boolean,
 *   centerVertically?: boolean,
 *   zIndex?: number
 * }} WindowOptions
 */

/**
 * @typedef {"spread" | "left" | "right"} ButtonAlignment
 */

/**
 * @typedef {{
 *   title?: string,
 *   text: string,
 *   buttons: string[],
 *   buttonAlignment?: ButtonAlignment,
 *   windowOptions?: WindowOptions
 * }} DialogBoxOptions
 */

/**
 * @param {ButtonAlignment | undefined} alignment
 * @returns {string}
 */
function buttonJustify(alignment) {
  if (alignment === "left") {
    return "flex-start";
  }
  if (alignment === "right") {
    return "flex-end";
  }
  return "space-between";
}

/**
 * @param {unknown} value
 * @param {unknown} channel
 * @returns {value is ChildChannelMessage}
 */
function isChannelMessage(value, channel) {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = /** @type {{ channel?: unknown, payload?: unknown }} */ (value);
  return candidate.channel === channel && typeof candidate.payload === "string";
}

/**
 * @param {string} buttonText
 * @param {boolean} stretch
 * @returns {ComponentSpecType}
 */
function dialogButtonSpec(buttonText, stretch) {
  return divComponent()
    .with(
      styleComponent({
        cursor: "pointer",
        userSelect: "none",
        textAlign: "center",
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        backgroundColor: "#f3f4f6",
        flex: stretch ? "1 1 0" : undefined
      })
    )
    .with(
      textComponent(buttonText, {
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.2,
        color: "#111827"
      })
    )
    .with(
      buttonBehaviorComponent(buttonText, {
        pressedBackground: "#e5e7eb",
        defaultBackground: "#f3f4f6"
      })
    );
}

/**
 * @param {string[]} buttons
 * @param {ButtonAlignment | undefined} alignment
 * @param {unknown} buttonChannel
 * @returns {ComponentSpecType}
 */
function dialogButtonsRowSpec(buttons, alignment, buttonChannel) {
  const stretch = alignment === "spread";
  let rowSpec = divComponent().with(
    styleComponent({
      display: "flex",
      justifyContent: buttonJustify(alignment),
      gap: "8px",
      marginTop: "auto",
      padding: "12px 16px 16px",
      borderTop: "1px solid #e5e7eb"
    })
  );

  for (const buttonText of buttons) {
    rowSpec = rowSpec.with(
      childComponentSpecWithOptions(dialogButtonSpec(buttonText, stretch), {
        channel: buttonChannel
      })
    );
  }

  return rowSpec;
}

/**
 * @param {string} name
 * @param {DialogBoxOptions} options
 * @returns {ComponentSpecType}
 */
export function dialogBoxComponent(name, options) {
  const {
    title = name,
    text,
    buttons,
    buttonAlignment = "right",
    windowOptions = {}
  } = options;
  const buttonChannel = Symbol("dialogButtons");
  const buttonSet = new Set(buttons);

  const titleSpec = divComponent()
    .with(
      styleComponent({
        padding: "16px 16px 8px",
        borderBottom: "1px solid #e5e7eb"
      })
    )
    .with(
      textComponent(title, {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.25,
        color: "#111827"
      })
    );

  const bodySpec = divComponent()
    .with(
      styleComponent({
        padding: "12px 16px",
        minWidth: "280px",
        maxWidth: "520px"
      })
    )
    .with(
      textComponent(text, {
        fontSize: 14,
        lineHeight: 1.5,
        color: "#1f2937"
      })
    );

  return windowComponent(name, windowOptions)
    .with(
      styleComponent({
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        border: "1px solid #d1d5db",
        borderRadius: "10px",
        boxShadow: "0 16px 40px rgba(17, 24, 39, 0.24)",
        overflow: "hidden"
      })
    )
    .with(childComponentSpec(titleSpec))
    .with(childComponentSpec(bodySpec))
    .with(childComponentSpec(dialogButtonsRowSpec(buttons, buttonAlignment, buttonChannel)))
    .with(
      ComponentSpec(() => {
        let isClosing = false;

        return {
          receive(widget, data) {
            if (isClosing || !isChannelMessage(data, buttonChannel)) {
              return;
            }

            const buttonText = data.payload;
            if (typeof buttonText !== "string") {
              return;
            }
            if (!buttonSet.has(buttonText)) {
              return;
            }

            const parent = widget.parent;
            if (!parent) {
              return;
            }

            const windowManager = /** @type {{ closeWindow?: (windowName: string, message?: unknown) => Promise<void> }} */ (
              parent.getCapability(WINDOW_MANAGER_CAPABILITY)
            );
            if (!windowManager || typeof windowManager.closeWindow !== "function") {
              return;
            }

            isClosing = true;
            return windowManager.closeWindow(name, buttonText);
          }
        };
      })
    );
}
