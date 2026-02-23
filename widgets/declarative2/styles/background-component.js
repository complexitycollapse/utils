/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { styleComponent } from "./style-component.js";

/**
 * @param {{
 *   color?: string,
 *   image?: string,
 *   size?: string,
 *   position?: string,
 *   repeat?: string
 * }} options
 * @returns {ComponentSpecType}
 */
export function backgroundComponent(options) {
  return styleComponent({
    backgroundColor: options.color,
    backgroundImage: options.image,
    backgroundSize: options.size,
    backgroundPosition: options.position,
    backgroundRepeat: options.repeat
  });
}
