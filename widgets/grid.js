/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").WidgetComponent} WidgetComponent */

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
 *   widgetSize: number,
 *   spacing: number
 * }} config
 * @param {Widget | undefined} [excludedChild]
 */
function applyGridLayout(widget, config, excludedChild) {
  const element = widget.element;
  if (!element) {
    return;
  }

  const cellSize = config.widgetSize + config.spacing;
  const columns = Math.max(1, Math.floor(config.width / cellSize));
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
    const left = column * cellSize;
    const top = row * cellSize;

    child.element.style.position = "absolute";
    child.element.style.left = toPx(left);
    child.element.style.top = toPx(top);
    child.element.style.width = toPx(config.widgetSize);
    child.element.style.height = toPx(config.widgetSize);
    itemIndex += 1;
  }

  const rows = itemIndex === 0 ? 0 : Math.ceil(itemIndex / columns);
  const height = rows === 0
    ? 0
    : (rows * config.widgetSize) + ((rows - 1) * config.spacing);
  element.style.height = toPx(height);
}

/**
 * Lays out children in a fixed-size grid.
 * The grid fills rows left-to-right, then top-to-bottom.
 *
 * @param {number} width
 * @param {number} widgetSize
 * @param {number} spacing
 * @returns {WidgetComponent}
 */
export function gridComponent(width, widgetSize, spacing) {
  const config = { width, widgetSize, spacing };

  return {
    afterShow(widget) {
      applyGridLayout(widget, config);
    },
    mountChild(widget) {
      applyGridLayout(widget, config);
    },
    unmountChild(widget, child) {
      applyGridLayout(widget, config, child);
    }
  };
}
