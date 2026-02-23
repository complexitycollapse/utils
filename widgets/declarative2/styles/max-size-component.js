/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").SizeValue} SizeValue */
import { toCssSize } from "./style-helpers.js";
import { styleComponent } from "./style-component.js";

/**
 * @param {SizeValue | undefined} width
 * @param {SizeValue | undefined} height
 * @returns {ComponentSpecType}
 */
export function maxSizeComponent(width, height) {
  return styleComponent({
    maxWidth: toCssSize(width),
    maxHeight: toCssSize(height)
  });
}
