/** @typedef {import("./types.js").WidgetComponent} WidgetComponent */
/** @typedef {import("./types.js").ComponentSpec} ComponentSpec */
/** @typedef {import("./types.js").ChildChannel} ChildChannel */

/**
 * @param {ComponentSpec} left
 * @param {ComponentSpec} right
 * @returns {ComponentSpec}
 */
function combineComponentSpecs(left, right) {
  /** @type {ComponentSpec} */
  const componentSpec = {
    instantiate() {
      return left.instantiate();
    },

    /** @param {ComponentSpec} other */
    with(other) {
      return combineComponentSpecs(componentSpec, other);
    },

    instantiateAll() {
      return Object.freeze([...left.instantiateAll(), ...right.instantiateAll()]);
    }
  };

  return Object.freeze(componentSpec);
}

/**
 * @param {() => WidgetComponent} instantiate
 * @returns {ComponentSpec}
 */
export function ComponentSpec(instantiate) {
  /** @type {ComponentSpec} */
  const componentSpec = {
    instantiate,

    /** @param {ComponentSpec} other */
    with(other) {
      return combineComponentSpecs(componentSpec, other);
    },

    instantiateAll() {
      return Object.freeze([instantiate()]);
    }
  };

  return Object.freeze(componentSpec);
}

/**
 * @param {ComponentSpec} childSpec
 * @returns {ComponentSpec}
 */
export function childComponentSpec(childSpec) {
  return childComponentSpecWithOptions(childSpec);
}

/**
 * @param {ComponentSpec} childSpec
 * @param {{ channel?: ChildChannel }} [options]
 * @returns {ComponentSpec}
 */
export function childComponentSpecWithOptions(childSpec, options = {}) {
  return ComponentSpec(() => {
    let hasCreatedChild = false;

    return {
      createChildren(widget) {
        if (hasCreatedChild) {
          return;
        }

        hasCreatedChild = true;
        widget.addChild(childSpec, options);
      }
    };
  });
}
