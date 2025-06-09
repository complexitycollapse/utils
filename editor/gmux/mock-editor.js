import { SymbolPanel } from "./symbol-panel.js";
import { Panel } from "./panel.js";

/*
  An example of an editor, for testing purposes.
*/

export function MockEditor() {
  const obj = {
    panel: Panel(),
    symbolPanel: undefined,
    handleKeydown(keystring) {
      console.log(keystring);
      if (keystring == "ArrowRight") {
        obj.symbolPanel.crawlForward();
      } else if (keystring == "ArrowLeft") {
        obj.symbolPanel.crawlBackward();
      } else if (keystring == "ArrowUp") {
        obj.symbolPanel.crawlUpward();
      } else if (keystring == "ArrowDown") {
        obj.symbolPanel.crawlDownward();
      } else if (keystring == " ") {
        obj.symbolPanel.endEdit();
      } else if (keystring.length == 1) {
        obj.symbolPanel.insertAtCursor(keystring);
      }
    }
  };

  obj.symbolPanel = SymbolPanel(obj.panel, obj);

  const l = obj.symbolPanel.addLine(0, 2);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("Hello,", "green"), l);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("World!", "orange"), l);

  //obj.symbolPanel.addLine(0);

  const l2 = obj.symbolPanel.addLine(1, 4);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("function", "pink"), l2);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("foo", "yellow"), l2);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("{", "lightblue"), l2);

  return obj;
}
