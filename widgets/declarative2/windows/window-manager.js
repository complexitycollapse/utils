/** @typedef {import("../types.js").Widget} Widget */
/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "../component-specs.js";
import { createChildSendUpMessage } from "../widget.js";
import { WINDOW_CAPABILITY } from "./window-component.js";

export const WINDOW_MANAGER_CAPABILITY = Symbol("windowManagerCapability");

/**
 * @typedef {{
 *   openWindow: (windowSpec: ComponentSpecType) => Promise<Widget>,
 *   closeWindow: (name: string, message?: unknown) => Promise<void>,
 *   getWindow: (name: string) => Widget | undefined
 * }} WindowManagerCapability
 */

/**
 * @param {Widget} window
 * @returns {string | undefined}
 */
function getWindowName(window) {
  const capability = /** @type {{ getName?: () => string } | undefined} */ (
    window.getCapability(WINDOW_CAPABILITY)
  );
  if (!capability || typeof capability.getName !== "function") {
    return undefined;
  }
  return capability.getName();
}

/**
 * @returns {ComponentSpecType}
 */
export function windowManagerComponent() {
  return ComponentSpec(() => {
    /** @type {Map<string, Widget>} */
    const windowsByName = new Map();

    /** @type {WindowManagerCapability} */
    const manager = {
      async openWindow(windowSpec) {
        const window = widget.addChild(windowSpec);
        await window.create();

        const name = getWindowName(window);
        if (name !== undefined) {
          windowsByName.set(name, window);
        }

        return window;
      },

      async closeWindow(name, message) {
        const window = manager.getWindow(name);
        if (!window) {
          return;
        }

        const routedMessage = message !== undefined
          ? createChildSendUpMessage(widget, window, message)
          : undefined;

        await widget.removeChild(window);
        windowsByName.delete(name);

        if (message !== undefined) {
          widget.send(routedMessage);
          widget.sendUp(routedMessage);
        }
      },

      getWindow(name) {
        const knownWindow = windowsByName.get(name);
        if (knownWindow && widget.children.includes(knownWindow)) {
          return knownWindow;
        }
        windowsByName.delete(name);

        for (const child of widget.children) {
          const childName = getWindowName(child);
          if (childName === name) {
            windowsByName.set(name, child);
            return child;
          }
        }

        return undefined;
      }
    };

    /** @type {Widget} */
    let widget;

    return {
      create(nextWidget) {
        widget = nextWidget;
        widget.provideCapability(WINDOW_MANAGER_CAPABILITY, manager);
      },
      destroy(nextWidget) {
        windowsByName.clear();
        nextWidget.revokeCapability(WINDOW_MANAGER_CAPABILITY);
      }
    };
  });
}
