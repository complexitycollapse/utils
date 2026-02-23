/** @typedef {import("../types.js").Widget} Widget */
/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "../component-specs.js";
import { divComponent } from "../dom-components.js";
import { styleComponent } from "../style-components.js";

export const WINDOW_CAPABILITY = Symbol("windowCapability");

/**
 * @typedef {{
 *   getName: () => string
 * }} WindowCapability
 */

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
 * @param {number | string | undefined} value
 * @returns {string | undefined}
 */
function toCssPosition(value) {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * @param {WindowOptions} options
 * @returns {string | undefined}
 */
function buildCenterTransform(options) {
  const { centerHorizontally = false, centerVertically = false } = options;

  if (centerHorizontally && centerVertically) {
    return "translate(-50%, -50%)";
  }
  if (centerHorizontally) {
    return "translateX(-50%)";
  }
  if (centerVertically) {
    return "translateY(-50%)";
  }
  return undefined;
}

/**
 * @param {WindowOptions} options
 * @returns {ComponentSpecType}
 */
function windowPositionStyle(options) {
  const {
    x,
    y,
    centerHorizontally = false,
    centerVertically = false,
    zIndex = 100
  } = options;

  return styleComponent({
    position: "absolute",
    left: centerHorizontally ? "50%" : toCssPosition(x),
    top: centerVertically ? "50%" : toCssPosition(y),
    transform: buildCenterTransform(options),
    zIndex
  });
}

/**
 * @param {string} name
 * @param {WindowOptions} [options]
 * @returns {ComponentSpecType}
 */
export function windowComponent(name, options = {}) {
  return divComponent()
    .with(windowPositionStyle(options))
    .with(
      ComponentSpec(() => {
        /** @type {WindowCapability} */
        const capability = {
          getName() {
            return name;
          }
        };

        return {
          create(widget) {
            widget.provideCapability(WINDOW_CAPABILITY, capability);
          },
          destroy(widget) {
            widget.revokeCapability(WINDOW_CAPABILITY);
          }
        };
      })
    );
}
