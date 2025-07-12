import * as focusManager from "./focus-manager.js";

/**
 * Decorator for a panel that adds symbol support
 * @param {*} panel The panel to wrap
 */
export function SymbolPanel(panel, editor) {
  const obj = {
    lines: [],
    addCursorElement(element) {
      panel.cursorOverlay.appendChild(element);
    },
    addLine(position, indent = 0) {
      const panelLine = panel.addLine(position);
      const indentElement = document.createElement("span");
      indentElement.className = "gindent gtext";
      indentElement.textContent = " ".repeat(indent);
      panelLine.appendChild(indentElement);
      const line = {
        indent,
        panelLine,
        indentElement,
        symbols: []
      };
      obj.lines.splice(position, 0, line);
      return line;
    },
    deleteLine(position) {
      panel.deleteLine(position);
      obj.lines.splice(position, 1);
    },
    pushSymbol(symbol, line) {
      if (line.panelLine.childNodes.length > 1) {
        line.panelLine.appendChild(createSpace());
      }
  
      line.panelLine.appendChild(symbol.element);
      line.symbols.push(symbol);
    },
    insertSymbolAfter(symbol, lineIndex, symbolIndex) {
      const line = obj.lines[lineIndex];
      if (!line) { return; }

      // Handle corner cases where the symbol will always go at the end
      if (line.symbols.length === 0 || symbolIndex >= line.symbols.length) {
        obj.pushSymbol(symbol, line);
        return;
      }

      const space = createSpace();

      // Inserting immediately after the indent
      if (symbolIndex == -1) {
        line.indentElement.after(symbol.element);
        symbol.element.after(space);
        line.symbols.unshift(symbol);
        return;
      }

      // Inserting after an existing symbol
      const replacedSymbol = line.symbols[symbolIndex];
      replacedSymbol.element.after(space);
      space.after(symbol.element);
      line.symbols.splice(symbolIndex + 1, 0, symbol);
    },
    removeSymbol(lineIndex, symbolIndex) {
      const lineSymbols = obj.lines[lineIndex].symbols;
      const symbolToRemove = lineSymbols[symbolIndex];

      if (!symbolToRemove) { return undefined; }

      if (symbolIndex === 0) {
        if (lineSymbols.length > 1) {
          symbolToRemove.element.nextSibling.remove();
        }
        symbolToRemove.element.remove();
        return lineSymbols.shift();
      }

      if (symbolToRemove.element.nextSibling) {
        symbolToRemove.element.nextSibling.remove();
      } else if (symbolIndex > 0) {
        symbolToRemove.element.previousSibling.remove();
      }
      symbolToRemove.element.remove();
      return lineSymbols.splice(symbolIndex, 1)[0];
    },
    createSymbol(text, colour) {
      const element = document.createElement("span");
      element.className = "gsymbol gtext";
      element.textContent = text;
      element.style.color = colour ?? "white";
  
      const symbol = {
        text,
        element,
        colour,
        append(text) {
          this.text += text;
          this.element.textContent += text;
        }
      }
  
      return symbol;
    }
  };

  panel.element.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    focusManager.changeFocus(editor);
    editor.handleMousedown?.(e);
    panel.textEntry.focus();
  });

  return obj;
}

function createSpace() {
  const space = document.createElement("span");
  space.className = "gtext gspace";
  space.textContent = " ";
  return space;
}
