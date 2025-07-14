import { getFocusedEditor } from "./focus-manager.js";

export function handleKeydown(event) {
  const keyString = getKeyString(event);

  let handled = false;
  const focus = getFocusedEditor();
  if (focus && focus.handleKeydown?.(keyString)) {
    handled = true;
  } else {
    // Do some kind of global handling
  }

  if (handled) {
    event.stopPropagation();
    event.preventDefault();
  }
}

function getKeyString(event) {
  const keys = [];
  if (event.ctrlKey) keys.push("Ctrl");
  if (event.altKey) keys.push("Alt");
  if (event.shiftKey) keys.push("Shift");
  keys.push(event.key);
  const combination = keys.join("-");
  return combination;
}
