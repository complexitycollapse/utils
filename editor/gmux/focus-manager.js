/**
  Used to manage which editor currently has focus. Note that currently no editors have
  been defined so I'm using SymbolPanel as a placeholder. In the final system, SymbolPanel
  will be a component of something like FileEditor, which will be the top level editor
  that has a panel and handles focus. (SymbolPanel is a bit like a ViewModel).
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
