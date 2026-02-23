/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").SizeValue} SizeValue */
import { toCssSize } from "./style-helpers.js";
import { styleComponent } from "./style-component.js";

/**
 * @param {SizeValue} padding
 * @returns {ComponentSpecType}
 */
export function paddingComponent(padding) {
  return styleComponent({
    padding: toCssSize(padding)
  });
}
