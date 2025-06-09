import * as focusManager from "./focus-manager.js";

/**
 * Decorator for a panel that adds symbol support
 * @param {*} panel The panel to wrap
 */
export function SymbolPanel(panel, editor) {
  const obj = {
    lines: [],
    cursor: document.createElement("div"),
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

    let symbolElement, lineElement, symbol, line;

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
      const index = Array.from(panel.linesElement.childNodes).indexOf(lineElement);
      if (index >= 0) {
        line = obj.lines[index];
      }
    }

    if (!line) {
      line = obj.lines[obj.lines.length - 1];
    }

    if (symbolElement) {
      symbol = line.symbols.find(s => s.element === symbolElement);
    } else if (line.symbols.length > 0) {
      symbol = line.symbols[line.symbols.length - 1];
    }

    if (symbol) {
      obj.cursor.style.left = `${symbol.element.offsetLeft + symbol.element.getBoundingClientRect().width}px`;
    } else {
      obj.cursor.style.left = "0px";
    }

    if (line) {
      obj.cursor.style.top = `${line.panelLine.offsetTop}px`;
      obj.cursor.style.height = `19px`;
    }

    panel.textEntry.focus();
  });

  return obj;
}
