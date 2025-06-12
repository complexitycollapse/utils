// TODO: handle the case where there are no lines

export function Cursor(symbolPanel) {
  let obj = {
    cursor: document.createElement("div"),
    cursorLineIndex: 0,
    cursorSymbolIndex: -1,
    shadowIndex: 0,
    symbolBeingEdited: undefined,

    get lines() {
      return symbolPanel.lines;
    },
    get lineAtCursor() {
      return obj.lines[obj.cursorLineIndex];
    },
    get symbolAtCursor() {
      return obj.lineAtCursor.symbols[obj.cursorSymbolIndex];
    },
    get lineLength() {
      return obj.lineAtCursor.symbols.length;
    },
    get atEndOfLine() {
      return obj.lineLength === 0 || obj.cursorSymbolIndex == obj.lineLength - 1;
    },
    get atStartOfLine() {
      return obj.cursorSymbolIndex === -1;
    },
    get onFirstLine() {
      return obj.cursorLineIndex === 0;
    },
    get onLastLine() {
      return obj.cursorLineIndex >= obj.lines.length - 1;
    },
    getCharacterPos() {
      let pos = obj.lineAtCursor.indent;

      if (obj.atStartOfLine) {
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

      return obj.lineLength - 1;
    },
    setShadowIndex() {
      obj.shadowIndex = obj.getCharacterPos();
    },
    get lineEmpty() {
      return obj.lineLength === 0;
    },
    moveToEnd() {
      obj.cursorSymbolIndex = obj.lineLength - 1;
    },
    moveToStart() {
      obj.cursorSymbolIndex = -1;
    },
    crawlForward() {
      commitEdit(obj);

      if (!obj.atEndOfLine) {
        obj.cursorSymbolIndex++;
      } else if (!obj.onLastLine) {
        obj.cursorLineIndex++;
        obj.moveToStart();
      }

      obj.setShadowIndex();
      positionCursor(obj);
    },
    crawlBackward() {
      commitEdit(obj);

      if (!obj.atStartOfLine) {
        obj.cursorSymbolIndex--;
      } else if (!obj.onFirstLine) {
        obj.cursorLineIndex--;
        obj.moveToEnd();
      }

      obj.setShadowIndex();
      positionCursor(obj);
    },
    crawlUpward() {
      commitEdit(obj);
      
      if (obj.onFirstLine) {
        obj.moveToStart();
        obj.setShadowIndex();
      } else {
        obj.cursorLineIndex--;
        const newPos = obj.getSymbolIndexAtPos(obj.shadowIndex)
        obj.cursorSymbolIndex = newPos;
      }

      positionCursor(obj);
    },
    crawlDownward() {
      commitEdit(obj);
      
      if (obj.onLastLine) {
        obj.moveToEnd();
        obj.setShadowIndex();
      } else {
        obj.cursorLineIndex++;
        const newPos = obj.getSymbolIndexAtPos(obj.shadowIndex);
        obj.cursorSymbolIndex = newPos;
      }

      positionCursor(obj);
    },
    insert(text) {
      if (!obj.symbolBeingEdited) {
        // Create a new symbol at the cursor position
        const symbol = symbolPanel.createSymbol(text, "white");
        obj.symbolBeingEdited = symbol;
        symbolPanel.insertSymbolAfter(symbol, obj.cursorLineIndex, obj.cursorSymbolIndex);
        obj.cursorSymbolIndex++;
      } else {
        obj.symbolBeingEdited.append(text);
      }

      obj.setShadowIndex();
      positionCursor(obj);
    },
    endEdit() {
      commitEdit(obj);
      positionCursor(obj);
    },
    delete() {
      if (obj.symbolBeingEdited) {
        commitEdit(obj);
        symbolPanel.removeSymbol(obj.cursorLineIndex, obj.cursorSymbolIndex);
        obj.cursorSymbolIndex--;
      } else if (!obj.atStartOfLine) {
        symbolPanel.removeSymbol(obj.cursorLineIndex, obj.cursorSymbolIndex);
        obj.cursorSymbolIndex--;
      } else if (!obj.onFirstLine) {
        const symbolsToMove = [...obj.lineAtCursor.symbols];
        symbolsToMove.forEach(() => symbolPanel.removeSymbol(obj.cursorLineIndex, 0));
        obj.cursorLineIndex--;  
        const originalLineLength = obj.lineLength;
        symbolsToMove.forEach(s => symbolPanel.pushSymbol(s, obj.lineAtCursor));
        obj.cursorSymbolIndex = originalLineLength - 1;
        symbolPanel.deleteLine(obj.cursorLineIndex + 1);
      }

      obj.setShadowIndex();
      positionCursor(obj);
    },
    insertNewline() {
      commitEdit(obj);

      const symbolsAfterCursor = obj.lineAtCursor.symbols.slice(obj.cursorSymbolIndex + 1, obj.lineLength);
      symbolsAfterCursor.forEach(() => symbolPanel.removeSymbol(obj.cursorLineIndex, obj.cursorSymbolIndex + 1));

      const newline = symbolPanel.addLine(obj.cursorLineIndex + 1, obj.lineAtCursor.indent);
      symbolsAfterCursor.forEach(s => symbolPanel.pushSymbol(s, newline));

      obj.crawlForward();
    },
    handleMousedown(e) {
      const target = e.target;
  
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
        obj.cursorLineIndex = obj.lines.map(l => l.panelLine).indexOf(lineElement);
        if (obj.cursorLineIndex < 0) {
          Math.max(0, obj.cursorLineIndex = obj.lines.length - 1);
        }
      } else {
        Math.max(0, obj.cursorLineIndex = obj.lines.length - 1);
      }
  
      // Note that cursorSymbolIndex could be set to -1 here, which represents the indent.
      obj.cursorSymbolIndex = symbolElement ? obj.lineAtCursor.symbols.map(s => s.element).indexOf(symbolElement)
        : Math.max(0, obj.lineAtCursor.symbols.length - 1);
      
      obj.setShadowIndex();
      positionCursor(obj);
    }
  };

  obj.cursor.className = "gcursor";
  obj.cursor.style.height = `${20}px`;
  obj.cursor.style.visibility = "visible";
  symbolPanel.addCursorElement(obj.cursor);

  return obj;
}

function commitEdit(obj) {
  if (obj.symbolBeingEdited) {
    obj.symbolBeingEdited = undefined;
    obj.setShadowIndex();
  }
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
