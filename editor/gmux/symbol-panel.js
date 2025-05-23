/**
 * Decorator for a panel that adds symbol support
 * @param {*} panel The panel to wrap
 */
export function symbolPanel(panel) {
  const obj = {
    lines: [],
    addLine(position) {
      const panelLine = panel.addLine(position);
      const line = {
        panelLine,
        symbols: []
      };
      obj.lines.push(line);
      return line;
    },
    pushSymbol(symbol, line) {
      if (line.panelLine.childNodes.length > 0) {
        const space = obj.createSymbol(" ");
        line.panelLine.appendChild(space.element);
      }
  
      line.panelLine.appendChild(symbol.element);
      line.symbols.push(symbol);
    },
    createSymbol(text, colour) {
      const element = document.createElement("span");
      element.className = "gtext";
      element.textContent = text;
      element.style.color = colour ?? "white";
  
      const symbol = {
        text,
        element,
        colour
      }
  
      return symbol;
    }
  };

  return obj;
}
