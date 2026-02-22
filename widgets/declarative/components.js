/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("./types.js").SizeValue} SizeValue */
import { ComponentSpec } from "./widget.js";

export const DIMMABLE_CAPABILITY = Symbol("dimmableCapability");

/**
 * @typedef {Record<string, string | number | undefined>} StyleMap
 */
/**
 * @typedef {{
 *   setDimmed: (widget: Widget, dimmed: boolean) => void,
 *   dim: (widget: Widget) => void,
 *   undim: (widget: Widget) => void,
 *   toggle: (widget: Widget) => void,
 *   isDimmed: () => boolean
 * }} DimmableCapability
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

/**
 * Reuses the first child's element as this widget's element.
 * @returns {ComponentSpecType}
 */
export function delegateComponent() {
  return ComponentSpec(() => ({
    mountChild(widget, child) {
      if (!widget.element && child.element) {
        widget.element = child.element;
      }
    }
  }));
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
 * @returns {ComponentSpecType}
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
 * @param {StyleMap} styles
 * @returns {ComponentSpecType}
 */
export function styleComponent(styles) {
  return styleLifecycleComponent((element) => {
    applyStyles(element, styles);
  });
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

/**
 * @param {{
 *   className?: string,
 *   color?: string,
 *   durationMs?: number,
 *   enterDurationMs?: number,
 *   exitDurationMs?: number,
 *   easing?: string,
 *   zIndex?: number
 * }} [options]
 * @returns {ComponentSpecType}
 */
export function dimmableComponent(options = {}) {
  const {
    className = "widget-dim-layer",
    color = "rgba(0, 0, 0, 0.48)",
    durationMs = 240,
    enterDurationMs = durationMs,
    exitDurationMs = durationMs,
    easing = "ease",
    zIndex = 10
  } = options;

  return ComponentSpec(() => {
    /** @type {HTMLDivElement | undefined} */
    let dimLayer = undefined;
    let isDimmed = false;
    let didSetPosition = false;

    /**
     * @param {Widget} widget
     */
    function ensureLayer(widget) {
      if (!widget.element || dimLayer) {
        return;
      }

      const host = widget.element;
      const computedPosition = getComputedStyle(host).position;
      if (computedPosition === "static") {
        host.style.position = "relative";
        didSetPosition = true;
      }

      dimLayer = document.createElement("div");
      dimLayer.classList.add(className);
      applyStyles(dimLayer, {
        position: "absolute",
        inset: "0",
        background: color,
        pointerEvents: "none",
        opacity: isDimmed ? 1 : 0,
        transition: `opacity ${isDimmed ? enterDurationMs : exitDurationMs}ms ${easing}`,
        zIndex
      });

      host.appendChild(dimLayer);
    }

    /**
     * @param {Widget} widget
     */
    function sync(widget) {
      ensureLayer(widget);
      if (!dimLayer) {
        return;
      }
      dimLayer.style.transition = `opacity ${
        isDimmed ? enterDurationMs : exitDurationMs
      }ms ${easing}`;
      dimLayer.style.opacity = isDimmed ? "1" : "0";
    }

    /**
     * @param {Widget} widget
     * @param {boolean} dimmed
     */
    function setDimmed(widget, dimmed) {
      isDimmed = dimmed;
      sync(widget);
    }

    /** @type {DimmableCapability} */
    const capability = {
      setDimmed(widget, dimmed) {
        setDimmed(widget, dimmed);
      },
      dim(widget) {
        setDimmed(widget, true);
      },
      undim(widget) {
        setDimmed(widget, false);
      },
      toggle(widget) {
        setDimmed(widget, !isDimmed);
      },
      isDimmed() {
        return isDimmed;
      }
    };

    return {
      create(widget) {
        widget.provideCapability(DIMMABLE_CAPABILITY, capability);
      },
      mount(widget) {
        sync(widget);
      },
      unmount(widget) {
        if (widget.element && dimLayer && dimLayer.parentElement === widget.element) {
          widget.element.removeChild(dimLayer);
        }
        dimLayer = undefined;
        if (didSetPosition && widget.element) {
          widget.element.style.removeProperty("position");
        }
        didSetPosition = false;
      },
      destroy(widget) {
        widget.revokeCapability(DIMMABLE_CAPABILITY);
      }
    };
  });
}
