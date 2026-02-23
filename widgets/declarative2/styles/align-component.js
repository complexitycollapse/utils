/** @typedef {import("../types.js").ComponentSpec} ComponentSpecType */
import { styleComponent } from "./style-component.js";

/**
 * @param {"start" | "center" | "end"} [horizontal]
 * @param {"start" | "center" | "end"} [vertical]
 * @returns {ComponentSpecType}
 */
export function alignComponent(horizontal = "center", vertical = "center") {
  const justifyMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end"
  };

  const textAlignMap = {
    start: "left",
    center: "center",
    end: "right"
  };

  return styleComponent({
    display: "flex",
    justifyContent: justifyMap[horizontal],
    alignItems: justifyMap[vertical],
    textAlign: textAlignMap[horizontal]
  });
}
