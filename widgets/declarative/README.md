# Declarative Composable Widgets

This package builds widgets from immutable `ComponentSpec` values. A widget is defined entirely by
its components.

## Component Spec Contract

`ComponentSpec` is immutable and composable:

- `ComponentSpec(instantiate)` creates a spec from a component factory.
- `specA.with(specB)` returns a new spec containing both.
- `createWidget(spec)` instantiates all components in order.

Example:

```js
const titleSpec = divComponent()
  .with(textComponent("Hello"))
  .with(classComponent("title"));

const widget = createWidget(titleSpec);
```

## Component Contract

A component is a POJO with optional hooks. Hooks may return `void` or `Promise<void>`.

### Lifecycle hooks

- `create(widget)`
- `createChildren(widget)`
- `mount(widget)`
- `activate(widget)`
- `enter(widget)`
- `exit(widget)`
- `deactivate(widget)`
- `unmount(widget)`
- `destroy(widget)`

### Child mount hooks

- `mountChild(widget, child)`
- `unmountChild(widget, child)`

### Messaging/event hooks

- `receive(widget, data)`
- `onEvent(widget, eventType, event)`
- Specific event handlers: `click`, `input`, `pointerdown`, etc.
- Optional `eventTypes: string[]` for explicit subscriptions.

## Widget Contract

`Widget` exposes:

- `components` (readonly)
- `children` (readonly collection reference; array content is runtime-managed)
- `parent`
- `element`
- `create(): Promise<void>`
- `show(): Promise<void>`
- `hide(): Promise<void>`
- `addChild(childSpec): Widget`
- `removeChild(child): Promise<void>`
- `destroy(): Promise<void>`
- `send`, `sendDown`, `sendUp`, `sendSiblings`

## Lifecycle Semantics

### `create()`

Runs once:

1. `create`
2. `createChildren`

### `show()`

Runs phases in order:

1. `mount` (tree)
2. `activate` (tree, event registration)
3. `enter` (tree, async animation)

### `hide()`

Runs phases in order:

1. `exit` (tree, async animation)
2. `deactivate` (tree, event unregister/resource release)
3. `unmount` (tree)

### `removeChild(child)`

When parent is mounted, the detach boundary happens once at the parent via `unmountChild(parent,
child)`. The removed subtree still gets full recursive cleanup (`exit`, `deactivate`, `unmount`,
`destroy`).

## Design Notes

- Components should implement behavior declaratively via hooks.
- Async easing belongs in `enter`/`exit` hooks, not ad-hoc external timers.
- `mountChild`/`unmountChild` should only handle direct child attachment concerns.
- Specs are reusable; component instances are not.

See `declarative/main.js` and `hud/widgets.js` for concrete examples.
