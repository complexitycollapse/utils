/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "./component-specs.js";

/**
 * @param {Widget} widget
 * @param {(element: HTMLElement) => void} fn
 */
function withElement(widget, fn) {
  if (!widget.element) {
    return;
  }
  fn(widget.element);
}

/**
 * Creates and assigns a div as the widget element.
 * @returns {ComponentSpecType}
 */
export function divComponent() {
  return ComponentSpec(() => ({
    mount(widget) {
      if (widget.element) {
        return;
      }
      widget.element = document.createElement("div");
    },
    mountChild(widget, child) {
      withElement(widget, (element) => {
        if (!child.element) {
          return;
        }
        element.appendChild(child.element);
      });
    },
    unmountChild(widget, child) {
      withElement(widget, (element) => {
        if (!child.element) {
          return;
        }
        if (child.element.parentElement === element) {
          element.removeChild(child.element);
        }
      });
    }
  }));
}
