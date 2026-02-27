/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").ContextPath} ContextPath */
/** @typedef {import("../types.js").ThemeDescriptor} ThemeDescriptor */
/** @typedef {import("../types.js").StyleMap} StyleMap */
/** @typedef {import("../types.js").Widget} Widget */
import { ComponentSpec } from "../component-specs.js";
import { applyStyles } from "../styles/style-helpers.js";

/** Makes a widget themeable.
 * 
 * @param {ContextPath} path
 * @returns {ComponentSpecType}
 */
export function themeableComponent(path) {
  return ComponentSpec(() => ({
    mount(widget) {
      if (!widget.element) {
        return;
      }
      const styles = calculateStyle(widget, path);
      applyStyles(widget.element, styles);
    }
  }));
}

/**
 * Iterate across the context of all ancestors to compute the style for the given path.
 * 
 * @param {Widget} widget
 * @param {ContextPath} path
 * @returns {StyleMap}
 */
function calculateStyle(widget, path) {
  /** @type {Widget[]} */
  const lineage = [];
  /** @type {Widget | undefined} */
  let current = widget;
  while (current) {
    lineage.push(current);
    current = current.parent;
  }
  lineage.reverse();

  /** @type {StyleMap} */
  let style = {};
  for (const ancestor of lineage) {
    const localStyle = mergeExtensionChain(ancestor, path);
    // Root contributes first; nearer ancestors override.
    style = { ...style, ...localStyle };
  }

  return style;
}

/**
 * Iterate across the extension chain in a widget's context and merge the theme objects.
 * 
 * @param {import("../types.js").Widget} widget
 * @param {ContextPath} path
 * @returns {StyleMap}
 */
function mergeExtensionChain(widget, path) {
  /** @type {StyleMap[]} */
  const chain = [];
  /** @type {ContextPath | undefined} */
  let currentPath = path;

  // Gather the whole extension chain.

  while (currentPath) {
    const themePath = ["theme", ...currentPath];
    
    const theme = /** @type {ThemeDescriptor} */ (widget.getOwnContext(themePath));
    if (theme === undefined) {
      break;
    }

    // Is this a ThemeExtension object?
    if (isStyleMap(theme.values))
    {
      // Yes, add its StyleMap and find what it extends.
      chain.push(theme.values);
      if (Array.isArray(theme?.extends)) {
        currentPath = theme.extends;
        continue;
      }
    } else {
      // No, then it's probably a StyleMap.
      if (isStyleMap(theme)) {
        chain.push(theme);
      }
    }

    break;
  }

  // Merge the chain.

  /** @type {StyleMap} */
  let merged = {};
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    merged = { ...merged, ...chain[i] };
  }
  return merged;
}

/**
 * @param {unknown} value
 * @returns {value is StyleMap}
 */
function isStyleMap(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
