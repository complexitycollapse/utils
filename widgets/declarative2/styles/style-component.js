/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("./style-helpers.js").StyleMap} StyleMap */
import { applyStyles, styleLifecycleComponent } from "./style-helpers.js";

/**
 * Generic style component for applying arbitrary CSS properties.
 * @param {StyleMap} styles
 * @returns {ComponentSpecType}
 */
export function styleComponent(styles) {
  return styleLifecycleComponent((element) => {
    applyStyles(element, styles);
  });
}
