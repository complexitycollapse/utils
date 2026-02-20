/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").WidgetComponent} WidgetComponent */
/** @typedef {import("./types.js").WidgetEventHandler} WidgetEventHandler */

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
  "pointercancel",
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

  /**
   * @param {Widget} child
   */
  function mountChild(child) {
    for (const component of components) {
      component.mountChild?.(widget, child);
    }
  }

  /**
   * @param {Widget} child
   */
  function unmountChild(child) {
    for (const component of components) {
      component.unmountChild?.(widget, child);
    }
  }

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
      if (isShown) {
        widget.hide();
      }

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
      if (isShown) {
        child.show();
        mountChild(child);
      }
    },

    /** @param {Widget} child */
    removeChild(child) {
      const index = children.indexOf(child);
      if (index === -1) {
        return;
      }

      if (isShown) {
        unmountChild(child);
        child.hide();
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
      for (const child of children) {
        mountChild(child);
      }
      registerEventHandlers();
    },

    hide() {
      if (!isShown) {
        return;
      }

      isShown = false;
      unregisterEventHandlers();
      for (const child of children) {
        unmountChild(child);
      }
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
