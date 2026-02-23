/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").SizeValue} SizeValue */
import { toCssSize } from "./style-helpers.js";
import { styleComponent } from "./style-component.js";

/**
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
export function textStyle(fontOptions = {}) {
  const {
    fontStyle,
    fontSize,
    fontFamily,
    fontWeight,
    lineHeight,
    color
  } = fontOptions;

  return styleComponent({
    fontStyle,
    fontSize: toCssSize(fontSize),
    fontFamily,
    fontWeight,
    lineHeight: toCssSize(lineHeight),
    color
  });
}
