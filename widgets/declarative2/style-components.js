/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("./types.js").SizeValue} SizeValue */
import { ComponentSpec } from "./component-specs.js";

/**
 * @typedef {Record<string, string | number | undefined>} StyleMap
 */

/**
 * @param {SizeValue | undefined} value
 * @returns {string | undefined}
 */
function toCssSize(value) {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "number" ? `${value}px` : value;
}

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
 * @param {HTMLElement} element
 * @param {StyleMap} styles
 */
function applyStyles(element, styles) {
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
function styleLifecycleComponent(apply) {
  return ComponentSpec(() => ({
    mount(widget) {
      withElement(widget, apply);
    }
  }));
}

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

/**
 * @param {{
 *   fontStyle?: string,
 *   fontSize?: SizeValue,
 *   fontFamily?: string,
 *   fontWeight?: string | number,
 *   lineHeight?: SizeValue,
 *   color?: string
 * }} [fontOptions]
 * @returns {ComponentSpecType}
 */
export function textStyle(fontOptions = {}) {
  const {
    fontStyle,
    fontSize,
    fontFamily,
    fontWeight,
    lineHeight,
    color
  } = fontOptions;

  return styleComponent({
    fontStyle,
    fontSize: toCssSize(fontSize),
    fontFamily,
    fontWeight,
    lineHeight: toCssSize(lineHeight),
    color
  });
}

/**
 * @param {SizeValue} padding
 * @returns {ComponentSpecType}
 */
export function paddingComponent(padding) {
  return styleComponent({
    padding: toCssSize(padding)
  });
}

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

/**
 * @param {{
 *   width?: SizeValue,
 *   style?: string,
 *   color?: string,
 *   radius?: SizeValue,
 *   shadow?: string
 * }} [options]
 * @returns {ComponentSpecType}
 */
export function boxComponent(options = {}) {
  const width = toCssSize(options.width);
  const borderStyle = options.style ?? (width ? "solid" : undefined);
  const borderColor = options.color;

  return styleComponent({
    borderWidth: width,
    borderStyle,
    borderColor,
    borderRadius: toCssSize(options.radius),
    boxShadow: options.shadow
  });
}

/**
 * @param {string | string[]} classNames
 * @returns {ComponentSpecType}
 */
export function classComponent(classNames) {
  const names = Array.isArray(classNames) ? classNames : [classNames];

  return ComponentSpec(() => ({
    mount(widget) {
      withElement(widget, (element) => {
        element.classList.add(...names);
      });
    },
    unmount(widget) {
      withElement(widget, (element) => {
        element.classList.remove(...names);
      });
    }
  }));
}

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

/**
 * @param {string} color
 * @returns {ComponentSpecType}
 */
export function colorComponent(color) {
  return styleComponent({ color });
}

/**
 * @param {"start" | "center" | "end"} [horizontal]
 * @param {"start" | "center" | "end"} [vertical]
 * @returns {ComponentSpecType}
 */
export function alignComponent(horizontal = "center", vertical = "center") {
  const justifyMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end"
  };

  const textAlignMap = {
    start: "left",
    center: "center",
    end: "right"
  };

  return styleComponent({
    display: "flex",
    justifyContent: justifyMap[horizontal],
    alignItems: justifyMap[vertical],
    textAlign: textAlignMap[horizontal]
  });
}

/**
 * @param {SizeValue | undefined} width
 * @param {SizeValue | undefined} height
 * @returns {ComponentSpecType}
 */
export function sizeComponent(width, height) {
  return styleComponent({
    width: toCssSize(width),
    height: toCssSize(height)
  });
}

/**
 * @param {SizeValue | undefined} width
 * @param {SizeValue | undefined} height
 * @returns {ComponentSpecType}
 */
export function minSizeComponent(width, height) {
  return styleComponent({
    minWidth: toCssSize(width),
    minHeight: toCssSize(height)
  });
}

/**
 * @param {SizeValue | undefined} width
 * @param {SizeValue | undefined} height
 * @returns {ComponentSpecType}
 */
export function maxSizeComponent(width, height) {
  return styleComponent({
    maxWidth: toCssSize(width),
    maxHeight: toCssSize(height)
  });
}
