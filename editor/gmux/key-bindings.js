import { getFocusedEditor } from "./focus-manager.js";

export function handleKeydown(event) {
  event.stopPropagation();
  event.preventDefault();
  const keyString = getKeyString(event);
  console.log(keyString);
  const focus = getFocusedEditor();
  if (!focus || !focus.handleKeydown?.(keyString)) {
    // Do some kind of global handling
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
