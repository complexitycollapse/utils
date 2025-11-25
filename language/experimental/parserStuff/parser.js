import { tokenize } from "../lexer.js";

export function parse(source) {
  const tokens = tokenize(source);
  const parser = createParser(tokens);
  return parser;
}

function createParser(tokens) {
  let index = 0, currentGroupingDepth = 0, ignoredIndents = 0;
  const delimiterStack = [];

  function pushDelimiters(delimiters) { delimiterStack.unshift(new Set(delimiters)); }
  function popDelimiters() { delimiterStack.shift(); }
  function isDelimiter(t) { delimiterStack[0] && delimiterStack[0].has(t.type); }

  function check(offset = 0) {
    if (index + offset >= tokens.length) {
      throw new Error("Parser has gone over the end");
    }
  }

  function current() {
    check();
    return tokens[index];
  }

  function peek(offset = 1) {
    check(offset);
    return tokens[index + offset];
  }

  function at(type) {
    check();
    return current().type === type;
  }

  function skipLineNoise() {
    if (currentGroupingDepth === 0) { return; }
    let t = tokens[index];
    while(t.type === "NEWLINE" || t.type === "DEDENT" || t.type === "INDENT") {
      if (t.type === "INDENT") { ignoredIndents++; }
      if (t.type === "DEDENT") { ignoredIndents--; }
      ++index
      t = tokens[index];
    }
  }

  function atNext(type) {
    check(1);
    return peek().type === type;
  }

  function advance() {
    return tokens[index++];
  }

  /**
   * Line continuations are allowed to be more or less indented than the line the continue, which causes the
   * lexer to generate indents and dedents when the line is completed. This fn detects them and drops them.
   */
  function skipContinuedLineExcessIndentation() {
    while (ignoredIndents > 0 && current().type === "DEDENT") {
      ++index;
      --ignoredIndents;
    }
    while (ignoredIndents < 0 && current().type === "INDENT") {
      ++index;
      ++ignoredIndents;
    }
  }

  function expect(type, message) {
    const t = current();
    if (!t || t.type !== type) {
      throw syntaxError(t,
        message || `Expected ${type}, got ${t ? t.type : "EOF"}.`,
      );
    }
    index += 1;
    return t;
  }

  function syntaxError(token, message) {
    if (!token) {
      return new SyntaxError(message);
    }
    return new SyntaxError(
      `${message} (line ${token.line}, column ${token.column}).`,
    );
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

  return { tokens, get current() { return current() }, peek, at, atNext, advance, expect, syntaxError, makeNode,
    nuds: new Map(), leds: new Map(), tokens, set groupingDepth(val) { currentGroupingDepth = val },
    get groupingDepth() { return currentGroupingDepth; }, skipContinuedLineExcessIndentation, skipLineNoise,
  pushDelimiters, popDelimiters, isDelimiter };
}
