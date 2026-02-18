// @ts-check

/**
 * @typedef {import("./type.js").ComponentSpec} ComponentSpec
 * @typedef {import("./type.js").WidgetSpec} WidgetSpecType
 * @typedef {import("./type.js").Widget} WidgetType
 */

/**
 * Creates a retained widget from an immutable `WidgetSpec`.
 * Components are ordered by priority (ascending), then by append order.
 *
 * @param {WidgetSpecType} spec
 * @returns {WidgetType}
 */
export function Widget(spec) {
  const orderedComponents = Object.freeze(
    spec.components
      .map((component, index) => ({ component, index }))
      .sort((left, right) => {
        if (left.component.priority !== right.component.priority) {
          return left.component.priority - right.component.priority;
        }
        return left.index - right.index;
      })
      .map((entry) => entry.component)
  );

  const children = Object.freeze(spec.children.map((child) => Widget(child)));

  return Object.freeze({
    components: orderedComponents,
    children,
  });
}
