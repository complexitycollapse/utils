import { describe, expect, it } from "vitest";

import { WidgetSpec } from "./widget-spec.js";

describe("WidgetSpec", () => {
  it("returns a singleton empty spec", () => {
    expect(WidgetSpec()).toBe(WidgetSpec());
  });

  it("append-only withComponent returns a new spec", () => {
    const base = WidgetSpec();
    const next = base.withComponent({ id: "a", onClick: () => {} });

    expect(next).not.toBe(base);
    expect(base.components).toHaveLength(0);
    expect(next.components).toHaveLength(1);
    const firstComponent = next.components[0];
    if (!firstComponent) {
      throw new Error("expected one component");
    }
    expect(firstComponent.id).toBe("a");
    expect(firstComponent.events).toEqual(["click"]);
  });

  it("append-only withChild returns a new spec", () => {
    const child = WidgetSpec().withComponent({ id: "child" });
    const base = WidgetSpec();
    const next = base.withChild(child);

    expect(next).not.toBe(base);
    expect(base.children).toHaveLength(0);
    expect(next.children).toHaveLength(1);
    expect(next.children[0]).toBe(child);
  });

  it("returns frozen arrays", () => {
    const spec = WidgetSpec().withComponent({ id: "a" }).withChild(WidgetSpec());

    expect(Object.isFrozen(spec)).toBe(true);
    expect(Object.isFrozen(spec.components)).toBe(true);
    expect(Object.isFrozen(spec.children)).toBe(true);
  });
});
