/**
  Used to manage which editor currently has focus.
 */

let focused;

export function getFocusedEditor() {
  return focused;
}

export function changeFocus(editor) {
  if (editor === focused) {
    return; // No change in focus
  }

  if (focused?.onUnfocused) {
    focused.onUnfocused();
  }

  focused = editor;
  focused.onFocused?.();
}
