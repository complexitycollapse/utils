// @ts-check

/**
 * @typedef {import("./type.js").ComponentSpec} ComponentSpec
 * @typedef {import("./type.js").WidgetContext} WidgetContext
 * @typedef {import("./type.js").WidgetSpec} WidgetSpecType
 * @typedef {import("./type.js").Widget} WidgetType
 */

let nextWidgetId = 1;
const DEFAULT_RENDER_API = Object.freeze({
  ensureElement() {
    return undefined;
  },
});
const FOCUS_EVENT = Object.freeze({ type: "focus" });

/**
 * Creates a retained widget from an immutable `WidgetSpec`.
 * Components are ordered by priority (ascending), then by append order.
 *
 * @param {WidgetSpecType} spec
 * @returns {WidgetType}
 */
export function Widget(spec) {
  /** @type {WidgetContext} */
  const context = { widgetId: `widget-${nextWidgetId}` };
  nextWidgetId += 1;
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

  /** @type {Array<WidgetType>} */
  const children = spec.children.map((child) => Widget(child));

  return Object.freeze({
    components: orderedComponents,
    children,
    create() {
      for (const component of orderedComponents) {
        component.create(context);
      }
      for (const child of [...children]) {
        child.create();
      }
    },
    destroy() {
      for (const child of [...children]) {
        child.destroy();
      }
      for (let i = orderedComponents.length - 1; i >= 0; i -= 1) {
        const component = orderedComponents[i];
        if (!component) {
          throw new Error("component unexpectedly undefined");
        }
        component.destroy(context);
      }
    },
    addChild(child) {
      children.push(child);
    },
    removeChild(child) {
      const index = children.indexOf(child);
      if (index < 0) {
        return false;
      }
      children.splice(index, 1);
      return true;
    },
    clear() {
      children.length = 0;
    },
    render() {
      for (const component of orderedComponents) {
        component.render(context, DEFAULT_RENDER_API);
      }
      for (const child of [...children]) {
        child.render();
      }
    },
    focus() {
      for (const component of orderedComponents) {
        component.onFocus(context, FOCUS_EVENT);
      }
    },
  });
}
