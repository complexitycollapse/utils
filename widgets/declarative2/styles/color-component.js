/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { styleComponent } from "./style-component.js";

/**
 * @param {string} color
 * @returns {ComponentSpecType}
 */
export function colorComponent(color) {
  return styleComponent({ color });
}
