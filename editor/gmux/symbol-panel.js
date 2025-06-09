import * as focusManager from "./focus-manager.js";

/**
 * Decorator for a panel that adds symbol support
 * @param {*} panel The panel to wrap
 */
export function SymbolPanel(panel, editor) {
  const obj = {
    lines: [],
    cursor: document.createElement("div"),
    cursorLineIndex: 0,
    cursorSymbolIndex: -1,
    get lineAtCursor() {
      return obj.lines[obj.cursorLineIndex];
    },
    get symbolAtCursor() {
      return obj.lineAtCursor.symbols[obj.cursorSymbolIndex];
    },
    shadowIndex: 0,
    symbolBeingEdited: undefined,
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
      obj.lines.push(line);
      return line;
    },
    pushSymbol(symbol, line) {
      if (line.panelLine.childNodes.length > 1) {
        line.panelLine.appendChild(createSpace());
      }
  
      line.panelLine.appendChild(symbol.element);
      line.symbols.push(symbol);
    },
    insertSymbolAtCursor(symbol) {
      if (obj.lineAtCursor.symbols.length > 0) {
        const space = createSpace();
        if (obj.symbolAtCursor) {
          obj.symbolAtCursor.element.after(space);
          space.after(symbol.element);
        } else {
          obj.lineAtCursor.indentElement.after(symbol.element);
          symbol.element.after(space);
        }
      } else {
        this.lineAtCursor.element.appendChild(symbol.element);
      }
      obj.cursorSymbolIndex++;
      obj.lineAtCursor.symbols.splice(obj.cursorSymbolIndex, 0, symbol);
    },
    removeSymbol(lineIndex, symbolIndex) {
      const lineSymbols = obj.lines[lineIndex].symbols;
      const symbol = lineSymbols[symbolIndex];
      const prev = symbol.element.previousSibling;
      if (prev.classList.contains("gspace")) {
        prev.remove();
      } else if (prev.classList.contains("gindent")) {
        symbol.element.nextSibling?.remove();
      }
      symbol.element.remove();
      lineSymbols.splice(symbolIndex, 1);
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
    },
    crawlForward() {
      commitEdit(obj);

      if (obj.cursorSymbolIndex < obj.lineAtCursor.symbols.length - 1) {
        obj.cursorSymbolIndex++;
      } else {
        if (obj.cursorLineIndex < obj.lines.length - 1) {
          obj.cursorLineIndex++;
          obj.cursorSymbolIndex = -1;
        }
      }

      obj.shadowIndex = obj.getCharacterPos();
      positionCursor(obj);
    },
    crawlBackward() {
      commitEdit(obj);

      if (obj.cursorSymbolIndex > -1) {
        obj.cursorSymbolIndex--;
      } else {
        if (obj.cursorLineIndex > 0) {
          obj.cursorLineIndex--;
          obj.cursorSymbolIndex = obj.lineAtCursor.symbols.length - 1;
        }
      }

      obj.shadowIndex = obj.getCharacterPos();
      positionCursor(obj);
    },
    getCharacterPos() {
      let pos = obj.lineAtCursor.indent;

      if (obj.cursorSymbolIndex < 0) {
        return pos;
      }

      for (let i = 0; i <= obj.cursorSymbolIndex; i++) {
        pos += obj.lineAtCursor.symbols[i].text.length + 1; // +1 for the space
      }

      return pos;
    },
    getSymbolIndexAtPos(pos) {
      const line = obj.lineAtCursor;

      pos -= line.indent
      if (pos <= 0) {
        return -1;
      }

      for (let index = 0; index < line.symbols.length; index++) {
        pos -= line.symbols[index].text.length + 1; // +1 for the space
        if (pos <= 0) {
          return index;
        }
      }

      return obj.lines.length - 1;
    },
    crawlUpward() {
      commitEdit(obj);
      
      if (obj.cursorLineIndex == 0) {
        obj.cursorSymbolIndex = -1;
        obj.shadowIndex = obj.lineAtCursor.indent;
      } else {
        obj.cursorLineIndex--;
        const newPos = obj.getSymbolIndexAtPos(obj.shadowIndex)
        if (newPos != undefined) { obj.cursorSymbolIndex = newPos; }
      }

      positionCursor(obj);
    },
    crawlDownward() {
      commitEdit(obj);
      
      if (obj.cursorLineIndex >= obj.lines.length - 1) {
        obj.cursorSymbolIndex = obj.lineAtCursor.symbols.length - 1;
        obj.shadowIndex = obj.getCharacterPos();
      } else {
        obj.cursorLineIndex++;
        const newPos = obj.getSymbolIndexAtPos(obj.shadowIndex);
        if (newPos != undefined) { obj.cursorSymbolIndex = newPos; }
      }

      positionCursor(obj);
    },
    insertAtCursor(text) {
      if (!obj.symbolBeingEdited) {
        // Create a new symbol at the cursor position
        const symbol = obj.createSymbol(text, "white");
        obj.symbolBeingEdited = symbol;
        obj.insertSymbolAtCursor(symbol);
      } else {
        obj.symbolBeingEdited.append(text);
      }

      positionCursor(obj);
    },
    endEdit() {
      commitEdit(obj);
      positionCursor(obj);
    },
    deleteAtCursor() {
      if (obj.symbolBeingEdited) {
        obj.removeSymbol(obj.cursorLineIndex, obj.cursorSymbolIndex);
        obj.cursorSymbolIndex--;
        obj.symbolBeingEdited = undefined;
      } else if (obj.cursorSymbolIndex >= 0) {
        obj.removeSymbol(obj.cursorLineIndex, obj.cursorSymbolIndex);
        obj.cursorSymbolIndex--;
      } else if (obj.cursorLineIndex > 0) {
        const symbolsToMove = [...obj.lineAtCursor.symbols];
        symbolsToMove.forEach(() => obj.removeSymbol(obj.cursorLineIndex, 0));
        obj.cursorLineIndex--;  
        const originalLineLength = obj.lines[obj.cursorLineIndex].symbols.length - 1;
        symbolsToMove.forEach(s => obj.pushSymbol(s, obj.lines[obj.cursorLineIndex]));
        obj.cursorSymbolIndex = originalLineLength;
        obj.lines.splice(obj.cursorLineIndex + 1, 1);
      }

      positionCursor(obj);
    }
  };

  obj.cursor.className = "gcursor";
  obj.cursor.style.height = `${20}px`;
  obj.cursor.style.visibility = "visible";
  panel.cursorOverlay.appendChild(obj.cursor);

  panel.element.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target;

    focusManager.changeFocus(editor);
    commitEdit(obj);

    let symbolElement, lineElement;

    if (target.classList.contains("gsymbol")) {
      // User clicked on a symbol
      symbolElement = target;
      lineElement = symbolElement.closest(".gline");
    } else if (target.classList.contains("gline")) {
      // User clicked on the blank part of a line
      lineElement = target;
    } else if (target.classList.contains("gtext")) {
      const prev = target.previousElementSibling;
      if (prev && prev.classList.contains("gsymbol")) {
        // User clicked on the space between symbols
        symbolElement = target.previousElementSibling;
        lineElement = symbolElement.closest(".gline");
      } else {
        // User clicked on the indent
        symbolElement = "indent"; // a pseudo-element representing the indent
        lineElement = target.closest(".gline");
      }
    } else {
      // User clicked outside of any line, so ignore
      return;
    }

    if (lineElement) {
      obj.cursorLineIndex = Array.from(panel.linesElement.childNodes).indexOf(lineElement);
      if (obj.cursorLineIndex < 0) {
        Math.max(0, obj.cursorLineIndex = obj.lines.length - 1);
      }
    } else {
      Math.max(0, obj.cursorLineIndex = obj.lines.length - 1);
    }

    // Note that cursorSymbolIndex could be set to -1 here, which represents the indent.
    obj.cursorSymbolIndex = symbolElement ? obj.lineAtCursor.symbols.map(s => s.element).indexOf(symbolElement)
      : Math.max(0, obj.lineAtCursor.symbols.length - 1);
    
    obj.shadowIndex = obj.getCharacterPos(obj.cursorSymbolIndex);
    positionCursor(obj);
    panel.textEntry.focus();
  });

  return obj;
}

function positionCursor(obj) {
  const line = obj.lineAtCursor;
  if (!line) return;

  obj.cursor.style.top = `${line.panelLine.offsetTop}px`;

  if (obj.cursorSymbolIndex < 0) {
    obj.cursor.style.left = `${line.indentElement.offsetLeft + line.indentElement.getBoundingClientRect().width}px`;
    return;
  }

  const symbol = obj.symbolAtCursor;
  if (symbol) {
    obj.cursor.style.left = `${symbol.element.offsetLeft + symbol.element.getBoundingClientRect().width}px`;
  } else {
    obj.cursor.style.left = "0px";
  }
}

function createSpace() {
  const space = document.createElement("span");
  space.className = "gtext gspace";
  space.textContent = " ";
  return space;
}

function commitEdit(obj) {
  obj.symbolBeingEdited = undefined;
}
