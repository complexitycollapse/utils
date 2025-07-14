import { SymbolPanel } from "./symbol-panel.js";
import { Panel } from "./panel.js";
import { Cursor } from "./cursor.js";

/*
  An example of an editor, for testing purposes.
*/

export function MockEditor() {
  let keyMappings;

  const obj = {
    panel: Panel(),
    symbolPanel: undefined,
    cursor: undefined,
    handleKeydown(keystring) {
      console.log(keystring);

      let handled = true;

      if (keystring.length == 1) {
        obj.cursor.insert(keystring);
      } else if (keystring.startsWith("Shift-") && keystring.length == 7) {
        bj.cursor.insert(keystring[6]);
      } else {
        const action = keyMappings.get(keystring);
        if (action) {
          action();
        } else {
          handled = false;
        }
      }

      return handled;
    },
    handleMousedown(e) {
      obj.cursor.handleMousedown(e);
    }
  };

  keyMappings = new Map([
    [" ", () => obj.cursor.endEdit()],
    ["ArrowRight", () => obj.cursor.crawlForward()],
    ["ArrowLeft", () => obj.cursor.crawlBackward()],
    ["ArrowUp", () => obj.cursor.crawlUpward()],
    ["ArrowDown", () => obj.cursor.crawlDownward()],
    ["Backspace", () => obj.cursor.delete()],
    ["Enter", () => obj.cursor.insertNewline()]
  ]);

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
