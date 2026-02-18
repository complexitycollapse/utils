import { describe, expect, it } from "vitest";

import { WidgetSpec } from "./widget-spec.js";
import { widgetInstanceFromSpec } from "./widget-instance.js";

describe("widgetInstanceFromSpec", () => {
  it("orders components by priority, then append order", () => {
    const spec = WidgetSpec()
      .withComponent({ id: "p2-a", priority: 2 })
      .withComponent({ id: "p1-a", priority: 1 })
      .withComponent({ id: "p2-b", priority: 2 })
      .withComponent({ id: "p0-a" });

    const instance = widgetInstanceFromSpec(spec);

    expect(instance.components.map((component) => component.id)).toEqual([
      "p0-a",
      "p1-a",
      "p2-a",
      "p2-b",
    ]);
  });

  it("creates child instances recursively", () => {
    const child = WidgetSpec().withComponent({ id: "child-component", priority: 5 });
    const parent = WidgetSpec().withChild(child);

    const instance = widgetInstanceFromSpec(parent);

    expect(instance.children).toHaveLength(1);
    const firstChild = instance.children[0];
    if (!firstChild) {
      throw new Error("expected one child");
    }
    expect(firstChild.components.map((component) => component.id)).toEqual([
      "child-component",
    ]);
  });

  it("returns frozen instance objects", () => {
    const instance = widgetInstanceFromSpec(WidgetSpec());

    expect(Object.isFrozen(instance)).toBe(true);
    expect(Object.isFrozen(instance.components)).toBe(true);
    expect(Object.isFrozen(instance.children)).toBe(true);
  });
});
