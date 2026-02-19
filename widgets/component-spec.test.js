import { describe, expect, it } from "vitest";

import { ComponentSpec } from "./component-spec.js";

describe("ComponentSpec", () => {
  it("normalizes omitted hooks to no-op functions", () => {
    const spec = ComponentSpec();

    expect(typeof spec.create).toBe("function");
    expect(typeof spec.destroy).toBe("function");
    expect(typeof spec.buildChildren).toBe("function");
    expect(typeof spec.measure).toBe("function");
    expect(typeof spec.layout).toBe("function");
    expect(typeof spec.render).toBe("function");
    expect(typeof spec.applyStyle).toBe("function");
    expect(typeof spec.onPointerDown).toBe("function");
    expect(typeof spec.onPointerUp).toBe("function");
    expect(typeof spec.onClick).toBe("function");
    expect(typeof spec.onKeyDown).toBe("function");
    expect(typeof spec.onKeyUp).toBe("function");
    expect(typeof spec.onFocus).toBe("function");
    expect(typeof spec.onBlur).toBe("function");
    expect(typeof spec.onEvent).toBe("function");
    expect(spec.priority).toBe(0);
    expect(spec.events).toEqual([]);
    expect(spec.capabilities).toEqual([]);
  });

  it("auto-registers events for implemented handlers and merges explicit events", () => {
    const spec = ComponentSpec({
      events: ["custom", "click"],
      onClick: () => {},
      onKeyDown: () => {},
    });

    expect(spec.events).toEqual(["custom", "click", "keydown"]);
  });

  it("defaults invalid priority values to 0", () => {
    expect(ComponentSpec({ priority: Number.NaN }).priority).toBe(0);
  });

  it("returns frozen objects and arrays", () => {
    const spec = ComponentSpec({ events: ["click"], capabilities: ["focus"] });

    expect(Object.isFrozen(spec)).toBe(true);
    expect(Object.isFrozen(spec.events)).toBe(true);
    expect(Object.isFrozen(spec.capabilities)).toBe(true);
  });
});
