import * as sessions from "./sessions.js";
import { createLayout } from "./layouts.js";
import { symbolPanel } from "./symbol-panel.js";

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

  const panel = symbolPanel(gmux.main.mainPanel);

  const l = panel.addLine(0);
  panel.pushSymbol(panel.createSymbol("Hello,", "green"), l);
  panel.pushSymbol(panel.createSymbol("World!", "orange"), l);

  //panel.addLine(0);

  const l2 = panel.addLine(1);
  panel.pushSymbol(panel.createSymbol("function", "pink"), l2);
  panel.pushSymbol(panel.createSymbol("foo", "yellow"), l2);
  panel.pushSymbol(panel.createSymbol("{", "lightblue"), l2);
});
