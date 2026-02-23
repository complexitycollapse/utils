/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("./types.js").SizeValue} SizeValue */
import { ComponentSpec } from "./component-specs.js";
import { textStyle } from "./style-components.js";

/**
 * @param {string} text
 * @param {{
 *   fontStyle?: string,
 *   fontSize?: SizeValue,
 *   fontFamily?: string,
 *   fontWeight?: string | number,
 *   lineHeight?: SizeValue,
 *   color?: string
 * }} [fontOptions]
 * @returns {ComponentSpecType}
 */
export function textComponent(text, fontOptions = {}) {
  return textStyle(fontOptions).with(
    ComponentSpec(() => ({
      mount(widget) {
        if (!widget.element) {
          return;
        }
        widget.element.textContent = text;
      }
    }))
  );
}
