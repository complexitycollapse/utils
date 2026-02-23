/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").SizeValue} SizeValue */
import { toCssSize } from "./style-helpers.js";
import { styleComponent } from "./style-component.js";

/**
 * @param {{
 *   width?: SizeValue,
 *   style?: string,
 *   color?: string,
 *   radius?: SizeValue,
 *   shadow?: string
 * }} [options]
 * @returns {ComponentSpecType}
 */
export function boxComponent(options = {}) {
  const width = toCssSize(options.width);
  const borderStyle = options.style ?? (width ? "solid" : undefined);
  const borderColor = options.color;

  return styleComponent({
    borderWidth: width,
    borderStyle,
    borderColor,
    borderRadius: toCssSize(options.radius),
    boxShadow: options.shadow
  });
}
