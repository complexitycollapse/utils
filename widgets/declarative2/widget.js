/** @typedef {import("./types.js").Widget} Widget */
/** @typedef {import("./types.js").WidgetComponent} WidgetComponent */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("./types.js").ChildChannel} ChildChannel */
/** @typedef {import("./types.js").ChildChannelMessage} ChildChannelMessage */
/** @typedef {import("./types.js").CapabilityToken} CapabilityToken */
/** @typedef {import("./types.js").ContextPath} ContextPath */
/** @typedef {import("./types.js").ContextPathSegment} ContextPathSegment */
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
 *   getChildChannel: (child: Widget) => ChildChannel | undefined,
 *   getOwnCapability: (token: CapabilityToken) => unknown,
 *   getOwnContext: (path: ContextPath) => unknown
 * }} WidgetInternal
 */

/**
 * @typedef {{
 *   value: unknown,
 *   children: Map<ContextPathSegment, ContextNode>
 * }} ContextNode
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
 * @returns {ContextNode}
 */
function createContextNode() {
  return {
    value: undefined,
    children: new Map()
  };
}

/**
 * Builds the exact payload that would be sent if `child.sendUp(data)` were invoked.
 * If the child has a channel in `parent`, returns a channel message envelope.
 *
 * @param {Widget} parent
 * @param {Widget} child
 * @param {unknown} data
 * @returns {unknown}
 */
export function createChildSendUpMessage(parent, child, data) {
  const parentInternal = getInternal(parent);
  const channel = parentInternal.getChildChannel(child);
  if (channel === undefined) {
    return data;
  }

  /** @type {ChildChannelMessage} */
  const channelMessage = {
    channel,
    payload: data,
    child
  };
  return channelMessage;
}

/**
 * @param {ComponentSpecType} componentSpec
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
  /** @type {ContextNode} */
  const context = createContextNode();

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

  /**
   * @param {ContextPath} path
   * @returns {ContextNode | undefined}
   */
  function getContextNode(path) {
    let node = context;
    for (const segment of path) {
      const child = node.children.get(segment);
      if (!child) {
        return undefined;
      }
      node = child;
    }
    return node;
  }

  /**
   * @param {ContextPath} path
   * @returns {ContextNode}
   */
  function materializeContextPath(path) {
    let node = context;
    for (const segment of path) {
      const child = node.children.get(segment);
      if (child) {
        node = child;
        continue;
      }
      const next = createContextNode();
      node.children.set(segment, next);
      node = next;
    }
    return node;
  }

  /**
   * @param {ContextPath} path
   * @returns {unknown}
   */
  function getOwnContext(path) {
    return getContextNode(path)?.value;
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
    context.children.clear();
    context.value = undefined;
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
     * @param {ComponentSpecType} childSpec
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

      const message = createChildSendUpMessage(parent, widget, data);
      parent.send(message);
      parent.sendUp(message);
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
      /** @type {Widget | undefined} */
      let current = widget;
      while (current) {
        const capability = getInternal(current).getOwnCapability(token);
        if (capability !== undefined) {
          return capability;
        }
        current = current.parent;
      }
      return undefined;
    },

    provideContext(path, value) {
      materializeContextPath(path).value = value;
    },

    revokeContext(path) {
      const node = getContextNode(path);
      if (!node) {
        return;
      }
      node.value = undefined;
    },

    getOwnContext(path) {
      return getOwnContext(path);
    },

    getContext(path) {
      /** @type {Widget | undefined} */
      let current = widget;
      while (current) {
        const value = getInternal(current).getOwnContext(path);
        if (value !== undefined) {
          return value;
        }
        current = current.parent;
      }
      return undefined;
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
    },
    getOwnCapability(token) {
      return capabilities.get(token);
    },
    getOwnContext(path) {
      return getOwnContext(path);
    }
  };

  Object.defineProperty(widget, INTERNAL, {
    value: internal,
    enumerable: false
  });

  return widget;
}
