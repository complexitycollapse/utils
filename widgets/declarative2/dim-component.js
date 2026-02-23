/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "./component-specs.js";
import { divComponent } from "./dom-components.js";
import { styleComponent } from "./style-components.js";

export const DIMMABLE_CAPABILITY = Symbol("dimmableCapability");

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
 * @typedef {{
 *   overlayColor?: string,
 *   blurPx?: number,
 *   zIndex?: number,
 *   blockPointerEvents?: boolean
 * }} DimOverlayOptions
 */

/**
 * @param {DimOverlayOptions} [options]
 * @returns {ComponentSpecType}
 */
export function dimOverlayComponent(options = {}) {
  const {
    overlayColor = "rgba(0, 0, 0, 0.45)",
    blurPx = 4,
    zIndex = 10,
    blockPointerEvents = true
  } = options;

  return divComponent()
    .with(
      styleComponent({
        position: "absolute",
        inset: "0",
        backgroundColor: overlayColor,
        backdropFilter: `blur(${blurPx}px)`,
        webkitBackdropFilter: `blur(${blurPx}px)`,
        pointerEvents: blockPointerEvents ? "auto" : "none",
        zIndex
      })
    );
}

/**
 * @typedef {DimOverlayOptions & {
 *   hostPosition?: string
 * }} DimmableComponentOptions
 */

/**
 * @param {DimmableComponentOptions} [options]
 * @returns {ComponentSpecType}
 */
export function dimmableComponent(options = {}) {
  const {
    hostPosition = "relative",
    ...overlayOptions
  } = options;

  return ComponentSpec(() => {
    const overlaySpec = dimOverlayComponent(overlayOptions);
    /** @type {Widget | undefined} */
    let overlayWidget = undefined;
    let dimmed = false;
    let didSetPosition = false;

    /**
     * @param {Widget} widget
     */
    function ensureHostPosition(widget) {
      if (!widget.element) {
        return;
      }
      if (getComputedStyle(widget.element).position === "static") {
        widget.element.style.position = hostPosition;
        didSetPosition = true;
      }
    }

    /**
     * @param {Widget} widget
     */
    function clearHostPosition(widget) {
      if (!didSetPosition || !widget.element) {
        return;
      }
      widget.element.style.removeProperty("position");
      didSetPosition = false;
    }

    /**
     * @param {Widget} widget
     * @param {boolean} nextDimmed
     */
    function setDimmed(widget, nextDimmed) {
      dimmed = nextDimmed;

      if (nextDimmed) {
        ensureHostPosition(widget);
        if (!overlayWidget) {
          overlayWidget = widget.addChild(overlaySpec);
        }
        return;
      }

      if (overlayWidget) {
        void widget.removeChild(overlayWidget);
        overlayWidget = undefined;
      }
      clearHostPosition(widget);
    }

    /** @type {DimmableCapability} */
    const capability = {
      setDimmed(widget, nextDimmed) {
        setDimmed(widget, nextDimmed);
      },
      dim(widget) {
        setDimmed(widget, true);
      },
      undim(widget) {
        setDimmed(widget, false);
      },
      toggle(widget) {
        setDimmed(widget, !dimmed);
      },
      isDimmed() {
        return dimmed;
      }
    };

    return {
      create(widget) {
        widget.provideCapability(DIMMABLE_CAPABILITY, capability);
      },
      mount(widget) {
        if (!dimmed) {
          return;
        }
        ensureHostPosition(widget);
      },
      unmount(widget) {
        clearHostPosition(widget);
      },
      destroy(widget) {
        if (overlayWidget) {
          void widget.removeChild(overlayWidget);
          overlayWidget = undefined;
        }
        widget.revokeCapability(DIMMABLE_CAPABILITY);
      }
    };
  });
}
