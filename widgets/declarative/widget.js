/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").WidgetComponent} WidgetComponent */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpec */
/** @typedef {import("./types.js").ChildChannel} ChildChannel */
/** @typedef {import("./types.js").ChildChannelMessage} ChildChannelMessage */
/** @typedef {import("./types.js").CapabilityToken} CapabilityToken */
/** @typedef {import("./types.js").WidgetEventHandler} WidgetEventHandler */
/** @typedef {import("./types.js").WidgetCatchAllEventHandler} WidgetCatchAllEventHandler */

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

const INTERNAL = Symbol("widgetInternal");

/**
 * @typedef {{
 *   mountTree: () => Promise<void>,
 *   activateTree: () => Promise<void>,
 *   enterTree: () => Promise<void>,
 *   exitTree: () => Promise<void>,
 *   deactivateTree: () => Promise<void>,
 *   unmountTree: (detachedByAncestor: boolean) => Promise<void>,
 *   destroyTree: (detachedByAncestor: boolean) => Promise<void>,
 *   getChildChannel: (child: Widget) => ChildChannel | undefined
 * }} WidgetInternal
 */

/**
 * @param {unknown} value
 * @returns {value is Promise<unknown>}
 */
function isPromise(value) {
  return typeof value === "object" && value !== null && "then" in value;
}

/**
 * @param {Widget} widget
 * @returns {WidgetInternal}
 */
function getInternal(widget) {
  return /** @type {WidgetInternal} */ (/** @type {any} */ (widget)[INTERNAL]);
}

/**
 * @param {unknown} value
 */
function fireAndForget(value) {
  if (isPromise(value)) {
    void value;
  }
}

/**
 * @param {ComponentSpec} left
 * @param {ComponentSpec} right
 * @returns {ComponentSpec}
 */
function combineComponentSpecs(left, right) {
  /** @type {ComponentSpec} */
  const componentSpec = {
    instantiate() {
      return left.instantiate();
    },

    /** @param {ComponentSpec} other */
    with(other) {
      return combineComponentSpecs(componentSpec, other);
    },

    instantiateAll() {
      return Object.freeze([...left.instantiateAll(), ...right.instantiateAll()]);
    }
  };

  return Object.freeze(componentSpec);
}

/**
 * @param {() => WidgetComponent} instantiate
 * @returns {ComponentSpec}
 */
export function ComponentSpec(instantiate) {
  /** @type {ComponentSpec} */
  const componentSpec = {
    instantiate,

    /** @param {ComponentSpec} other */
    with(other) {
      return combineComponentSpecs(componentSpec, other);
    },

    instantiateAll() {
      return Object.freeze([instantiate()]);
    }
  };

  return Object.freeze(componentSpec);
}

/**
 * @param {ComponentSpec} childSpec
 * @returns {ComponentSpec}
 */
export function childComponentSpec(childSpec) {
  return childComponentSpecWithOptions(childSpec);
}

/**
 * @param {ComponentSpec} childSpec
 * @param {{ channel?: ChildChannel }} [options]
 * @returns {ComponentSpec}
 */
export function childComponentSpecWithOptions(childSpec, options = {}) {
  return ComponentSpec(() => {
    let hasCreatedChild = false;

    return {
      createChildren(widget) {
        if (hasCreatedChild) {
          return;
        }

        hasCreatedChild = true;
        widget.addChild(childSpec, options);
      }
    };
  });
}

/**
 * @param {ComponentSpec} componentSpec
 * @returns {Widget}
 */
