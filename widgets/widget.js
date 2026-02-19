/**
 * @typedef {(widget: Widget, event: Event) => void} WidgetEventHandler
 */

/**
 * @typedef {{
 *   readonly components: WidgetComponent[],
 *   readonly children: Widget[],
  *   parent: Widget | undefined,
 *   element: HTMLElement | undefined,
 *   create: () => void,
 *   destroy: () => void,
 *   addChild: (child: Widget) => void,
 *   removeChild: (child: Widget) => void,
 *   show: () => void,
 *   hide: () => void,
 *   send: (data: unknown) => void,
 *   sendDown: (data: unknown) => void,
 *   sendUp: (data: unknown) => void,
 *   sendSiblings: (data: unknown) => void
 * }} Widget
 */

/**
 * @typedef {{
 *   create?: (widget: Widget) => void,
 *   destroy?: (widget: Widget) => void,
 *   beforeShow?: (widget: Widget) => void,
 *   afterShow?: (widget: Widget) => void,
 *   hide?: (widget: Widget) => void,
 *   receive?: (widget: Widget, data: unknown) => void,
 *   click?: WidgetEventHandler,
 *   dblclick?: WidgetEventHandler,
 *   input?: WidgetEventHandler,
 *   change?: WidgetEventHandler,
 *   submit?: WidgetEventHandler,
 *   focus?: WidgetEventHandler,
 *   blur?: WidgetEventHandler,
 *   keydown?: WidgetEventHandler,
 *   keyup?: WidgetEventHandler,
 *   mousedown?: WidgetEventHandler,
 *   mouseup?: WidgetEventHandler,
 *   mousemove?: WidgetEventHandler,
 *   mouseenter?: WidgetEventHandler,
 *   mouseleave?: WidgetEventHandler,
 *   pointerdown?: WidgetEventHandler,
 *   pointerup?: WidgetEventHandler,
 *   pointermove?: WidgetEventHandler,
 *   [key: string]: unknown
 * }} WidgetComponent
 */

const UI_EVENT_TYPES = [
  "click",
  "dblclick",
  "input",
  "change",
  "submit",
  "focus",
  "blur",
  "keydown",
  "keyup",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseenter",
  "mouseleave",
  "pointerdown",
  "pointerup",
  "pointermove"
];

/**
 * @returns {Widget}
 */
export function createWidget() {
  /** @type {WidgetComponent[]} */
  const components = [];
  /** @type {Widget[]} */
  const children = [];

  /** @type {Widget | undefined} */
  let parent = undefined;
  /** @type {HTMLElement | undefined} */
  let element = undefined;
  /** @type {HTMLElement | undefined} */
  let eventElement = undefined;
  /** @type {Map<string, (event: Event) => void>} */
  const registeredHandlers = new Map();
  let isShown = false;

  function unregisterEventHandlers() {
    if (!eventElement) {
      return;
    }

    for (const [eventType, handler] of registeredHandlers) {
      eventElement.removeEventListener(eventType, handler);
    }
    registeredHandlers.clear();
    eventElement = undefined;
  }

  function registerEventHandlers() {
    if (!element) {
      return;
    }

    for (const eventType of UI_EVENT_TYPES) {
      const hasComponentHandler = components.some(
        (component) =>
          typeof /** @type {unknown} */ (component[eventType]) === "function"
      );

      if (!hasComponentHandler) {
        continue;
      }

      /** @param {Event} event */
      const handler = (event) => {
        for (const component of components) {
          const componentHandler = /** @type {WidgetEventHandler | undefined} */ (
            component[eventType]
          );
          componentHandler?.(widget, event);
        }
      };

      registeredHandlers.set(eventType, handler);
      element.addEventListener(eventType, handler);
    }

    eventElement = element;
  }

  /** @type {Widget} */
  const widget = {
    get components() {
      return components;
    },

    get children() {
      return children;
    },

    get parent() {
      return parent;
    },

    get element() {
      return element;
    },

    /** @param {HTMLElement | undefined} nextElement */
    set element(nextElement) {
      element = nextElement;
    },

    /** @param {Widget | undefined} nextParent */
    set parent(nextParent) {
      parent = nextParent;
    },

    create() {
      for (const component of components) {
        component.create?.(widget);
      }
    },

    destroy() {
      for (const component of components) {
        component.destroy?.(widget);
      }
    },

    /** @param {Widget} child */
    addChild(child) {
      if (children.includes(child)) {
        return;
      }

      children.push(child);
      child.parent = widget;
      child.create();
    },

    /** @param {Widget} child */
    removeChild(child) {
      const index = children.indexOf(child);
      if (index === -1) {
        return;
      }

      children.splice(index, 1);
      child.destroy();
      child.parent = undefined;
    },

    show() {
      if (isShown) {
        return;
      }

      isShown = true;
      for (const component of components) {
        component.beforeShow?.(widget);
      }
      for (const child of children) {
        child.show();
      }
      for (const component of components) {
        component.afterShow?.(widget);
      }
      registerEventHandlers();
    },

    hide() {
      if (!isShown) {
        return;
      }

      isShown = false;
      unregisterEventHandlers();
      for (const component of components) {
        component.hide?.(widget);
      }
      for (const child of children) {
        child.hide();
      }
    },

    /** @param {unknown} data */
    send(data) {
      for (const component of components) {
        component.receive?.(widget, data);
      }
    },

    /** @param {unknown} data */
    sendDown(data) {
      for (const child of children) {
        child.send(data);
        child.sendDown(data);
      }
    },

    /** @param {unknown} data */
    sendUp(data) {
      if (!parent) {
        return;
      }

      parent.send(data);
      parent.sendUp(data);
    },

    /** @param {unknown} data */
    sendSiblings(data) {
      if (!parent) {
        return;
      }

      for (const sibling of parent.children) {
        if (sibling === widget) {
          continue;
        }
        sibling.send(data);
      }
    }
  };

  return widget;
}
