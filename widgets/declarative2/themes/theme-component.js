/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
/** @typedef {import("../types.js").ContextPath} ContextPath */
/** @typedef {import("../types.js").ThemeDescriptor} ThemeDescriptor */
/** @typedef {import("../types.js").StyleMap} StyleMap */
import { ComponentSpec } from "../component-specs.js";

/**
 * Provides a theme value under the context path `["theme", ...path]`.
 *
 * @param {ContextPath} path
 * @param {StyleMap} style
 * @param {ContextPath} [extendsPath]
 * @returns {ComponentSpecType}
 */
export function themeComponent(path, style, extendsPath) {
  const themePath = Object.freeze(["theme", ...path]);

  /** @type {ThemeDescriptor} */
  const theme = extendsPath
    ? ({
        extends: extendsPath,
        values: style
      })
    : style;

  return ComponentSpec(() => ({
    create(widget) {
      widget.provideContext(themePath, theme);
    },
    destroy(widget) {
      widget.revokeContext(themePath);
    }
  }));
}
