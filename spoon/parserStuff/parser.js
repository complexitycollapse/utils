import { tokenize } from "../lexer.js";

export function parse(source) {
  const tokens = tokenize(source);
  const tokenSource = TokenSource(tokens);
  const parser = createParser(tokenSource);
  return parser;
}

function createParser(tokenSource) {
  let obj = {
    ignoredIndents: 0,
    delimiterStack: [],
    index: 0,
    nuds: new Map(),
    leds: new Map(),
    unreadToken: undefined
  };

  function pushDelimiters(delimiters) { obj.delimiterStack.unshift(new Set(delimiters)); }
  function popDelimiters() { obj.delimiterStack.shift(); }
  function isDelimiter(t) { return obj.delimiterStack[0] && obj.delimiterStack[0].has(t.type); }

  function current() {
    if (obj.unreadToken) { return obj.unreadToken; }
    return tokenSource.current();
  }

  function at(type) {
    return current().type === type;
  }

  function advance() {
    if (obj.unreadToken) {
      const t = obj.unreadToken;
      obj.unreadToken = undefined;
      return t;
    }
    return tokenSource.advance();
  }

  function unread(t) {
    obj.unreadToken = t;
  }

  function expect(type, message) {
    const t = current();
    if (!t || t.type !== type) {
      throw syntaxError(t,
        message || `Expected ${type}, got ${t ? t.type : "EOF"}.`,
      );
    }
    advance();
    return t;
  }

  function syntaxError(token, message) {
    return tokenSource.syntaxError(token, message);
  }

  function makeNode(type, props, loc) {
    const node = {
      type,
      ...props
    };
    if (loc) {
      node.line = loc.line;
      node.column = loc.column;
    }

    return node;
  }

  Object.defineProperties(obj, Object.getOwnPropertyDescriptors({
    get current() { return current(); }, at, advance, popBlockStack: tokenSource.popBlockStack,
    expect, syntaxError, makeNode, get currentLineIsDedented() { return tokenSource.lineIsDedented; },
    pushDelimiters, popDelimiters, isDelimiter, tryEnterBlock: tokenSource.tryEnterBlock, unread }));

  return obj;
}

function TokenSource(tokens) {
  let index = 0, indent = 0, logicalLineIndent = 0, newline, bracketsCount = 0;
  let blockIndentStack = [];

  function chompIndents() {
    let t = tokens[index], delta = 0;

    while (true) {
      if (t.type === "INDENT") {
        ++delta;
        index++;
        t = tokens[index];
      } else if (t.type === "DEDENT") {
        --delta;
        index++;
        t = tokens[index];
      } else {
        break;
      }
    }

    return delta;
  }

  let obj = {
    lineIsDedented: false,
    advance() {
      let result = obj.current();

      // If we were storing a newline it has now been returned so drop it
      if (newline) {
        newline = undefined;
      } else {
        ++index;
      }

      if (result.type === "(") {
        ++bracketsCount;
      } else if (result.type === ")") {
        bracketsCount--;
      }

      let t = tokens[index];

      if (t.type === "NEWLINE") {
        newline = t;
        ++index;

        // Chomp empty lines
        while(tokens[index].type === "NEWLINE") {
          ++index;
        }

        // Chomp all indents/dedents at the beginning of the next line
        let indentDelta = chompIndents();
        indent += indentDelta;
        this.lineIsDedented = indentDelta;
        
        if (bracketsCount <= 0 && indent <= logicalLineIndent) {
          // New logical line has started
          logicalLineIndent = indent;
        } else {
          // This is a continuation of the logical line, so drop the NEWLINE
          newline = undefined;
        }
      }

      return result;
    },
    current() {
      if (newline) { return newline; }
      obj.check();
      return tokens[index];
    },
    syntaxError(token, message) {
      if (!token) {
        return new SyntaxError(message);
      }
      return new SyntaxError(
        `${message} (line ${token.line}, column ${token.column}).`,
      )
    },
    check(offset = 0) {
      if (index + offset >= tokens.length) {
        throw new Error("Parser has gone over the end");
      }
    },
    tryEnterBlock() {
      this.lineIsDedented = false;
   
      if (tokens[index].type === ":" && tokens[index + 1].type === "NEWLINE") {
        index += 2;
        indent += chompIndents();
        if (indent <= logicalLineIndent) {
          throw this.syntaxError(token[index], "empty statement block");
        }
        blockIndentStack.push(logicalLineIndent);
        logicalLineIndent = indent;
        return true;
      }
    },
    popBlockStack() {
      logicalLineIndent = blockIndentStack.pop();
    }
  };

  // Fast-forward to the first non-empty line
  while(tokens[index].type === "NEWLINE") { index++; }

  return obj;
}
