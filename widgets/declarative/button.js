import { ComponentSpec, childComponentSpec } from "./widget.js";
import { delegateComponent } from "./components.js";

/**
 * @param {unknown} message
 * @param {{
 *   pressedClassName?: string,
 *   pressedBackground?: string,
 *   defaultBackground?: string
 * }} [options]
 */
function buttonBehaviorComponent(message, options = {}) {
  const {
    pressedClassName = "is-pressed",
    pressedBackground,
    defaultBackground
  } = options;

  /**
   * @param {import("./types.js").Widget} widget
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

  /** @type {(widget: import("./types.js").Widget) => void} */
  const click = (widget) => {
    widget.sendUp(message);
  };

  /** @type {(widget: import("./types.js").Widget) => void} */
  const pointerdown = (widget) => {
    setPressed(widget, true);
  };

  /** @type {(widget: import("./types.js").Widget) => void} */
  const pointerup = (widget) => {
    setPressed(widget, false);
  };

  /** @type {(widget: import("./types.js").Widget) => void} */
  const pointercancel = (widget) => {
    setPressed(widget, false);
  };

  /** @type {(widget: import("./types.js").Widget) => void} */
  const mouseleave = (widget) => {
    setPressed(widget, false);
  };

  /** @type {(widget: import("./types.js").Widget) => void} */
  const blur = (widget) => {
    setPressed(widget, false);
  };

  return ComponentSpec(() => ({
    click,
    pointerdown,
    pointerup,
    pointercancel,
    mouseleave,
    blur
  }));
}

/**
 * @param {{
 *   hoverClassName?: string
 * }} [options]
 */
function buttonHoverComponent(options = {}) {
  const { hoverClassName = "is-hovered" } = options;

  /**
   * @param {import("./types.js").Widget} widget
   * @param {boolean} hovered
   */
  function setHovered(widget, hovered) {
    const element = widget.element;
    if (!element) {
      return;
    }
    element.classList.toggle(hoverClassName, hovered);
  }

  /** @type {(widget: import("./types.js").Widget) => void} */
  const mouseenter = (widget) => {
    setHovered(widget, true);
  };

  /** @type {(widget: import("./types.js").Widget) => void} */
  const mouseleave = (widget) => {
    setHovered(widget, false);
  };

  /** @type {(widget: import("./types.js").Widget) => void} */
  const hide = (widget) => {
    setHovered(widget, false);
  };

  return ComponentSpec(() => ({ mouseenter, mouseleave, hide }));
}

/**
 * Creates a button with separate behavior and visual widgets.
 * The parent widget owns behavior and delegates its element to the visual child.
 *
 * @param {{
 *   visualComponentSpec: import("./types.js").ComponentSpec,
 *   message: unknown,
 *   pressedBackground?: string,
 *   defaultBackground?: string,
 *   pressedClassName?: string,
 *   hoverClassName?: string
 * }} options
 */
export function createButton(options) {
  const {
    visualComponentSpec,
    message,
  } = options;

  return delegateComponent()
    .with(buttonHoverComponent(options))
    .with(buttonBehaviorComponent(message, options))
    .with(childComponentSpec(visualComponentSpec));
}
