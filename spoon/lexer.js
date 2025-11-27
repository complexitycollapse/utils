// lexer.js
const KEYWORDS = new Map([
  ["if", "IF"],
  ["then", "THEN"],
  ["match", "MATCH"],
  ["not", "NOT"],
  ["and", "AND"],
  ["or", "OR"],
  ["true", "TRUE"],
  ["false", "FALSE"],
]);

export function tokenize(source) {
  const text = source.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");

  const tokens = [];
  const indentStack = [0];
  let lineNumber = 1;

  for (let li = 0; li < lines.length; li += 1) {
    const rawLine = lines[li];

    if (rawLine.indexOf("\t") !== -1) {
      throw new SyntaxError(`Tabs are not allowed (line ${lineNumber}).`);
    }

    const lineLength = rawLine.length;
    let i = 0;

    // Count leading spaces for indentation.
    while (i < lineLength && rawLine[i] === " ") {
      i += 1;
    }
    const indent = i;
    const content = rawLine.slice(i);
    const trimmed = content.trim();

    if (trimmed.length === 0) {
      // Blank or whitespace-only line: just a NEWLINE.
      tokens.push(makeToken("NEWLINE", "\n", lineNumber, 1));
      lineNumber += 1;
      continue;
    }

    // Off-side rule: emit INDENT / DEDENT as needed.
    const currentIndent = indentStack[indentStack.length - 1];
    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push(makeToken("INDENT", indent, lineNumber, 1));
    } else if (indent < currentIndent) {
      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        tokens.push(makeToken("DEDENT", indent, lineNumber, 1));
      }
      if (indent !== indentStack[indentStack.length - 1]) {
        throw new SyntaxError(
          `Inconsistent indentation on line ${lineNumber} ` +
            `(got ${indent}, expected ${indentStack[indentStack.length - 1]}).`,
        );
      }
    }

    let column = indent + 1;
    i = indent;

    while (i < lineLength) {
      const ch = rawLine[i];

      // Intra-line spaces: skip.
      if (ch === " ") {
        i += 1;
        column += 1;
        continue;
      }

      // Numbers (unsigned).
      if (isDigit(ch)) {
        const { value, length } = readNumber(rawLine, i);
        tokens.push(makeToken("NUMBER", value, lineNumber, column, length));
        i += length;
        column += length;
        continue;
      }

      // Negative numbers or flags or minus operator.
      if (ch === "-" && i + 1 < lineLength) {
        const next = rawLine[i + 1];

        // Signed numeric literal, e.g. -42 or -3.14
        if (isDigit(next)) {
          const { value, length } = readNumber(rawLine, i);
          tokens.push(makeToken("NUMBER", value, lineNumber, column, length));
          i += length;
          column += length;
          continue;
        }

        // Flag / keyword-arg: -name
        if (isIdentifierStart(next)) {
          let j = i + 1;
          while (j < lineLength && isIdentifierPart(rawLine[j])) {
            j += 1;
          }
          const name = rawLine.slice(i + 1, j);
          tokens.push(makeToken("FLAG", name, lineNumber, column, j - i));
          column += j - i;
          i = j;
          continue;
        }

        // Otherwise, it's the minus operator
        tokens.push(makeToken("-", "-", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }

      // Identifiers and keywords (supporting kebab-case like do-something).
      if (isIdentifierStart(ch)) {
        let j = i + 1;
        while (j < lineLength && isIdentifierPart(rawLine[j])) {
          j += 1;
        }
        const textIdent = rawLine.slice(i, j);
        const kwType = keywordType(textIdent);
        const type = kwType || "IDENT";
        tokens.push(makeToken(type, textIdent, lineNumber, column, j-i));
        column += j - i;
        i = j;
        continue;
      }

      // Double-quoted strings with simple escapes.
      if (ch === "\"") {
        const { value, length } = readString(rawLine, i, lineNumber, column);
        tokens.push(makeToken("STRING", value, lineNumber, column, length));
        i += length;
        column += length;
        continue;
      }

      // Punctuation / operators.
      if (ch === "+") {
        tokens.push(makeToken("+", "+", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === "*") {
        tokens.push(makeToken("*", "*", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === "/") {
        tokens.push(makeToken("/", "/", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === "%") {
        tokens.push(makeToken("%", "%", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === ".") {
        tokens.push(makeToken(".", ".", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === ",") {
        tokens.push(makeToken(",", ",", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === "(") {
        if (rawLine.length >= i && rawLine[i+1] === ")") {
          tokens.push(makeToken("()", "()", lineNumber, column, 2));
          i += 2;
          column += 2;
          continue;
        } 
        tokens.push(makeToken("(", "(", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === ")") {
        tokens.push(makeToken(")", ")", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === ":") {
        tokens.push(makeToken(":", ":", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === "<") {
        const next = rawLine[i + 1];
        if (next === "=") {
          tokens.push(makeToken("<=", "<=", lineNumber, column, 2));
          i += 2;
          column += 2;
        } else {
          tokens.push(makeToken("<", "<", lineNumber, column, 1));
          i += 1;
          column += 1;
        }
        continue;
      }
      if (ch === ">") {
        const next = rawLine[i + 1];
        if (next === "=") {
          tokens.push(makeToken(">=", ">=", lineNumber, column, 2));
          i += 2;
          column += 2;
        } else {
          tokens.push(makeToken(">", ">", lineNumber, column, 1));
          i += 1;
          column += 1;
        }
        continue;
      }
      if (ch === "=") {
        const next = rawLine[i + 1];
        tokens.push(makeToken("=", "=", lineNumber, column, 1));
        i += 1;
        column += 1;
        continue;
      }
      if (ch === "!") {
        const next = rawLine[i + 1];
        if (next === "=") {
          tokens.push(makeToken("!=", "!=", lineNumber, column, 2));
          i += 2;
          column += 2;
          continue;
        }
        throw new SyntaxError(
          `Unexpected '!' (line ${lineNumber}, column ${column}). Use '!=' for inequality.`,
        );
      }

      throw new SyntaxError(
        `Unexpected character '${ch}' (line ${lineNumber}, column ${column}).`,
      );
    }

    tokens.push(makeToken("NEWLINE", "\n", lineNumber, column));
    lineNumber += 1;
  }

  // Close remaining indentation.
  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push(makeToken("DEDENT", 0, lineNumber, 1));
  }

  tokens.push(makeToken("EOF", null, lineNumber, 1));
  return tokens;
}

function makeToken(type, value, line, column, length) {
  return { type, value, line, column, length };
}

function isDigit(ch) {
  return ch >= "0" && ch <= "9";
}

function isIdentifierStart(ch) {
  return (
    (ch >= "A" && ch <= "Z") ||
    (ch >= "a" && ch <= "z") ||
    ch === "_"
  );
}

function isIdentifierPart(ch) {
  return (
    isIdentifierStart(ch) ||
    isDigit(ch) ||
    ch === "-"
  );
}

function keywordType(text) {
  if (KEYWORDS.has(text)) {
    return KEYWORDS.get(text);
  }
  return null;
}

function readNumber(line, startIndex) {
  let i = startIndex;
  let hasSign = false;
  if (line[i] === "-") {
    hasSign = true;
    i += 1;
  }
  let sawDigits = false;
  while (i < line.length && isDigit(line[i])) {
    sawDigits = true;
    i += 1;
  }
  let sawDot = false;
  if (i < line.length && line[i] === "." && isDigit(line[i + 1])) {
    sawDot = true;
    i += 1;
    while (i < line.length && isDigit(line[i])) {
      i += 1;
    }
  }
  if (!sawDigits && !sawDot) {
    throw new SyntaxError("Invalid numeric literal.");
  }
  const text = line.slice(startIndex, i);
  return { value: Number(text), length: i - startIndex };
}

function readString(line, startIndex, lineNumber, column) {
  let i = startIndex;
  let result = "";
  let closed = false;

  // Skip opening quote.
  i += 1;
  while (i < line.length) {
    const c = line[i];
    if (c === "\"") {
      closed = true;
      i += 1;
      break;
    }
    if (c === "\\") {
      const next = line[i + 1];
      if (next === "n") {
        result += "\n";
      } else if (next === "t") {
        result += "\t";
      } else if (next === "\"" || next === "\\") {
        result += next;
      } else {
        // Unknown escape: keep the escaped char as-is.
        result += next;
      }
      i += 2;
      continue;
    }
    result += c;
    i += 1;
  }

  if (!closed) {
    throw new SyntaxError(
      `Unterminated string literal (line ${lineNumber}, column ${column}).`,
    );
  }

  const length = i - startIndex;
  return { value: result, length };
}
