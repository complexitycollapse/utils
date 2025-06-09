import { SymbolPanel } from "./symbol-panel.js";
import { Panel } from "./panel.js";

/*
  An example of an editor, for testing purposes.
*/

export function MockEditor() {
  const obj = {
    panel: Panel(),
    symbolPanel: undefined
  };

  obj.symbolPanel = SymbolPanel(obj.panel, obj);

  const l = obj.symbolPanel.addLine(0);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("Hello,", "green"), l);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("World!", "orange"), l);

  //obj.symbolPanel.addLine(0);

  const l2 = obj.symbolPanel.addLine(1);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("function", "pink"), l2);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("foo", "yellow"), l2);
  obj.symbolPanel.pushSymbol(obj.symbolPanel.createSymbol("{", "lightblue"), l2);

  return obj;
}
