/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { ComponentSpec } from "../component-specs.js";
import { withElement } from "./style-helpers.js";

/**
 * @param {string | string[]} classNames
 * @returns {ComponentSpecType}
 */
export function classComponent(classNames) {
  const names = Array.isArray(classNames) ? classNames : [classNames];

  return ComponentSpec(() => ({
    mount(widget) {
      withElement(widget, (element) => {
        element.classList.add(...names);
      });
    },
    unmount(widget) {
      withElement(widget, (element) => {
        element.classList.remove(...names);
      });
    }
  }));
}
