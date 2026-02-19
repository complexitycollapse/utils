import { describe, expect, it } from "vitest";

import { WidgetSpec } from "./widget-spec.js";
import { Widget } from "./widget.js";

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

  it("returns a frozen widget object with mutable children list", () => {
    const widget = Widget(WidgetSpec());

    expect(Object.isFrozen(widget)).toBe(true);
    expect(Object.isFrozen(widget.components)).toBe(true);
    expect(Object.isFrozen(widget.children)).toBe(false);
  });

  it("supports addChild, removeChild and clear", () => {
    const parent = Widget(WidgetSpec());
    const childA = Widget(WidgetSpec().withComponent({ id: "a" }));
    const childB = Widget(WidgetSpec().withComponent({ id: "b" }));

    parent.addChild(childA);
    parent.addChild(childB);
    expect(parent.children).toHaveLength(2);

    expect(parent.removeChild(childA)).toBe(true);
    expect(parent.children).toEqual([childB]);
    expect(parent.removeChild(childA)).toBe(false);

    parent.clear();
    expect(parent.children).toHaveLength(0);
  });

  it("dispatches lifecycle and render/focus methods to components", () => {
    /** @type {Array<string>} */
    const calls = [];
    const component = {
      id: "c",
      priority: 0,
      events: [],
      capabilities: [],
      create: () => calls.push("create"),
      destroy: () => calls.push("destroy"),
      buildChildren: () => {},
      measure: () => {},
      layout: () => {},
      render: () => calls.push("render"),
      applyStyle: () => {},
      onPointerDown: () => {},
      onPointerUp: () => {},
      onClick: () => {},
      onKeyDown: () => {},
      onKeyUp: () => {},
      onFocus: () => calls.push("focus"),
      onBlur: () => {},
      onEvent: () => {},
    };
    const widget = Widget(WidgetSpec().withComponent(component));

    widget.create();
    widget.render();
    widget.focus();
    widget.destroy();

    expect(calls).toEqual(["create", "render", "focus", "destroy"]);
  });

  it("uses an internal context per widget instance", () => {
    /** @type {Array<string>} */
    const seenIds = [];
    const childComponent = {
      id: "child",
      priority: 0,
      events: [],
      capabilities: [],
      create: (/** @type {import("./type.js").WidgetContext} */ ctx) =>
        seenIds.push(ctx.widgetId),
      destroy: () => {},
      buildChildren: () => {},
      measure: () => {},
      layout: () => {},
      render: () => {},
      applyStyle: () => {},
      onPointerDown: () => {},
      onPointerUp: () => {},
      onClick: () => {},
      onKeyDown: () => {},
      onKeyUp: () => {},
      onFocus: () => {},
      onBlur: () => {},
      onEvent: () => {},
    };
    const parentComponent = {
      ...childComponent,
      id: "parent",
      create: (/** @type {import("./type.js").WidgetContext} */ ctx) =>
        seenIds.push(ctx.widgetId),
    };
    const childSpec = WidgetSpec().withComponent(childComponent);
    const parentSpec = WidgetSpec().withComponent(parentComponent).withChild(childSpec);
    const parent = Widget(parentSpec);

    parent.create();

    expect(seenIds).toHaveLength(2);
    expect(seenIds[0]).not.toBe(seenIds[1]);
  });
});
