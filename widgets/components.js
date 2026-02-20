/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").WidgetComponent} WidgetComponent */
/** @typedef {import("./types.js").SizeValue} SizeValue */

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
 * @returns {WidgetComponent}
 */
function styleLifecycleComponent(apply) {
  return {
    afterShow(widget) {
      withElement(widget, apply);
    }
  };
}

/**
 * Creates and assigns a div as the widget element.
 * @returns {WidgetComponent}
 */
export function divComponent() {
  return {
    beforeShow(widget) {
      const element = document.createElement("div");
      widget.element = element;
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
  };
}

/**
 * Reuses the first child's element as this widget's element.
 * @returns {WidgetComponent}
 */
export function delegateComponent() {
  return {
    afterShow(widget) {
      widget.element = widget.children[0]?.element;
    }
  };
}

/**
 * @param {string} text
 * @param {{
 *   fontStyle?: string,
 *   fontSize?: SizeValue,
 *   fontFamily?: string,
 *   fontWeight?: string | number,
 *   lineHeight?: SizeValue,
 *   color?: string
 * }} [fontOptions]
 * @returns {WidgetComponent}
 */
export function textComponent(text, fontOptions = {}) {
  const {
    fontStyle,
    fontSize,
    fontFamily,
    fontWeight,
    lineHeight,
    color
  } = fontOptions;

  return styleLifecycleComponent((element) => {
    element.textContent = text;
    applyStyles(element, {
      fontStyle,
      fontSize: toCssSize(fontSize),
      fontFamily,
      fontWeight,
      lineHeight: toCssSize(lineHeight),
      color
    });
  });
}

/**
 * @param {SizeValue} padding
 * @returns {WidgetComponent}
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
 * @returns {WidgetComponent}
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
 * @returns {WidgetComponent}
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
 * @returns {WidgetComponent}
 */
export function classComponent(classNames) {
  const names = Array.isArray(classNames) ? classNames : [classNames];

  return {
    afterShow(widget) {
      withElement(widget, (element) => {
        element.classList.add(...names);
      });
    },
    hide(widget) {
      withElement(widget, (element) => {
        element.classList.remove(...names);
      });
    }
  };
}

/**
 * @param {StyleMap} styles
 * @returns {WidgetComponent}
 */
export function styleComponent(styles) {
  return styleLifecycleComponent((element) => {
    applyStyles(element, styles);
  });
}

/**
 * @param {"start" | "center" | "end"} [horizontal]
 * @param {"start" | "center" | "end"} [vertical]
 * @returns {WidgetComponent}
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
 * @returns {WidgetComponent}
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
 * @returns {WidgetComponent}
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
 * @returns {WidgetComponent}
 */
export function maxSizeComponent(width, height) {
  return styleComponent({
    maxWidth: toCssSize(width),
    maxHeight: toCssSize(height)
  });
}
