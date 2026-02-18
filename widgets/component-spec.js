// @ts-check

/**
 * @typedef {import("./type.js").ComponentInput} ComponentInput
 * @typedef {import("./type.js").ComponentSpec} ComponentSpec
 */

const NOOP = () => {};
/** @type {ReadonlyArray<string>} */
const EMPTY_LIST = Object.freeze([]);
const EVENT_HOOKS = Object.freeze({
  onPointerDown: "pointerdown",
  onPointerUp: "pointerup",
  onClick: "click",
  onKeyDown: "keydown",
  onKeyUp: "keyup",
  onFocus: "focus",
  onBlur: "blur"
});

/**
 * Normalizes `ComponentInput` into a full `ComponentSpec` with no-op hooks.
 *
 * @param {ComponentInput | ComponentSpec} [input]
 * @returns {ComponentSpec}
 */
export function ComponentSpec(input = {}) {
  const priority =
    typeof input.priority === "number" && Number.isFinite(input.priority) ? input.priority : 0;

  return Object.freeze({
    id: input.id,
    priority,
    events: normalizeEvents(input),
    capabilities: toReadonlyStringArray(input.capabilities),
    onAttach: input.onAttach ?? NOOP,
    onDetach: input.onDetach ?? NOOP,
    buildChildren: input.buildChildren ?? NOOP,
    measure: input.measure ?? NOOP,
    layout: input.layout ?? NOOP,
    render: input.render ?? NOOP,
    applyStyle: input.applyStyle ?? NOOP,
    onPointerDown: input.onPointerDown ?? NOOP,
    onPointerUp: input.onPointerUp ?? NOOP,
    onClick: input.onClick ?? NOOP,
    onKeyDown: input.onKeyDown ?? NOOP,
    onKeyUp: input.onKeyUp ?? NOOP,
    onFocus: input.onFocus ?? NOOP,
    onBlur: input.onBlur ?? NOOP,
    onEvent: input.onEvent ?? NOOP
  });
}

/**
 * @param {unknown} value
 * @returns {ReadonlyArray<string>}
 */
function toReadonlyStringArray(value) {
  if (!Array.isArray(value)) {
    return EMPTY_LIST;
  }
  return Object.freeze([...value]);
}

/**
 * @param {ComponentInput | ComponentSpec} input
 * @returns {ReadonlyArray<string>}
 */
function normalizeEvents(input) {
  const set = new Set(Array.isArray(input.events) ? input.events : EMPTY_LIST);
  for (const [hook, eventName] of Object.entries(EVENT_HOOKS)) {
    if (typeof getHook(input, hook) === "function") {
      set.add(eventName);
    }
  }
  return Object.freeze([...set]);
}

/**
 * Helps JSDoc type-checking when selecting hook names dynamically.
 *
 * @param {ComponentInput | ComponentSpec} input
 * @param {string} hook
 * @returns {unknown}
 */
function getHook(input, hook) {
  return /** @type {Record<string, unknown>} */ (input)[hook];
}
