/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").WidgetComponent} WidgetComponent */

/**
 * @param {"vertical" | "horizontal"} orientation
 * @returns {WidgetComponent}
 */
export function listComponent(orientation) {
  const isVertical = orientation === "vertical";

  /**
   * @param {Widget} widget
   */
  function applyContainerLayout(widget) {
    const element = widget.element;
    if (!element) {
      return;
    }

    element.style.display = "flex";
    element.style.flexDirection = isVertical ? "column" : "row";
    element.style.alignItems = "stretch";
    element.style.justifyContent = "flex-start";
  }

  /**
   * @param {Widget} widget
   * @param {Widget | undefined} [excludedChild]
   */
  function mountAll(widget, excludedChild) {
    const element = widget.element;
    if (!element) {
      return;
    }

    for (const child of widget.children) {
      if (child === excludedChild || !child.element) {
        continue;
      }
      element.appendChild(child.element);
    }
  }

  return {
    afterShow(widget) {
      applyContainerLayout(widget);
      mountAll(widget);
    },
    mountChild(widget) {
      applyContainerLayout(widget);
      mountAll(widget);
    },
    unmountChild(widget, child) {
      const element = widget.element;
      if (!element || !child.element) {
        return;
      }
      if (child.element.parentElement === element) {
        element.removeChild(child.element);
      }
    }
  };
}

