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

The root of the UI is an instance of `Interface`. Widgets are added (and create is immediately
called on them when they are), can be cleared (call clear on all widgets then drop them), there is a
draw method that calls draw on them, and finally update that clears out all deleted widgets, then
PrePosition, then PostPosition, then Update on each one.

So in summary, UIs are built hierarchically from widgets. Each widget's functionality is defined by
scripts. To help with this pattern, scripts are first wrapped with `WidgetCustom`. My guess is that
this is an abbreviation for "Widget Customization".

### Widget Class in More Detail

Draw calls preDraw on each component, then draw on each child, then postDraw on each component.
Prior to the draw call, it sets the child's alpha by multiplying it by its own alpha. Note that
preDraw and postDraw call components in opposite orders.

PrePosition (part of the Update cycle) is interesting. If "rebuild" has been set, all children are
cleared and the widget is set to uninitialized. If the widget is uninitialized, CreateChildren is
called. Then the parent is set on each child and Create is called on each one. I can't find a
definition for CreateChildren except the default which does nothing. Components also have a
CreateChildren method though, which returns a list of children. Upshot: to initiaize a widget means
to create its children an to uninitialize it means to destroy them. Then PrePosition is called on
the children and finally on the components. PostPosition does components first then children, in
reverse order in both cases.

Update just calls update on the components then the children. It then calls CaptureFocus (which
calls the same on the Components). Unsure what the CaptureFocus method is for. I think it doesn't
actually "capture" any focus, but rather gives the control an opportunity to check whether it has
focus by checking whether the mouse is within its bounds.

There is also a messaging system. Send, SendUp and SendDown and SendSiblings send data through the
hierarchy. This is how events are simulated, but they are generated by the widgets themselves rather
than being standardized. Sometimes the message is passed in. For example, a button receives a
message when it's created and sends it up to the parent when it's clicked. Send simply calls Recieve
on the components. The other send methods call send on other widgets, as well as possibly
recursively calling the other send methods on those widgets. (e.g. SendUp calls send on the parent
and then calls SendUp on the parent).

## What Needs to Be Changed

- The notion of "scripts" only makes sense in the context of the LTSL scrtipting language, which was
  being used to extend C++ classes. That step can be skipped and instead all that's required is that
  we can create widget components, which can be POJOs.
- It might still be nice to have a wrapper that adds null implementations for all unimplemented
  methods. This avoid having to use conditional calls everywhere.
- The contract for components is completely inappropriate for HTML. Need a new one.
- Need to handle the fact that there will be a parallel DOM tree as well as the widget tree.

## Final Implementation and Conclusion
The createButton method shows an implementation of a button. A widget must be passed in that
implements a visual button (e.g. a textual element) and createButton will wrap it in a widget that
adds button behavour. The button behaviour is itself implemented in buttonBehaviorComponent.

The whole system relies on two kinds of object. There are components, which expose optional methods
that are called on certain events (both UI and lifecycle events). Then there are widgets, which have
a collection of components, a collection of children and a DOM element (possibly shared with a
child to avoid unnecessary wrapping). The widget composes the components together by calling their
methods as appropriate. Every widget needs a component that creates and manages the DOM element
(e.g. creating it, attaching children). Other components can style it etc.

There is also a communication system between widgets. They can send messages up or down the tree, or
to siblings. This is how buttons implement being clicked (they send a message up the tree).

Although the management of the DOM element is a little awkward, the system seems to work. It's easy
to add components that add some visual functionality through styling, events are also handled
cleanly. The button widget is nice because it allows the visual widget to be passed in, so button
behaviour can be added to anything.

Generally speaking, this was a success and I would much prefer to work in a system like this to
handle creating widgets than dealing with raw DOM/CSS.
### Some Possible Improvements
- Creating the element is probably not best managed with a generic component. It would make more
sense to either handle this at the widget level, or have a special component added that owns the
element (which means the creation and destruction of the element would still be customizable).
- It may also be nice to explicitly distinguish widgets that create elements (i.e. are adding to the
visual tree) from those that are purely decorating other widgets (such as the button behavour
widget.)
- Slot-based composition, where child widgets can be added to named slots on a parent, rather than
being genetic children.
- Separate widget construction into an immutable, declarative layer (in which the required
components are specified) and the final creation of the widget from the spec. This would make
widgets more immutable.
- Perhaps components should be able to add shared state to a widget (this is similar to, possibly
a generalization of, slot-based composition).