export function createWidget(componentSpec) {
  const components = componentSpec.instantiateAll();
  /** @type {Widget[]} */
  const children = [];
  /** @type {Map<Widget, ChildChannel>} */
  const childChannels = new Map();
  /** @type {Map<CapabilityToken, unknown>} */
  const capabilities = new Map();

  /** @type {Widget | undefined} */
  let parent = undefined;
  /** @type {HTMLElement | undefined} */
  let element = undefined;
  /** @type {HTMLElement | undefined} */
  let eventElement = undefined;
  /** @type {Map<string, (event: Event) => void>} */
  const registeredHandlers = new Map();
  let isCreated = false;
  let isMounted = false;
  let isActive = false;
  let isShown = false;
  let isDestroyed = false;
  let lifecycleQueue = Promise.resolve();

  /**
   * @param {Widget} child
   */
  function mountChild(child) {
    for (const component of components) {
      fireAndForget(component.mountChild?.(widget, child));
    }
  }

  /**
   * @param {Widget} child
   */
  function unmountChild(child) {
    for (const component of components) {
      fireAndForget(component.unmountChild?.(widget, child));
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

    /** @type {Set<string>} */
    const subscribedEventTypes = new Set();

    for (const component of components) {
      if (!Array.isArray(component.eventTypes)) {
        continue;
      }
      for (const eventType of component.eventTypes) {
        if (typeof eventType === "string" && eventType.length > 0) {
          subscribedEventTypes.add(eventType);
        }
      }
    }

    for (const eventType of UI_EVENT_TYPES) {
      const hasSpecificHandler = components.some(
        (component) =>
          typeof /** @type {unknown} */ (component[eventType]) === "function"
      );

      if (hasSpecificHandler) {
        subscribedEventTypes.add(eventType);
      }
    }

    for (const eventType of subscribedEventTypes) {
      /** @param {Event} event */
      const handler = (event) => {
        for (const component of components) {
          const componentHandler = /** @type {WidgetEventHandler | undefined} */ (
            component[eventType]
          );
          fireAndForget(componentHandler?.(widget, event));
          const onEvent = /** @type {WidgetCatchAllEventHandler | undefined} */ (
            component.onEvent
          );
          fireAndForget(onEvent?.(widget, eventType, event));
        }
      };

      registeredHandlers.set(eventType, handler);
      element.addEventListener(eventType, handler);
    }

    eventElement = element;
  }

  /**
   * @template {keyof WidgetComponent} T
   * @param {T} hookName
   */
  async function runHook(hookName) {
    for (const component of components) {
      const hook = component[hookName];
      if (typeof hook !== "function") {
        continue;
      }
      await hook(widget);
    }
  }

  async function createInternal() {
    if (isCreated || isDestroyed) {
      return;
    }

    await runHook("create");
    await runHook("createChildren");
    isCreated = true;
  }

  async function mountTree() {
    if (isMounted || isDestroyed) {
      return;
    }

    await createInternal();
    await runHook("mount");

    for (const child of children) {
      await getInternal(child).mountTree();
      mountChild(child);
    }

    isMounted = true;
  }

  async function activateTree() {
    if (isActive || isDestroyed) {
      return;
    }

    await runHook("activate");
    registerEventHandlers();
    for (const child of children) {
      await getInternal(child).activateTree();
    }

    isActive = true;
  }

  async function enterTree() {
    if (isShown || isDestroyed) {
      return;
    }

    await runHook("enter");
    for (const child of children) {
      await getInternal(child).enterTree();
    }

    isShown = true;
  }

  async function exitTree() {
    if (!isShown) {
      return;
    }

    for (const child of children) {
      await getInternal(child).exitTree();
    }
    await runHook("exit");

    isShown = false;
  }

  async function deactivateTree() {
    if (!isActive) {
      return;
    }

    for (const child of children) {
      await getInternal(child).deactivateTree();
    }

    unregisterEventHandlers();
    await runHook("deactivate");

    isActive = false;
  }

  /**
   * @param {boolean} detachedByAncestor
   */
  async function unmountTree(detachedByAncestor) {
    if (!isMounted) {
      return;
    }

    for (const child of children) {
      if (!detachedByAncestor) {
        unmountChild(child);
      }
      await getInternal(child).unmountTree(true);
    }

    await runHook("unmount");
    isMounted = false;
  }

  /**
   * @param {boolean} detachedByAncestor
   */
  async function destroyTree(detachedByAncestor) {
    if (isDestroyed) {
      return;
    }

    await exitTree();
    await deactivateTree();
    await unmountTree(detachedByAncestor);

    for (const child of [...children]) {
      await getInternal(child).destroyTree(true);
      childChannels.delete(child);
      child.parent = undefined;
    }
    children.length = 0;

    await runHook("destroy");

    isCreated = false;
    isDestroyed = true;
    capabilities.clear();
    element = undefined;
  }

  /**
   * @param {() => Promise<void>} fn
   * @returns {Promise<void>}
   */
  function enqueue(fn) {
    const run = lifecycleQueue.then(fn);
    lifecycleQueue = run.catch(() => {});
    return run;
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
      return enqueue(async () => {
        await createInternal();
      });
    },

    destroy() {
      return enqueue(async () => {
        await destroyTree(false);
      });
    },

    /**
     * @param {ComponentSpec} childSpec
     * @param {{ channel?: ChildChannel }} [options]
     */
    addChild(childSpec, options = {}) {
      const child = createWidget(childSpec);
      children.push(child);
      if (options.channel !== undefined) {
        childChannels.set(child, options.channel);
      }
      child.parent = widget;

      if (isMounted || isActive || isShown) {
        void enqueue(async () => {
          if (!children.includes(child)) {
            return;
          }

          await getInternal(child).mountTree();
          mountChild(child);

          if (isActive) {
            await getInternal(child).activateTree();
          }
          if (isShown) {
            await getInternal(child).enterTree();
          }
        });
      }

      return child;
    },

    /** @param {Widget} child */
    removeChild(child) {
      return enqueue(async () => {
        const index = children.indexOf(child);
        if (index === -1) {
          return;
        }

        const childInternal = getInternal(child);
        await childInternal.exitTree();
        await childInternal.deactivateTree();

        if (isMounted) {
          unmountChild(child);
        }
        await childInternal.unmountTree(true);

        children.splice(index, 1);
        childChannels.delete(child);
        child.parent = undefined;
        await childInternal.destroyTree(true);
      });
    },

    show() {
      return enqueue(async () => {
        await mountTree();
        await activateTree();
        await enterTree();
      });
    },

    hide() {
      return enqueue(async () => {
        await exitTree();
        await deactivateTree();
        await unmountTree(false);
      });
    },

    /** @param {unknown} data */
    send(data) {
      for (const component of components) {
        fireAndForget(component.receive?.(widget, data));
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

      const parentInternal = getInternal(parent);
      const channel = parentInternal.getChildChannel(widget);
      if (channel === undefined) {
        parent.send(data);
        parent.sendUp(data);
        return;
      }

      /** @type {ChildChannelMessage} */
      const channelMessage = {
        channel,
        payload: data,
        child: widget
      };
      parent.send(channelMessage);
      parent.sendUp(channelMessage);
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
    },

    provideCapability(token, capability) {
      capabilities.set(token, capability);
    },

    revokeCapability(token) {
      capabilities.delete(token);
    },

    getCapability(token) {
      return capabilities.get(token);
    }
  };

  /** @type {WidgetInternal} */
  const internal = {
    mountTree,
    activateTree,
    enterTree,
    exitTree,
    deactivateTree,
    unmountTree,
    destroyTree,
    getChildChannel(child) {
      return childChannels.get(child);
    }
  };

  Object.defineProperty(widget, INTERNAL, {
    value: internal,
    enumerable: false
  });

  return widget;
}
