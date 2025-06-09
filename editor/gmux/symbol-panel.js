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
    shadowIndex: 0,
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
        const space = document.createElement("span");
        space.className = "gtext";
        space.textContent = " ";
        line.panelLine.appendChild(space);
      }
  
      line.panelLine.appendChild(symbol.element);
      line.symbols.push(symbol);
    },
    createSymbol(text, colour) {
      const element = document.createElement("span");
      element.className = "gsymbol gtext";
      element.textContent = text;
      element.style.color = colour ?? "white";
  
      const symbol = {
        text,
        element,
        colour
      }
  
      return symbol;
    },
    crawlForward() {
      if (obj.cursorSymbolIndex < obj.lines[obj.cursorLineIndex].symbols.length - 1) {
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
      if (obj.cursorSymbolIndex > -1) {
        obj.cursorSymbolIndex--;
      } else {
        if (obj.cursorLineIndex > 0) {
          obj.cursorLineIndex--;
          obj.cursorSymbolIndex = obj.lines[obj.cursorLineIndex].symbols.length - 1;
        }
      }

      obj.shadowIndex = obj.getCharacterPos();
      positionCursor(obj);
    },
    getCharacterPos() {
      let pos = obj.lines[obj.cursorLineIndex].indent;

      if (obj.cursorSymbolIndex < 0) {
        return pos;
      }

      for (let i = 0; i <= obj.cursorSymbolIndex; i++) {
        pos += obj.lines[obj.cursorLineIndex].symbols[i].text.length + 1; // +1 for the space
      }

      return pos;
    },
    getSymbolIndexAtPos(pos) {
      const line = obj.lines[obj.cursorLineIndex];
      
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
      if (obj.cursorLineIndex == 0) {
        obj.cursorSymbolIndex = -1;
        obj.shadowIndex = obj.lines[obj.cursorLineIndex].indent;
      } else {
        obj.cursorLineIndex--;
        const newPos = obj.getSymbolIndexAtPos(obj.shadowIndex)
        if (newPos != undefined) { obj.cursorSymbolIndex = newPos; }
      }

      positionCursor(obj);
    },
    crawlDownward() {
      if (obj.cursorLineIndex >= obj.lines.length - 1) {
        obj.cursorSymbolIndex = obj.lines[obj.cursorLineIndex].symbols.length - 1;
        obj.shadowIndex = obj.getCharacterPos();
      } else {
        obj.cursorLineIndex++;
        const newPos = obj.getSymbolIndexAtPos(obj.shadowIndex);
        if (newPos != undefined) { obj.cursorSymbolIndex = newPos; }
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

    let line = obj.lines[obj.cursorLineIndex];

    // Note that cursorSymbolIndex could be set to -1 here, which represents the indent.
    obj.cursorSymbolIndex = symbolElement ? line.symbols.map(s => s.element).indexOf(symbolElement)
      : Math.max(0, line.symbols.length - 1);
    
    obj.shadowIndex = obj.getCharacterPos(obj.cursorSymbolIndex);
    positionCursor(obj);
    panel.textEntry.focus();
  });

  return obj;
}

function positionCursor(obj) {
  const line = obj.lines[obj.cursorLineIndex];
  if (!line) return;

  obj.cursor.style.top = `${line.panelLine.offsetTop}px`;

  if (obj.cursorSymbolIndex < 0) {
    obj.cursor.style.left = `${line.indentElement.offsetLeft + line.indentElement.getBoundingClientRect().width}px`;
    return;
  }

  const symbol = line.symbols[obj.cursorSymbolIndex];
  if (symbol) {
    obj.cursor.style.left = `${symbol.element.offsetLeft + symbol.element.getBoundingClientRect().width}px`;
  } else {
    obj.cursor.style.left = "0px";
  }
}