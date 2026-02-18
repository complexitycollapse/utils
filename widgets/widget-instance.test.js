import { describe, expect, it } from "vitest";

import { WidgetSpec } from "./widget-spec.js";
import { Widget } from "./widget-instance.js";

describe("Widget", () => {
  it("orders components by priority, then append order", () => {
    const spec = WidgetSpec()
      .withComponent({ id: "p2-a", priority: 2 })
      .withComponent({ id: "p1-a", priority: 1 })
      .withComponent({ id: "p2-b", priority: 2 })
      .withComponent({ id: "p0-a" });

    const widget = Widget(spec);

    expect(widget.components.map((component) => component.id)).toEqual([
      "p0-a",
      "p1-a",
      "p2-a",
      "p2-b",
    ]);
  });

  it("creates child widgets recursively", () => {
    const child = WidgetSpec().withComponent({ id: "child-component", priority: 5 });
    const parent = WidgetSpec().withChild(child);

    const widget = Widget(parent);

    expect(widget.children).toHaveLength(1);
    const firstChild = widget.children[0];
    if (!firstChild) {
      throw new Error("expected one child");
    }
    expect(firstChild.components.map((component) => component.id)).toEqual([
      "child-component",
    ]);
  });

  it("returns frozen widget objects", () => {
    const widget = Widget(WidgetSpec());

    expect(Object.isFrozen(widget)).toBe(true);
    expect(Object.isFrozen(widget.components)).toBe(true);
    expect(Object.isFrozen(widget.children)).toBe(true);
  });
});
