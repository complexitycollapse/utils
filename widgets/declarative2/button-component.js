/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "./component-specs.js";

/**
 * @param {unknown} message
 * @param {{
 *   pressedClassName?: string,
 *   pressedBackground?: string,
 *   defaultBackground?: string
 * }} [options]
 * @returns {ComponentSpecType}
 */
export function buttonBehaviorComponent(message, options = {}) {
  const {
    pressedClassName = "is-pressed",
    pressedBackground,
    defaultBackground
  } = options;

  /**
   * @param {Widget} widget
   * @param {boolean} pressed
   */
  function setPressed(widget, pressed) {
    const element = widget.element;
    if (!element) {
      return;
    }

    element.classList.toggle(pressedClassName, pressed);

    if (pressed && pressedBackground !== undefined) {
      element.style.backgroundColor = pressedBackground;
      return;
    }

    if (!pressed && defaultBackground !== undefined) {
      element.style.backgroundColor = defaultBackground;
      return;
    }

    if (!pressed) {
      element.style.removeProperty("background-color");
    }
  }

  return ComponentSpec(() => ({
    click(widget) {
      widget.sendUp(message);
    },
    pointerdown(widget) {
      setPressed(widget, true);
    },
    pointerup(widget) {
      setPressed(widget, false);
    },
    pointercancel(widget) {
      setPressed(widget, false);
    },
    mouseleave(widget) {
      setPressed(widget, false);
    },
    blur(widget) {
      setPressed(widget, false);
    }
  }));
}
