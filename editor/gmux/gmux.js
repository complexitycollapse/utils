import * as sessions from "./sessions.js";
import { createLayout } from "./layouts.js";

window.addEventListener("DOMContentLoaded", () => {
  sessions.init();
  const session = sessions.addSession();
  const window = session.addWindow();
  const layouts = createLayout(window);

  // TODO: this API doesn't handle multiple sessions or windows properly.
  const gmux = {
    session,
    window,
    main: layouts.main
  };

  const line = gmux.main.mainPanel.addLine(0);
  line.textContent = "Hello, world!";
});
