/** @typedef {import("./types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("./types.js").ContextPath} ContextPath */
import { ComponentSpec } from "./component-specs.js";

/**
 * Adds context under a hierarchical path made of string/symbol segments.
 *
 * @param {ContextPath} path
 * @param {unknown} value
 * @returns {ComponentSpecType}
 */
export function contextComponent(path, value) {
  return ComponentSpec(() => ({
    create(widget) {
      widget.provideContext(path, value);
    },
    destroy(widget) {
      widget.revokeContext(path);
    }
  }));
}
