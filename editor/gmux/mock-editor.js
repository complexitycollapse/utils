import { SymbolPanel } from "./symbol-panel.js";
import { Panel } from "./panel.js";
import { Cursor } from "./cursor.js";

/*
  An example of an editor, for testing purposes.
*/

export function MockEditor() {
  const obj = {
    panel: Panel(),
    symbolPanel: undefined,
    cursor: undefined,
    handleKeydown(keystring) {
      console.log(keystring);

      if (keystring == " ") {
        obj.cursor.endEdit();
      } else if (keystring.length == 1) {
        obj.cursor.insert(keystring);
      } else if (keystring.startsWith("Shift-") && keystring.length == 7) {
        obj.cursor.insert(keystring[6]);
      } else if (keystring == "ArrowRight") {
        obj.cursor.crawlForward();
      } else if (keystring == "ArrowLeft") {
        obj.cursor.crawlBackward();
      } else if (keystring == "ArrowUp") {
        obj.cursor.crawlUpward();
      } else if (keystring == "ArrowDown") {
        obj.cursor.crawlDownward();
      } else if (keystring == "Backspace") {
        obj.cursor.delete();
      } else if (keystring == "Enter") {
        obj.cursor.insertNewline();
      }
    },
    handleMousedown(e) {
      obj.cursor.handleMousedown(e);
    }
  };

  obj.symbolPanel = SymbolPanel(obj.panel, obj);
  obj.cursor = Cursor(obj.symbolPanel);

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
