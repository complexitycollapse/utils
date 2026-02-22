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
- `addChild(childSpec, { channel? }): Widget`
- `removeChild(child): Promise<void>`
- `destroy(): Promise<void>`
- `send`, `sendDown`, `sendUp`, `sendSiblings`
- `provideCapability(token, capability)`
- `getCapability(token)`
- `revokeCapability(token)`

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

## Parent-Assigned Child Channels

Parents can assign a distinct channel per child:

```js
parent.addChild(childSpec, { channel: Symbol("childA") });
```

When that child (or its subtree) calls `sendUp(payload)`, the parent receives:

```js
{
  channel,   // assigned by parent
  payload,   // original child payload
  child      // child widget instance
}
```

If no channel is assigned, `sendUp` forwards the raw payload.

## Capabilities

Components can publish explicit APIs on a widget without exposing DOM internals.

Typical pattern:

1. In a component `create` hook, call `widget.provideCapability(TOKEN, api)`.
2. In `destroy`, call `widget.revokeCapability(TOKEN)`.
3. External code with a widget reference can call `widget.getCapability(TOKEN)`.

This is useful for opt-in behaviors like `setColor`, `setValue`, `open`, `close`, etc., while
keeping component internals encapsulated.

### Built-in dimmable capability

`dimmableComponent(options?)` in `declarative/components.js` publishes
`DIMMABLE_CAPABILITY` with methods:

- `dim(widget)`
- `undim(widget)`
- `setDimmed(widget, boolean)`
- `toggle(widget)`
- `isDimmed()`

The component adds a dim layer to the widget element and eases opacity changes via CSS transition.
Theme details (color, blur, class styling) can stay in app-level CSS.

## Design Notes

- Components should implement behavior declaratively via hooks.
- Async easing belongs in `enter`/`exit` hooks, not ad-hoc external timers.
- `mountChild`/`unmountChild` should only handle direct child attachment concerns.
- Specs are reusable; component instances are not.

See `declarative/main.js` and `hud/widgets.js` for concrete examples.
