import * as sessions from "./sessions.js";
import { createLayout } from "./layouts.js";
import { MockEditor } from "./mock-editor.js";

window.addEventListener("DOMContentLoaded", () => {
  sessions.init();
  const session = sessions.addSession();
  const window = session.addWindow();
  const layouts = createLayout(window);
  const editor = MockEditor();

  layouts.editors.setMain(editor.panel);
});
