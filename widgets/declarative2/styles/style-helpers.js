/** @typedef {import("../types.js").Widget} Widget */
/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").SizeValue} SizeValue */
import { ComponentSpec } from "../component-specs.js";

/**
 * @typedef {Record<string, string | number | undefined>} StyleMap
 */

/**
 * @param {SizeValue | undefined} value
 * @returns {string | undefined}
 */
export function toCssSize(value) {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * @param {Widget} widget
 * @param {(element: HTMLElement) => void} fn
 */
export function withElement(widget, fn) {
  if (!widget.element) {
    return;
  }
  fn(widget.element);
}

/**
 * @param {HTMLElement} element
 * @param {StyleMap} styles
 */
export function applyStyles(element, styles) {
  for (const [property, value] of Object.entries(styles)) {
    if (value === undefined) {
      continue;
    }

    if (property.includes("-")) {
      element.style.setProperty(property, String(value));
      continue;
    }

    /** @type {any} */ (element.style)[property] = String(value);
  }
}

/**
 * @param {(element: HTMLElement) => void} apply
 * @returns {ComponentSpecType}
 */
export function styleLifecycleComponent(apply) {
  return ComponentSpec(() => ({
    mount(widget) {
      withElement(widget, apply);
    }
  }));
}
