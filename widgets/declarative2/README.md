# Declarative Composable Widget Library (v2)

This is an attempt at creating an HTML widget library for building UIs that uses composition and
very high levels of code reuse. The most important thing about this project is using composition and
code reuse as much as possible. The whole point is to experiment with these techniques. Anything
that violates this is considered a failure and should promt thinking about how the system can be
made even more composable.

## Basic Architecture

A UI consists of a tree of widgets. Each widget has children, and children can be dynamically added
and removed from the tree. Each widget has an immutable list of components added at creation. The
components specify everything about the behaviour of the widget.

Widgets are created using the createWidget function, which takes a component spec as input. A
component spec is an immutable description of the components a widget has. Each component spec has
two methods, with and instantiateAll. The with method is used to combine individual component specs
together to form a spec that describes all components. It is an associative operator.

```js
return divComponent()
  .with(dimmableComponent())
  .with(textComponent("This is the text for the widget"))
  .with(buttonBehaviourComponent());
```

The instantiateAll method returns an array of components, as descibed by the specs. So
instantiateAll when called on the above spec would produce an array of 4 components. instantiateAll
is called by createWidget to create the widget's components.

To make it easy to create new specs, there is a ComponentSpec function which takes an instantiation
function as an argument and returns a component spec that can create a component using that
instantiation function. Here's an example of how divComponent would be implemented:

```js
/**
 * Creates and assigns a div as the widget element.
 * @returns {ComponentSpecType}
 */
export function divComponent() {
  return ComponentSpec(() => ({
    mount(widget) {
      if (widget.element) {
        return;
      }
      widget.element = document.createElement("div");
    },
    mountChild(widget, child) {
      withElement(widget, (element) => {
        if (!child.element) {
          return;
        }
        element.appendChild(child.element);
      });
    },
    unmountChild(widget, child) {
      withElement(widget, (element) => {
        if (!child.element) {
          return;
        }
        if (child.element.parentElement === element) {
          element.removeChild(child.element);
        }
      });
    }
  }));
}
```

There is a standard interface that all components implement (however all methods are optional, so
components only provide implementations for those that are relevant to their function). Mostly these
methods represent lifecycle events. The widget calls these methods on all components that have them
as necessary.

In order to extend the widget's interface, each component may add capabilities to a widget. The
widget has a map of capabilities of type `Map<CapabilityToken, unknown>`, where CapabilityToken is
of unknown type, but is usually a Symbol object that uniquely defines the capability. The values of
the map are objects representing APIs. A component or other widget may use the map to find a
capability and call its methods. A component adds a capability to the widget by calling
provideCapability, and removes it using revokeCapability.

Capability lookup (`getCapability`) resolves to the nearest ancestor (including the widget itself)
that provides the capability.

### Contexts

Widgets also support hierarchical context values. Context is ambient data made available by a widget
for consumption by other widgets, in particular those below them in the subtree (hence providing a
"context" for that tree that all nodes share in common). Context is keyed by a path of string/symbol
segments:

```js
const path = ["theme", Symbol.for("dialog"), "title"];
```

Each widget has its own context store. Context lookup (`getContext`) resolves to the nearest
ancestor (including self) that has a value at the given path.

Widget context methods:

- `provideContext(path, value)` - materialize the path in this widget and assign a value
- `revokeContext(path)` - clear this widget's value at the path
- `getOwnContext(path)` - get only this widget's value at the path
- `getContext(path)` - get nearest ancestor value at the path

To populate a widget's context, use `contextComponent(path, value)`. This writes context on
`create` and revokes it on `destroy`.

Becuase context is hierarchical there may be many different values for the context as you ascend the
widget tree. In some cases you'll want a "closet context wins" rule. In others you may want to merge
values in some way. The intention is that the consumer of the context decides what to do, so
consumer components will implement their own logic for climbing the tree and merging contexts.

### Messaging

Widgets communicate to each other by sending messages. Messages are of unknown type. A message is
sent to a widget by calling its send function. The widget handles the message by calling receive on
all the components that implement it, passing the message. Widgets also have sendUp, which sends the
message to the widget's ancestors, sendDown which sends it to all descendents, and sendSiblings
which sends it to other children of the same parent.

Because a widget may have many children, it may have trouble disambiguating messages from different
sources. To handle this, a widget may assign a channel to a child. The channel is simply an unknown
type token associate with the child. When sendUp is called, the sending widget will check if it has
a channel registered in the parent, and if so it will transform the message into an object lke this:

```js
const channelMessage = {
  channel,
  payload: data,
  child: widget
};
```

where channel is the channel token, data is the original message and widget is the child that is
associated with the channel (and which is doing the transformation).

Because this is an HTML library, there must be a DOM tree associated with the widget tree. Each
widget has an element property representing its corresponding DOM element. Each widget will have
components that manage this element. For example, the divComponent described above creates a div
element and ensures that the elements of child widgets are added and removed from it. It isn't
strictly necessary for every widget to have an element (some widgets may not be visual) so this
property can be undefined, but most widgets will populate it.

