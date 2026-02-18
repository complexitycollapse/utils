# Widgets

Attempt to do widgets like in LTSL, but for HTML.

## Project Goals
To get really good at making software more composable, starting with an existing example of good
composition.

## LTSL Widgets: A Summary

The LTSL widget library is a means for building UIs for the game Limit Theory. The widgets are
created using the Limit Theory Scripting Language (LTSL) and used to render GUIs in OpenGL. Complex
UIs are constructed from a hierarchy of widgets. The widgets themselves are constructed using a
highly composable system, that allows complex widgets to be built by reusing very simple components.
In the below I have translated the syntax to something more like JavaScript to be more familiar.

Widgets are 2D user interface objects. Widgets are created compositionally using call chains similar
to the following:

```
captureMouse(
  tooltip(
    "This is a tooltip",
    minSize(
      100,
      custom(widget)
    )
  )
);
```

Each of these functions takes a `Widget` argument and returns a `Widget`. They are in fact just
helper functions that look like this:

```
function minSize(size, widget) {
  return custom(MinSizeScript(size), widget);
}
```

`MinSizeScript` is an example of a "script" (this terminology makes sense in the original context).
A script is an object that optionally implements any number of standard methods. The implementation
of `MinSizeScript` is:

```
function MinSizeScript(size) {
  return {
    setStyle(widget) { widget.style.minSize = size; }
  };
}
```

Other examples of methods that a script may implement: create, destroy, createChildren,
captureFocus, getName, onClick. Actually, Note that LTSL is not implemented in HTML so the list of
methods may not be valid for my use case.

The key function is `custom`, which creates a kind of `WidgetComponent` called a `WidgetCustom`. It
takes a script and a widget as an argument. It creates a `WidgetCustom` that implements all the
methods that a script could implement. Each one has the same implementation: check whether the
script has the method and if so, call it. Otherwise do nothing. Each method takes a widget as an
argument that is passed through to the script.

However, it doesn't return the `WidgetCustom`. Instead it adds it to the passed widget's list of
components, then returns the original widget.

A widget is created via the parameterless function `Widget`. Each widget has a list of components, a
list of children, a parent, alpha value and a few other properties than any widget may need. The
widget has various methods which are usually implemented by iterating through all the components in
turn and calling methods on them. The order in which the components are used varies. When the widget
is created, it calls create on each component in least-recently-added order, but destructors are
called in the reverse order, for example.

A worked example: the prePosition method on a Widget clears the widget's internal state, then it
checks to see if a rebuild of the widget has been requested (by a previous call to the rebuild()
method). If so, it destroys all the children. Then it calls createChildren on each component, then
create on each child. Next prePosition is called on all children, then prePosition is called on each
component.

So in summary, UIs are built hierarchically from widgets. Each widget's functionality is defined by
scripts. To help with this pattern, scripts are first wrapped with `WidgetCustom`. My guess is that
this is an abbreviation for "Widget Customization".

## What Needs to Be Changed
- The notion of "scripts" only makes sense in the context of the LTSL scrtipting language, which was
being used to extend C++ classes. That step can be skipped and instead all that's required is that
we can create widget components, which can be POJOs.
- It might still be nice to have a wrapper that adds null implementations for all unimplemented
methods. This avoid having to use conditional calls everywhere.
- The contract for components is completely inappropriate for HTML. Need a new one.
- Proposed retained HTML component contract: each `WidgetComponent` is a POJO with optional
`id`/`priority` and hooks for lifecycle (`onAttach`, `onDetach`), tree composition
(`buildChildren`), layout pipeline (`measure`, `layout`), DOM pipeline (`render`, `applyStyle`),
common typed events (`onPointerDown`, `onPointerUp`, `onClick`, `onKeyDown`, `onKeyUp`, `onFocus`,
`onBlur`), plus a catch-all (`onEvent`) for uncommon/custom events; components may also declare
capabilities via `events`/`capabilities` metadata so the runtime dispatches only relevant work.
- Eliminate the destructive nature of "custom" by creating "widget specs" which create a
specification for widgets rather than actual widgets with state. The widget is then created from
the state. Each component in the widget is in turn described by a "component spec".

## Contracts
- `ComponentInput` vs `ComponentSpec`: `ComponentInput` is author-facing with optional hook methods.
`ComponentSpec` is runtime-facing and normalized so every hook method exists (no-op by default).
- Event registration rules: if a typed event hook is implemented (for example `onClick`), that
event is automatically included in `events`; explicit `events` entries are merged and deduplicated.
- `WidgetSpec` model: immutable, append-only, and fluent via `withComponent` and `withChild`.
`WidgetSpec()` returns a singleton empty spec.
- `widgetInstanceFromSpec(spec)`: creates retained widget instances by ordering components by
ascending `priority` and then by append order.
