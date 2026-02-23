/** @typedef {import("../types.js").Widget} Widget */
/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "../component-specs.js";

/**
 * @param {{
 *   hoverClassName?: string
 * }} [options]
 * @returns {ComponentSpecType}
 */
export function hoverComponent(options = {}) {
  const { hoverClassName = "is-hovered" } = options;

  /**
   * @param {Widget} widget
   * @param {boolean} hovered
   */
  function setHovered(widget, hovered) {
    const element = widget.element;
    if (!element) {
      return;
    }
    element.classList.toggle(hoverClassName, hovered);
  }

  return ComponentSpec(() => ({
    mouseenter(widget) {
      setHovered(widget, true);
    },
    mouseleave(widget) {
      setHovered(widget, false);
    },
    deactivate(widget) {
      setHovered(widget, false);
    }
  }));
}
