/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { childComponentSpec } from "../component-specs.js";
import { divComponent } from "../dom-components.js";
import { styleComponent } from "../style-components.js";

/**
 * @typedef {"vertical" | "horizontal"} ListOrientation
 */

/**
 * @typedef {{
 *   orientation?: ListOrientation,
 *   gap?: number | string,
 *   alignItems?: string,
 *   justifyContent?: string
 * }} ListOptions
 */

/**
 * @param {number | string | undefined} value
 * @returns {string | undefined}
 */
function toCssSize(value) {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Displays a list of child specs in a vertical or horizontal flow.
 *
 * @param {ComponentSpecType[]} itemSpecs
 * @param {ListOptions} [options]
 * @returns {ComponentSpecType}
 */
export function listComponent(itemSpecs, options = {}) {
  const {
    orientation = "vertical",
    gap = 0,
    alignItems = "stretch",
    justifyContent = "flex-start"
  } = options;

  let spec = divComponent().with(
    styleComponent({
      display: "flex",
      flexDirection: orientation === "vertical" ? "column" : "row",
      alignItems,
      justifyContent,
      gap: toCssSize(gap)
    })
  );

  for (const itemSpec of itemSpecs) {
    spec = spec.with(childComponentSpec(itemSpec));
  }

  return spec;
}
