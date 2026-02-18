// @ts-check

import { ComponentSpec as toComponentSpec } from "./component-spec.js";

/**
 * @typedef {import("./type.js").ComponentInput} ComponentInput
 * @typedef {import("./type.js").ComponentSpec} ComponentSpec
 * @typedef {import("./type.js").WidgetSpec} WidgetSpecType
 */

/**
 * Creates an immutable widget spec with append-only `withComponent` and `withChild`.
 *
 * @returns {WidgetSpecType}
 */
export function WidgetSpec() {
  return EMPTY_WIDGET_SPEC;
}

/**
 * @param {ReadonlyArray<ComponentSpec>} components
 * @param {ReadonlyArray<WidgetSpecType>} children
 * @returns {WidgetSpecType}
 */
function createWidgetSpec(components, children) {
  return Object.freeze({
    components,
    children,
    withComponent(component) {
      return createWidgetSpec(
        Object.freeze([...components, toComponentSpec(component)]),
        children
      );
    },
    withChild(child) {
      return createWidgetSpec(components, Object.freeze([...children, child]));
    },
  });
}

const EMPTY_WIDGET_SPEC = createWidgetSpec(Object.freeze([]), Object.freeze([]));