## Contracts

Below are descriptions of the interfaces that these objects support.

### Widget

- `components` (readonly)
- `children` (readonly reference)
- `parent`
- `element`
- `create()`
- `destroy()`
- `addChild(childSpec, { channel? })`
- `removeChild(child)`
- `show()`
- `hide()`
- `send(data)`
- `sendDown(data)`
- `sendUp(data)`
- `sendSiblings(data)`
- `provideCapability(token, capability)`
- `revokeCapability(token)`
- `getCapability(token)`
- `provideContext(path, value)`
- `revokeContext(path)`
- `getOwnContext(path)`
- `getContext(path)`

### Components

Note that providing an implementation of any of these methods is optional.

#### Lifecycle Methods

- `create(widget)` - do all the set up prior to modifying the DOM
- `createChildren(widget)` - spawn any children created by this component (by calling
  `widget.addChild`)
- `mount(widget)` - prepare the DOM element for this widget (e.g. create element, attach handlers)
- `activate(widget)` - turn on runtime behaviour after the widget is fully mounted in the DOM tree
- `enter(widget)` - run transition-in animations
- `exit(widget)` - run transition-out animations
- `deactivate(widget)` - undo activate work
- `unmount(widget)` - clean up DOM element (e.g. detach handlers)
- `destroy(widget)` - final teardown
- `mountChild(widget, child)` - handle attaching a child's DOM element to our DOM element
- `unmountChild(widget, child)` - detach the child from our DOM element

#### Messaging and Events

For inter-widget messaging:

- `receive(widget, data)` - receive a message sent via `widget.send`

For handling general events:

- `eventTypes` (`string[]`) - which event types this component handles (doesn't include event types
  with their own handler methods, where presence of the method signifies that we handle it)
- `onEvent(widget, eventType, event)` - catch-all handler for all events that don't have a specific
  handler method

Handlers for common events:

- `click(widget, event)`
- `dblclick(widget, event)`
- `input(widget, event)`
- `change(widget, event)`
- `submit(widget, event)`
- `focus(widget, event)`
- `blur(widget, event)`
- `keydown(widget, event)`
- `keyup(widget, event)`
- `mousedown(widget, event)`
- `mouseup(widget, event)`
- `mousemove(widget, event)`
- `mouseenter(widget, event)`
- `mouseleave(widget, event)`
- `pointerdown(widget, event)`
- `pointerup(widget, event)`
- `pointercancel(widget, event)`
- `pointermove(widget, event)`

## Widget Lifecycle

All lifecycle operations are serialized through an internal queue. This means calls like `show()`,
`hide()`, `removeChild()` and `destroy()` are applied in order, not concurrently.

### `create()`

Runs only once per widget:

1. `create`
2. `createChildren`

### `show()`

Runs these phases in order:

1. `mountTree()`
2. `activateTree()`
3. `enterTree()`

Detailed hook order:

- Mount phase:
  - this widget: `mount`
  - each child subtree: child `mountTree()`
  - then parent boundary hook for that child: `mountChild(parent, child)`
- Activate phase:
  - this widget: `activate`
  - event handlers are registered on this widget's `element`
  - each child subtree: child `activateTree()`
- Enter phase:
  - this widget: `enter`
  - each child subtree: child `enterTree()`

### `hide()`

Runs these phases in order:

1. `exitTree()`
2. `deactivateTree()`
3. `unmountTree(false)`

Detailed hook order:

- Exit phase:
  - each child subtree exits first
  - this widget: `exit`
- Deactivate phase:
  - each child subtree deactivates first
  - event handlers are unregistered on this widget
  - this widget: `deactivate`
- Unmount phase:
  - for each child, parent boundary hook runs first: `unmountChild(parent, child)`
  - then child subtree unmounts
  - this widget: `unmount`

### `destroy()`

`destroy()` performs full cleanup even if still shown:

1. `exitTree()`
2. `deactivateTree()`
3. `unmountTree(false)`
4. recursively destroy all children
5. `destroy`

After destroy:

- capabilities are cleared
- `element` is reset to `undefined`
- child list is emptied

### `addChild(childSpec, options?)`

- Child is created and attached to the parent relationship immediately.
- If parent is already mounted/active/shown, child lifecycle is brought up to the current state via
  the lifecycle queue:
  - `mountTree()` then `mountChild(parent, child)`
  - if parent is active: `activateTree()`
  - if parent is shown: `enterTree()`

### `removeChild(child)`

When removing a child from a mounted parent:

1. child exits
2. child deactivates
3. parent boundary detach: `unmountChild(parent, child)` (once)
4. child unmounts with `detachedByAncestor = true`
5. child is removed from parent state and destroyed

The purpose of `detachedByAncestor` is to prevent each child from detaching their own children,
which creates a lot of unnecessary DOM updates.
