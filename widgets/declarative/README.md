# Declarative Composable Widgets

This is an attempt at making a widget library where composability is the highest good. Widgets are
created by first describing them in a component spec. Example:

``
  return delegateComponent()
    .with(buttonHoverComponent(options))
    .with(buttonBehaviorComponent(message, options))
    .with(childComponentSpec(visualComponentSpec));
```

This returns a component spec that implements a button that contains a child widget (defined by
another component spec) that provides the visual representation of the button. To turn this into a
widget, you pass it to createWidget, which will instantiate all the described components, including
any child components that the components define.

Component specs are themselves immutable and can be reused to create multiple widgets. The easy way
to create a new component spec with the ComponentSpec function, which tranforms a constructor
funtion into a component spec object.

```
/**
 * @param {string | string[]} classNames
 * @returns {ComponentSpecType}
 */
export function classComponent(classNames) {
  const names = Array.isArray(classNames) ? classNames : [classNames];

  return ComponentSpec(() => ({
    afterShow(widget) {
      withElement(widget, (element) => {
        element.classList.add(...names);
      });
    },
    hide(widget) {
      withElement(widget, (element) => {
        element.classList.remove(...names);
      });
    }
  }));
}
```

See `index.html` and `main.js` for examples of how to use the components.
