/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "./widget.js";

/**
 * @param {number} value
 * @returns {string}
 */
function toPx(value) {
  return `${value}px`;
}

/**
 * @param {Widget} widget
 * @param {{
 *   width: number,
 *   widgetWidth: number,
 *   widgetHeight: number,
 *   spacingX: number,
 *   spacingY: number
 * }} config
 * @param {Widget | undefined} [excludedChild]
 */
function applyGridLayout(widget, config, excludedChild) {
  const element = widget.element;
  if (!element) {
    return;
  }

  const cellWidth = config.widgetWidth + config.spacingX;
  const cellHeight = config.widgetHeight + config.spacingY;
  const columns = Math.max(1, Math.floor(config.width / cellWidth));
  const layoutChildren = widget.children.filter((child) => child !== excludedChild);

  element.style.position = "relative";
  element.style.width = toPx(config.width);

  let itemIndex = 0;
  for (const child of layoutChildren) {
    if (!child.element) {
      continue;
    }

    const row = Math.floor(itemIndex / columns);
    const column = itemIndex % columns;
    const left = column * cellWidth;
    const top = row * cellHeight;

    child.element.style.position = "absolute";
    child.element.style.left = toPx(left);
    child.element.style.top = toPx(top);
    child.element.style.width = toPx(config.widgetWidth);
    child.element.style.height = toPx(config.widgetHeight);
    itemIndex += 1;
  }

  const rows = itemIndex === 0 ? 0 : Math.ceil(itemIndex / columns);
  const height = rows === 0
    ? 0
    : (rows * config.widgetHeight) + ((rows - 1) * config.spacingY);
  element.style.height = toPx(height);
}

/**
 * Lays out children in a fixed-size grid.
 * The grid fills rows left-to-right, then top-to-bottom.
 *
 * @param {number} width
 * @param {number} widgetWidth
 * @param {number} [widgetHeight]
 * @param {number} [spacingX]
 * @param {number} [spacingY]
 * @returns {ComponentSpecType}
 */
export function gridComponent(
  width,
  widgetWidth,
  widgetHeight = widgetWidth,
  spacingX = 0,
  spacingY = spacingX
) {
  const config = { width, widgetWidth, widgetHeight, spacingX, spacingY };

  return ComponentSpec(() => ({
    afterShow(widget) {
      applyGridLayout(widget, config);
    },
    mountChild(widget) {
      applyGridLayout(widget, config);
    },
    unmountChild(widget, child) {
      applyGridLayout(widget, config, child);
    }
  }));
}
